import { Router } from "express";
import { getDbPool } from "../lib/db";
import { GoogleGenAI, Type } from "@google/genai";

export const chatRouter = Router();

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

chatRouter.post("/strategic", async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required." });

    const ai = getAI();
    const pool = getDbPool();

    // 1. Retrieve Memory
    let memoryContext = "";
    try {
      const resp = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: message,
      });
      const embedding = resp.embeddings[0].values;
      if (embedding) {
        const embeddingStr = `[${embedding.join(",")}]`;
        const memoryRes = await pool.query(`
          SELECT content, 1 - (embedding <=> $1::vector) as similarity
          FROM memory_chunks
          WHERE user_id = $2 OR $2 IS NULL
          ORDER BY embedding <=> $1::vector
          LIMIT 3;
        `, [embeddingStr, userId || "anonymous"]);
        memoryContext = memoryRes.rows.map((r: any) => r.content).join("\n\n");
      }
    } catch (e) {
      console.warn("Memory retrieval failed or not initialized:", e);
    }

    // 2. Retrieve PPC Context
    let ppcContext = "";
    let ppcMetrics = "";
    try {
      const campRes = await pool.query("SELECT name, status, spend, sales, roas FROM campaigns ORDER BY spend DESC LIMIT 10");
      ppcContext = JSON.stringify(campRes.rows);

      const metRes = await pool.query(`
        SELECT 
          SUM(spend) as total_spend, 
          SUM(sales) as total_sales, 
          CASE WHEN SUM(spend) > 0 THEN SUM(sales) / SUM(spend) ELSE 0 END as overall_roas
        FROM campaigns
      `);
      ppcMetrics = JSON.stringify(metRes.rows[0]);
    } catch (e) {
      console.warn("PPC context retrieval failed or not initialized:", e);
    }

    // 3. Generate Strategic Output
    const prompt = `You are "The Sovereign Strategist", an Autonomous Enterprise Metamorphosis Engine for ecommerce.
You are not a chatbot; you are a strategic decision engine.
Analyze the user's query and provide structured strategic advice based on the provided context.

User Query: "${message}"

--- CONTEXT START ---
Organization Memory (from embeddings): 
${memoryContext || "None"}

Current PPC Metrics:
${ppcMetrics || "None"}

Top PPC Campaigns:
${ppcContext || "None"}
--- CONTEXT END ---
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Strategic insights derived from data and memory."
            },
            reasoning: {
              type: Type.STRING,
              description: "The core rationale for your advice."
            },
            actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific, executable actions the business should take."
            },
            risk: {
              type: Type.STRING,
              enum: ["Low", "Medium", "High"],
              description: "Risk calculation for these actions."
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence in this strategy (0-100)."
            }
          },
          required: ["insights", "reasoning", "actions", "risk", "confidence"]
        }
      }
    });

    const output = response.text;
    if (output) {
      const parsed = JSON.parse(output);
      res.json(parsed);
    } else {
      res.status(500).json({ error: "Failed to generate strategy" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
