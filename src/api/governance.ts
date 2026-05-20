import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDbPool } from "../lib/db";

export const governanceRouter = Router();

// Initialize schema
governanceRouter.post("/init", async (req, res) => {
  try {
    const pool = getDbPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255),
        title VARCHAR(255),
        description TEXT,
        action_type VARCHAR(100),
        payload JSONB,
        status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, executed, failed
        risk_level VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY,
        workflow_id UUID REFERENCES workflows(id),
        user_id VARCHAR(255),
        action VARCHAR(100),
        details TEXT,
        outcome TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DO $$ 
      BEGIN
          BEGIN
              ALTER TABLE audit_logs ADD COLUMN outcome TEXT;
          EXCEPTION
              WHEN duplicate_column THEN null;
          END;
      END $$;
    `);
    res.json({ message: "Governance layer initialized successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Propose a new workflow (called by AI indirectly or UI)
governanceRouter.post("/propose", async (req, res) => {
  try {
    const pool = getDbPool();
    const { userId, title, description, actionType, payload, riskLevel } = req.body;
    
    const id = uuidv4();
    await pool.query(
      "INSERT INTO workflows (id, user_id, title, description, action_type, payload, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [id, userId || 'system', title, description, actionType, JSON.stringify(payload || {}), riskLevel || 'Medium']
    );

    res.json({ message: "Workflow proposed.", id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get pending workflows
governanceRouter.get("/pending", async (req, res) => {
  try {
    const pool = getDbPool();
    // In real app filter by user_id
    const result = await pool.query("SELECT * FROM workflows ORDER BY created_at DESC");
    res.json({ workflows: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Get Audit Logs
governanceRouter.get("/logs", async (req, res) => {
  try {
    const pool = getDbPool();
    // In real app filter by user_id
    const result = await pool.query(`
      SELECT a.*, w.title as workflow_title 
      FROM audit_logs a 
      LEFT JOIN workflows w ON a.workflow_id = w.id 
      ORDER BY a.created_at DESC 
      LIMIT 50
    `);
    res.json({ logs: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

// Approve/Reject/Execute
governanceRouter.post("/action", async (req, res) => {
  try {
    const pool = getDbPool();
    const { workflowId, action, userId, comments, outcome } = req.body;
    
    if (!['approve', 'reject', 'execute', 'fail'].includes(action)) {
       return res.status(400).json({ error: "Invalid action" });
    }

    let newStatus = 'pending';
    if (action === 'approve') newStatus = 'approved';
    if (action === 'reject') newStatus = 'rejected';
    if (action === 'execute') newStatus = 'executed';
    if (action === 'fail') newStatus = 'failed';

    await pool.query("UPDATE workflows SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [newStatus, workflowId]);

    // Log the audit
    const logId = uuidv4();
    
    // Add outcome column to insert if it's there? Using exact names is better.
    // However, if the db hasn't been migrated with `outcome`, this might throw.
    // The user has to click "Run DB Migrations" anyway. (Better yet, we can do ALTER TABLE in /init)
    
    await pool.query(
      "INSERT INTO audit_logs (id, workflow_id, user_id, action, details, outcome) VALUES ($1, $2, $3, $4, $5, $6)",
      [logId, workflowId, userId || 'anonymous', `HUMAN_${action.toUpperCase()}`, comments || 'No comments', outcome || '']
    );

    res.json({ message: `Workflow ${action}d.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});
