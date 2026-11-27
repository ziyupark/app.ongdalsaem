// 9.3 Deactivate account — deletes every account deactivated more than 30 days ago (profiles.deactivated_at),
// the same way as delete-account. Called once a day by pg_cron (supabase/migrations/20261201000000_account_deactivation.sql)
// with the service-role key; anything else is refused.
//
// Deploy:  supabase functions deploy purge-deactivated-accounts
import { admin, json } from "../_shared/common.ts";
import { deleteUser } from "../_shared/deleteUser.ts";

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRACE_DAYS = 30;
const BATCH = 200;

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${SERVICE_KEY}`) return new Response("forbidden", { status: 403 });

  const before = new Date(Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("profiles").select("id").not("deactivated_at", "is", null).lt("deactivated_at", before).limit(BATCH);
  if (error) {
    console.error("[purge-deactivated] select", error.message);
    return json({ error: "select_failed" }, 500);
  }

  let deleted = 0;
  let failed = 0;
  for (const row of data ?? []) {
    if ((await deleteUser(row.id)) === "deleted") deleted++;
    else failed++;
  }
  return json({ deleted, failed });
});
