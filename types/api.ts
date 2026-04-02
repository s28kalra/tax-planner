import type { TaxCalculationResult, IncomeBreakdown, DeductionInput, ChatMessage } from "@/types/tax";
import type { FinancialYear } from "@/lib/tax-data";

export interface AnalyzeRequest {
  mode: "initial_analysis" | "deduction_followup" | "chat";
  fy: FinancialYear;
  income: IncomeBreakdown;
  deductions?: DeductionInput;
  oldRegimeResult: TaxCalculationResult;
  newRegimeResult: TaxCalculationResult;
  hraExemption: number;
  chatHistory?: ChatMessage[];
  userMessage?: string;
}
