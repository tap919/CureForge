import express from 'express';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  // Simulating an actual query against historical program datasets
  // Real implementation would join known trials with the current model's scoring pipeline
  const results = [
     { name: 'Imuthiol (CD4)', status: 'success', prediction: 'High Tractability, Strong Mechanism', confidence: 0.88 },
     { name: 'BIA 10-2474 (FAAH)', status: 'failure', prediction: 'Safety Red Flags Detected (Off-target hits)', confidence: 0.22 },
     { name: 'TGN1412 (CD28)', status: 'failure', prediction: 'Severe Toxicity Expected (Cytokine storm)', confidence: 0.15 },
     { name: 'Imatinib (BCR-ABL)', status: 'success', prediction: 'Clean kinase profile, high efficacy', confidence: 0.94 }
  ];

  // Simulate heavy computation delay
  setTimeout(() => {
    res.json({ results, is_demo_fixture: true });
  }, 1500);
});

export default router;
