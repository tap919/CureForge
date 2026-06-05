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

app.get('/api/targets', (_req, res) => {
  const targets = [
    { id: 'ENSG00000130203', symbol: 'APOE', area: 'Neurodegeneration', disease: "Alzheimer's Disease", score: 0.96, safety: 'Medium', tractability: 'Low', infoGain: 0.95 },
    { id: 'ENSG00000157764', symbol: 'BRAF', area: 'Oncology', disease: 'Melanoma', score: 0.95, safety: 'Low', tractability: 'High', infoGain: 0.8 },
    { id: 'ENSG00000146648', symbol: 'EGFR', area: 'Oncology', disease: 'Lung Cancer', score: 0.92, safety: 'Medium', tractability: 'High', infoGain: 0.75 },
    { id: 'ENSG00000232810', symbol: 'TNF', area: 'Immunology', disease: 'Rheumatoid Arthritis', score: 0.89, safety: 'Low', tractability: 'High', infoGain: 0.6 },
    { id: 'ENSG00000160087', symbol: 'SMN1', area: 'Rare Pediatric', disease: 'Spinal Muscular Atrophy', score: 0.98, safety: 'High', tractability: 'Medium', infoGain: 0.99 },
    { id: 'ENSG00000198691', symbol: 'KREMEN1', area: 'Neglected Tropical', disease: 'Chagas Disease', score: 0.85, safety: 'Medium', tractability: 'Unknown', infoGain: 0.9 },
    { id: 'ENSG00000142192', symbol: 'APP', area: 'Neurodegeneration', disease: "Alzheimer's Disease", score: 0.91, safety: 'Low', tractability: 'Medium', infoGain: 0.88 },
  ];
  res.json({ targets });
});

// ---------------------------------------------------------------------------
// POST /api/synthesize – generator + skeptic code generation via Gemini
// ---------------------------------------------------------------------------
app.post('/api/synthesize', async (req, res) => {
  try {
    const { intent, knowledgeBase, attempt } = req.body;

    // Only use Gemini if both the capability and the API key are present
    if (genAI) {
      try {
        const prompt = `You are the Hypothesis Engine for CureForge. Formulate a testable biomedical intervention.
Generate a structured biomedical hypothesis based on the following context.
Intent: ${intent}
Context: ${knowledgeBase}

Return ONLY a JSON object (no markdown block) with this exact structure:
{
  "target": "Gene/Protein symbol",
  "mechanism": "Biological reasoning in 2-3 sentences",
  "modality": "Small molecule, Biologic, Gene therapy, etc.",
  "proposed_intervention": "Proposed drug or mechanism of action",
  "testable_prediction": "Expected biomarker or functional outcome",
  "confidence": 85,
  "literature_support": "Brief hypothetical literature/evidence summary"
}`;
        const result = await genAI.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: prompt,
        });
        const generatedHypothesisText = (result.text || '').replace(/```json|```/g, '').trim();
        let hypothesis;
        try {
          hypothesis = JSON.parse(generatedHypothesisText);
        } catch(e) {
          throw new Error('Failed to parse Hypothesis JSON');
        }

        // --- SECOND CALL: Skeptic AI ---
        const skepticPrompt = `You are Skeptic.ai, a ruthless peer reviewer. Review this hypothesis for flaws, list them, cite contradictory (mock) papers, and assign a critic_score from 0-100 indicating falsifiability.
Hypothesis: ${generatedHypothesisText}

Return ONLY a JSON object (no markdown block) with this exact structure:
{
  "flaws": ["Flaw 1", "Flaw 2"],
  "contradictory_papers": ["Citations..."],
  "critic_score": 75
}`;
        const skepticResult = await genAI.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: skepticPrompt,
        });
        const skepticText = (skepticResult.text || '').replace(/```json|```/g, '').trim();
        let skepticObj;
        try {
          skepticObj = JSON.parse(skepticText);
        } catch(e) {
          throw new Error('Failed to parse Skeptic JSON');
        }

        // Combine
        const finalOutput = { ...hypothesis, ...skepticObj };

        return res.json({ success: true, hypothesis: finalOutput });
      } catch (aiError: any) {
        console.error('Gemini synthesis failed:', aiError);
        // Fallback to demo
        return res.json({
          success: true,
          hypothesis: {
            target: "Fallback",
            mechanism: "Gemini failed to load or parse.",
            modality: "N/A",
            proposed_intervention: "N/A",
            testable_prediction: "N/A",
            confidence: 0,
            literature_support: "N/A",
            flaws: ["AI failed"],
            contradictory_papers: ["None"],
            critic_score: 0
          }
        });
      }
    }

    // Gemini not available – return a static demo
    res.json({
      success: true,
      hypothesis: {
        target: "EGFR",
        mechanism: "Inhibition of EGFR tyrosine kinase domain prevents downstream signaling.",
        modality: "Small molecule",
        proposed_intervention: "Type I Tyrosine Kinase Inhibitor",
        testable_prediction: "Decreased phosphorylation of ERK1/2 in tumor biopsy.",
        confidence: 90,
        literature_support: "Multiple phase 3 trials in NSCLC demonstrate efficacy.",
        flaws: ["Acquired resistance via T790M mutation", "Off-target GI toxicity"],
        contradictory_papers: ["Smith et al. 2025: Early resistance pathways in EGFR+"],
        critic_score: 65
      }
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