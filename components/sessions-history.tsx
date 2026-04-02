"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatINRCompact } from "@/lib/formatters";
import { useTaxStore } from "@/store/tax-store";
import type { IncomeBreakdown, DeductionInput, TaxCalculationResult } from "@/types/tax";
import type { FinancialYear } from "@/lib/tax-data";

interface TaxSessionRow {
  id: string;
  financialYear: string;
  income: IncomeBreakdown;
  deductions?: DeductionInput | null;
  selectedRegime?: string | null;
  newRegimeResult?: TaxCalculationResult | null;
  oldRegimeResult?: TaxCalculationResult | null;
  oldWithDeductionsResult?: TaxCalculationResult | null;
  createdAt?: string;
  updatedAt?: string;
}

export function SessionsHistory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setIncome, setDeductions, setNewRegimeResult, setOldRegimeResult, setOldRegimeWithDeductionsResult, setSelectedFY, setCurrentSessionId, resetAll } = useTaxStore();

  const [rows, setRows] = useState<TaxSessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/sessions")
        .then((r) => r.json())
        .then((data) => {
          setRows(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "unauthenticated" || status === "loading") return null;
  if (!loading && rows.length === 0) return null;

  async function handleDelete(id: string) {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleLoad(row: TaxSessionRow) {
    resetAll();
    setSelectedFY(row.financialYear as FinancialYear);
    setIncome(row.income);
    if (row.deductions) setDeductions(row.deductions);
    if (row.newRegimeResult) setNewRegimeResult(row.newRegimeResult);
    if (row.oldRegimeResult) setOldRegimeResult(row.oldRegimeResult);
    if (row.oldWithDeductionsResult) setOldRegimeWithDeductionsResult(row.oldWithDeductionsResult);
    setCurrentSessionId(row.id);
    router.push("/analysis");
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getRecommendedRegime(row: TaxSessionRow) {
    if (row.selectedRegime) {
      return row.selectedRegime === "new" ? "New Regime" : "Old Regime";
    }
    if (row.newRegimeResult && row.oldRegimeResult) {
      return row.newRegimeResult.totalTax <= row.oldRegimeResult.totalTax
        ? "New Regime"
        : "Old Regime";
    }
    return null;
  }

  function getGrossIncome(row: TaxSessionRow) {
    const inc = row.income;
    const custom = inc.customItems?.reduce((s, i) => s + i.amount, 0) ?? 0;
    return inc.basicPay + inc.hra + inc.specialAllowance + inc.lta + inc.bonus + inc.epfEmployer + inc.gratuity + custom;
  }

  const skeletonCount = loading ? 2 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Your Past Analyses</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { resetAll(); router.push("/income"); }}
        >
          <Plus className="h-3 w-3 mr-1" /> New Analysis
        </Button>
      </div>

      {loading &&
        Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}

      {rows.map((row) => {
        const recommended = getRecommendedRegime(row);
        const bestResult =
          row.oldWithDeductionsResult ??
          (row.newRegimeResult && row.oldRegimeResult
            ? row.newRegimeResult.totalTax <= row.oldRegimeResult.totalTax
              ? row.newRegimeResult
              : row.oldRegimeResult
            : null);

        return (
          <Card key={row.id} className="border hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{row.financialYear}</span>
                  {recommended && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {recommended}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gross income: {formatINRCompact(getGrossIncome(row))}
                  {bestResult && ` · Tax: ${formatINRCompact(bestResult.totalTax)}`}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(row.updatedAt)}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => handleLoad(row)}>
                  Load <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
                <button
                  onClick={() => handleDelete(row.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
