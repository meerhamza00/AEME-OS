import express from "express";
import path from "path";
import cors from "cors";
import { memoryRouter } from "./src/api/memory";
import { ppcRouter } from "./src/api/ppc";
import { analyticsRouter } from "./src/api/analytics";
import { simulationRouter } from "./src/api/simulation";
import { chatRouter } from "./src/api/chat";
import { governanceRouter } from "./src/api/governance";
import { autonomyRouter } from "./src/api/autonomy";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // --- API Routes (Week 1 Foundation) ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "AEME OS Meta-Orchestrator" });
  });

  // --- API Routes (Week 2 Memory Engine) ---
  app.use("/api/memory", memoryRouter);

  // --- API Routes (Week 3 PPC Engine) ---
  app.use("/api/ppc", ppcRouter);

  // --- API Routes (Week 4 Analytics Engine) ---
  app.use("/api/analytics", analyticsRouter);

  // --- API Routes (Week 5 Simulation Engine) ---
  app.use("/api/simulation", simulationRouter);

  // --- API Routes (Week 6 Strategic Chat System) ---
  app.use("/api/chat", chatRouter);

  // --- API Routes (Week 7 Governance Layer) ---
  app.use("/api/governance", governanceRouter);

  // --- API Routes (Week 8 Autonomous Operations Layer) ---
  app.use("/api/autonomy", autonomyRouter);

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    // In development mode, defer to Vite for asset serving and HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AEME OS] Backend online.`);
    console.log(`Port: ${PORT}`);
  });
}

startServer();
