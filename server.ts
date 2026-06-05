import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { parse } from 'acorn';
import { Script, createContext } from 'vm';
import util from 'util';
import { createServer as createViteServer } from 'vite';
import fc from 'fast-check';
import seedrandom from 'seedrandom';

// ---------------------------------------------------------------------------
// CureForge platform metadata – single source of truth
// ---------------------------------------------------------------------------
const METADATA = {
  name: 'CureForge',
  description:
    'Unified platform with autonomous, cure-directed AI agents powered by SciNet. Multi-agent systems for biomedicine.',
  requestFramePermissions: [],
  majorCapabilities: ['MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'],
};

// ---------------------------------------------------------------------------
// Application setup
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Gemini configuration – only enabled if capability is claimed AND key exists
// ---------------------------------------------------------------------------
const GEMINI_CAPABILITY = METADATA.majorCapabilities.includes(
  'MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'
);
const genAI =
  GEMINI_CAPABILITY && process.env.GOOGLE_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
    : null;

// ---------------------------------------------------------------------------
// Public config endpoint – exposes CureForge identity to the frontend
// ---------------------------------------------------------------------------
app.get('/api/config', (_req, res) => {
  res.json(METADATA);
});

// ---------------------------------------------------------------------------
// POST /api/verify – syntax check, safe execution, fuzzing, Monte Carlo
// ---------------------------------------------------------------------------
app.post('/api/verify', async (req, res) => {
  try {
    const {
      code,
      spec,
      knowledgeBase,
      attempt,
      runMonteCarlo = false,
      runFuzzing = false,
      fuzzCode,        // user-provided fast-check test (sets sandbox.result)
      monteCarloCode,  // user-provided Monte Carlo code (sets sandbox.result)
    } = req.body;

    // 1. Syntax validation with Acorn
    try {
      parse(code, { ecmaVersion: 2024, sourceType: 'script' });
    } catch (err: any) {
      return res.json({ success: false, error: 'Syntax error: ' + err.message });
    }

    // 2. Build a locked-down sandbox
    const trace: string[] = [];
    const sandbox = {
      // Safe console – captures logs into the trace array
      console: {
        log: (...args: any[]) =>
          trace.push(args.map(a => util.format(a)).join(' ')),
        warn: (...args: any[]) =>
          trace.push('[warn] ' + args.map(a => util.format(a)).join(' ')),
        error: (...args: any[]) =>
          trace.push('[error] ' + args.map(a => util.format(a)).join(' ')),
      },
      assert: util.isDeepStrictEqual,
      fc,
      seedrandom,
      // No require, process, or other dangerous globals
      result: null,
    };
    const context = createContext(sandbox);

    // 3. Execute user code to define functions / objects
    try {
      const userScript = new Script(code);
      userScript.runInContext(context, { timeout: 2000 });
      trace.push('Syntax verified; code loaded into sandbox.');
    } catch (err: any) {
      return res.json({
        success: false,
        error: 'Execution error: ' + err.message,
        trace,
      });
    }

    // 4. Optional fuzzing (fast-check)
    let fuzzResult: any = null;
    if (runFuzzing && fuzzCode) {
      try {
        const fuzzScript = new Script(fuzzCode);
        fuzzScript.runInContext(context, { timeout: 3000 });
        fuzzResult = context.result;
        trace.push('Fuzzing completed.');
      } catch (err: any) {
        fuzzResult = { failed: true, error: err.message };
        trace.push('Fuzzing failed: ' + err.message);
      }
    }

    // 5. Optional Monte Carlo simulation
    let monteCarloData: any[] = [];
    if (runMonteCarlo && monteCarloCode) {
      try {
        const mcScript = new Script(monteCarloCode);
        mcScript.runInContext(context, { timeout: 5000 });
        monteCarloData = context.result;
        trace.push('Monte Carlo simulation completed.');
      } catch (err: any) {
        trace.push('Monte Carlo failed: ' + err.message);
      }
    }

    res.json({ success: true, trace, fuzzResult, monteCarloData });
  } catch (error) {
    console.error('Verification endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/synthesize – code generation via Gemini (if available)
// ---------------------------------------------------------------------------
app.post('/api/synthesize', async (req, res) => {
  try {
    const { intent, knowledgeBase, attempt } = req.body;

    // Only use Gemini if both the capability and the API key are present
    if (genAI) {
      try {
        const prompt = `You are CureForge, a code synthesizer for biomedical simulation.
Write a JavaScript function named targetFunction based on the following intent and knowledge base.
Intent: ${intent}
Knowledge base: ${knowledgeBase || 'none'}
Return ONLY the function code, no explanation, no markdown.`;
        const result = await genAI.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
        });
        const generatedCode = result.text || '';
        const cleanCode = generatedCode.replace(/```javascript|```/g, '').trim();
        return res.json({ success: true, code: cleanCode });
      } catch (aiError) {
        console.error('Gemini synthesis failed:', aiError);
        // Fallback to a default function
        return res.json({
          success: true,
          code: `function targetFunction(x, y) {
  return Math.sin(x) * Math.cos(y) + (x * 0.1);
}`,
        });
      }
    }

    // Gemini not available – return a static demo
    res.json({
      success: true,
      code: `function targetFunction(x, y) {
  // Default demo function (CureForge)
  return Math.sin(x) * Math.cos(y) + (x * 0.1);
}`,
    });
  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({ success: false, error: 'Synthesis failed' });
  }
});

// ---------------------------------------------------------------------------
// Start server (with Vite dev middleware in development)
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

  app.listen(3000, '0.0.0.0', () => {
    const caps = METADATA.majorCapabilities.length
      ? METADATA.majorCapabilities.join(', ')
      : 'none';
    console.log(`CureForge server running on port 3000 – Capabilities: ${caps}`);
  });
}

startServer();