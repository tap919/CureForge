/**
 * CureForge – Unified Verification Server
 * Trust tiers: REPLAY → NITRO → RISC_ZERO
 *
 * Endpoints
 * ---------
 * GET  /api/config
 * GET  /api/agents                   list all agents + replay ranks
 * POST /api/agents/package           package + immediately replay-run an agent
 * POST /api/agents/:id/replay        challenge-replay an agent
 * DELETE /api/agents/:id             remove agent
 *
 * POST /api/verify                   sandboxed code verification (Acorn + vm)
 * POST /api/synthesize               Gemini-powered code synthesis
 *
 * POST /api/nitro/:id/enroll         enroll in Nitro mode
 * POST /api/nitro/:id/sign           sign a payload with the Nitro enclave key
 * POST /api/nitro/:id/verify         verify a Nitro-signed payload
 * GET  /api/nitro/:id/policy         Nitro trust report
 *
 * POST /api/risc-zero/:id/prove      submit a RISC Zero proving task
 * GET  /api/risc-zero/:id/tasks      list tasks for an agent
 * GET  /api/risc-zero/eligible       eligibility + cost analysis
 */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { parse as acornParse } from 'acorn';
import { Script, createContext } from 'vm';
import util from 'util';
import { createServer as createViteServer } from 'vite';
import fc from 'fast-check';
import seedrandom from 'seedrandom';

import {
  packageAgent,
  replayAgent,
  rankAgents,
  getAllAgents,
  getAgent,
  getAllReplays,
  deleteAgent,
} from './src/registry/store.js';
import { enrollNitro, nitroSign, nitroVerify, nitroPolicyReport } from './src/nitro/index.js';
import { proveTask, verifyReceipt, eligibilityReport, costAnalysis } from './src/risc-zero/index.js';

// ---------------------------------------------------------------------------
// Platform metadata
// ---------------------------------------------------------------------------
const METADATA = {
  name: 'CureForge',
  description:
    'Unified platform for reproducible, attestable, and provable AI agents. ' +
    'Three trust tiers: Replay (byte-identical reproducibility), ' +
    'Nitro (measured signing + escrow), RISC Zero (receipt-verified bounded tasks).',
  trustTiers: ['REPLAY', 'NITRO', 'RISC_ZERO'],
  requestFramePermissions: [],
  majorCapabilities: ['MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'],
};

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------
const GEMINI_CAPABILITY = METADATA.majorCapabilities.includes(
  'MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API',
);
const genAI =
  GEMINI_CAPABILITY && process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

// ---------------------------------------------------------------------------
// GET /api/config
// ---------------------------------------------------------------------------
app.get('/api/config', (_req, res) => {
  res.json(METADATA);
});

// ---------------------------------------------------------------------------
// GET /api/agents  – ranked registry
// ---------------------------------------------------------------------------
app.get('/api/agents', (_req, res) => {
  res.json(rankAgents());
});

