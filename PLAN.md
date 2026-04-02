# Indian Tax Planner — Project Plan

## What We're Building
A web app for Indian salaried employees to:
1. Enter their salary breakdown
2. See tax calculated under **both Old and New regimes**
3. Get **AI-powered analysis** (Claude) explaining which regime is better and why
4. Get **smart deduction suggestions** — AI tells you what deductions to make if Old Regime could save you more money
5. Ask follow-up tax questions via **chat**

No login required. Works entirely in-browser with localStorage persistence.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + localStorage |
| AI | Claude API (Anthropic SDK) — streaming |
| Charts | Recharts |
| Forms | react-hook-form + Zod |

---

## App Pages & Flow

```
1. Landing Page   →  Select Financial Year (2023-24 to 2026-27)
      ↓
2. Income Page    →  Enter salary breakdown
      ↓
3. Analysis Page  →  See tax comparison + AI analysis + deduction suggestions + chat
      ↓
4. Summary Page   →  Print-friendly tax report (Save as PDF)
```

---

## Income Inputs (Page 2)

### Fixed Fields
- Basic Pay
- HRA + City Tier (Tier 1 / Tier 2 / Tier 3) + Monthly Rent Paid
- Special Allowance
- LTA (Leave Travel Allowance)
- Bonus
- EPF Employer Contribution
- Gratuity (annual)

### Dynamic Fields
- **+ Add Income Component** button
- User can add any custom type: e.g., "Food Coupons ₹26,400", "Transport ₹1,800/month"
- Toggle: Taxable / Exempt

---

## Analysis Page — The Core (Page 3)

### Step 1: Tax Comparison (instant, no AI needed)
- Both regimes calculated in pure TypeScript (deterministic, exact math)
- Side-by-side comparison: Gross → Deductions → Taxable Income → Tax → Cess → **Total Tax**
- Bar chart: Green = winning regime, Amber = losing
- Effective tax rate shown

### Step 2: AI Analysis (Claude streams a narrative)
- Claude explains which regime is better and **why**
- Calls out the **87A rebate cliff** (e.g., at exactly ₹12L in new regime = ₹0 tax)
- Uses the pre-computed numbers — Claude never does tax math, only explains

### Step 3: Deduction Suggestions (shown if Old Regime could win)
AI suggests deductions you could make to save more under Old Regime:

| Section | What It Covers | Max Limit |
|---|---|---|
| 80C | ELSS, PPF, LIC, EPF, Tuition fees | ₹1,50,000 |
| 80D | Health insurance (self + parents) | ₹25,000–₹75,000 |
| 80CCD(1B) | Additional NPS contribution | ₹50,000 |
| 24(b) | Home loan interest | ₹2,00,000 |
| HRA Exemption | Auto-calculated based on rent | Varies |

User ticks which ones they can commit to → live re-calculation → Final recommendation

### Step 4: Chat Q&A
- Ask anything: "What if I increase my NPS by ₹20K?", "Should I take home loan?"
- Claude responds using your specific income numbers

### Bonus Features
- **What-if Simulator**: Adjust Basic Pay / Bonus, see instant tax impact
- **Salary Restructuring Tips**: Rule-based suggestions (add meal vouchers, LTA, employer NPS)
- **Tax Dates**: Important deadlines for selected FY

---

## Financial Years Supported

| FY | Notes |
|---|---|
| 2023-24 | Historical — verify past taxes |
| 2024-25 | Previous year |
| 2025-26 | **Current year** (Budget 2025 slabs) |
| 2026-27 | Estimated (same as 2025-26 with disclaimer) |

### New Regime Slabs — FY 2025-26
| Income Range | Rate |
|---|---|
| 0 – ₹4,00,000 | 0% |
| ₹4L – ₹8L | 5% |
| ₹8L – ₹12L | 10% |
| ₹12L – ₹16L | 15% |
| ₹16L – ₹20L | 20% |
| ₹20L – ₹24L | 25% |
| Above ₹24L | 30% |

