// supabase/functions/expire-subscriptions/index.ts
// Agora Livre — Cron job: revoke premium when subscription expires
//
// Deploy: supabase functions deploy expire-subscriptions
// Schedule in Supabase Dashboard > Edge Functions > Schedules
//   Cron: "0 2 * * *"  (runs every day at 2am UTC)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date().toISOString();

  // 1. Find expired active subscriptions
  const { data: expired, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')
    .lt('expires_at', now);

  if (error) {
    console.error('[expire-subscriptions] Query failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ updated: 0 }), { status: 200 });
  }

  const userIds = expired.map(r => r.user_id);

  // 2. Mark subscriptions as expired
  await supabase
    .from('subscriptions')
    .update({ status: 'expired' })
    .in('user_id', userIds)
    .lt('expires_at', now);

  // 3. Revoke premium on profiles
  await supabase
    .from('profiles')
    .update({ is_premium: false })
    .in('id', userIds);

  console.log(`[expire-subscriptions] Revoked ${userIds.length} subscription(s)`);

  return new Response(
    JSON.stringify({ updated: userIds.length, userIds }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  );
});
