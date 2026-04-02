"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { formatINR } from "@/lib/formatters";
import { useTaxStore } from "@/store/tax-store";

interface Suggestion {
  title: string;
  description: string;
  potentialSaving: string;
  regime: "both" | "old" | "new";
}

export function SalaryRestructuring() {
  const { income } = useTaxStore();

  const suggestions: Suggestion[] = [];

  // Meal vouchers (Sodexo/food allowance): up to ₹2,200/month exempt
  const hasMealVouchers = income.customItems.some(
    (i) => i.label.toLowerCase().includes("meal") || i.label.toLowerCase().includes("food") || i.label.toLowerCase().includes("sodexo")
  );
  if (!hasMealVouchers && income.basicPay > 300000) {
    suggestions.push({
      title: "Add Meal Vouchers / Food Allowance",
      description:
        "Meal vouchers (Sodexo/Zeta) up to ₹2,200/month (₹26,400/year) are fully exempt from tax. Ask HR to restructure part of your Special Allowance into a food allowance.",
      potentialSaving: formatINR(Math.round(26400 * 0.3 * 1.04)), // ~30% bracket + cess
      regime: "both",
    });
  }

  // LTA: suggest adding if zero
  if (income.lta === 0 && income.basicPay > 500000) {
    suggestions.push({
      title: "Add LTA (Leave Travel Allowance)",
      description:
        "LTA can be claimed twice in a 4-year block for travel within India. Ask HR to include LTA in your CTC — it's exempt in old regime, and though taxable in new regime, the CTC restructure reduces your cash salary if restructured.",
      potentialSaving: "₹10,000 – ₹30,000 saved over 4 years",
      regime: "old",
    });
  }

  // NPS via employer (Section 80CCD(2)) — exempt in BOTH regimes
  if (income.epfEmployer > 0 && !income.customItems.some((i) => i.label.toLowerCase().includes("nps"))) {
    suggestions.push({
      title: "Employer NPS under Section 80CCD(2)",
      description:
        "Up to 10% of Basic Pay contributed by employer to NPS is exempt from tax in BOTH old and new regimes. This is over and above the 80C/80CCD(1B) limits — ask HR to route part of special allowance as employer NPS.",
      potentialSaving: formatINR(Math.round(income.basicPay * 0.1 * 0.208)), // 20% effective rate
      regime: "both",
    });
  }

  // Phone/internet reimbursement
  const hasPhone = income.customItems.some(
    (i) =>
      i.label.toLowerCase().includes("phone") ||
      i.label.toLowerCase().includes("internet") ||
      i.label.toLowerCase().includes("broadband")
  );
  if (!hasPhone && income.specialAllowance > 100000) {
    suggestions.push({
      title: "Phone & Internet Reimbursement",
      description:
        "Actual phone and internet bills reimbursed by employer are fully tax-exempt. Restructure ₹1,200–₹2,000/month from Special Allowance to a reimbursement component.",
      potentialSaving: "Up to ₹7,500/year saved",
      regime: "both",
    });
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Salary Restructuring Tips
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Reduce tax through smart CTC restructuring (no investment needed).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((s, i) => (
          <div key={i} className="border rounded-md p-3 space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{s.title}</p>
              <Badge variant={s.regime === "both" ? "success" : s.regime === "old" ? "warning" : "secondary"} className="text-xs">
                {s.regime === "both" ? "Both Regimes" : s.regime === "old" ? "Old Regime" : "New Regime"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{s.description}</p>
            <p className="text-xs font-medium text-green-700">Potential saving: {s.potentialSaving}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
