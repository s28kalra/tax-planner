"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/formatters";
import type { IncomeBreakdown, CityTier } from "@/types/tax";

const incomeSchema = z.object({
  basicPay: z.coerce.number().min(0),
  hra: z.coerce.number().min(0),
  cityTier: z.enum(["tier1", "tier2", "tier3"]),
  rentPaid: z.coerce.number().min(0),
  specialAllowance: z.coerce.number().min(0),
  lta: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  epfEmployer: z.coerce.number().min(0),
  gratuity: z.coerce.number().min(0),
  customItems: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, "Label required"),
      amount: z.coerce.number().min(0),
      isTaxable: z.boolean(),
    })
  ),
});

type IncomeFormValues = z.infer<typeof incomeSchema>;

type NumericField = "basicPay" | "hra" | "rentPaid" | "specialAllowance" | "lta" | "bonus" | "epfEmployer" | "gratuity";

interface IncomeFormProps {
  defaultValues?: Partial<IncomeBreakdown>;
  onSubmit: (data: IncomeBreakdown) => void;
  isSubmitting?: boolean;
}

function AmountField({
  label,
  name,
  hint,
  register,
  watchValue,
}: {
  label: string;
  name: NumericField;
  hint?: string;
  register: ReturnType<typeof useForm<IncomeFormValues>>["register"];
  watchValue: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {hint && (
          <span className="text-muted-foreground text-xs cursor-help" title={hint}>
            <Info className="h-3 w-3" />
          </span>
        )}
      </Label>
      <Input
        id={name}
        type="number"
        min={0}
        placeholder="0"
        {...register(name)}
        className="font-mono"
      />
      {watchValue > 0 && (
        <p className="text-xs text-muted-foreground">{formatINR(watchValue)}</p>
      )}
    </div>
  );
}

export function IncomeForm({ defaultValues, onSubmit, isSubmitting = false }: IncomeFormProps) {
  const { register, handleSubmit, watch, control, setValue } =
    useForm<IncomeFormValues>({
      resolver: zodResolver(incomeSchema),
      defaultValues: {
        basicPay: defaultValues?.basicPay ?? 0,
        hra: defaultValues?.hra ?? 0,
        cityTier: (defaultValues?.cityTier as CityTier) ?? "tier1",
        rentPaid: defaultValues?.rentPaid ?? 0,
        specialAllowance: defaultValues?.specialAllowance ?? 0,
        lta: defaultValues?.lta ?? 0,
        bonus: defaultValues?.bonus ?? 0,
        epfEmployer: defaultValues?.epfEmployer ?? 0,
        gratuity: defaultValues?.gratuity ?? 0,
        customItems: defaultValues?.customItems ?? [],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "customItems" });

  const watchHra = watch("hra");
  const watchAll = watch();

  const grossTotal =
    Number(watchAll.basicPay || 0) +
    Number(watchAll.hra || 0) +
    Number(watchAll.specialAllowance || 0) +
    Number(watchAll.lta || 0) +
    Number(watchAll.bonus || 0) +
    (watchAll.customItems || []).reduce((s: number, i) => s + Number(i.amount || 0), 0);

  function handleFormSubmit(data: IncomeFormValues) {
    onSubmit({
      ...data,
      rentPaid: data.rentPaid * 12, // convert monthly → annual for HRA exemption formula
      cityTier: data.cityTier as CityTier,
      customItems: data.customItems.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Base Salary Components</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AmountField label="Basic Pay (Annual)" name="basicPay" register={register} watchValue={watch("basicPay")} hint="Typically 40-50% of CTC" />
          <div className="space-y-1">
            <Label>HRA (Annual)</Label>
            <Input type="number" min={0} placeholder="0" {...register("hra")} className="font-mono" />
            {watchHra > 0 && <p className="text-xs text-muted-foreground">{formatINR(watchHra)}</p>}
          </div>

          {watchHra > 0 && (
            <>
              <div className="space-y-1">
                <Label>City Tier (for HRA exemption)</Label>
                <Select
                  value={watch("cityTier")}
                  onValueChange={(v) => setValue("cityTier", v as CityTier)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tier1">Tier 1 — Mumbai, Delhi, Kolkata, Chennai (50%)</SelectItem>
                    <SelectItem value="tier2">Tier 2 — Bengaluru, Hyderabad, Pune etc. (40%)</SelectItem>
                    <SelectItem value="tier3">Tier 3 — Other cities (40%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Monthly Rent Paid</Label>
                <Input type="number" min={0} placeholder="0" {...register("rentPaid")} className="font-mono" />
                <p className="text-xs text-muted-foreground">Enter 0 if you don&apos;t pay rent</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Allowances & Other Income</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AmountField label="Special Allowance (Annual)" name="specialAllowance" register={register} watchValue={watch("specialAllowance")} />
          <AmountField label="LTA (Annual)" name="lta" register={register} watchValue={watch("lta")} hint="Leave Travel Allowance" />
          <AmountField label="Annual Bonus" name="bonus" register={register} watchValue={watch("bonus")} />
          <AmountField label="Employer EPF Contribution" name="epfEmployer" register={register} watchValue={watch("epfEmployer")} hint="Employer's 12% PF — typically not in take-home" />
          <AmountField label="Gratuity (Annual provision)" name="gratuity" register={register} watchValue={watch("gratuity")} hint="Usually excluded from taxable income till limit" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Custom Income Items
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: crypto.randomUUID(), label: "", amount: 0, isTaxable: true })}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom items. Add meal vouchers, phone allowance, etc.</p>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input placeholder="Item name" {...register(`customItems.${index}.label`)} />
              </div>
              <div className="w-32">
                <Input type="number" min={0} placeholder="Amount" {...register(`customItems.${index}.amount`)} className="font-mono" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Checkbox
                  id={`taxable-${index}`}
                  checked={watch(`customItems.${index}.isTaxable`)}
                  onCheckedChange={(checked) => setValue(`customItems.${index}.isTaxable`, !!checked)}
                />
                <Label htmlFor={`taxable-${index}`} className="text-xs whitespace-nowrap">Taxable</Label>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Estimated Gross Income</p>
          <p className="text-2xl font-bold text-primary">{formatINR(grossTotal)}</p>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Calculate Tax →"
          )}
        </Button>
      </div>
    </form>
  );
}
