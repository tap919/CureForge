import express from 'express';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/evidence', authenticate, async (req, res) => {
  const { target, prior, isSuccess } = req.query;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Missing target symbol' });
  }

  try {
    const [chemblData, ctData] = await Promise.all([
      fetch(`https://www.ebi.ac.uk/chembl/api/data/target/search?q=${target}&format=json`).then(r => r.json()).catch(() => ({})),
      fetch(`https://clinicaltrials.gov/api/v2/studies?query.intr=${target}&pageSize=1`).then(r => r.json()).catch(() => ({}))
    ]);
    
    // Approximation for ChEMBL active count
    const chemblActiveCount = chemblData.page_meta?.total_count || 0;
    const hasClinicalTrials = ctData.studies && ctData.studies.length > 0;

    let pD_H = 0.85;
    let pD_notH = 0.20;

    if (chemblActiveCount > 50) pD_H = Math.min(0.99, pD_H + 0.10);
    else if (chemblActiveCount === 0) pD_H = Math.max(0.5, pD_H - 0.20);

    if (hasClinicalTrials) pD_notH = Math.max(0.01, pD_notH - 0.10);

    let posterior = undefined;
    if (prior !== undefined && isSuccess !== undefined) {
      const priorValue = parseFloat(prior as string) / 100;
      const successData = isSuccess === 'true';
      const D_H = successData ? pD_H : 1 - pD_H;
      const D_notH = successData ? pD_notH : 1 - pD_notH;
      const unnormalizedPosterior = D_H * priorValue;
      const evidence = unnormalizedPosterior + (D_notH * (1 - priorValue));
      posterior = Math.round((unnormalizedPosterior / evidence) * 100);
    }

    res.json({ pD_H, pD_notH, chemblActiveCount, hasClinicalTrials, posterior });
  } catch (error) {
    let posterior = undefined;
    if (prior !== undefined && isSuccess !== undefined) {
      const pD_H = 0.85;
      const pD_notH = 0.20;
      const priorValue = parseFloat(prior as string) / 100;
      const successData = isSuccess === 'true';
      const D_H = successData ? pD_H : 1 - pD_H;
      const D_notH = successData ? pD_notH : 1 - pD_notH;
      const unnormalizedPosterior = D_H * priorValue;
      const evidence = unnormalizedPosterior + (D_notH * (1 - priorValue));
      posterior = Math.round((unnormalizedPosterior / evidence) * 100);
    }
    res.json({ pD_H: 0.85, pD_notH: 0.20, chemblActiveCount: 0, hasClinicalTrials: false, posterior });
  }
});

export default router;
