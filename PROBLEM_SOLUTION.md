# Tax Planner — Problem Statement & Solution Summary

**Live App:** https://tax-planner-tau.vercel.app/

---

## Problem Statement

### Background

India's income tax system currently offers two parallel regimes for salaried employees:

- **Old Tax Regime** — Higher tax rates but allows a wide range of exemptions and deductions (HRA, 80C, 80D, NPS, Home Loan interest, etc.)
- **New Tax Regime** — Lower, simplified tax slabs but restricts most deductions and exemptions

Every financial year, salaried employees must choose one regime before filing their ITR (Income Tax Return). This decision can result in a difference of **₹50,000 to ₹2,00,000+** in annual tax liability depending on the individual's salary structure and investment profile.

---

### The Problem

Despite the financial impact, most salaried employees struggle to make an informed regime choice due to:

1. **Complexity of Tax Calculations**
   - Multiple income components (Basic, HRA, LTA, Special Allowance, Bonus, EPF)
   - HRA exemption involves a three-way minimum formula based on city tier
   - Deduction limits vary across sections (80C, 80D, 80CCD, 24b)
   - Surcharges, cess, and rebates (87A) add further complexity

2. **Lack of Personalized Guidance**
   - Generic online tax calculators output numbers without explanation
   - Users don't understand *why* one regime is better for them
   - No actionable advice on how to restructure salary or investments to save more

3. **Fragmented Tools**
   - Separate tools exist for HRA calculation, 80C planning, and tax filing
   - No single platform connects income → deductions → regime comparison → recommendations

4. **Information Overload**
   - IT department circulars and CA advice use technical jargon
   - First-time earners and mid-career employees alike struggle to interpret tax rules
   - Changes every financial year (new slabs, revised limits) require re-learning

---

### Who Is Affected

- **Salaried employees** across all income bands (₹5L – ₹50L+ CTC)
- **Freshers and early-career professionals** making their first tax decisions
- **Mid-career employees** with home loans, investments, and HRA who need to optimise
- **HR and payroll teams** helping employees declare their regime at the start of FY

---

## Solution

### What We Built

**Tax Planner** is an AI-powered web application that takes a salaried employee's income breakdown as input and produces an instant, personalised tax regime comparison — explained in plain language by an AI assistant.

---

### How It Solves the Problem

#### 1. Instant Regime Comparison
The app calculates Old Regime and New Regime tax in real time using deterministic TypeScript logic — covering all salary components, HRA exemption, slab-wise tax, rebate 87A, and 4% health & education cess. Users see the exact rupee difference between both regimes in seconds.

#### 2. AI-Powered Plain-Language Explanation
After the calculation, Claude Sonnet streams a personalised narrative explaining:
- Why one regime is better for this specific user
- Which components of their salary are driving the difference
- What deductions they should consider to further reduce tax

The AI narrates; it never recalculates — ensuring accuracy is always grounded in the deterministic engine.

#### 3. Interactive Deduction Optimiser
A guided checklist walks users through applicable Old Regime deductions:
- Section 80C (ELSS, PPF, EPF, LIC, home loan principal)
- Section 80D (health insurance)
- NPS 80CCD(1B)
- HRA Exemption (auto-calculated from Basic, HRA, rent paid, and city tier)
- Section 24(b) Home Loan interest
- Other deductions (80G, 80E, 80TTA)

The Old Regime tax updates live as deductions are entered, showing the optimised comparison.

#### 4. Salary Restructuring Suggestions
The app identifies which salary components, if restructured, would reduce taxable income — e.g., increasing NPS contribution, optimising HRA component, or converting taxable allowances.

#### 5. What-If Simulator
Users can model hypothetical scenarios — "What if my bonus is ₹2L higher?" or "What if I invest ₹1.5L in 80C?" — and instantly see the tax impact without re-entering all data.

#### 6. Session History
Authenticated users can save analyses across financial years, revisit past comparisons, and track how their tax liability has changed over time.

#### 7. PDF Report Export
A downloadable PDF summary of the full tax analysis — suitable for sharing with a CA or for personal records.

---

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Tax math in TypeScript, not AI | Ensures 100% accurate, auditable calculations |
| AI explains after calculation | Keeps AI focused on communication, not arithmetic |
| Deductions asked after initial analysis | Users see the regime gap first — motivates them to optimise |
| Monthly rent converted to annual internally | HRA formula operates on annual figures; collecting monthly is more intuitive |
| `FinancialYear` type derived from config keys | Adding a new FY requires a single config entry — no code changes elsewhere |
| No ESLint / create-next-app | Folder name "Tax Planner" with spaces fails npm package naming — bootstrapped manually |

---

### Impact

| Metric | Before Tax Planner | With Tax Planner |
|---|---|---|
| Time to compare regimes | 30–60 min (manual or CA consultation) | < 2 minutes |
| Understanding of result | Numbers only | Plain-language AI explanation |
| Deduction optimisation | Requires tax knowledge | Guided checklist with live updates |
| Accessibility | CA fees, complex tools | Free, self-serve, mobile-friendly |

---

### Tech Stack Summary

