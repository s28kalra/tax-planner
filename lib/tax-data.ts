import type { RegimeConfig, DeductionLimits, TaxDate } from "@/types/tax";

export interface FYTaxConfig {
  label: string;
  isEstimated: boolean;
  defaultRegime: "old" | "new";
  newRegime: RegimeConfig;
  oldRegime: RegimeConfig;
  deductionLimits: DeductionLimits;
  importantDates: TaxDate[];
}

// Single source of truth for all Financial Year configs.
// Adding a new FY = adding ONE entry here. Nothing else changes.
export const TAX_CONFIG = {
  "2023-24": {
    label: "FY 2023-24 (Apr 2023 – Mar 2024)",
    isEstimated: false,
    defaultRegime: "new",
    newRegime: {
      slabs: [
        { from: 0,       to: 300000,  rate: 0 },
        { from: 300000,  to: 600000,  rate: 0.05 },
        { from: 600000,  to: 900000,  rate: 0.10 },
        { from: 900000,  to: 1200000, rate: 0.15 },
        { from: 1200000, to: 1500000, rate: 0.20 },
        { from: 1500000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { incomeLimit: 700000, maxRebate: 25000 },
      cessRate: 0.04,
    },
    oldRegime: {
      slabs: [
        { from: 0,       to: 250000,  rate: 0 },
        { from: 250000,  to: 500000,  rate: 0.05 },
        { from: 500000,  to: 1000000, rate: 0.20 },
        { from: 1000000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { incomeLimit: 500000, maxRebate: 12500 },
      cessRate: 0.04,
    },
    deductionLimits: {
      section80C: 150000,
      section80D_self: 25000,
      section80D_senior: 50000,
      nps80CCD1B: 50000,
      homeLoanInterest24B: 200000,
    },
    importantDates: [
      { date: "2023-06-15", description: "Advance Tax Q1 (15% of estimated tax)" },
      { date: "2023-09-15", description: "Advance Tax Q2 (45% cumulative)" },
      { date: "2023-12-15", description: "Advance Tax Q3 (75% cumulative)" },
      { date: "2024-03-15", description: "Advance Tax Q4 (100% cumulative)" },
      { date: "2024-07-31", description: "ITR filing deadline (non-audit)" },
    ],
  },

  "2024-25": {
    label: "FY 2024-25 (Apr 2024 – Mar 2025)",
    isEstimated: false,
    defaultRegime: "new",
    newRegime: {
      slabs: [
        { from: 0,       to: 300000,  rate: 0 },
        { from: 300000,  to: 700000,  rate: 0.05 },
        { from: 700000,  to: 1000000, rate: 0.10 },
        { from: 1000000, to: 1200000, rate: 0.15 },
        { from: 1200000, to: 1500000, rate: 0.20 },
        { from: 1500000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 75000,
      rebate87A: { incomeLimit: 700000, maxRebate: 25000 },
      cessRate: 0.04,
    },
    oldRegime: {
      slabs: [
        { from: 0,       to: 250000,  rate: 0 },
        { from: 250000,  to: 500000,  rate: 0.05 },
        { from: 500000,  to: 1000000, rate: 0.20 },
        { from: 1000000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { incomeLimit: 500000, maxRebate: 12500 },
      cessRate: 0.04,
    },
    deductionLimits: {
      section80C: 150000,
      section80D_self: 25000,
      section80D_senior: 50000,
      nps80CCD1B: 50000,
      homeLoanInterest24B: 200000,
    },
    importantDates: [
      { date: "2024-06-15", description: "Advance Tax Q1 (15%)" },
      { date: "2024-09-15", description: "Advance Tax Q2 (45% cumulative)" },
      { date: "2024-12-15", description: "Advance Tax Q3 (75% cumulative)" },
      { date: "2025-03-15", description: "Advance Tax Q4 (100% cumulative)" },
      { date: "2025-07-31", description: "ITR filing deadline (non-audit)" },
    ],
  },

  "2025-26": {
    label: "FY 2025-26 (Apr 2025 – Mar 2026)",
    isEstimated: false,
    defaultRegime: "new",
    newRegime: {
      slabs: [
        { from: 0,        to: 400000,  rate: 0 },
        { from: 400000,   to: 800000,  rate: 0.05 },
        { from: 800000,   to: 1200000, rate: 0.10 },
        { from: 1200000,  to: 1600000, rate: 0.15 },
        { from: 1600000,  to: 2000000, rate: 0.20 },
        { from: 2000000,  to: 2400000, rate: 0.25 },
        { from: 2400000,  to: null,    rate: 0.30 },
      ],
      standardDeduction: 75000,
      rebate87A: { incomeLimit: 1200000, maxRebate: 60000 },
      cessRate: 0.04,
    },
    oldRegime: {
      slabs: [
        { from: 0,       to: 250000,  rate: 0 },
        { from: 250000,  to: 500000,  rate: 0.05 },
        { from: 500000,  to: 1000000, rate: 0.20 },
        { from: 1000000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { incomeLimit: 500000, maxRebate: 12500 },
      cessRate: 0.04,
    },
    deductionLimits: {
      section80C: 150000,
      section80D_self: 25000,
      section80D_senior: 50000,
      nps80CCD1B: 50000,
      homeLoanInterest24B: 200000,
    },
    importantDates: [
      { date: "2025-06-15", description: "Advance Tax Q1 (15%)" },
      { date: "2025-09-15", description: "Advance Tax Q2 (45% cumulative)" },
      { date: "2025-12-15", description: "Advance Tax Q3 (75% cumulative)" },
      { date: "2026-03-15", description: "Advance Tax Q4 (100% cumulative)" },
      { date: "2026-07-31", description: "ITR filing deadline (non-audit)" },
    ],
  },

  "2026-27": {
    label: "FY 2026-27 (Apr 2026 – Mar 2027)",
    isEstimated: true,
    defaultRegime: "new",
    newRegime: {
      slabs: [
        { from: 0,        to: 400000,  rate: 0 },
        { from: 400000,   to: 800000,  rate: 0.05 },
        { from: 800000,   to: 1200000, rate: 0.10 },
        { from: 1200000,  to: 1600000, rate: 0.15 },
        { from: 1600000,  to: 2000000, rate: 0.20 },
        { from: 2000000,  to: 2400000, rate: 0.25 },
        { from: 2400000,  to: null,    rate: 0.30 },
      ],
      standardDeduction: 75000,
      rebate87A: { incomeLimit: 1200000, maxRebate: 60000 },
      cessRate: 0.04,
    },
    oldRegime: {
      slabs: [
        { from: 0,       to: 250000,  rate: 0 },
        { from: 250000,  to: 500000,  rate: 0.05 },
        { from: 500000,  to: 1000000, rate: 0.20 },
        { from: 1000000, to: null,    rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { incomeLimit: 500000, maxRebate: 12500 },
      cessRate: 0.04,
    },
    deductionLimits: {
      section80C: 150000,
      section80D_self: 25000,
      section80D_senior: 50000,
      nps80CCD1B: 50000,
      homeLoanInterest24B: 200000,
    },
    importantDates: [
      { date: "2026-06-15", description: "Advance Tax Q1 (15%)" },
      { date: "2026-09-15", description: "Advance Tax Q2 (45% cumulative)" },
      { date: "2026-12-15", description: "Advance Tax Q3 (75% cumulative)" },
      { date: "2027-03-15", description: "Advance Tax Q4 (100% cumulative)" },
      { date: "2027-07-31", description: "ITR filing deadline (non-audit)" },
    ],
  },
} as const satisfies Record<string, FYTaxConfig>;

// FinancialYear type is DERIVED from TAX_CONFIG keys — auto-updates when a new FY is added
export type FinancialYear = keyof typeof TAX_CONFIG;

export function getAvailableFYs(): FinancialYear[] {
  return Object.keys(TAX_CONFIG) as FinancialYear[];
}

export function getLatestFY(): FinancialYear {
  const fys = getAvailableFYs();
  // Return last non-estimated entry; fall back to last entry
  for (let i = fys.length - 1; i >= 0; i--) {
    if (!TAX_CONFIG[fys[i]].isEstimated) return fys[i];
  }
  return fys[fys.length - 1];
}

export function getFYConfig(fy: FinancialYear): FYTaxConfig {
  return TAX_CONFIG[fy];
}
