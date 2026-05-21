# AEME OS: The Sovereign Strategist
An Autonomous Enterprise Metamorphosis Engine for E-commerce

AEME defines a new category: **Autonomous Ecommerce Decision Operating Systems (EDOS)**. It compresses the e-commerce growth cycle from reactive spreadsheets into a continuously learning decision engine.

Unlike traditional dashboards that tell you "what happened", AEME simulates futures, governs risk, and proposes precise executable actions for growth.

📖 **[Read the Complete Expert User Guide](./USER_GUIDE.md) to master AEME OS from onboarding to full autonomy.**

## Core Modules

1. **Memory Engine**
   Retrieves business intelligence, brand memory, and external knowledge using vector search and embeddings.
2. **PPC Intelligence**
   Ingests and analyzes live Amazon Ads and Shopify performance data to surface immediate operational inefficiencies.
3. **Simulation Engine**
   Tests strategic changes (e.g., "What if I increase the SP-Core bid by 20%?") via Monte Carlo-style modeling to predict ROAS, Sales, and Risk Outcomes before execution.
4. **Strategic Chat System**
   A high-fidelity AI companion that does not just converse, but formulates structured actionable strategy based on the e-commerce ecosystem's data lake.
5. **Autonomy Control Plane**
   A continuously running daemon analyzing metrics to queue optimized workflow proposals autonomously.
6. **Governance Layer**
   The safety net: Executable operations and workflows proposed by the Autonomy or Strategic layers are held for Human-in-the-loop audit and approval.

## Award-Winning UI/UX Architecture

AEME OS has been upgraded to feature a precise **macOS Tahoe** design language, presenting an elite "Apple-developed" aesthetic optimized for modern capabilities:

- **macOS Tahoe Glassmorphism:** Incorporates deep translucent backgrounds (`backdrop-blur-3xl`) with nuanced material effects, mirroring macOS application windows. The container features macOS-style traffic light window controls.
- **Apple Typography:** Uses the native Apple font stack (`-apple-system`, `BlinkMacSystemFont`, `SF Pro`) for flawless legibility that mimics native macOS utility applications.
- **Isolated Modular Workspace:** Built a deeply segmented sidebar navigation system for total visual isolation, eliminating dashboards clutter and preventing cognitive overload. Includes a collapsible translucent navigation bar (`macos-glass-sidebar`).
- **Dynamic Theme Selection:** Supports universal Light and Dark modes (`.dark` strategy) configurable through the application header. Light mode features vibrant white translucency while dark mode utilizes deep, frosted graphite tones.
- **Fluid Scale & Density:** Driven by `clamp()` functions for seamless scaling. The header features a "Compact" vs. "Comfort" toggle seamlessly animating layout densities.

## Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Express, Node.js
- **AI Core:** Google Gemini (`gemini-2.5-flash`, `text-embedding-004`) via `@google/genai`
- **Authentication:** Clerk (`@clerk/clerk-react`)
- **Database (Simulated via lib/db):** PostgreSQL with `pgvector`

## Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed along with `npm`.

### Environment Variables

Configure your `.env` file referencing `.env.example`:

```env
GEMINI_API_KEY="your-gemini-api-key"
VITE_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
DATABASE_URL="postgres://user:password@host:port/db"
```

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/meerhamza00/AEME-OS.git
   ```
2. Navigate to the directory:
   ```bash
   cd AEME-OS
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To run the application in a local development environment (with hot module replacement for UI and server components compiled by `tsx`):

```bash
npm run dev
```

### Production Build

To build the client SPA and bundled Express backend for production:

```bash
npm run build
```

Then start the production server:

```bash
npm run start
```
