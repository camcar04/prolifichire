import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  MessageSquare, X, Send, Loader2, Sparkles, Briefcase, Wrench,
  ArrowRight, DollarSign, MapPin, Plus, Check, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { canPerformAction } from "@/lib/security";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface ParsedAction {
  type: string;
  label?: string;
  data?: Record<string, any>;
}

const SUGGESTIONS_HIRE = [
  "Create a spray job for my largest field",
  "What jobs need my approval?",
  "Estimate pricing for planting 200 acres of corn",
  "What's missing from my setup?",
];

const SUGGESTIONS_DO = [
  "What should I quote on that spray job?",
  "Is my last completed job profitable?",
  "Find high-paying jobs near me",
  "What equipment am I missing?",
];

function parseActions(content: string): { text: string; actions: ParsedAction[] } {
  const actions: ParsedAction[] = [];
  const text = content.replace(/```action\s*\n?([\s\S]*?)```/g, (_, json) => {
    try {
      const parsed = JSON.parse(json.trim());
      actions.push(parsed);
    } catch { /* ignore malformed */ }
    return "";
  }).trim();
  return { text, actions };
}

export function AIAssistant() {
  const { activeMode, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = activeMode === "operator" ? SUGGESTIONS_DO : SUGGESTIONS_HIRE;

  // Build page context from current route
  const pageContext = useCallback(() => {
    const path = location.pathname;
    const ctx: Record<string, string> = { page: path };
    
    const jobMatch = path.match(/\/jobs\/([^/]+)/);
    if (jobMatch) ctx.jobId = jobMatch[1];
    
    const fieldMatch = path.match(/\/fields\/([^/]+)/);
    if (fieldMatch) ctx.fieldId = fieldMatch[1];
    
    if (path.includes("marketplace")) ctx.page = "marketplace";
    else if (path.includes("dashboard") || path === "/app") ctx.page = "dashboard";
    else if (path.includes("settings")) ctx.page = "settings";
    else if (path.includes("packets")) ctx.page = "packets";
    else if (path.includes("schedule") || path.includes("calendar")) ctx.page = "calendar";
    else if (path.includes("payouts")) ctx.page = "payouts";
    else if (path.includes("bid-queue")) ctx.page = "bid-queue";
    
    return ctx;
  }, [location.pathname]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleAction = useCallback((action: ParsedAction) => {
    switch (action.type) {
      case "navigate":
        if (action.data?.path) navigate(action.data.path);
        break;
      case "complete_setup":
        if (action.data?.path) navigate(action.data.path);
        break;
      case "find_jobs":
        navigate("/marketplace");
        break;
      case "save_to_bid":
        toast.success("Job saved to bid queue");
        break;
      case "create_job_draft":
        navigate("/jobs/new");
        toast.info("Job draft started from AI suggestion");
        break;
      case "suggest_quote":
        toast.success(`Suggested quote: $${action.data?.amount}`);
        break;
      default:
        toast.info(action.label || "Action noted");
    }
    setOpen(false);
  }, [navigate]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (!canPerformAction("ai_send", 1500)) return;

    const safeText = text.trim().slice(0, 2000);
    const userMsg: Msg = { role: "user", content: safeText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Please sign in to use the assistant." }]);
        setIsStreaming(false);
        return;
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: newMessages.slice(-20).map(m => ({ role: m.role, content: m.content.slice(0, 2000) })),
            mode: activeMode,
            pageContext: pageContext(),
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) toast.error("Rate limited. Please wait a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errData.error || "Something went wrong."}` }]);
        setIsStreaming(false);
        return;
      }

      if (!resp.body) {
        setMessages(prev => [...prev, { role: "assistant", content: "No response received." }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error("AI assistant error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    }

    setIsStreaming(false);
  }, [messages, isStreaming, activeMode, pageContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Open AI Assistant"
        >
          <Sparkles size={20} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] rounded-2xl bg-card border shadow-elevated flex flex-col animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-surface-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles size={14} className="text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">ProlificHire AI</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  {activeMode === "operator" ? <Wrench size={9} /> : <Briefcase size={9} />}
                  {activeMode === "operator" ? "Do Work" : "Hire Work"} · Context-aware
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground text-center mb-1">
                  {activeMode === "operator" 
                    ? "I know your equipment, pricing, and jobs." 
                    : "I know your fields, farms, and work history."}
                </p>
                <p className="text-[11px] text-muted-foreground/70 text-center mb-4">
                  Ask me anything — I'll give you real answers with actions.
                </p>
                <div className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-foreground/80 transition-colors active:scale-[0.98] flex items-center gap-2"
                    >
                      <ChevronRight size={10} className="text-primary shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              if (msg.role === "user") {
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed bg-primary text-primary-foreground rounded-br-sm">
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const { text, actions } = parseActions(msg.content);
              return (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[90%] space-y-2">
                    {text && (
                      <div className="rounded-xl px-3 py-2 text-sm leading-relaxed bg-surface-2 text-foreground rounded-bl-sm">
                        <p className="whitespace-pre-wrap break-words">{text}</p>
                      </div>
                    )}
                    {actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {actions.map((action, ai) => (
                          <Button
                            key={ai}
                            size="sm"
                            variant={action.type === "navigate" || action.type === "complete_setup" ? "outline" : "default"}
                            className="h-7 text-[11px] gap-1 rounded-lg"
                            onClick={() => handleAction(action)}
                          >
                            {action.type === "suggest_quote" && <DollarSign size={11} />}
                            {action.type === "find_jobs" && <MapPin size={11} />}
                            {action.type === "create_job_draft" && <Plus size={11} />}
                            {action.type === "navigate" && <ArrowRight size={11} />}
                            {action.type === "complete_setup" && <Check size={11} />}
                            {action.label || action.type.replace(/_/g, " ")}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-surface-2 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t px-3 py-2.5 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={activeMode === "operator" ? "Quote help, job analysis, route planning…" : "Create jobs, estimate pricing, find operators…"}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isStreaming}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8 shrink-0" disabled={!input.trim() || isStreaming}>
              <Send size={15} />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
