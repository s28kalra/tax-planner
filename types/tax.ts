// FinancialYear and FYTaxConfig are defined in lib/tax-data.ts
// so that FinancialYear can be derived from TAX_CONFIG keys.

export interface TaxSlab {
  from: number;
  to: number | null;
  rate: number; // 0-1 decimal (e.g. 0.05 for 5%)
}

export interface Rebate87A {
  incomeLimit: number;  // taxable income must be <= this
  maxRebate: number;    // cap on rebate amount
}

export interface RegimeConfig {
  slabs: TaxSlab[];
  standardDeduction: number;
  rebate87A: Rebate87A;
  cessRate: number; // 0.04
}

export interface DeductionLimits {
  section80C: number;
  section80D_self: number;
  section80D_senior: number;
  nps80CCD1B: number;
  homeLoanInterest24B: number;
}

export interface TaxDate {
  date: string;
  description: string;
}

export type CityTier = "tier1" | "tier2" | "tier3";

export interface CustomIncomeItem {
  id: string;
  label: string;
  amount: number;
  isTaxable: boolean;
}

export interface IncomeBreakdown {
  basicPay: number;
  hra: number;
  cityTier: CityTier;
  rentPaid: number;
  specialAllowance: number;
  lta: number;
  bonus: number;
  epfEmployer: number;
  gratuity: number;
  customItems: CustomIncomeItem[];
}

export interface DeductionInput {
  section80C: number;
  section80D: number;
  nps80CCD1B: number;
  homeLoanInterest24B: number;
  hraExemptionClaimed: number; // auto-calculated, user just checks checkbox
  otherDeductions: number;
}

export interface SlabBreakdownItem {
  from: number;
  to: number | null;
  rate: number;
  taxableInSlab: number;
  taxInSlab: number;
}

export interface TaxCalculationResult {
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  taxBeforeCess: number;
  cess: number;
  totalTax: number;
  effectiveRate: number; // percentage
  rebateApplied: number;
  slabBreakdown: SlabBreakdownItem[];
  hraExemption: number;
  deductionsTotal: number;
}

export interface DeductionSuggestion {
  section: string;
  description: string;
  maxLimit: number;
  suggestedAmount: number;
  taxSavingAtMargin: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type AnalysisMode =
  | "LOADING"
  | "SHOWING_COMPARISON"
  | "AI_STREAMING"
  | "AI_COMPLETE"
  | "SHOWING_DEDUCTIONS"
  | "CONFIRMED"
  | "FINAL_STREAMING"
  | "DONE";
