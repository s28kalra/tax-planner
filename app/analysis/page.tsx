"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaxComparison } from "@/components/tax-comparison";
import { AIChat } from "@/components/ai-chat";
import { DeductionChecklist } from "@/components/deduction-checklist";
import { WhatIfSimulator } from "@/components/what-if-simulator";
import { SalaryRestructuring } from "@/components/salary-restructuring";
import { calculateNewRegimeTax, calculateOldRegimeTax } from "@/lib/tax-calculator";
import { useTaxStore } from "@/store/tax-store";
import type { DeductionInput } from "@/types/tax";

export default function AnalysisPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    income,
    selectedFY,
    newRegimeResult,
    oldRegimeResult,
    oldRegimeWithDeductionsResult,
    currentSessionId,
    setNewRegimeResult,
    setOldRegimeResult,
    setOldRegimeWithDeductionsResult,
    setDeductions,
    setAnalysisMode,
    analysisMode,
  } = useTaxStore();
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate results if not already done
  useEffect(() => {
    if (!income.basicPay && !income.specialAllowance && !income.bonus) {
      router.replace("/income");
      return;
    }
    if (!newRegimeResult) {
      const nr = calculateNewRegimeTax(income, selectedFY);
      setNewRegimeResult(nr);
    }
    if (!oldRegimeResult) {
      const emptyDeductions: DeductionInput = {
        section80C: 0,
        section80D: 0,
        nps80CCD1B: 0,
        homeLoanInterest24B: 0,
        hraExemptionClaimed: 0,
        otherDeductions: 0,
      };
      const or = calculateOldRegimeTax(income, emptyDeductions, selectedFY);
      setOldRegimeResult(or);
    }
    if (newRegimeResult && oldRegimeResult && analysisMode === "LOADING") {
      setAnalysisMode("SHOWING_COMPARISON");
    }
  }, [income, selectedFY, newRegimeResult, oldRegimeResult, analysisMode, setNewRegimeResult, setOldRegimeResult, setAnalysisMode, router]);

  // Transition to AI_STREAMING once comparison is shown
  useEffect(() => {
    if (analysisMode === "SHOWING_COMPARISON" && newRegimeResult && oldRegimeResult) {
      setAnalysisMode("AI_STREAMING");
    }
  }, [analysisMode, newRegimeResult, oldRegimeResult, setAnalysisMode]);

  // Save initial results to DB
  useEffect(() => {
    if (newRegimeResult && oldRegimeResult && currentSessionId && session?.user?.id) {
      fetch(`/api/sessions/${currentSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_regime_result: newRegimeResult,
          old_regime_result: oldRegimeResult,
          selected_regime: newRegimeResult.totalTax <= oldRegimeResult.totalTax ? "new" : "old",
        }),
      });
    }
  }, [newRegimeResult, oldRegimeResult, currentSessionId, session?.user?.id]);

  // Save deduction results to DB
  useEffect(() => {
    if (oldRegimeWithDeductionsResult && currentSessionId && session?.user?.id) {
      fetch(`/api/sessions/${currentSessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_with_deductions_result: oldRegimeWithDeductionsResult,
        }),
      });
    }
  }, [oldRegimeWithDeductionsResult, currentSessionId, session?.user?.id]);

  const handleDeductionConfirm = useCallback(
    (deductions: DeductionInput) => {
      setDeductions(deductions);
      const result = calculateOldRegimeTax(income, deductions, selectedFY);
      setOldRegimeWithDeductionsResult(result);
      setAnalysisMode("FINAL_STREAMING");

      if (currentSessionId && session?.user?.id) {
        fetch(`/api/sessions/${currentSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deductions }),
        });
      }
    },
    [income, selectedFY, setDeductions, setOldRegimeWithDeductionsResult, setAnalysisMode, currentSessionId, session?.user?.id]
  );

  const oldRegimeGap =
    newRegimeResult && oldRegimeResult
      ? oldRegimeResult.totalTax - newRegimeResult.totalTax
      : 0;

  const showDeductions =
    (analysisMode === "AI_COMPLETE" ||
      analysisMode === "SHOWING_DEDUCTIONS" ||
      analysisMode === "CONFIRMED" ||
      analysisMode === "FINAL_STREAMING" ||
      analysisMode === "DONE") &&
    oldRegimeGap > 10000; // only show if gap is meaningful

  const showFinalAnalysis =
    analysisMode === "FINAL_STREAMING" || analysisMode === "DONE";

  if (!newRegimeResult || !oldRegimeResult) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Calculating…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress + nav */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground items-center">
          <button
            onClick={() => router.push("/income")}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Edit Income
          </button>
          <span className="font-medium">Step 2 of 3 — Analysis ({selectedFY})</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: "66%" }} />
        </div>
      </div>

      <h1 className="text-2xl font-bold">Your Tax Analysis</h1>

      {/* 1. Tax Comparison */}
      <TaxComparison
        newRegime={newRegimeResult}
        oldRegime={oldRegimeResult}
        oldRegimeWithDeductions={oldRegimeWithDeductionsResult ?? undefined}
      />

      {/* 2. AI Chat — initial analysis */}
      {(analysisMode === "AI_STREAMING" || analysisMode === "AI_COMPLETE" || analysisMode === "SHOWING_DEDUCTIONS" || analysisMode === "CONFIRMED") && (
        <AIChat autoStart mode="initial_analysis" />
      )}

      {/* 3. Deduction Checklist (conditional) */}
      {showDeductions && (
        <DeductionChecklist onConfirm={handleDeductionConfirm} />
      )}

      {/* 4. Final AI analysis after deductions */}
      {showFinalAnalysis && (
        <AIChat autoStart={analysisMode === "FINAL_STREAMING"} mode="deduction_followup" />
      )}

      {/* 5. Salary Restructuring */}
      <SalaryRestructuring />

      {/* 6. What-If Simulator */}
      <WhatIfSimulator />

      {/* 7. View Report */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          variant="outline"
          disabled={isNavigating}
          onClick={() => { setIsNavigating(true); router.push("/summary"); }}
        >
          {isNavigating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          {isNavigating ? "Loading…" : "View Full Report"}
        </Button>
      </div>
    </div>
  );
}
