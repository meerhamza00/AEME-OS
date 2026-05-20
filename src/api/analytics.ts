import { Router } from "express";
import { getDbPool } from "../lib/db";
import { GoogleGenAI, Type } from "@google/genai";

export const analyticsRouter = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

analyticsRouter.get("/analyze", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query("SELECT * FROM campaigns ORDER BY spend DESC LIMIT 50");
    const campaigns = result.rows;

    if (campaigns.length === 0) {
      return res.json({ 
        issues: [], 
        opportunities: ["No data to analyze. Please sync network data."], 
        severity: "low" 
      });
    }

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze the following PPC campaigns and provide structured insights. Identify issues (e.g. low ROAS, high spend with no sales) and opportunities (e.g. scale up high ROAS). Here is the data: " + JSON.stringify(campaigns) }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of identified issues based on performance metrics.",
            },
            opportunities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of opportunities for optimization based on high performance.",
            },
            severity: {
              type: Type.STRING,
              enum: ["low", "medium", "high"],
              description: "Overall severity of the issues found.",
            }
          },
          required: ["issues", "opportunities", "severity"]
        }
      }
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      res.json(parsed);
    } else {
       res.status(500).json({ error: "Failed to generate analysis" });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
