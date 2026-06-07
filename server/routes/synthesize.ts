import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { METADATA } from '../metadata';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

const GEMINI_CAPABILITY = METADATA.majorCapabilities.includes(
  'MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API'
);
const genAI =
  GEMINI_CAPABILITY && process.env.GOOGLE_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
    : null;

router.post('/', authenticate, async (req, res) => {
  try {
    const { intent, knowledgeBase, targetSymbol } = req.body;

    if (typeof intent !== 'string' || intent.length > 1000) {
      return res.status(400).json({ success: false, error: 'Invalid intent parameter' });
    }
    if (typeof knowledgeBase !== 'string' || knowledgeBase.length > 2000) {
      return res.status(400).json({ success: false, error: 'Invalid knowledgeBase parameter' });
    }
    
    let enrichedKnowledgeBase = knowledgeBase;
    if (targetSymbol && typeof targetSymbol === 'string') {
      try {
        const [chemblData, pubmedData] = await Promise.all([
          fetch(`https://www.ebi.ac.uk/chembl/api/data/target/search?q=${targetSymbol}&format=json`).then(r => r.json()).catch(() => ({})),
          fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${targetSymbol}[MeSH]&retmode=json&retmax=3`).then(r => r.json()).catch(() => ({}))
        ]);
        enrichedKnowledgeBase = `${knowledgeBase} | ChEMBL compounds: ${chemblData.page_meta?.total_count || 0} | Recent PMIDs: ${pubmedData.esearchresult?.idlist?.join(', ') || 'None'}`;
      } catch (e) {
        console.error('Failed to prefetch enrichments:', e);
      }
    }

    if (genAI) {
      try {
        const result = await genAI.models.generateContent({
          model: 'gemini-2.5-pro',
          systemInstruction: 'You are the Hypothesis Engine for CureForge. Formulate a testable biomedical intervention.\\nReturn ONLY a JSON object (no markdown block) with this exact structure:\\n{\\n  "target": "Gene/Protein symbol",\\n  "mechanism": "Biological reasoning in 2-3 sentences",\\n  "modality": "Small molecule, Biologic, Gene therapy, etc.",\\n  "proposed_intervention": "Proposed drug or mechanism of action",\\n  "testable_prediction": "Expected biomarker or functional outcome",\\n  "confidence": 85,\\n  "literature_support": "Brief hypothetical literature/evidence summary"\\n}',
          contents: [
            { role: 'user', parts: [
              { text: `Intent: ${intent}\n\nContext: ${enrichedKnowledgeBase}` }
            ]},
          ],
        });
        const generatedHypothesisText = (result.text || '').replace(/\`\`\`json|\`\`\`/g, '').trim();
        let hypothesis;
        try {
          hypothesis = JSON.parse(generatedHypothesisText);
        } catch(e) {
          throw new Error('Failed to parse Hypothesis JSON: ' + generatedHypothesisText.substring(0, 50));
        }

        const skepticResult = await genAI.models.generateContent({
          model: 'gemini-2.5-pro',
          systemInstruction: 'You are Skeptic.ai, a ruthless peer reviewer. Review this hypothesis for flaws, list them, cite contradictory papers, and assign a critic_score from 0-100 indicating falsifiability.\\nReturn ONLY a JSON object (no markdown block) with this exact structure:\\n{\\n  "flaws": ["Flaw 1", "Flaw 2"],\\n  "contradictory_papers": ["Citations..."],\\n  "critic_score": 75\\n}',
          contents: [
            { role: 'user', parts: [
               { text: generatedHypothesisText }
            ]}
          ],
        });
        const skepticText = (skepticResult.text || '').replace(/\`\`\`json|\`\`\`/g, '').trim();
        let skepticObj;
        try {
          skepticObj = JSON.parse(skepticText);
        } catch(e) {
          throw new Error('Failed to parse Skeptic JSON');
        }

        const finalOutput = { ...hypothesis, ...skepticObj };
        return res.json({ success: true, hypothesis: finalOutput });
      } catch (aiError: any) {
        console.error('Gemini synthesis failed:', aiError);
        return res.json({
          success: true,
          hypothesis: {
            target: "Fallback", mechanism: "Gemini failed to load or parse.",
            modality: "N/A", proposed_intervention: "N/A",
            testable_prediction: "N/A", confidence: 0,
            literature_support: "N/A", flaws: ["AI failed"],
            contradictory_papers: ["None"], critic_score: 0
          }
        });
      }
    }

    // Gemini not available – return a static demo
    res.json({
      success: true,
      hypothesis: {
        target: "EGFR", mechanism: "Inhibition of EGFR tyrosine kinase domain prevents downstream signaling.",
        modality: "Small molecule", proposed_intervention: "Type I Tyrosine Kinase Inhibitor",
        testable_prediction: "Decreased phosphorylation of ERK1/2 in tumor biopsy.",
        confidence: 90, literature_support: "Multiple phase 3 trials in NSCLC demonstrate efficacy.",
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

export default router;
