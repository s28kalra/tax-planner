import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IncomeBreakdown, DeductionInput, TaxCalculationResult, ChatMessage, AnalysisMode } from "@/types/tax";
import { getLatestFY, type FinancialYear } from "@/lib/tax-data";

const defaultIncome: IncomeBreakdown = {
  basicPay: 0,
  hra: 0,
  cityTier: "tier1",
  rentPaid: 0,
  specialAllowance: 0,
  lta: 0,
  bonus: 0,
  epfEmployer: 0,
  gratuity: 0,
  customItems: [],
};

const defaultDeductions: DeductionInput = {
  section80C: 0,
  section80D: 0,
  nps80CCD1B: 0,
  homeLoanInterest24B: 0,
  hraExemptionClaimed: 0,
  otherDeductions: 0,
};

interface TaxState {
  selectedFY: FinancialYear;
  income: IncomeBreakdown;
  deductions: DeductionInput;
  newRegimeResult: TaxCalculationResult | null;
  oldRegimeResult: TaxCalculationResult | null;
  oldRegimeWithDeductionsResult: TaxCalculationResult | null;
  chatMessages: ChatMessage[];
  analysisMode: AnalysisMode;
  currentSessionId: string | null;

  // Actions
  setSelectedFY: (fy: FinancialYear) => void;
  setIncome: (income: IncomeBreakdown) => void;
  setDeductions: (deductions: DeductionInput) => void;
  setNewRegimeResult: (result: TaxCalculationResult) => void;
  setOldRegimeResult: (result: TaxCalculationResult) => void;
  setOldRegimeWithDeductionsResult: (result: TaxCalculationResult) => void;
  addChatMessage: (message: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setCurrentSessionId: (id: string | null) => void;
  resetAnalysis: () => void;
  resetAll: () => void;
}

export const useTaxStore = create<TaxState>()(
  persist(
    (set) => ({
      selectedFY: getLatestFY(),
      income: defaultIncome,
      deductions: defaultDeductions,
      newRegimeResult: null,
      oldRegimeResult: null,
      oldRegimeWithDeductionsResult: null,
      chatMessages: [],
      analysisMode: "LOADING",
      currentSessionId: null,

      setSelectedFY: (selectedFY) => set({ selectedFY }),
      setIncome: (income) => set({ income }),
      setDeductions: (deductions) => set({ deductions }),
      setNewRegimeResult: (result) => set({ newRegimeResult: result }),
      setOldRegimeResult: (result) => set({ oldRegimeResult: result }),
      setOldRegimeWithDeductionsResult: (result) => set({ oldRegimeWithDeductionsResult: result }),

      addChatMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      updateLastAssistantMessage: (content) =>
        set((state) => {
          const msgs = [...state.chatMessages];
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === "assistant") {
              msgs[i] = { ...msgs[i], content };
              return { chatMessages: msgs };
            }
          }
          return {};
        }),

      setAnalysisMode: (analysisMode) => set({ analysisMode }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),

      resetAnalysis: () =>
        set({
          newRegimeResult: null,
          oldRegimeResult: null,
          oldRegimeWithDeductionsResult: null,
          chatMessages: [],
          analysisMode: "LOADING",
          deductions: defaultDeductions,
          currentSessionId: null,
        }),

      resetAll: () =>
        set({
          income: defaultIncome,
          deductions: defaultDeductions,
          newRegimeResult: null,
          oldRegimeResult: null,
          oldRegimeWithDeductionsResult: null,
          chatMessages: [],
          analysisMode: "LOADING",
          currentSessionId: null,
        }),
    }),
    {
      name: "tax-planner-store",
      storage: createJSONStorage(() => localStorage),
      // Exclude loading/transient flags from persistence
      partialize: (state) => ({
        selectedFY: state.selectedFY,
        income: state.income,
        deductions: state.deductions,
        newRegimeResult: state.newRegimeResult,
        oldRegimeResult: state.oldRegimeResult,
        oldRegimeWithDeductionsResult: state.oldRegimeWithDeductionsResult,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
