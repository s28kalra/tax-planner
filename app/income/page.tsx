"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { IncomeForm } from "@/components/income-form";
import { useTaxStore } from "@/store/tax-store";
import type { IncomeBreakdown } from "@/types/tax";

export default function IncomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { income, setIncome, selectedFY, resetAnalysis, currentSessionId, setCurrentSessionId } = useTaxStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: IncomeBreakdown) {
    setIsSubmitting(true);
    setIncome(data);
    resetAnalysis();

    if (session?.user?.id) {
      if (currentSessionId) {
        fetch(`/api/sessions/${currentSessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ income: data, financial_year: selectedFY }),
        });
      } else {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ income: data, financial_year: selectedFY }),
        });
        const { id } = await res.json();
        setCurrentSessionId(id);
      }
    }

    router.push("/analysis");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step 1 of 3 — Income Details</span>
          <span className="font-medium">{selectedFY}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: "33%" }} />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Enter Your Income Details</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your annual salary components. All values in rupees (₹).
        </p>
      </div>

      <IncomeForm defaultValues={income} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
