import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { calculateOldRegimeTax } from "@/lib/tax-calculator";
import { formatINR, formatPercent } from "@/lib/formatters";
import type { TaxCalculationResult, IncomeBreakdown, DeductionInput, ChatMessage } from "@/types/tax";
import type { FinancialYear } from "@/lib/tax-data";

export const runtime = "nodejs";

interface AnalyzeRequest {
  mode: "initial_analysis" | "deduction_followup" | "chat";
  fy: FinancialYear;
  income: IncomeBreakdown;
  oldRegimeResult: TaxCalculationResult;
  newRegimeResult: TaxCalculationResult;
  hraExemption: number;
  deductions?: DeductionInput;
  chatHistory?: ChatMessage[];
  userMessage?: string;
}

function buildSystemPrompt(
  req: AnalyzeRequest,
  oldWithDeductions?: TaxCalculationResult
): string {
  const { fy, newRegimeResult: nr, oldRegimeResult: or, hraExemption } = req;
  const gap = or.totalTax - nr.totalTax;
  const winner = gap > 0 ? "New Regime" : "Old Regime";

  let prompt = `You are an expert Indian tax advisor helping a salaried employee for FY ${fy}.

COMPUTED TAX FACTS (do NOT recalculate — use these exact numbers):

New Regime:
  Gross Income: ${formatINR(nr.grossIncome)}
  Standard Deduction: ${formatINR(nr.standardDeduction)}
  Taxable Income: ${formatINR(nr.taxableIncome)}
  Tax (before cess): ${formatINR(nr.taxBeforeCess)}
  Cess (4%): ${formatINR(nr.cess)}
  Total Tax: ${formatINR(nr.totalTax)}
  Effective Rate: ${formatPercent(nr.effectiveRate)}
  ${nr.rebateApplied > 0 ? `Rebate 87A Applied: ${formatINR(nr.rebateApplied)}` : "No rebate 87A (income above limit)"}

Old Regime (no deductions):
  Taxable Income: ${formatINR(or.taxableIncome)}
  Total Tax: ${formatINR(or.totalTax)}
  Effective Rate: ${formatPercent(or.effectiveRate)}`;

  if (hraExemption > 0) {
    prompt += `\n  HRA Exemption (auto-calculated): ${formatINR(hraExemption)}`;
  }

  if (oldWithDeductions) {
    prompt += `\n\nOld Regime WITH committed deductions:
  Taxable Income: ${formatINR(oldWithDeductions.taxableIncome)}
  Total Tax: ${formatINR(oldWithDeductions.totalTax)}
  Effective Rate: ${formatPercent(oldWithDeductions.effectiveRate)}
  Savings vs New Regime: ${formatINR(nr.totalTax - oldWithDeductions.totalTax)} (${nr.totalTax > oldWithDeductions.totalTax ? "Old Regime wins" : "New Regime still wins"})`;
  }

  prompt += `

IMPORTANT RULES:
- Always use Indian number format with ₹ symbol (e.g. ₹1,00,000 not ₹100,000)
- Never guess or recalculate tax figures — only use the numbers above
- Be concise, conversational, and actionable
- If taxable income in new regime is exactly ₹12,00,000 (FY 2025-26/2026-27), mention the rebate 87A cliff effect
- Recommend ${winner} based on the numbers

RESPONSE STYLE: Speak like a friendly CA (Chartered Accountant), not a tax robot. Use clear headings and bullet points.`;

  return prompt;
}

function buildUserMessage(req: AnalyzeRequest): string {
  const { mode, newRegimeResult: nr, oldRegimeResult: or } = req;
  const gap = Math.abs(or.totalTax - nr.totalTax);

  if (mode === "initial_analysis") {
    const winner = or.totalTax > nr.totalTax ? "New Regime" : "Old Regime";
    return `Please analyze my tax situation for FY ${req.fy}.
Current comparison (no deductions in old regime): New Regime tax = ${formatINR(nr.totalTax)}, Old Regime tax = ${formatINR(or.totalTax)}.
Gap = ${formatINR(gap)} in favor of ${winner}.

${gap > 50000 && or.totalTax > nr.totalTax ? `The old regime could potentially win if I have the right deductions — please explain what investments/commitments I would need.` : ""}

Please give me a clear recommendation with reasoning.`;
  }

  if (mode === "deduction_followup") {
    return `I've committed to these deductions. Please give me a final recommendation comparing both regimes with these deductions, and advise me on what to do for TDS/Form 16 submission.`;
  }

  return req.userMessage ?? "What else should I know about my tax situation?";
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseURL = process.env.ANTHROPIC_BASE_URL; // set automatically by Claude Code local proxy

  // Production: require an explicit API key.
  // Dev: Claude Code injects ANTHROPIC_API_KEY + ANTHROPIC_BASE_URL when the server is started
  //      via the Claude Code terminal — no manual key needed.
  if (!apiKey && !baseURL && process.env.NODE_ENV !== "development") {
    return new Response(
      "ANTHROPIC_API_KEY not configured. Set it in .env.local.",
      { status: 500 }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // If deductions are provided, compute old regime with deductions server-side
  let oldWithDeductions: TaxCalculationResult | undefined;
  if (body.deductions && body.mode !== "initial_analysis") {
    oldWithDeductions = calculateOldRegimeTax(body.income, body.deductions, body.fy);
  }

  const client = new Anthropic({
    apiKey: apiKey ?? "local", // "local" is a placeholder; Claude Code proxy ignores the key value
    ...(baseURL ? { baseURL } : {}),
  });
  const systemPrompt = buildSystemPrompt(body, oldWithDeductions);
  const userMsg = buildUserMessage(body);

  // Build message history
  const messages: Anthropic.MessageParam[] = [];
  if (body.chatHistory && body.chatHistory.length > 0) {
    for (const msg of body.chatHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }
  if (body.mode === "chat" && body.userMessage) {
    // Last message already included from chatHistory
  } else {
    messages.push({ role: "user", content: userMsg });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: systemPrompt,
          messages,
          stream: true,
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const data = JSON.stringify({ text: event.delta.text });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
