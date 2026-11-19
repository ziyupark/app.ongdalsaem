// Tells the operator about a new report (App Review 1.2: reports are acted on within 24 h).
// Called only by the `reports_notify` trigger (migration 20261121000000) with the service-role key, never by the app.
//
// Deploy:  supabase functions deploy report-alert --no-verify-jwt
// Secrets (set at least one):
//   REPORT_WEBHOOK_URL — a Slack or Discord incoming-webhook URL (the message goes to that channel)
//   RESEND_API_KEY + REPORT_EMAIL_TO (+ optional REPORT_EMAIL_FROM) — an email through Resend
import { admin, cors, json } from "../_shared/common.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const WEBHOOK = Deno.env.get("REPORT_WEBHOOK_URL");
const RESEND = Deno.env.get("RESEND_API_KEY");
const EMAIL_TO = Deno.env.get("REPORT_EMAIL_TO");
const EMAIL_FROM = Deno.env.get("REPORT_EMAIL_FROM") ?? "ongdalsaem reports <onboarding@resend.dev>";

const URGENT = new Set(["sexual", "child_safety"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!SERVICE_KEY || req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) return json({ error: "forbidden" }, 403);

  let id = "";
  try { id = String((await req.json()).report_id ?? ""); } catch { return json({ error: "bad_json" }, 400); }
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "bad_request" }, 400);

  const { data: r, error } = await admin.from("moderation_queue").select("*").eq("report_id", id).maybeSingle();
  if (error || !r) return json({ error: "not_found" }, 404);

  // Only ids, the reason and a short excerpt — no emails or locations in the alert.
  const excerpt = typeof r.reported_text === "string" ? r.reported_text.slice(0, 160) : r.food_name ?? "";
  const subject = `${URGENT.has(r.reason) ? "[URGENT] " : ""}New report · ${r.target} · ${r.reason}`;
  const lines = [
    subject,
    `Due: ${r.due_at}`,
    `Report: ${r.report_id}`,
    `Reported user: ${r.reported_user_id ?? "-"}`,
    r.food_id ? `Dish: ${r.food_id}` : null,
    r.comment_id ? `Comment: ${r.comment_id}` : null,
    r.question_id ? `Question: ${r.question_id}` : null,
    r.answer_id ? `Answer: ${r.answer_id}` : null,
    r.message_id ? `Message: ${r.message_id}` : null,
    excerpt ? `Text: ${excerpt}` : null,
    r.note ? `Note: ${String(r.note).slice(0, 200)}` : null,
    "Review in the Supabase dashboard → moderation_queue, then record the decision in moderation_actions.",
  ].filter(Boolean).join("\n");

  const sent: string[] = [];
  if (WEBHOOK) {
    // Slack reads `text`, Discord reads `content`.
    const res = await fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: lines, content: lines.slice(0, 1900) }) });
    if (res.ok) sent.push("webhook"); else console.error("[report-alert] webhook", res.status);
  }
  if (RESEND && EMAIL_TO) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND}` },
      body: JSON.stringify({ from: EMAIL_FROM, to: EMAIL_TO.split(",").map((s) => s.trim()), subject, text: lines }),
    });
    if (res.ok) sent.push("email"); else console.error("[report-alert] email", res.status);
  }
  if (!sent.length) console.error("[report-alert] no channel configured or all failed", r.report_id);
  return json({ sent });
});
