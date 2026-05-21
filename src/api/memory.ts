import { Router } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { getDbPool } from "../lib/db";
import { GoogleGenAI } from "@google/genai";

export const memoryRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  return new GoogleGenAI({ apiKey });
}

// Initialize DB Schema
memoryRouter.post("/init", async (req, res) => {
  try {
    const pool = getDbPool();
    await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memory_chunks (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255),
        content TEXT,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ message: "Memory Engine database initialized successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Upload & Process (Chunk & Embed)
memoryRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const userId = req.body.userId || "anonymous";
    let textBase = "";

    if (req.file) {
      textBase = req.file.buffer.toString("utf-8");
    } else if (req.body.text) {
      textBase = req.body.text;
    } else {
      return res.status(400).json({ error: "No file or text provided." });
    }

    // Basic Chunking: split by double newlines, group up to ~1000 chars
    const paragraphs = textBase.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const p of paragraphs) {
      if (currentChunk.length + p.length > 1000) {
        chunks.push(currentChunk.trim());
        currentChunk = p;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + p;
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());

    if (chunks.length === 0) return res.status(400).json({ error: "Empty content." });

    const ai = getAI();
    const pool = getDbPool();
    let inserted = 0;

    for (const chunk of chunks) {
      const resp = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: chunk,
      });
      const embedding = resp.embeddings[0].values;
      if (!embedding) continue;
      
      const embeddingStr = `[${embedding.join(",")}]`;
      await pool.query(
        "INSERT INTO memory_chunks (id, user_id, content, embedding) VALUES ($1, $2, $3, $4)",
        [uuidv4(), userId, chunk, embeddingStr]
      );
      inserted++;
    }

    res.json({ message: `Successfully embedded ${inserted} chunks.`, inserted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get Memory Chunks (List)
memoryRouter.get("/chunks", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";
    const pool = getDbPool();
    const result = await pool.query(
      "SELECT id, content, created_at FROM memory_chunks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json({ chunks: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Delete Memory Chunk
memoryRouter.delete("/chunks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    await pool.query("DELETE FROM memory_chunks WHERE id = $1", [id]);
    res.json({ message: "Chunk deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Update (Rename/Edit) Memory Chunk
memoryRouter.put("/chunks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const pool = getDbPool();
    await pool.query("UPDATE memory_chunks SET content = $1 WHERE id = $2", [content, id]);
    res.json({ message: "Chunk updated successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Visualize Embeddings (Experimental 2D Projection)
memoryRouter.get("/visualize", async (req, res) => {
  try {
    const userId = req.query.userId || "anonymous";
    const pool = getDbPool();
    // Retrieve embedding and content, parse vector
    const result = await pool.query(
      "SELECT id, content, embedding::text FROM memory_chunks WHERE user_id = $1",
      [userId]
    );
    
    // Naive 2D projection (just taking first two components or mocking PCA for visualization)
    const points = result.rows.map(row => {
      // Postgres vector comes as string '[0.1, 0.2, ...]'
      const vecMatch = row.embedding.match(/\[(.*)\]/);
      let x = 0, y = 0;
      if (vecMatch && vecMatch[1]) {
        const vals = vecMatch[1].split(',').map(Number);
        // Extremely naive pseudo-PCA: sum of alternate components
        x = vals.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
        y = vals.filter((_, i) => i % 2 !== 0).reduce((a, b) => a + b, 0);
      }
      return {
        id: row.id,
        name: row.content.substring(0, 20) + "...",
        x: x,
        y: y
      };
    });
    
    res.json({ points });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Search Memory
memoryRouter.post("/search", async (req, res) => {
  try {
    const { query, userId } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required." });

    const ai = getAI();
    const resp = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: query,
    });
    const embedding = resp.embeddings[0].values;
    if (!embedding) return res.status(500).json({ error: "Failed to generate embedding." });

    const embeddingStr = `[${embedding.join(",")}]`;
    const pool = getDbPool();

    // Cosine distance is used directly here
    const sql = `
      SELECT id, content, 1 - (embedding <=> $1::vector) as similarity
      FROM memory_chunks
      WHERE user_id = $2 OR $2 IS NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 5;
    `;
    
    const result = await pool.query(sql, [embeddingStr, userId || "anonymous"]);
    res.json({ results: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
