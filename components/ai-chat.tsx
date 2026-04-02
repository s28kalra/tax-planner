"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, RefreshCw, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { streamAnalysis } from "@/lib/claude-client";
import { useTaxStore } from "@/store/tax-store";
import type { ChatMessage } from "@/types/tax";
import type { AnalyzeRequest } from "@/types/api";

interface AIChatProps {
  autoStart?: boolean;
  mode?: "initial_analysis" | "deduction_followup" | "chat";
}

export function AIChat({ autoStart = true, mode = "initial_analysis" }: AIChatProps) {
  const {
    selectedFY,
    income,
    deductions,
    newRegimeResult,
    oldRegimeResult,
    chatMessages,
    addChatMessage,
    updateLastAssistantMessage,
    setAnalysisMode,
  } = useTaxStore();

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasAutoStarted = useRef(false);

  // Scroll within the chat box only — never hijack the page scroll
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  const startStream = useCallback(
    async (userMessage?: string, streamMode?: typeof mode) => {
      if (!newRegimeResult || !oldRegimeResult) return;
      setError(null);
      setIsStreaming(true);

      const currentMode = streamMode ?? mode;

      if (userMessage) {
        addChatMessage({ role: "user", content: userMessage, timestamp: Date.now() });
      }

      const assistantPlaceholder: ChatMessage = { role: "assistant", content: "", timestamp: Date.now() };
      addChatMessage(assistantPlaceholder);

      let accumulated = "";

      try {
        const body: AnalyzeRequest = {
          mode: currentMode,
          fy: selectedFY,
          income,
          deductions,
          oldRegimeResult,
          newRegimeResult,
          hraExemption: oldRegimeResult.hraExemption,
          chatHistory: currentMode === "chat" ? [...chatMessages, { role: "user", content: userMessage ?? "", timestamp: Date.now() }] : undefined,
          userMessage,
        };

        for await (const chunk of streamAnalysis(body as unknown as Record<string, unknown>)) {
          if (chunk.type === "text" && chunk.text) {
            accumulated += chunk.text;
            updateLastAssistantMessage(accumulated);
          } else if (chunk.type === "error") {
            setError(chunk.error ?? "Stream error");
            break;
          } else if (chunk.type === "done") {
            break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to stream response");
      } finally {
        setIsStreaming(false);
        if (currentMode === "initial_analysis") {
          setAnalysisMode("AI_COMPLETE");
        }
      }
    },
    [newRegimeResult, oldRegimeResult, mode, selectedFY, income, deductions, chatMessages, addChatMessage, updateLastAssistantMessage, setAnalysisMode]
  );

  useEffect(() => {
    if (autoStart && !hasAutoStarted.current && newRegimeResult && oldRegimeResult) {
      hasAutoStarted.current = true;
      startStream(undefined, "initial_analysis");
    }
  }, [autoStart, newRegimeResult, oldRegimeResult, startStream]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    await startStream(msg, "chat");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          AI Tax Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Messages */}
        <div ref={messagesContainerRef} className="min-h-[300px] max-h-[500px] overflow-y-auto space-y-3 pr-1">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-ul:my-1 prose-ol:my-1 prose-p:my-1 prose-headings:my-2 prose-table:text-sm prose-th:text-foreground prose-td:text-foreground prose-thead:border-border prose-tr:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    {isStreaming && i === chatMessages.length - 1 && (
                      <span className="inline-block w-1 h-4 ml-0.5 bg-current animate-pulse" />
                    )}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {chatMessages.length === 0 && !isStreaming && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Analysis will appear here…
            </div>
          )}

        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setError(null);
                startStream(undefined, mode);
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[40px] max-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Ask a follow-up question… (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
