import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDbPool } from "../lib/db";

export const ppcRouter = Router();

// Initialize DB Schema
ppcRouter.post("/init", async (req, res) => {
  try {
    const pool = getDbPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY,
        name VARCHAR(255),
        status VARCHAR(50),
        budget NUMERIC(10, 2),
        spend NUMERIC(10, 2),
        sales NUMERIC(10, 2),
        roas NUMERIC(5, 2),
        impressions INTEGER,
        clicks INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    res.json({ message: "PPC Engine database initialized successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Import simulated PPC data
ppcRouter.post("/sync", async (req, res) => {
  try {
    const pool = getDbPool();
    
    // Simulating an Amazon Ads API Pull with realistic sample data
    const mockCampaigns = [
      { id: uuidv4(), name: "SP - Core Products - Exact", status: "ENABLED", budget: 150.00, spend: 142.50, sales: 580.20, roas: 4.07, impressions: 15400, clicks: 320 },
      { id: uuidv4(), name: "SB - Brand Defense", status: "ENABLED", budget: 50.00, spend: 48.00, sales: 210.00, roas: 4.38, impressions: 8500, clicks: 115 },
      { id: uuidv4(), name: "SD - Remarketing 30d", status: "ENABLED", budget: 100.00, spend: 95.20, sales: 185.50, roas: 1.95, impressions: 42000, clicks: 410 },
      { id: uuidv4(), name: "SP - Competitor Conquest", status: "PAUSED", budget: 100.00, spend: 100.00, sales: 85.00, roas: 0.85, impressions: 22000, clicks: 505 },
      { id: uuidv4(), name: "SP - Auto Discovery", status: "ENABLED", budget: 75.00, spend: 74.50, sales: 110.00, roas: 1.48, impressions: 31000, clicks: 450 },
    ];

    // Clear existing for the sake of the sync demo
    await pool.query('DELETE FROM campaigns');

    for (const c of mockCampaigns) {
      await pool.query(
        "INSERT INTO campaigns (id, name, status, budget, spend, sales, roas, impressions, clicks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [c.id, c.name, c.status, c.budget, c.spend, c.sales, c.roas, c.impressions, c.clicks]
      );
    }

    res.json({ message: `Successfully synced ${mockCampaigns.length} campaigns from ad network.`, count: mockCampaigns.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Update budget
ppcRouter.put("/campaigns/:id/budget", async (req, res) => {
  try {
    const { id } = req.params;
    const { budget } = req.body;
    const pool = getDbPool();
    await pool.query(
      "UPDATE campaigns SET budget = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [budget, id]
    );
    res.json({ message: "Budget updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Create campaign
ppcRouter.post("/campaigns", async (req, res) => {
  try {
    const pool = getDbPool();
    const { name, status, budget, target_roas } = req.body;
    const id = uuidv4();
    
    // Simulate initial zero metrics for new campaign
    await pool.query(
      "INSERT INTO campaigns (id, name, status, budget, spend, sales, roas, impressions, clicks) VALUES ($1, $2, $3, $4, 0, 0, $5, 0, 0)",
      [id, name, status, budget, target_roas]
    );
    res.json({ message: "Campaign created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Delete campaign
ppcRouter.delete("/campaigns/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getDbPool();
    await pool.query("DELETE FROM campaigns WHERE id = $1", [id]);
    res.json({ message: "Campaign deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get campaigns
ppcRouter.get("/campaigns", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query("SELECT * FROM campaigns ORDER BY spend DESC");
    res.json({ campaigns: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get aggregate metrics
ppcRouter.get("/metrics", async (req, res) => {
  try {
    const pool = getDbPool();
    const result = await pool.query(`
      SELECT 
        SUM(spend) as total_spend, 
        SUM(sales) as total_sales, 
        CASE WHEN SUM(spend) > 0 THEN SUM(sales) / SUM(spend) ELSE 0 END as overall_roas,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks
      FROM campaigns
    `);
    
    // Safely parse decimals from postgres
    const row = result.rows[0];
    const metrics = row ? {
      total_spend: parseFloat(row.total_spend || "0"),
      total_sales: parseFloat(row.total_sales || "0"),
      overall_roas: parseFloat(row.overall_roas || "0"),
      total_impressions: parseInt(row.total_impressions || "0"),
      total_clicks: parseInt(row.total_clicks || "0")
    } : null;

    res.json({ metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
