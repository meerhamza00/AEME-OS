import { Router } from "express";
import { getDbPool } from "../lib/db";
import { GoogleGenAI, Type } from "@google/genai";

export const simulationRouter = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

simulationRouter.post("/simulate", async (req, res) => {
  try {
    const { scenario } = req.body;
    if (!scenario) return res.status(400).json({ error: "Scenario is required." });

    const pool = getDbPool();
    const result = await pool.query("SELECT * FROM campaigns ORDER BY spend DESC LIMIT 50");
    const campaigns = result.rows;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Run a business simulation based on the following scenario: "${scenario}". 
            Use the current PPC campaign data as the baseline: ${JSON.stringify(campaigns)}.
            Provide probabilistic outcomes, risk estimation, and a recommendation.` }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predicted_roas: {
              type: Type.NUMBER,
              description: "Expected new overall Return on Ad Spend (multiplier, e.g. 2.5)"
            },
            predicted_sales: {
              type: Type.NUMBER,
              description: "Expected new total sales in USD"
            },
            risk_level: {
              type: Type.STRING,
              enum: ["Low", "Medium", "High"],
              description: "Estimated risk of this scenario"
            },
            confidence_score: {
              type: Type.NUMBER,
              description: "Confidence in this simulation outcome (0-100)"
            },
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific insights and distribution analysis of this scenario"
            }
          },
          required: ["predicted_roas", "predicted_sales", "risk_level", "confidence_score", "insights"]
        }
      }
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      res.json(parsed);
    } else {
      res.status(500).json({ error: "Failed to generate simulation" });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
