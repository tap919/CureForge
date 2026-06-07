import express from 'express';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/tick', authenticate, async (req, res) => {
  const { target } = req.query;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Missing target symbol' });
  }
  
  if (target.length > 50) {
    return res.status(400).json({ error: 'Target symbol too long' });
  }

  try {
    const ncbiUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(target)}[Title/Abstract]&retmode=json&retmax=1&sort=date`;
    const ncbiRes = await fetch(ncbiUrl);
    const data = await ncbiRes.json();
    if (data && data.esearchresult && data.esearchresult.idlist && data.esearchresult.idlist.length > 0) {
       const pmid = data.esearchresult.idlist[0];
       
       try {
         const efetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=text&rettype=abstract`;
         const abstractRes = await fetch(efetchUrl);
         const abstractText = await abstractRes.text();
         const shortAbstract = abstractText.substring(0, 100).replace(/\n/g, ' ') + '...';
         return res.json({ success: true, message: `New PMID ${pmid}: ${shortAbstract}` });
       } catch (err) {
         return res.json({ success: true, message: `Found recent publication: PMID ${pmid}` });
       }
    }
    return res.json({ success: true, message: 'No new literature detected for target.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'NCBI API failed' });
  }
});

export default router;
