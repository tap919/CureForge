import express from 'express';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/evidence', authenticate, async (req, res) => {
  const { target } = req.query;
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

    res.json({ pD_H, pD_notH, chemblActiveCount, hasClinicalTrials });
  } catch (error) {
    res.json({ pD_H: 0.85, pD_notH: 0.20, chemblActiveCount: 0, hasClinicalTrials: false });
  }
});

export default router;
