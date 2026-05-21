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

AEME OS is designed with an elite frontend architecture targeting flawless aesthetics and multi-screen responsiveness:

- **Advanced Grid & Ultrawide Optimization:** Employs a robust CSS Grid utilizing responsive properties and fluid sizing to maintain aspect ratios and layout integrity up to `1600px` ultra-wide bounds. Container queries (`@container`) ensure every widget gracefully adapts its internal anatomy based on available space rather than raw viewport width.
- **Fluid Scale & Typography:** Driven by `clamp()` functions for seamless scaling of typography, padding, and gaps across breakpoints—avoiding layout jumping entirely.
- **Density Control:** The header features a "Compact View" vs. "Comfort View" toggle. It seamlessly animates layout densities to provide high mouse precision for desktop operators, while ensuring 48px+ touch targets on smaller devices via progressive padding adjustments.
- **Micro-Interactions & Hardware Acceleration:** Leverages Framer Motion (`motion/react`) to deliver physics-based staggering animations on dashboard load. Deep native Dark UI relies on WCAG AAA compliant constrast and nuanced layer shadows.

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
