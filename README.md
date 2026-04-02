# Tax Planner — Indian Income Tax Analyzer

**Live App:** https://tax-planner-tau.vercel.app/

A web app for Indian salaried employees to compare the **Old vs New tax regime**, get AI-powered explanations, and optimize their tax planning.

---

## Features

- **Regime Comparison** — Side-by-side Old vs New regime tax breakdown with slab-wise detail
- **AI Analysis** — Claude Sonnet-powered streaming explanations of your tax situation
- **HRA Exemption** — Auto-calculated from Basic Pay, HRA received, rent paid, and city tier
- **Deduction Checklist** — 80C, 80D, NPS 80CCD(1B), Home Loan 24(b), and others
- **What-If Simulator** — See how income changes affect your tax liability
- **Salary Restructuring** — Suggestions to restructure CTC for tax efficiency
- **Session History** — Save and revisit past tax analyses (requires login)
- **PDF Report** — Export full tax summary as PDF

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI (shadcn/ui) |
| State | Zustand + localStorage |
| AI | Anthropic Claude Sonnet 4.6 (streaming SSE) |
| Auth | NextAuth v5 (credentials) |
| Database | Neon PostgreSQL (serverless) |
| ORM | Drizzle ORM |
| Charts | Recharts |
| Forms | react-hook-form + Zod |

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Landing page
│   ├── income/page.tsx           # Income input form
│   ├── analysis/page.tsx         # Tax comparison + AI chat
│   ├── summary/page.tsx          # Full tax report
│   ├── auth/                     # Login & register pages
│   └── api/
│       ├── analyze/route.ts      # Claude streaming endpoint
│       ├── auth/                 # NextAuth handler
│       └── sessions/             # Tax session CRUD
├── components/
│   ├── income-form.tsx
│   ├── tax-comparison.tsx
│   ├── ai-chat.tsx
│   ├── deduction-checklist.tsx
│   ├── what-if-simulator.tsx
│   ├── salary-restructuring.tsx
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── tax-calculator.ts         # Pure tax math engine
│   ├── tax-data.ts               # FY configs & slab data
│   ├── formatters.ts             # INR formatting
│   ├── claude-client.ts          # SSE stream wrapper
│   ├── auth.ts                   # NextAuth config
│   └── db/
│       ├── index.ts              # Drizzle DB client
│       └── schema.ts             # Database schema
├── store/
│   └── tax-store.ts              # Zustand global store
└── types/
    └── tax.ts                    # Core TypeScript interfaces
```

---

## Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- An [Anthropic API key](https://console.anthropic.com)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/s28kalra/tax-planner.git
cd tax-planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
# Anthropic (Claude AI)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Neon PostgreSQL
DATABASE_URL=your_neon_database_connection_string

# NextAuth
NEXTAUTH_SECRET=any_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

### 4. Push database schema

```bash
npm run db:push
```

This creates all required tables in your Neon database using Drizzle ORM.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Push Drizzle schema to database |

---

## How It Works

1. **Enter Income** — Input salary components (Basic, HRA, Special Allowance, LTA, Bonus, etc.)
2. **Get Analysis** — App calculates both regimes instantly; Claude explains the results
3. **Add Deductions** — Fill in 80C, 80D, NPS, HRA, Home Loan to see Old Regime optimized
4. **View Report** — Get a full breakdown with slab details and regime recommendation
5. **Export PDF** — Download the summary as a PDF

---

## Environment Notes

- `.env.local` is git-ignored — never commit your API keys
- The app works without auth/database (session history will be disabled)
- Tax calculations are deterministic TypeScript — Claude only narrates, never recalculates
