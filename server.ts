import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Helper to get Gemini client lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    timestamp: new Date().toISOString(),
  });
});

// AI Clipboard Analysis Route (Summarize, detect action items, generate tags & auto title)
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { content, type } = req.body;
    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "Content string is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristics if Gemini key is not configured yet
      res.json({
        summary: content.length > 120 ? content.slice(0, 120) + "..." : content,
        actionItems: extractHeuristicActionItems(content),
        autoTitle: generateHeuristicTitle(content, type),
        suggestedTags: generateHeuristicTags(content, type),
        isAiGenerated: false,
      });
      return;
    }

    const prompt = `Analyze the following copied clipboard text snippet and provide structured insights in JSON format.
Content:
"""
${content.slice(0, 3000)}
"""

Return ONLY a valid JSON object with the following fields:
1. "summary": A concise 1-2 sentence summary of what this text is about.
2. "actionItems": An array of string tasks/action items mentioned (e.g. TODOs, meetings, follow-ups). Empty array if none.
3. "autoTitle": A short 3-6 word descriptive title for this clip.
4. "suggestedTags": An array of 2-4 short relevant lowercase tag strings (e.g. ["javascript", "auth", "api"]).

Format: JSON only, no markdown wrappers.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || "";
    const cleanJsonText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleanJsonText);
      res.json({
        summary: parsed.summary || content.slice(0, 100),
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        autoTitle: parsed.autoTitle || "Clipboard Item",
        suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags : [],
        isAiGenerated: true,
      });
    } catch {
      res.json({
        summary: rawText.slice(0, 150),
        actionItems: extractHeuristicActionItems(content),
        autoTitle: generateHeuristicTitle(content, type),
        suggestedTags: generateHeuristicTags(content, type),
        isAiGenerated: true,
      });
    }
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze clipboard content with AI",
      details: error?.message || String(error),
    });
  }
});

// Explain Code / Explain Query endpoint
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) {
      res.status(400).json({ error: "Code is required" });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.json({
        explanation: "AI Key is required for code explanations. Configure GEMINI_API_KEY in secrets panel.",
      });
      return;
    }

    const prompt = `Explain the following ${language || "code"} snippet clearly and concisely in 2-3 bullet points:
\`\`\`
${code.slice(0, 2000)}
\`\`\``;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ explanation: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Heuristic fallback utilities
function extractHeuristicActionItems(text: string): string[] {
  const lines = text.split("\n");
  const actionItems: string[] = [];
  const taskKeywords = ["todo", "fixme", "task:", "action:", "remember to", "call ", "email ", "meeting", "deadline"];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (taskKeywords.some((kw) => lower.includes(kw)) || /^\s*[-*\[\]\d+.]\s+/.test(line)) {
      const clean = line.replace(/^[\s-*\[\]\d+.]+/, "").trim();
      if (clean && clean.length > 5 && clean.length < 150) {
        actionItems.push(clean);
      }
    }
  }
  return actionItems.slice(0, 5);
}

function generateHeuristicTitle(text: string, type: string): string {
  if (type === "url") return "Web Bookmark";
  if (type === "json") return "JSON Data Structure";
  if (type === "sql") return "SQL Query Statement";
  if (type === "hex") return "Color Palette Code";
  if (type === "email") return "Contact Email Address";
  if (type === "image") return "Image Snapshot";
  if (type === "code") return "Code Snippet";

  const firstLine = text.trim().split("\n")[0] || "";
  if (firstLine.length > 35) {
    return firstLine.slice(0, 32) + "...";
  }
  return firstLine || "Copied Text";
}

function generateHeuristicTags(text: string, type: string): string[] {
  const tags: string[] = [type.toLowerCase()];
  const lower = text.toLowerCase();
  if (lower.includes("http")) tags.push("link");
  if (lower.includes("function") || lower.includes("import") || lower.includes("const")) tags.push("dev");
  if (lower.includes("select") || lower.includes("table") || lower.includes("where")) tags.push("database");
  if (lower.includes("password") || lower.includes("key")) tags.push("sensitive");
  return Array.from(new Set(tags));
}

// Vite middleware or static serving
async function start() {
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
    console.log(`PasteTimeline server running on http://0.0.0.0:${PORT}`);
  });
}

start();
