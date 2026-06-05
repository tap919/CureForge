import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API 1: Fetch real literature from PubMed API
  app.get("/api/pubmed/search", async (req, res) => {
    try {
      const term = req.query.term || "Pancreatic Cancer";
      
      // Step 1: ESearch to get PubMed IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term as string)}&retmode=json&retmax=5`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
        return res.json({ success: true, articles: [] });
      }
      
      const ids = searchData.esearchresult.idlist;
      if (ids.length === 0) {
        return res.json({ success: true, articles: [] });
      }
      
      // Step 2: ESummary to get article metadata
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
      const summaryRes = await fetch(summaryUrl);
      const summaryData = await summaryRes.json();
      
      const articles = ids.map((id: string) => {
        const article = summaryData.result[id];
        return {
          id,
          title: article.title,
          source: article.source,
          pdbr: article.pubdate,
          authors: article.authors ? article.authors.slice(0, 3).map((a: any) => a.name).join(", ") : "Unknown",
        };
      });
      
      res.json({ success: true, articles });
    } catch (error) {
      console.error("PubMed API error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch from PubMed API" });
    }
  });

  // API 2: Use Gemini to actually generate hypothesis based on context
  app.post("/api/agent/hypothesize", async (req, res) => {
    try {
      const { topic, context } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(401).json({ success: false, error: "Please configure GEMINI_API_KEY in the settings menu to use the Hypothesis Generator." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a specialized biomedical AI agent. Generate a concise, highly specific novel scientific hypothesis regarding "${topic}" based on these recent findings: ${context}. Avoid generalities. State the hypothesis, its rationale in 1 sentence, and a proposed experimental target. Format as JSON: { "insight": "...", "target": "..." }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      let data;
      try {
        data = JSON.parse(response.text || '{}');
      } catch (e) {
        data = { insight: "JSON parse failed", target: "Unknown", raw: response.text };
      }
      
      res.json({ success: true, hypothesis: data });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate hypothesis" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
