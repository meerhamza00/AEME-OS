import { Router } from "express";
import { getDbPool } from "../lib/db";
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from "uuid";

export const autonomyRouter = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

// Control plane ping (e.g. called hourly)
autonomyRouter.post("/cycle", async (req, res) => {
  try {
    const pool = getDbPool();
    const { minRiskLevel, cycleFrequency } = req.body || { minRiskLevel: 'Low', cycleFrequency: 'hourly' };

    // 1. Observe: fetch metrics
    const campRes = await pool.query("SELECT * FROM campaigns ORDER BY spend DESC LIMIT 10");
    const campaigns = campRes.rows;

    if (campaigns.length === 0) {
       return res.status(400).json({ error: "No campaigns found to analyze. Please run DB migrations and sync data first." });
    }

    // 2. AI Analyze & Recommend -> Simulate -> Propose
    const ai = getAI();
    let riskConstraint = "";
    if (minRiskLevel === 'Medium') riskConstraint = "The proposed action MUST have a riskLevel of 'Medium' or 'High'.";
    if (minRiskLevel === 'High') riskConstraint = "The proposed action MUST have a riskLevel of 'High'.";

    const prompt = `You are the Autonomous Operations Layer for a DTC business. 
Cycle Frequency: ${cycleFrequency}
Analyze these campaigns:
${JSON.stringify(campaigns)}

Task: Identify ONE critical inefficiency or scaling opportunity. Propose an operational workflow action to fix it. Do not recommend small micro-optimizations, only significant strategic changes.
${riskConstraint}

Format the response strictly as valid JSON with no markdown formatting or backticks:
{
  "title": "Short title of the workflow",
  "description": "Why this action is needed.",
  "actionType": "PAUSE_CAMPAIGN" | "UPDATE_BUDGET" | "EXPAND_KEYWORDS",
  "riskLevel": "Low" | "Medium" | "High",
  "payload": { "campaign_id": "...", "change": "..." }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            actionType: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            payload: { type: Type.OBJECT }
          },
          required: ["title", "description", "actionType", "riskLevel", "payload"]
        }
      }
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      
      const id = uuidv4();
      await pool.query(
        "INSERT INTO workflows (id, user_id, title, description, action_type, payload, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, 'system', parsed.title, parsed.description, parsed.actionType, JSON.stringify(parsed.payload || {}), parsed.riskLevel]
      );

      res.json({ message: "Autonomous cycle complete. Workflow proposed.", workflow_id: id, recommendation: parsed });
    } else {
      res.status(500).json({ error: "No output from reasoning engine" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
