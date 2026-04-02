"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getAvailableFYs, TAX_CONFIG, type FinancialYear } from "@/lib/tax-data";

interface FYSelectorProps {
  value: FinancialYear;
  onChange: (fy: FinancialYear) => void;
}

export function FYSelector({ value, onChange }: FYSelectorProps) {
  const fys = getAvailableFYs();
  const isEstimated = TAX_CONFIG[value].isEstimated;

  return (
    <div className="space-y-3">
      <Select value={value} onValueChange={(v) => onChange(v as FinancialYear)}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select Financial Year" />
        </SelectTrigger>
        <SelectContent>
          {fys.map((fy) => (
            <SelectItem key={fy} value={fy}>
              {TAX_CONFIG[fy].label}
              {TAX_CONFIG[fy].isEstimated ? " (Estimated)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isEstimated && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Estimated figures:</strong> Tax slabs for {TAX_CONFIG[value].label} are based on the
            previous year's regime and may change after the Union Budget. Verify with official sources
            after budget announcement.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
