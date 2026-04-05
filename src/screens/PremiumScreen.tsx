// src/screens/PremiumScreen.tsx
// Agora Livre — Premium Screen + Google Play Billing
// Follows Google Play Billing policy: no external payment, no price outside GP

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as RNIap from 'react-native-iap';
import { GhostButton, PrimaryButton } from '../components';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import type { PlanType } from '../types';

// ── SKUs must match exactly what's configured in Google Play Console ──
const SKUS: Record<PlanType, string> = {
  monthly: 'agora_livre_premium_monthly',
  annual:  'agora_livre_premium_annual',
};

const FEATURES = [
  { icon: '🧠', titleKey: 'feat1Title', subKey: 'feat1Sub' },
  { icon: '⚠️', titleKey: 'feat2Title', subKey: 'feat2Sub' },
  { icon: '📊', titleKey: 'feat3Title', subKey: 'feat3Sub' },
  { icon: '🎯', titleKey: 'feat4Title', subKey: 'feat4Sub' },
] as const;

export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [products,     setProducts]     = useState<RNIap.Subscription[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [isPremium,    setIsPremium]    = useState(false);

  // ── Init IAP connection & fetch products ───────────────────────────
  useEffect(() => {
    let purchaseUpdateSub: any;
    let purchaseErrorSub: any;

    async function init() {
      try {
        await RNIap.initConnection();

        // Fetch subscriptions from Play Store
        const subs = await RNIap.getSubscriptions({ skus: Object.values(SKUS) });
        setProducts(subs);

        // Listen for purchase updates
        purchaseUpdateSub = RNIap.purchaseUpdatedListener(async (purchase) => {
          await handlePurchase(purchase);
        });

        purchaseErrorSub = RNIap.purchaseErrorListener((error) => {
          if ((error as any).code !== 'E_USER_CANCELLED') {
            Alert.alert('Erro', 'Não foi possível completar a compra. Tente novamente.');
          }
          setLoading(false);
        });

        // Check current premium status
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_premium')
            .eq('id', user.id)
            .single();
          setIsPremium(profile?.is_premium ?? false);
        }
      } catch (e) {
        console.error('[IAP] Init failed:', e);
      }
    }

    init();

    return () => {
      purchaseUpdateSub?.remove?.();
      purchaseErrorSub?.remove?.();
      RNIap.endConnection();
    };
  }, []);

  // ── Handle completed purchase ──────────────────────────────────────
  async function handlePurchase(purchase: RNIap.SubscriptionPurchase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // 1. Acknowledge the purchase (REQUIRED by Google Play)
      if (Platform.OS === 'android' && purchase.purchaseToken) {
        await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
      }

      // 2. Validate server-side via Supabase Edge Function
      const { error } = await supabase.functions.invoke('validate-purchase', {
        body: {
          userId:        user.id,
          productId:     purchase.productId,
          purchaseToken: purchase.purchaseToken,
          platform:      Platform.OS,
        },
      });

      if (error) throw error;

      // 3. Finish the transaction
      await RNIap.finishTransaction({ purchase, isConsumable: false });

      setIsPremium(true);
      setLoading(false);
      Alert.alert('✅ Bem-vindo ao Premium!', 'Seus insights estão desbloqueados.');
    } catch (e) {
      console.error('[IAP] Purchase handling failed:', e);
      setLoading(false);
      Alert.alert('Erro', 'Compra recebida, mas houve um problema. Entre em contato com o suporte.');
    }
  }

  // ── Subscribe ──────────────────────────────────────────────────────
  async function handleSubscribe() {
    setLoading(true);
    try {
      await RNIap.requestSubscription({ sku: SKUS[selectedPlan] });
      // Result handled by purchaseUpdatedListener above
    } catch (e: any) {
      if (e.code !== 'E_USER_CANCELLED') {
        Alert.alert('Erro', 'Não foi possível iniciar a compra.');
      }
      setLoading(false);
    }
  }

  // ── Restore purchases ──────────────────────────────────────────────
  async function handleRestore() {
    setLoading(true);
    try {
      const purchases = await RNIap.getAvailablePurchases();
      const active    = purchases.find(p => Object.values(SKUS).includes(p.productId));
      if (active) {
        await handlePurchase(active as RNIap.SubscriptionPurchase);
      } else {
        Alert.alert('Nenhuma compra encontrada', 'Nenhuma assinatura ativa foi encontrada nessa conta.');
        setLoading(false);
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível restaurar compras.');
      setLoading(false);
    }
  }

  // ── Price helper ───────────────────────────────────────────────────
  function priceFor(plan: PlanType): string {
    const product = products.find(p => p.productId === SKUS[plan]);
    // Use localizedPrice from Play Store when available
    return product?.localizedPrice ?? t(plan === 'monthly' ? 'monthlyPrice' : 'annualPrice');
  }

  if (isPremium) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.alreadyPremium}>
          <Text style={styles.premiumEmoji}>⭐</Text>
          <Text style={styles.premiumTitle}>Você já é Premium!</Text>
          <Text style={styles.premiumSub}>Todos os insights estão desbloqueados para você.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⭐</Text>
          <Text style={styles.heroTitle}>{t('premTitle')}</Text>
          <Text style={styles.heroSub}>{t('premSub')}</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map(f => (
            <View key={f.titleKey} style={styles.featRow}>
              <View style={styles.featIcon}>
                <Text style={{ fontSize: 16 }}>{f.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featTitle}>{t(f.titleKey as any)}</Text>
                <Text style={styles.featSub}>{t(f.subKey as any)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          {(['monthly', 'annual'] as PlanType[]).map(plan => {
            const isSelected = selectedPlan === plan;
            const isAnnual   = plan === 'annual';
            return (
              <TouchableOpacity
                key={plan}
                onPress={() => setSelectedPlan(plan)}
                activeOpacity={0.75}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
              >
                {isAnnual && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{t('bestValue')}</Text>
                  </View>
                )}
                <Text style={styles.planPeriod}>{t(plan === 'monthly' ? 'monthly' : 'annual')}</Text>
                <Text style={styles.planPrice}>
                  {priceFor(plan)}
                  <Text style={styles.planPricePer}>/{plan === 'monthly' ? 'mês' : 'ano'}</Text>
                </Text>
                {isAnnual && <Text style={styles.planSave}>{t('save')}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <PrimaryButton
          label={loading ? '' : t('subscribeGP')}
          onPress={handleSubscribe}
          loading={loading}
          disabled={loading}
        />

        <GhostButton
          label={t('restorePurchase')}
          onPress={handleRestore}
        />

        {/* Legal note — required by Google Play */}
        <Text style={styles.legalNote}>
          {t('billedByGP')}
          {'\n'}A assinatura renova automaticamente. Cancele a qualquer momento nas configurações da Play Store.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },

  hero: {
    backgroundColor: Colors.blue,
    borderRadius:    Radius.xl,
    padding:         Spacing['2xl'],
    alignItems:      'center',
    gap:             Spacing.sm,
  },
  heroIcon:  { fontSize: 40 },
  heroTitle: { fontFamily: 'Manrope', fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.white, textAlign: 'center' },
  heroSub:   { fontSize: FontSize.sm, color: Colors.blueLight, textAlign: 'center', lineHeight: 18 },

  features: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    gap:             0,
  },
  featRow: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderColor:     Colors.surface,
  },
  featIcon: {
    width: 32, height: 32, borderRadius: Radius.sm,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  featSub:   { fontSize: FontSize.sm, color: Colors.faint, marginTop: 2 },

  planRow: { flexDirection: 'row', gap: Spacing.md },
  planCard: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    alignItems:      'center',
    borderWidth:     2,
    borderColor:     Colors.border,
    position:        'relative',
    gap:             Spacing.xs,
  },
  planCardSelected: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blue,
    ...Shadow.button,
  },
  popularBadge: {
    position:        'absolute',
    top:             -12,
    backgroundColor: Colors.blue,
    borderRadius:    Radius.full,
    paddingVertical:   3,
    paddingHorizontal: Spacing.sm,
  },
  popularBadgeText: { fontSize: 9, fontWeight: FontWeight.extrabold, color: Colors.white, letterSpacing: 0.5 },
  planPeriod: { fontSize: FontSize.xs, color: Colors.faint, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  planPrice:  { fontFamily: 'Manrope', fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  planPricePer: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.faint },
  planSave:   { fontSize: FontSize.xs, color: Colors.greenText, fontWeight: FontWeight.bold },

  legalNote: {
    fontSize:   FontSize.xs,
    color:      Colors.placeholder,
    textAlign:  'center',
    lineHeight: 18,
  },

  alreadyPremium: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },
  premiumEmoji:   { fontSize: 64 },
  premiumTitle:   { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  premiumSub:     { fontSize: FontSize.md, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
});
