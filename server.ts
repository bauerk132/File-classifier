import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Shared lazy Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Sorter", version: "1.2.0" });
});

// 2. Load taxonomy JSON
app.get("/api/taxonomy", (_req, res) => {
  try {
    const taxPath = path.join(process.cwd(), "public", "file-classifier-taxonomy.json");
    if (fs.existsSync(taxPath)) {
      const data = fs.readFileSync(taxPath, "utf-8");
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: "Taxonomy file not found" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to read taxonomy" });
  }
});

// 3. Save / Update taxonomy JSON (Import / Export support)
app.post("/api/taxonomy", (req, res) => {
  try {
    const newTaxonomy = req.body;
    if (!newTaxonomy || !Array.isArray(newTaxonomy.groups) || !Array.isArray(newTaxonomy.ignore_rules)) {
      return res.status(400).json({ error: "Invalid taxonomy schema: must contain groups and ignore_rules" });
    }
    const taxPath = path.join(process.cwd(), "public", "file-classifier-taxonomy.json");
    fs.writeFileSync(taxPath, JSON.stringify(newTaxonomy, null, 2), "utf-8");
    return res.json({ success: true, message: "Taxonomy persisted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to persist taxonomy" });
  }
});

// 4. Web lookup endpoint for rare extensions
app.post("/api/lookup", (req, res) => {
  const { extension } = req.body;
  if (!extension || typeof extension !== "string") {
    return res.status(400).json({ error: "Extension required" });
  }

  const cleanExt = extension.startsWith(".") ? extension.toLowerCase() : "." + extension.toLowerCase();
  
  const knownExtensions: Record<string, { description: string; mimeType: string; suggestedCategory: string }> = {
    ".webloc": { description: "macOS Safari internet location URL shortcut", mimeType: "application/internet-shortcut", suggestedCategory: "Shortcuts & Web Links" },
    ".sketch": { description: "Bohemian Coding Sketch UI vector document", mimeType: "application/x-sketch", suggestedCategory: "Vector & Icons" },
    ".parquet": { description: "Apache Parquet columnar binary data storage", mimeType: "application/vnd.apache.parquet", suggestedCategory: "Raw Data Pipeline" },
    ".pkpass": { description: "Apple Wallet digital boarding pass or coupon", mimeType: "application/vnd.apple.pkpass", suggestedCategory: "Travel & Tickets" },
    ".epub": { description: "Electronic publication e-book standard container", mimeType: "application/epub+zip", suggestedCategory: "Word & Office Documents" },
    ".dmg": { description: "Apple macOS Disk Image installer archive", mimeType: "application/x-apple-diskimage", suggestedCategory: "Installers & Executables" },
    ".apk": { description: "Android package application archive", mimeType: "application/vnd.android.package-archive", suggestedCategory: "Installers & Executables" },
    ".crdownload": { description: "Google Chrome partial in-progress download", mimeType: "application/octet-stream", suggestedCategory: "Partial Downloads & Temp Files" },
    ".sql": { description: "Structured Query Language database script / dump", mimeType: "application/sql", suggestedCategory: "Database Backups" }
  };

  if (knownExtensions[cleanExt]) {
    return res.json({ found: true, ...knownExtensions[cleanExt] });
  }

  return res.json({
    found: true,
    description: `Generic ${cleanExt.toUpperCase()} file artifact`,
    mimeType: "application/octet-stream",
    suggestedCategory: "Scratchpads & Untitled"
  });
});

// 5. Server-side AI Smart Classification (Strict privacy: never receives file content)
app.post("/api/ai-classify", async (req, res) => {
  const { fileName, extension, candidateCategories } = req.body;
  if (!fileName) {
    return res.status(400).json({ error: "fileName is required" });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      useFallback: true,
      message: "Gemini API key not configured. Using deterministic taxonomy rules."
    });
  }

  try {
    const prompt = `You are a strict file classifier.
Given the file name "${fileName}" with extension "${extension}", categorize it into the single most fitting category from this candidate list:
${JSON.stringify(candidateCategories || [])}

Respond with only a JSON object formatted as:
{
  "category": "Exact category name from list",
  "confidence": 0.85,
  "reason": "Short one-sentence explanation based on file name pattern"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, ...parsed });
  } catch (err: any) {
    return res.json({
      useFallback: true,
      error: err.message || "AI classification error"
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sorter Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
