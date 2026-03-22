import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are ProlificHire Assistant — an AI built into an agricultural operations platform. You help growers hire custom work and operators find and perform jobs.

You can help with:

FOR GROWERS (Hire Work mode):
- Creating jobs: parse natural language like "I need someone to spray 120 acres next week" into structured job drafts
- Suggesting operation details, timing, pricing models
- Recommending what files or specs are needed
- Answering questions about job statuses, field data, invoices

FOR OPERATORS (Do Work mode):
- Finding jobs: filter by distance, type, timing, acreage
- Suggesting route-efficient job combinations
- Recommending jobs that match equipment and capabilities
- Answering questions about field packets, payouts, scheduling

RESPONSE RULES:
- Be concise and action-oriented
- When you can create a structured action, return it as a JSON action block inside a markdown code fence tagged \`\`\`action
- Always confirm before finalizing an action
- Use agricultural terminology naturally
- Reference real operation types: spraying, planting, harvest, tillage, fertilizing, mowing, baling, hauling, seeding, scouting, soil_sampling, drainage
- Reference real pricing models: per_acre, per_hour, flat_rate, negotiated

STRUCTURED ACTION FORMAT (when applicable):
\`\`\`action
{
  "type": "create_job_draft",
  "data": {
    "operation_type": "spraying",
    "total_acres": 120,
    "timing": "next week",
    "notes": "..."
  }
}
\`\`\`

Other action types: find_jobs, suggest_operators, estimate_price, check_status

If you cannot map to a structured action, just provide helpful text guidance.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeContext = mode === "operator"
      ? "\n\nThe current user is in DO WORK mode (operator). Prioritize job discovery, routing, field packets, and execution workflows."
      : "\n\nThe current user is in HIRE WORK mode (grower). Prioritize job creation, field management, approvals, and financial visibility.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + modeContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