// ---------------------------------------------------------------------------
// POST /api/agents/package
// Body: { name, description, code, spec, seed?, trustTier? }
// ---------------------------------------------------------------------------
app.post('/api/agents/package', async (req, res) => {
  try {
    const { name, description, code, spec, seed, trustTier } = req.body;
    if (!name || !code || !spec) {
      return res.status(400).json({ error: 'name, code, spec required' });
    }

    const manifest = packageAgent({ name, description: description ?? '', code, spec, seed, trustTier });
    const record    = await replayAgent(manifest.id);

    res.json({ manifest, canonicalReplay: record });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/agents/:id/replay
// ---------------------------------------------------------------------------
app.post('/api/agents/:id/replay', async (req, res) => {
  try {
    const record = await replayAgent(req.params.id);
    res.json(record);
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/agents/:id
// ---------------------------------------------------------------------------
app.delete('/api/agents/:id', (req, res) => {
  deleteAgent(req.params.id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /api/agents/:id/replays
// ---------------------------------------------------------------------------
app.get('/api/agents/:id/replays', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(getAllReplays(req.params.id));
});

// ---------------------------------------------------------------------------
// POST /api/verify  (unchanged contract, now also writes to registry if agentId given)
// ---------------------------------------------------------------------------
app.post('/api/verify', async (req, res) => {
  try {
    const {
      code,
      spec,
      runMonteCarlo = false,
      runFuzzing    = false,
      fuzzCode,
      monteCarloCode,
    } = req.body;

    // 1. Syntax check
    try {
      acornParse(code, { ecmaVersion: 2024, sourceType: 'script' });
    } catch (err: any) {
      return res.json({ success: false, error: 'Syntax error: ' + err.message });
    }

    // 2. Build sandbox
    const trace: string[] = [];
    const sandbox: any = {
      console: {
        log  : (...a: unknown[]) => trace.push(a.map(x => util.format(x)).join(' ')),
        warn : (...a: unknown[]) => trace.push('[warn] ' + a.map(x => util.format(x)).join(' ')),
        error: (...a: unknown[]) => trace.push('[error] ' + a.map(x => util.format(x)).join(' ')),
      },
      assert  : util.isDeepStrictEqual,
      fc,
      seedrandom,
      Math,
      result  : null,
    };
    const context = createContext(sandbox);

    // 3. Load user code
    try {
      new Script(code).runInContext(context, { timeout: 2000 });
      trace.push('Code loaded into sandbox.');
    } catch (err: any) {
      return res.json({ success: false, error: 'Execution error: ' + err.message, trace });
    }

    // 4. Fuzzing
    let fuzzResult: unknown = null;
    if (runFuzzing && fuzzCode) {
      try {
        new Script(fuzzCode).runInContext(context, { timeout: 3000 });
        fuzzResult = sandbox.result;
        trace.push('Fuzzing completed.');
      } catch (err: any) {
        fuzzResult = { failed: true, error: err.message };
        trace.push('Fuzzing failed: ' + err.message);
      }
    }

    // 5. Monte Carlo
    let monteCarloData: unknown[] = [];
    if (runMonteCarlo && monteCarloCode) {
      try {
        new Script(monteCarloCode).runInContext(context, { timeout: 5000 });
        monteCarloData = sandbox.result ?? [];
        trace.push('Monte Carlo completed.');
      } catch (err: any) {
        trace.push('Monte Carlo failed: ' + err.message);
      }
    }

    res.json({ success: true, trace, fuzzResult, monteCarloData });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Internal error: ' + e.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/synthesize
// ---------------------------------------------------------------------------
app.post('/api/synthesize', async (req, res) => {
  try {
    const { intent, knowledgeBase } = req.body;

    if (genAI) {
      try {
        const prompt = `You are CureForge, a deterministic code synthesizer for biomedical AI agents.
Write a JavaScript function named targetFunction based on this intent: ${intent}
Knowledge base: ${knowledgeBase ?? 'none'}
Return ONLY the function code, no markdown, no explanation.`;

        const result = await genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });
        const raw = result.text ?? '';
        const clean = raw.replace(/```(?:javascript|js)?\n?|```/g, '').trim();
        return res.json({ success: true, code: clean });
      } catch (e) {
        console.error('Gemini failed:', e);
      }
    }

    res.json({
      success: true,
      code: `function targetFunction(x, y) {\n  // CureForge default: 2D sinusoidal surface\n  return Math.sin(x) * Math.cos(y) + (x * 0.1);\n}`,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------------------------------------------------------------------------
// NITRO routes
// ---------------------------------------------------------------------------
app.post('/api/nitro/:id/enroll', (req, res) => {
  const result = enrollNitro(req.params.id);
  res.json(result);
});

app.post('/api/nitro/:id/sign', (req, res) => {
  const { payload } = req.body;
  if (!payload) return res.status(400).json({ error: 'payload required' });
  res.json(nitroSign(req.params.id, payload));
});

app.post('/api/nitro/:id/verify', (req, res) => {
  const { payload, signature } = req.body;
  if (!payload || !signature) return res.status(400).json({ error: 'payload and signature required' });
  res.json({ verified: nitroVerify(req.params.id, payload, signature) });
});

app.get('/api/nitro/:id/policy', (req, res) => {
  res.json(nitroPolicyReport(req.params.id));
});

// ---------------------------------------------------------------------------
// RISC Zero routes
// ---------------------------------------------------------------------------
app.post('/api/risc-zero/:id/prove', (req, res) => {
  const { taskKind, input } = req.body;
  if (!taskKind || input === undefined) return res.status(400).json({ error: 'taskKind and input required' });
  res.json(proveTask({ agentId: req.params.id, taskKind, input }));
});

app.get('/api/risc-zero/:id/tasks', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ agentId: req.params.id, tasks: require('./src/registry/store.js').getRiscZeroTasks(req.params.id) });
});

app.get('/api/risc-zero/eligible', (req, res) => {
  const { agentId, taskKind, inputSize } = req.query as Record<string, string>;
  if (agentId && taskKind) {
    return res.json({
      eligibility: eligibilityReport(agentId, taskKind),
      cost: costAnalysis(taskKind, Number(inputSize ?? 0)),
    });
  }
  res.json({
    eligibleTaskKinds: ['POLICY_CHECK', 'PARSER', 'SCORING', 'BOUNDED_SUBROUTINE'],
    philosophy: METADATA.description,
  });
});

// ---------------------------------------------------------------------------
// Vite dev / static prod
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = Number(process.env.PORT ?? 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🧬 CureForge running on port ${PORT}`);
    console.log('   Trust tiers: REPLAY | NITRO | RISC_ZERO');
    console.log(`   Gemini: ${genAI ? 'enabled' : 'disabled (set GEMINI_API_KEY)'}\n`);
  });
}

startServer();
