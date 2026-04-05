// supabase/functions/validate-purchase/index.ts
// Agora Livre — Supabase Edge Function: Validate Google Play Purchase
//
// Deploy: supabase functions deploy validate-purchase
// Set secret: supabase secrets set GOOGLE_SERVICE_ACCOUNT_JSON='...'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9';

// ── Types ─────────────────────────────────────────────────────────────
interface RequestBody {
  userId:        string;
  productId:     string;
  purchaseToken: string;
  platform:      'android' | 'ios';
}

interface PlayStoreSubscription {
  expiryTimeMillis:     string;
  paymentState:         number;   // 1 = payment received
  autoRenewing:         boolean;
  cancelReason?:        number;
}

// ── Plan config ───────────────────────────────────────────────────────
const PACKAGE_NAME = 'com.agoralivre.app'; // Change to your app package

const SKU_TO_PLAN: Record<string, 'monthly' | 'annual'> = {
  'agora_livre_premium_monthly': 'monthly',
  'agora_livre_premium_annual':  'annual',
};

// ── Handler ───────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // ── 1. Parse + validate request ──────────────────────────────────
    const body = await req.json() as RequestBody;
    const { userId, productId, purchaseToken, platform } = body;

    if (!userId || !productId || !purchaseToken) {
      return errorResponse(400, 'Missing required fields');
    }

    if (platform !== 'android') {
      // iOS: implement App Store receipt validation separately
      return errorResponse(400, 'iOS validation not implemented yet');
    }

    const plan = SKU_TO_PLAN[productId];
    if (!plan) {
      return errorResponse(400, `Unknown product: ${productId}`);
    }

    // ── 2. Verify with Google Play Developer API ──────────────────────
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(serviceAccountJson),
      scopes:      ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const client      = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const gpUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

    const gpRes  = await fetch(gpUrl, {
      headers: { Authorization: `Bearer ${accessToken.token}` },
    });

    if (!gpRes.ok) {
      const err = await gpRes.text();
      console.error('[GP] Verification failed:', err);
      return errorResponse(402, 'Purchase verification failed with Google Play');
    }

    const gpData = await gpRes.json() as PlayStoreSubscription;

    // ── 3. Check subscription is active ──────────────────────────────
    const expiryMs   = Number(gpData.expiryTimeMillis);
    const isActive   = expiryMs > Date.now() && gpData.paymentState === 1;

    if (!isActive) {
      return errorResponse(402, 'Subscription is not active');
    }

    // ── 4. Save to Supabase ───────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role bypasses RLS
    );

    const expiresAt = new Date(expiryMs).toISOString();

    // Upsert subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id:        userId,
        plan,
        status:         'active',
        expires_at:     expiresAt,
        play_store_sku: productId,
        purchase_token: purchaseToken,
      }, { onConflict: 'user_id' });

    if (subError) throw subError;

    // Update profile is_premium flag
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', userId);

    if (profileError) throw profileError;

    // ── 5. Return success ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, plan, expiresAt }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('[validate-purchase]', err);
    return errorResponse(500, 'Internal server error');
  }
});

function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { headers: { 'Content-Type': 'application/json' }, status }
  );
}
