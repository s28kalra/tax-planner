"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatPercent } from "@/lib/formatters";
import { getFYConfig } from "@/lib/tax-data";
import { useTaxStore } from "@/store/tax-store";

export default function SummaryPage() {
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    income,
    deductions,
    selectedFY,
    newRegimeResult,
    oldRegimeResult,
    oldRegimeWithDeductionsResult,
  } = useTaxStore();

  async function handleDownload() {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: 10,
          filename: `tax-report-${selectedFY}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(reportRef.current)
        .save();
    } finally {
      setDownloading(false);
    }
  }

  if (!newRegimeResult || !oldRegimeResult) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No analysis found.</p>
        <Button className="mt-4" disabled={isNavigating} onClick={() => { setIsNavigating(true); router.push("/"); }}>
          {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Start Planning
        </Button>
      </div>
    );
  }

  const fyConfig = getFYConfig(selectedFY);
  const effectiveOld = oldRegimeWithDeductionsResult ?? oldRegimeResult;
  const newWins = newRegimeResult.totalTax <= effectiveOld.totalTax;
  const savings = Math.abs(effectiveOld.totalTax - newRegimeResult.totalTax);
  const recommended = newWins ? "New Regime" : "Old Regime";
  const monthlyTDS = Math.round(newRegimeResult.totalTax / 12);

  const incomeRows = [
    { label: "Basic Pay", value: income.basicPay },
    { label: "HRA", value: income.hra },
    { label: "Special Allowance", value: income.specialAllowance },
    { label: "LTA", value: income.lta },
    { label: "Bonus", value: income.bonus },
    ...income.customItems.map((i) => ({ label: i.label, value: i.amount })),
  ].filter((r) => r.value > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" disabled={isNavigating} onClick={() => { setIsNavigating(true); router.push("/analysis"); }}>
          {isNavigating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowLeft className="h-4 w-4 mr-1" />}
          Back to Analysis
        </Button>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          {downloading ? "Generating…" : "Download PDF"}
        </Button>
      </div>

      <div ref={reportRef} className="space-y-6 bg-white p-2">

      {/* Header */}
      <div className="text-center space-y-1 print:text-left">
        <h1 className="text-2xl font-bold">Tax Planning Report</h1>
        <p className="text-muted-foreground text-sm">
          {fyConfig.label} — Generated {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {fyConfig.isEstimated && (
          <Badge variant="warning">Estimated — Verify after Union Budget</Badge>
        )}
      </div>

      <Separator />

      {/* Recommendation */}
      <Card className={`border-2 ${newWins ? "border-green-500" : "border-amber-500"}`}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recommended Regime</p>
              <p className="text-3xl font-bold text-primary">{recommended}</p>
              <p className="text-sm mt-1">
                Saves <span className="font-semibold text-green-700">{formatINR(savings)}</span> per year
                {oldRegimeWithDeductionsResult ? " (with committed deductions)" : " vs base comparison"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Monthly TDS (approx.)</p>
              <p className="text-2xl font-bold">{formatINR(newWins ? newRegimeResult.totalTax / 12 : effectiveOld.totalTax / 12)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Income Breakdown</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {incomeRows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 text-muted-foreground">{row.label}</td>
                  <td className="py-1.5 text-right font-mono">{formatINR(row.value)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2">Gross Income</td>
                <td className="py-2 text-right font-mono">{formatINR(newRegimeResult.grossIncome)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Regime Comparison</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-1.5">Item</th>
                <th className="text-right py-1.5">New Regime</th>
                <th className="text-right py-1.5">Old Regime</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-1.5">Gross Income</td>
                <td className="text-right">{formatINR(newRegimeResult.grossIncome)}</td>
                <td className="text-right">{formatINR(effectiveOld.grossIncome)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Total Deductions</td>
                <td className="text-right">− {formatINR(newRegimeResult.deductionsTotal)}</td>
                <td className="text-right">− {formatINR(effectiveOld.deductionsTotal)}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Taxable Income</td>
                <td className="text-right font-medium">{formatINR(newRegimeResult.taxableIncome)}</td>
                <td className="text-right font-medium">{formatINR(effectiveOld.taxableIncome)}</td>
              </tr>
              {(newRegimeResult.rebateApplied > 0 || effectiveOld.rebateApplied > 0) && (
                <tr className="border-b">
                  <td className="py-1.5">Rebate 87A</td>
                  <td className="text-right text-green-700">
                    {newRegimeResult.rebateApplied > 0 ? `− ${formatINR(newRegimeResult.rebateApplied)}` : "—"}
                  </td>
                  <td className="text-right text-green-700">
                    {effectiveOld.rebateApplied > 0 ? `− ${formatINR(effectiveOld.rebateApplied)}` : "—"}
                  </td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-1.5">Cess (4%)</td>
                <td className="text-right">{formatINR(newRegimeResult.cess)}</td>
                <td className="text-right">{formatINR(effectiveOld.cess)}</td>
              </tr>
              <tr className="font-bold">
                <td className="py-2">Total Tax</td>
                <td className={`text-right ${newWins ? "text-green-700" : ""}`}>{formatINR(newRegimeResult.totalTax)}</td>
                <td className={`text-right ${!newWins ? "text-green-700" : ""}`}>{formatINR(effectiveOld.totalTax)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-muted-foreground">Effective Rate</td>
                <td className="text-right text-muted-foreground">{formatPercent(newRegimeResult.effectiveRate)}</td>
                <td className="text-right text-muted-foreground">{formatPercent(effectiveOld.effectiveRate)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Deductions (if old regime used) */}
      {oldRegimeWithDeductionsResult && (
        <Card>
          <CardHeader><CardTitle className="text-base">Committed Deductions (Old Regime)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <tbody>
                {deductions.section80C > 0 && <tr className="border-b"><td className="py-1.5">Section 80C</td><td className="text-right">{formatINR(deductions.section80C)}</td></tr>}
                {deductions.section80D > 0 && <tr className="border-b"><td className="py-1.5">Section 80D (Health Insurance)</td><td className="text-right">{formatINR(deductions.section80D)}</td></tr>}
                {deductions.nps80CCD1B > 0 && <tr className="border-b"><td className="py-1.5">NPS 80CCD(1B)</td><td className="text-right">{formatINR(deductions.nps80CCD1B)}</td></tr>}
                {deductions.homeLoanInterest24B > 0 && <tr className="border-b"><td className="py-1.5">Home Loan Interest 24(b)</td><td className="text-right">{formatINR(deductions.homeLoanInterest24B)}</td></tr>}
                {oldRegimeWithDeductionsResult.hraExemption > 0 && <tr className="border-b"><td className="py-1.5">HRA Exemption</td><td className="text-right">{formatINR(oldRegimeWithDeductionsResult.hraExemption)}</td></tr>}
                {deductions.otherDeductions > 0 && <tr className="border-b"><td className="py-1.5">Other Deductions</td><td className="text-right">{formatINR(deductions.otherDeductions)}</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Slab breakdown */}
      {newRegimeResult.slabBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Regime — Tax Slab Breakdown</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-1.5">Income Range</th>
                  <th className="text-right py-1.5">Rate</th>
                  <th className="text-right py-1.5">Taxable</th>
                  <th className="text-right py-1.5">Tax</th>
                </tr>
              </thead>
              <tbody>
                {newRegimeResult.slabBreakdown.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-1.5">{formatINR(s.from)} – {s.to ? formatINR(s.to) : "Above"}</td>
                    <td className="text-right">{formatPercent(s.rate * 100, 0)}</td>
                    <td className="text-right">{formatINR(s.taxableInSlab)}</td>
                    <td className="text-right font-medium">{formatINR(s.taxInSlab)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Important Dates */}
      <Card>
        <CardHeader><CardTitle className="text-base">Important Tax Dates — {fyConfig.label}</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {fyConfig.importantDates.map((d, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.description}</span>
                <span className="font-mono font-medium">{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Key action items */}
      <Card>
        <CardHeader><CardTitle className="text-base">Key Action Items</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>
              Submit <strong>Form 12BB</strong> to your employer declaring your chosen regime:{" "}
              <Badge variant={newWins ? "success" : "warning"}>{recommended}</Badge>
            </li>
            <li>
              Inform employer of your monthly TDS preference: approx.{" "}
              <strong>{formatINR(newWins ? newRegimeResult.totalTax / 12 : effectiveOld.totalTax / 12)}/month</strong>
            </li>
            {!newWins && oldRegimeWithDeductionsResult && (
              <li>Submit investment proofs (80C, 80D, etc.) to HR by February for final TDS calculation</li>
            )}
            <li>
              File your ITR by{" "}
              <strong>{fyConfig.importantDates.find((d) => d.description.includes("ITR"))?.date ?? "31 July"}</strong>
            </li>
            <li>
              Note: You can switch regime at ITR filing time if employer regime doesn&apos;t suit you (new regime is default)
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground border rounded-md p-3">
        <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute professional tax advice.
        Tax calculations are based on inputs provided and standard rules — surcharge for income above ₹50L is not included.
        Always verify with a Chartered Accountant or the official Income Tax website (incometax.gov.in).
        {fyConfig.isEstimated && " Figures for this FY are estimated and subject to change after the Union Budget."}
      </div>

      </div> {/* end reportRef */}
    </div>
  );
}
