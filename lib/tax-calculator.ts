import type {
  TaxSlab,
  Rebate87A,
  IncomeBreakdown,
  DeductionInput,
  TaxCalculationResult,
  SlabBreakdownItem,
  DeductionSuggestion,
  CityTier,
} from "@/types/tax";
import { getFYConfig, type FinancialYear } from "@/lib/tax-data";

// ─── Pure helpers ───────────────────────────────────────────────────────────

export function calculateTaxOnIncome(taxableIncome: number, slabs: readonly TaxSlab[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break;
    const upper = slab.to ?? Infinity;
    const taxableInSlab = Math.min(taxableIncome, upper) - slab.from;
    if (taxableInSlab > 0) tax += taxableInSlab * slab.rate;
  }
  return Math.round(tax);
}

export function applyRebate87A(tax: number, taxableIncome: number, rebate: Rebate87A): number {
  if (taxableIncome <= rebate.incomeLimit) {
    return Math.max(0, tax - Math.min(tax, rebate.maxRebate));
  }
  return tax;
}

export function calculateCess(tax: number, cessRate: number): number {
  return Math.round(tax * cessRate);
}

/**
 * HRA exemption = minimum of:
 *  1. Actual HRA received
 *  2. Rent paid − 10% of Basic Pay
 *  3. 50% of Basic Pay (Tier 1 cities) or 40% of Basic Pay (others)
 */
export function calculateHRAExemption(
  basicPay: number,
  hraReceived: number,
  rentPaid: number,
  cityTier: CityTier
): number {
  if (hraReceived <= 0 || rentPaid <= 0) return 0;
  const metroPercent = cityTier === "tier1" ? 0.5 : 0.4;
  return Math.max(
    0,
    Math.min(hraReceived, rentPaid - 0.1 * basicPay, metroPercent * basicPay)
  );
}

export function getSlabBreakdown(
  taxableIncome: number,
  slabs: readonly TaxSlab[]
): SlabBreakdownItem[] {
  const breakdown: SlabBreakdownItem[] = [];
  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break;
    const upper = slab.to ?? Infinity;
    const taxableInSlab = Math.min(taxableIncome, upper) - slab.from;
    if (taxableInSlab > 0) {
      breakdown.push({
        from: slab.from,
        to: slab.to,
        rate: slab.rate,
        taxableInSlab: Math.round(taxableInSlab),
        taxInSlab: Math.round(taxableInSlab * slab.rate),
      });
    }
  }
  return breakdown;
}

export function calculateGrossIncome(income: IncomeBreakdown): number {
  const fixed =
    income.basicPay +
    income.hra +
    income.specialAllowance +
    income.lta +
    income.bonus +
    income.epfEmployer +
    income.gratuity;
  const custom = income.customItems
    .filter((item) => item.isTaxable)
    .reduce((sum, item) => sum + item.amount, 0);
  // Also include non-taxable custom items in gross but not in taxable
  const customAll = income.customItems.reduce((sum, item) => sum + item.amount, 0);
  return fixed + customAll - income.epfEmployer - income.gratuity + custom - custom;
  // Simplify: gross = all salary components (employer EPF and gratuity typically excluded)
}

function computeGross(income: IncomeBreakdown): number {
  // Gross = all components the employee sees in CTC/salary (EPF employer + gratuity not part of take-home)
  const base =
    income.basicPay +
    income.hra +
    income.specialAllowance +
    income.lta +
    income.bonus;
  const customTotal = income.customItems.reduce((s, i) => s + i.amount, 0);
  return base + customTotal;
}

// ─── New Regime ─────────────────────────────────────────────────────────────

export function calculateNewRegimeTax(
  income: IncomeBreakdown,
  fy: FinancialYear
): TaxCalculationResult {
  const config = getFYConfig(fy).newRegime;
  const grossIncome = computeGross(income);
  const taxableIncome = Math.max(0, grossIncome - config.standardDeduction);

  const taxBeforeRebate = calculateTaxOnIncome(taxableIncome, config.slabs);
  const taxAfterRebate = applyRebate87A(taxBeforeRebate, taxableIncome, config.rebate87A);
  const rebateApplied = taxBeforeRebate - taxAfterRebate;
  const cess = calculateCess(taxAfterRebate, config.cessRate);
  const totalTax = taxAfterRebate + cess;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    standardDeduction: config.standardDeduction,
    taxableIncome,
    taxBeforeCess: taxAfterRebate,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    rebateApplied,
    slabBreakdown: getSlabBreakdown(taxableIncome, config.slabs),
    hraExemption: 0, // not applicable in new regime
    deductionsTotal: config.standardDeduction,
  };
}

