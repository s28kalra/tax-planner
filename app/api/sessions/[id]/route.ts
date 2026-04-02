import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taxSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Build update object — only include provided fields
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (body.income !== undefined) updates.income = body.income;
  if (body.financial_year !== undefined) updates.financialYear = body.financial_year;
  if (body.deductions !== undefined) updates.deductions = body.deductions;
  if (body.selected_regime !== undefined) updates.selectedRegime = body.selected_regime;
  if (body.new_regime_result !== undefined) updates.newRegimeResult = body.new_regime_result;
  if (body.old_regime_result !== undefined) updates.oldRegimeResult = body.old_regime_result;
  if (body.old_with_deductions_result !== undefined)
    updates.oldWithDeductionsResult = body.old_with_deductions_result;

  await db
    .update(taxSessions)
    .set(updates)
    .where(
      and(
        eq(taxSessions.id, params.id),
        eq(taxSessions.userId, session.user.id)
      )
    );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(taxSessions)
    .where(
      and(
        eq(taxSessions.id, params.id),
        eq(taxSessions.userId, session.user.id)
      )
    );

  return NextResponse.json({ ok: true });
}
