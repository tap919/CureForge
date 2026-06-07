import express from 'express';
import { validateSecureAST, runInSubprocess } from '../services/sandbox';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      code,
      runMonteCarlo = false,
      runFuzzing = false,
      fuzzCode,
      monteCarloCode,
    } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid or missing code' });
    }

    // 1. Syntax & Security validation with Acorn
    try {
      validateSecureAST(code);
      if (runFuzzing) validateSecureAST(fuzzCode);
      if (runMonteCarlo) validateSecureAST(monteCarloCode);
    } catch (err: any) {
      return res.json({ success: false, error: 'Syntax/Security error: ' + err.message });
    }

    const trace: string[] = [];

    // 2. Execute user code
    const runRes = await runInSubprocess(code, 2000);
    if (runRes.trace) trace.push(...runRes.trace);
    
    if (runRes.failed) {
      return res.json({
        success: false,
        error: 'Execution error: ' + runRes.error,
        trace,
      });
    }
    trace.push('Syntax verified; code loaded safely.');

    // 3. Optional fuzzing (fast-check)
    let fuzzResult: any = null;
    if (runFuzzing && fuzzCode) {
      const combined = code + '\n' + fuzzCode;
      const fRes = await runInSubprocess(combined, 3000);
      if (fRes.trace) trace.push(...fRes.trace);
      
      if (fRes.failed) {
        fuzzResult = { failed: true, error: fRes.error };
        trace.push('Fuzzing failed: ' + fRes.error);
      } else {
        fuzzResult = fRes.data;
        trace.push('Fuzzing completed.');
      }
    }

    // 4. Optional Monte Carlo simulation
    let monteCarloData: any[] = [];
    if (runMonteCarlo && monteCarloCode) {
      const combined = code + '\n' + monteCarloCode;
      const mRes = await runInSubprocess(combined, 5000);
      if (mRes.trace) trace.push(...mRes.trace);
      
      if (mRes.failed) {
        trace.push('Monte Carlo failed: ' + mRes.error);
      } else {
        monteCarloData = mRes.data || [];
        trace.push('Monte Carlo simulation completed.');
      }
    }

    res.json({ success: true, trace, fuzzResult, monteCarloData });
  } catch (error) {
    console.error('Verification endpoint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