- **Next.js 14** (App Router) + **TypeScript**
- **Anthropic Claude Sonnet 4.6** — streaming SSE via `@anthropic-ai/sdk`
- **Neon PostgreSQL** + **Drizzle ORM** — session persistence
- **NextAuth v5** — credential-based authentication
- **Zustand** — client-side state with localStorage persistence
- **Recharts** — visual regime comparison bar chart
- **Tailwind CSS** + **Radix UI** — responsive, accessible UI

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │ Income Form │──▶│ Zustand Store│◀──│  Tax Comparison UI  │  │
│  │(react-hook- │   │+ localStorage│   │  Deduction Checklist│  │
│  │  form + zod)│   └──────┬───────┘   │  What-If Simulator  │  │
│  └─────────────┘          │           └─────────────────────┘  │
│                           │                                     │
│              ┌────────────▼────────────┐                        │
│              │   tax-calculator.ts     │                        │
│              │  (Pure TypeScript Math) │                        │
│              │  - Old Regime Tax       │                        │
│              │  - New Regime Tax       │                        │
│              │  - HRA Exemption        │                        │
│              │  - Rebate 87A + Cess    │                        │
│              └────────────────────────┘                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌────────────┐ ┌──────────────────┐
│  /api/analyze   │ │/api/auth/  │ │  /api/sessions/  │
│  (SSE Stream)   │ │[nextauth]  │ │  (CRUD)          │
│                 │ │            │ │                  │
│  Sends income + │ │  NextAuth  │ │  Save/load tax   │
│  regime results │ │  v5 (JWT + │ │  analyses per    │
│  to Claude API  │ │  Drizzle   │ │  user per FY     │
└────────┬────────┘ │  Adapter)  │ └────────┬─────────┘
         │          └─────┬──────┘          │
         ▼                │                 ▼
┌─────────────────┐       │        ┌─────────────────┐
│  Anthropic API  │       └───────▶│  Neon PostgreSQL│
│  Claude Sonnet  │                │  (Serverless)   │
│  4.6 (streaming)│                │                 │
└─────────────────┘                │  users          │
                                   │  accounts       │
                                   │  sessions       │
                                   │  tax_sessions   │
                                   └─────────────────┘
```

---

### User Flow

```
┌──────────┐     ┌──────────────┐     ┌───────────────────┐     ┌──────────────┐
│  Landing │────▶│ Income Input │────▶│ Analysis Page     │────▶│   Summary /  │
│  Page    │     │              │     │                   │     │   PDF Report │
└──────────┘     │ - FY select  │     │ 1. Tax Comparison │     └──────────────┘
                 │ - Basic, HRA │     │    (Old vs New)   │
                 │ - Rent, LTA  │     │                   │
                 │ - Bonus, EPF │     │ 2. AI Streaming   │
                 │ - Custom     │     │    Explanation    │
                 └──────┬───────┘     │                   │
                        │             │ 3. Deduction       │
                        │             │    Checklist       │
                        │             │    (if gap > ₹10K) │
                        ▼             │                   │
                 ┌──────────────┐     │ 4. AI Follow-up   │
                 │ tax-calculator│────▶│    (post deduct.) │
                 │ .ts computes │     │                   │
                 │ both regimes │     │ 5. Salary         │
                 └──────────────┘     │    Restructuring  │
                                      │                   │
                                      │ 6. What-If        │
                                      │    Simulator      │
                                      └───────────────────┘
```

---

### Data Flow — AI Analysis

```
Client                          Server (/api/analyze)          Anthropic
  │                                      │                        │
  │── POST { income, results, mode } ───▶│                        │
  │                                      │── stream request ─────▶│
  │                                      │                        │
  │◀─── SSE: text/event-stream ──────────│◀── token chunks ───────│
  │     (chunks rendered in real-time)   │                        │
  │                                      │                        │
  │◀─── SSE: [DONE] ─────────────────────│                        │
```

---

### Database Schema

```
users ──────────────────────────────────────────────┐
  id (PK)                                           │
  email (unique)                                    │
  passwordHash                                      │
  name                                              │
                                                    │
accounts                          tax_sessions      │
  userId (FK → users) ──────────▶  user_id (FK) ───┘
  provider                          financial_year
  providerAccountId                 income (JSONB)
                                    deductions (JSONB)
sessions                            new_regime_result (JSONB)
  sessionToken (PK)                 old_regime_result (JSONB)
  userId (FK → users)               old_with_deductions_result (JSONB)
  expires                           selected_regime
                                    created_at / updated_at
```

---

### Tax Calculation Engine

The core calculation is a pure, side-effect-free TypeScript module (`lib/tax-calculator.ts`):

```
calculateNewRegimeTax(income, FY)
  └── computeGross(income)
  └── taxableIncome = gross − standardDeduction
  └── calculateTaxOnIncome(taxableIncome, newSlabs)
  └── applyRebate87A(tax, taxableIncome)
  └── calculateCess(tax, 0.04)

calculateOldRegimeTax(income, deductions, FY)
  └── computeGross(income)
  └── calculateHRAExemption(basic, hra, rentPaid×12, cityTier)
       └── min(HRA received, rentPaid − 10% basic, 50%/40% basic)
  └── deductionsTotal = stdDeduction + HRA + LTA + 80C + 80D + NPS + 24b + others
  └── taxableIncome = gross − deductionsTotal
  └── calculateTaxOnIncome(taxableIncome, oldSlabs)
  └── applyRebate87A(tax, taxableIncome)
  └── calculateCess(tax, 0.04)
```

Financial year configs (slabs, limits, rebates) live in `lib/tax-data.ts`. Adding a new FY requires only one new config entry — the `FinancialYear` type is automatically derived from the config keys.
