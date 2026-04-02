import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taxSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(taxSessions)
    .where(eq(taxSessions.userId, session.user.id))
    .orderBy(desc(taxSessions.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { income, financial_year } = body;

  const [row] = await db
    .insert(taxSessions)
    .values({
      userId: session.user.id,
      financialYear: financial_year,
      income,
    })
    .returning({ id: taxSessions.id });

  return NextResponse.json({ id: row.id });
}