Standard Deduction: ₹75,000 | Rebate 87A: Income ≤ ₹12L → ₹0 tax | Cess: 4%

### Old Regime Slabs (all years)
| Income Range | Rate |
|---|---|
| 0 – ₹2,50,000 | 0% |
| ₹2.5L – ₹5L | 5% |
| ₹5L – ₹10L | 20% |
| Above ₹10L | 30% |

Standard Deduction: ₹50,000 | Rebate 87A: Income ≤ ₹5L → ₹0 tax | Cess: 4%

---

## Project File Structure

```
Tax Planner/
├── PLAN.md                         ← This file
├── types/
│   └── tax.ts                      ← All TypeScript interfaces
├── lib/
│   ├── tax-data.ts                 ← Slab configs for each FY (pure data)
│   ├── tax-calculator.ts           ← Pure math: calculateTax, HRA exemption, etc.
│   ├── formatters.ts               ← formatINR(), formatPercent()
│   └── claude-client.ts            ← Anthropic SDK streaming wrapper
├── store/
│   └── tax-store.ts                ← Zustand store + localStorage persist
├── components/
│   ├── fy-selector.tsx             ← FY dropdown with estimated warning
│   ├── income-form.tsx             ← Dynamic income form
│   ├── tax-comparison.tsx          ← Side-by-side cards + Recharts bar chart
│   ├── deduction-checklist.tsx     ← Deduction suggestions with live recalc
│   ├── ai-chat.tsx                 ← Streaming chat interface
│   ├── what-if-simulator.tsx       ← Sliders for instant tax impact
│   └── salary-restructuring.tsx   ← Rule-based CTC restructuring tips
├── app/
│   ├── layout.tsx                  ← Root layout + fonts
│   ├── page.tsx                    ← Landing: FY select + start
│   ├── income/
│   │   └── page.tsx                ← Income breakdown form
│   ├── analysis/
│   │   └── page.tsx                ← Core page: comparison + AI + chat
│   ├── summary/
│   │   └── page.tsx                ← Print-friendly report
│   └── api/
│       └── analyze/
│           └── route.ts            ← Claude API: streaming SSE endpoint
└── .env.local                      ← ANTHROPIC_API_KEY (you provide this)
```

---

## How the AI Works (Important)

**Claude does NOT calculate tax.** Tax math is done in TypeScript with exact rupee figures.

Claude receives pre-computed numbers like:
```
New Regime: Taxable ₹9,25,000 → Tax ₹77,500 (Effective rate 8.38%)
Old Regime: Taxable ₹10,25,000 → Tax ₹1,32,500 (Effective rate 14.32%)
```

Claude then explains, advises, and suggests — using these exact figures.
This ensures the numbers are always correct and auditable.

---

## Build Order

1. Project setup (create-next-app + install deps)
2. `types/tax.ts` — interfaces
3. `lib/tax-data.ts` — slab data
4. `lib/tax-calculator.ts` — math engine
5. `lib/formatters.ts`
6. `store/tax-store.ts`
7. `lib/claude-client.ts`
8. `app/api/analyze/route.ts` — test with curl
9. `components/fy-selector.tsx`
10. `components/income-form.tsx`
11. `components/tax-comparison.tsx`
12. `app/layout.tsx` + `app/page.tsx` + `app/income/page.tsx`
13. `components/ai-chat.tsx`
14. `components/deduction-checklist.tsx`
15. `app/analysis/page.tsx` — wire everything
16. `components/what-if-simulator.tsx` + `salary-restructuring.tsx`
17. `app/summary/page.tsx`

---

## Before We Start — You Need

1. **Anthropic API Key** — get from https://console.anthropic.com
   - Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`
2. **Node.js 18+** installed
3. That's it — no database, no cloud setup needed

---

*Disclaimer: This app is for planning and reference only. Consult a CA for actual ITR filing.*
