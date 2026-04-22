// Sends an in-app notification (via secure RPC) and best-effort email
// when a contract needs the counter-party's signature.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  contractId: string;
  recipientId: string;
  jobId: string;
  jobDisplayId?: string;
  contractTitle?: string;
  expiresAt?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const jwt = auth.replace("Bearer ", "").trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: "missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.contractId || !body.recipientId || !body.jobId) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } },
    );

    // Validate caller is authenticated
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionUrl = `/jobs/${body.jobId}`;
    const title = "Contract awaiting your signature";
    const message = `${body.contractTitle ?? "A contract"} for ${body.jobDisplayId ?? "your job"} is ready to sign. ${
      body.expiresAt ? `Please sign before ${new Date(body.expiresAt).toLocaleDateString()}.` : ""
    }`.trim();

    // Insert notification via SECURITY DEFINER RPC (validates participation)
    const { data: notifId, error: rpcErr } = await supabase.rpc("notify_contract_party", {
      _contract_id: body.contractId,
      _recipient_id: body.recipientId,
      _title: title,
      _message: message,
      _action_url: actionUrl,
      _type: "action",
    });

    if (rpcErr) {
      return new Response(JSON.stringify({ error: rpcErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email is best-effort: skipped if no provider is configured.
    // (Email infra is opt-in for this project; in-app notification is the primary channel.)
    let emailSent = false;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      // Pull recipient email
      const service = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: prof } = await service
        .from("profiles")
        .select("email, first_name")
        .eq("user_id", body.recipientId)
        .maybeSingle();
      if (prof?.email) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ProlificHire <notifications@prolifichire.com>",
              to: prof.email,
              subject: title,
              html: `
                <p>Hi ${prof.first_name || "there"},</p>
                <p>${message}</p>
                <p><a href="https://www.prolifichire.com${actionUrl}">Open job and sign →</a></p>
                <p style="color:#888;font-size:12px;">If you didn't expect this, you can ignore this email.</p>
              `,
            }),
          });
          emailSent = emailRes.ok;
        } catch (_e) {
          // ignore – in-app notification still succeeded
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, notificationId: notifId, emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
