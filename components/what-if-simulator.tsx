"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { calculateNewRegimeTax, calculateOldRegimeTax } from "@/lib/tax-calculator";
import { useTaxStore } from "@/store/tax-store";

const STEPS = [25000, 50000, 100000];

interface Adjustment {
  field: "basicPay" | "bonus" | "specialAllowance";
  label: string;
  delta: number;
}

export function WhatIfSimulator() {
  const { income, deductions, selectedFY, newRegimeResult } = useTaxStore();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({
    basicPay: 0,
    bonus: 0,
    specialAllowance: 0,
  });

  if (!newRegimeResult) return null;

  const adjustedIncome = {
    ...income,
    basicPay: income.basicPay + (adjustments.basicPay ?? 0),
    bonus: income.bonus + (adjustments.bonus ?? 0),
    specialAllowance: income.specialAllowance + (adjustments.specialAllowance ?? 0),
  };

  const newResult = calculateNewRegimeTax(adjustedIncome, selectedFY);
  const oldResult = calculateOldRegimeTax(adjustedIncome, deductions, selectedFY);
  const newDelta = newResult.totalTax - newRegimeResult.totalTax;

  function adjust(field: string, delta: number) {
    setAdjustments((prev) => ({ ...prev, [field]: (prev[field] ?? 0) + delta }));
  }

  function reset() {
    setAdjustments({ basicPay: 0, bonus: 0, specialAllowance: 0 });
  }

  const fields: { key: string; label: string }[] = [
    { key: "basicPay", label: "Basic Pay" },
    { key: "bonus", label: "Annual Bonus" },
    { key: "specialAllowance", label: "Special Allowance" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          What-If Simulator
          <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how changes in salary affect your tax liability.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-36 text-sm">{label}</span>
            <div className="flex items-center gap-1">
              {STEPS.map((step) => (
                <Button key={step} variant="outline" size="sm" className="px-2 text-xs" onClick={() => adjust(key, -step)}>
                  <Minus className="h-3 w-3" />
                  {(step / 1000).toFixed(0)}k
                </Button>
              ))}
              <span className="mx-2 font-mono text-sm min-w-[80px] text-center">
                {adjustments[key] >= 0 ? "+" : ""}
                {formatINR(adjustments[key] ?? 0)}
              </span>
              {[...STEPS].reverse().map((step) => (
                <Button key={step} variant="outline" size="sm" className="px-2 text-xs" onClick={() => adjust(key, step)}>
                  <Plus className="h-3 w-3" />
                  {(step / 1000).toFixed(0)}k
                </Button>
              ))}
            </div>
          </div>
        ))}

        <div className="rounded-md bg-muted p-3 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">New Regime Tax</p>
              <p className="font-bold">{formatINR(newResult.totalTax)}</p>
              <p className={`text-xs font-medium ${newDelta >= 0 ? "text-red-600" : "text-green-600"}`}>
                Tax impact: {newDelta >= 0 ? "+" : ""}{formatINR(newDelta)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Old Regime Tax</p>
              <p className="font-bold">{formatINR(oldResult.totalTax)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Adjusted Gross: {formatINR(newResult.grossIncome)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
