"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Bot, GitCompare, ArrowRight, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FYSelector } from "@/components/fy-selector";
import { SessionsHistory } from "@/components/sessions-history";
import { useTaxStore } from "@/store/tax-store";

export default function LandingPage() {
  const router = useRouter();
  const { selectedFY, setSelectedFY, income, resetAll } = useTaxStore();
  const hasExistingSession = income.basicPay > 0;
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Indian Tax Planner
        </h1>
        <p className="text-lg text-muted-foreground">
          Compare Old vs New regime with AI-powered analysis.
          <br />
          Find out which regime saves you more — in minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2 text-center">
            <Shield className="h-8 w-8 text-primary" />
            <p className="font-medium text-sm">Works Anonymously</p>
            <p className="text-xs text-muted-foreground">Sign in to save your analyses across devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2 text-center">
            <Bot className="h-8 w-8 text-primary" />
            <p className="font-medium text-sm">AI-Powered Analysis</p>
            <p className="text-xs text-muted-foreground">Claude explains your tax situation conversationally</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-2 text-center">
            <GitCompare className="h-8 w-8 text-primary" />
            <p className="font-medium text-sm">Both Regimes</p>
            <p className="text-xs text-muted-foreground">Side-by-side comparison with deduction checklist</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Select Financial Year</p>
          <FYSelector value={selectedFY} onChange={setSelectedFY} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" className="flex-1" disabled={navigatingTo !== null} onClick={() => { setNavigatingTo("income"); router.push("/income"); }}>
            {navigatingTo === "income" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Planning <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {hasExistingSession && (
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              disabled={navigatingTo !== null}
              onClick={() => { setNavigatingTo("analysis"); router.push("/analysis"); }}
            >
              {navigatingTo === "analysis" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
              Continue Session
            </Button>
          )}
        </div>

        {hasExistingSession && (
          <p className="text-xs text-center text-muted-foreground">
            Previous session found.{" "}
            <button
              disabled={navigatingTo !== null}
              onClick={() => { setNavigatingTo("fresh"); resetAll(); router.push("/income"); }}
              className="underline hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {navigatingTo === "fresh" ? "Loading…" : "Start fresh"}
            </button>
          </p>
        )}
      </div>

      <SessionsHistory />
    </div>
  );
}
