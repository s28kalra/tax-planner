"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatINR, formatPercent, formatLakhs } from "@/lib/formatters";
import type { TaxCalculationResult } from "@/types/tax";

interface TaxComparisonProps {
  newRegime: TaxCalculationResult;
  oldRegime: TaxCalculationResult;
  oldRegimeWithDeductions?: TaxCalculationResult;
}

interface RegimeCardProps {
  title: string;
  result: TaxCalculationResult;
  isWinner: boolean;
  label?: string;
}

function RegimeCard({ title, result, isWinner, label }: RegimeCardProps) {
  return (
    <Card className={`relative ${isWinner ? "border-green-500 border-2" : "border-amber-400"}`}>
      {isWinner && (
        <div className="absolute -top-3 left-4">
          <Badge variant="success" className="shadow-sm">Recommended</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <Row label="Gross Income" value={formatINR(result.grossIncome)} />
        <Row label="Standard Deduction" value={`− ${formatINR(result.standardDeduction)}`} />
        {result.hraExemption > 0 && (
          <Row label="HRA Exemption" value={`− ${formatINR(result.hraExemption)}`} />
        )}
        {result.deductionsTotal > result.standardDeduction && (
          <Row label="Other Deductions" value={`− ${formatINR(result.deductionsTotal - result.standardDeduction - result.hraExemption)}`} />
        )}
        <Separator className="my-1" />
        <Row label="Taxable Income" value={formatINR(result.taxableIncome)} bold />
        <Row label="Tax (before cess)" value={formatINR(result.taxBeforeCess)} />
        {result.rebateApplied > 0 && (
          <Row label="Rebate 87A" value={`− ${formatINR(result.rebateApplied)}`} className="text-green-700" />
        )}
        <Row label="Cess (4%)" value={formatINR(result.cess)} />
        <Separator className="my-1" />
        <div className="flex justify-between items-center">
          <span className="font-bold">Total Tax</span>
          <span className={`text-xl font-bold ${isWinner ? "text-green-700" : "text-amber-700"}`}>
            {formatINR(result.totalTax)}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Effective Rate</span>
          <span>{formatPercent(result.effectiveRate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between ${className ?? ""}`}>
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

export function TaxComparison({ newRegime, oldRegime, oldRegimeWithDeductions }: TaxComparisonProps) {
  const oldEffective = oldRegimeWithDeductions ?? oldRegime;
  const newWins = newRegime.totalTax <= oldEffective.totalTax;
  const savings = Math.abs(oldEffective.totalTax - newRegime.totalTax);

  const chartData = [
    {
      name: "New Regime",
      tax: newRegime.totalTax,
      wins: newWins,
    },
    {
      name: oldRegimeWithDeductions ? "Old Regime\n(with deductions)" : "Old Regime",
      tax: oldEffective.totalTax,
      wins: !newWins,
    },
  ];

  return (
    <div className="space-y-6">
      {savings > 0 && (
        <div className="text-center">
          <Badge variant={newWins ? "success" : "warning"} className="text-sm px-4 py-1">
            {newWins
              ? `New Regime saves ${formatINR(savings)}`
              : `Old Regime saves ${formatINR(savings)} with deductions`}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RegimeCard
          title="New Regime"
          result={newRegime}
          isWinner={newWins}
        />
        <RegimeCard
          title="Old Regime"
          result={oldEffective}
          isWinner={!newWins}
          label={oldRegimeWithDeductions ? "With committed deductions" : "Without deductions"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatLakhs(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => [formatINR(value), "Total Tax"]} />
              <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.wins ? "#22c55e" : "#f59e0b"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Slab breakdown */}
      {newRegime.slabBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Regime — Slab Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-1">Income Range</th>
                  <th className="text-right py-1">Rate</th>
                  <th className="text-right py-1">Taxable Amount</th>
                  <th className="text-right py-1">Tax</th>
                </tr>
              </thead>
              <tbody>
                {newRegime.slabBreakdown.map((slab, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1">
                      {formatINR(slab.from)} — {slab.to ? formatINR(slab.to) : "Above"}
                    </td>
                    <td className="text-right py-1">{formatPercent(slab.rate * 100, 0)}</td>
                    <td className="text-right py-1">{formatINR(slab.taxableInSlab)}</td>
                    <td className="text-right py-1 font-medium">{formatINR(slab.taxInSlab)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
