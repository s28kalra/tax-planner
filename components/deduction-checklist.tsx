"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/formatters";
import { calculateOldRegimeTax, calculateHRAExemption } from "@/lib/tax-calculator";
import { useTaxStore } from "@/store/tax-store";
import type { DeductionInput } from "@/types/tax";
import { getFYConfig } from "@/lib/tax-data";

interface DeductionChecklistProps {
  onConfirm: (deductions: DeductionInput) => void;
}

const DEDUCTION_ITEMS = [
  {
    key: "section80C" as keyof DeductionInput,
    section: "Section 80C",
    label: "80C Investments",
    description: "ELSS mutual funds, PPF, life insurance premium, NSC, home loan principal repayment, children's tuition fees",
  },
  {
    key: "section80D" as keyof DeductionInput,
    section: "Section 80D",
    label: "Health Insurance (80D)",
    description: "Mediclaim premium for self, spouse, children (₹25,000 limit) or parents (₹50,000 if senior)",
  },
  {
    key: "nps80CCD1B" as keyof DeductionInput,
    section: "80CCD(1B)",
    label: "NPS Additional Contribution",
    description: "Additional NPS contribution over and above 80C — exclusive ₹50,000 deduction",
  },
  {
    key: "homeLoanInterest24B" as keyof DeductionInput,
    section: "Section 24(b)",
    label: "Home Loan Interest",
    description: "Interest on home loan for self-occupied property (up to ₹2,00,000 per year)",
  },
  {
    key: "otherDeductions" as keyof DeductionInput,
    section: "Others",
    label: "Other Deductions",
    description: "80G (donations), 80E (education loan interest), 80TTA (savings interest), etc.",
  },
];

export function DeductionChecklist({ onConfirm }: DeductionChecklistProps) {
  const { income, selectedFY, newRegimeResult, deductions } = useTaxStore();

  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      DEDUCTION_ITEMS
        .filter((item) => ((deductions[item.key] as number) ?? 0) > 0)
        .map((item) => [item.key, true])
    )
  );
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      DEDUCTION_ITEMS
        .filter((item) => ((deductions[item.key] as number) ?? 0) > 0)
        .map((item) => [item.key, deductions[item.key] as number])
    )
  );
  const [hraEnabled, setHraEnabled] = useState(() => (deductions.hraExemptionClaimed ?? 0) > 0);
  const [isConfirming, setIsConfirming] = useState(false);

  const limits = getFYConfig(selectedFY).deductionLimits;
  const hraExemption = calculateHRAExemption(income.basicPay, income.hra, income.rentPaid, income.cityTier);

  const currentDeductions: DeductionInput = {
    section80C: enabled.section80C ? (values.section80C ?? 0) : 0,
    section80D: enabled.section80D ? (values.section80D ?? 0) : 0,
    nps80CCD1B: enabled.nps80CCD1B ? (values.nps80CCD1B ?? 0) : 0,
    homeLoanInterest24B: enabled.homeLoanInterest24B ? (values.homeLoanInterest24B ?? 0) : 0,
    hraExemptionClaimed: hraEnabled ? hraExemption : 0,
    otherDeductions: enabled.otherDeductions ? (values.otherDeductions ?? 0) : 0,
  };

  const oldWithDeductions = calculateOldRegimeTax(income, currentDeductions, selectedFY);
  const newTax = newRegimeResult?.totalTax ?? 0;
  const savings = newTax - oldWithDeductions.totalTax;
  const oldWins = savings > 0;

  function getLimitForKey(key: string): number {
    const map: Record<string, number> = {
      section80C: limits.section80C,
      section80D: limits.section80D_self,
      nps80CCD1B: limits.nps80CCD1B,
      homeLoanInterest24B: limits.homeLoanInterest24B,
      otherDeductions: 999999,
    };
    return map[key] ?? 0;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deduction Checklist</CardTitle>
        <p className="text-sm text-muted-foreground">
          Check the deductions you can commit to. We'll calculate how they affect your tax.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HRA — auto-calculated */}
        {hraExemption > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-md border">
            <Checkbox
              id="hra"
              checked={hraEnabled}
              onCheckedChange={(c) => setHraEnabled(!!c)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <Label htmlFor="hra" className="font-medium cursor-pointer">
                HRA Exemption <Badge variant="secondary" className="ml-2 text-xs">Auto-calculated</Badge>
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Based on Basic ₹{income.basicPay.toLocaleString("en-IN")}, HRA received, and rent paid
              </p>
              <p className="text-sm font-medium mt-1 text-green-700">Exemption: {formatINR(hraExemption)}</p>
            </div>
          </div>
        )}

        {DEDUCTION_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start gap-3 p-3 rounded-md border">
            <Checkbox
              id={item.key}
              checked={!!enabled[item.key]}
              onCheckedChange={(c) => setEnabled((e) => ({ ...e, [item.key]: !!c }))}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-2">
              <div>
                <Label htmlFor={item.key} className="font-medium cursor-pointer">
                  {item.label}
                  <Badge variant="outline" className="ml-2 text-xs">{item.section}</Badge>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                {item.key !== "otherDeductions" && (
                  <p className="text-xs text-muted-foreground">Max limit: {formatINR(getLimitForKey(item.key))}</p>
                )}
              </div>
              {enabled[item.key] && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={getLimitForKey(item.key)}
                    placeholder="Amount you can invest/pay"
                    value={values[item.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [item.key]: Number(e.target.value) }))}
                    className="max-w-xs font-mono"
                  />
                  {values[item.key] > 0 && (
                    <span className="text-xs text-muted-foreground">{formatINR(values[item.key])}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <Separator />

        {/* Live preview */}
        <div className="rounded-md bg-muted p-4 space-y-2">
          <p className="text-sm font-medium">Live Preview</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Old Regime (with these deductions)</p>
              <p className="text-xl font-bold">{formatINR(oldWithDeductions.totalTax)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">New Regime</p>
              <p className="text-xl font-bold">{formatINR(newTax)}</p>
            </div>
          </div>
          {savings !== 0 && (
            <Badge variant={oldWins ? "success" : "warning"} className="text-sm px-3">
              {oldWins
                ? `Old Regime saves ${formatINR(savings)}`
                : `New Regime saves ${formatINR(-savings)}`}
            </Badge>
          )}
        </div>

        <Button
          className="w-full"
          disabled={isConfirming}
          onClick={() => {
            setIsConfirming(true);
            onConfirm(currentDeductions);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => setIsConfirming(false), 500);
          }}
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Confirm Deductions & Get Final Recommendation"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