// ─── Old Regime ─────────────────────────────────────────────────────────────

export function calculateOldRegimeTax(
  income: IncomeBreakdown,
  deductions: DeductionInput,
  fy: FinancialYear
): TaxCalculationResult {
  const config = getFYConfig(fy).oldRegime;
  const limits = getFYConfig(fy).deductionLimits;
  const grossIncome = computeGross(income);

  // HRA exemption
  const hraExemption =
    deductions.hraExemptionClaimed > 0
      ? deductions.hraExemptionClaimed
      : calculateHRAExemption(income.basicPay, income.hra, income.rentPaid, income.cityTier);

  // Capped deductions
  const sec80C = Math.min(deductions.section80C, limits.section80C);
  const sec80D = Math.min(deductions.section80D, limits.section80D_self);
  const nps = Math.min(deductions.nps80CCD1B, limits.nps80CCD1B);
  const homeLoan = Math.min(deductions.homeLoanInterest24B, limits.homeLoanInterest24B);
  const ltaExemption = income.lta; // LTA fully exempt (simplified)

  const deductionsTotal =
    config.standardDeduction +
    hraExemption +
    ltaExemption +
    sec80C +
    sec80D +
    nps +
    homeLoan +
    deductions.otherDeductions;

  const taxableIncome = Math.max(0, grossIncome - deductionsTotal);
  const taxBeforeRebate = calculateTaxOnIncome(taxableIncome, config.slabs);
  const taxAfterRebate = applyRebate87A(taxBeforeRebate, taxableIncome, config.rebate87A);
  const rebateApplied = taxBeforeRebate - taxAfterRebate;
  const cess = calculateCess(taxAfterRebate, config.cessRate);
  const totalTax = taxAfterRebate + cess;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    standardDeduction: config.standardDeduction,
    taxableIncome,
    taxBeforeCess: taxAfterRebate,
    cess,
    totalTax,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    rebateApplied,
    slabBreakdown: getSlabBreakdown(taxableIncome, config.slabs),
    hraExemption,
    deductionsTotal,
  };
}

// ─── Deduction Suggestions ──────────────────────────────────────────────────

export function suggestDeductionsNeeded(
  oldTaxNoDeductions: number,
  newTax: number,
  income: IncomeBreakdown,
  fy: FinancialYear
): DeductionSuggestion[] {
  const limits = getFYConfig(fy).deductionLimits;
  const config = getFYConfig(fy).oldRegime;
  const grossIncome = computeGross(income);
  // Marginal tax rate estimate (rough)
  const marginalRate = grossIncome > 1000000 ? 0.312 : grossIncome > 500000 ? 0.208 : 0.052;

  const suggestions: DeductionSuggestion[] = [];

  suggestions.push({
    section: "Section 80C",
    description: "ELSS, PPF, EPF, life insurance, NSC, home loan principal, tuition fees",
    maxLimit: limits.section80C,
    suggestedAmount: limits.section80C,
    taxSavingAtMargin: Math.round(limits.section80C * marginalRate),
  });

  suggestions.push({
    section: "Section 80D",
    description: "Health insurance premium for self & family",
    maxLimit: limits.section80D_self,
    suggestedAmount: limits.section80D_self,
    taxSavingAtMargin: Math.round(limits.section80D_self * marginalRate),
  });

  suggestions.push({
    section: "Section 80CCD(1B) NPS",
    description: "Additional NPS contribution over 80C",
    maxLimit: limits.nps80CCD1B,
    suggestedAmount: limits.nps80CCD1B,
    taxSavingAtMargin: Math.round(limits.nps80CCD1B * marginalRate),
  });

  if (income.hra > 0 && income.rentPaid > 0) {
    const hraExemption = calculateHRAExemption(income.basicPay, income.hra, income.rentPaid, income.cityTier);
    suggestions.push({
      section: "HRA Exemption",
      description: "Auto-calculated from Basic, HRA, and rent paid",
      maxLimit: income.hra,
      suggestedAmount: hraExemption,
      taxSavingAtMargin: Math.round(hraExemption * marginalRate),
    });
  }

  suggestions.push({
    section: "Section 24(b) Home Loan",
    description: "Interest on home loan for self-occupied property",
    maxLimit: limits.homeLoanInterest24B,
    suggestedAmount: 0,
    taxSavingAtMargin: Math.round(limits.homeLoanInterest24B * marginalRate),
  });

  return suggestions;
}

// ─── Re-export gross for convenience ────────────────────────────────────────
export { computeGross as calculateGrossIncomeFn };
