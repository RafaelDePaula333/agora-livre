// src/screens/ProgressScreen.tsx
// Agora Livre — Progress Screen

import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PrimaryButton } from '../components';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import type { UserInsights, WeeklyProgress } from '../types';

export default function ProgressScreen() {
  const [insights,    setInsights]    = useState<UserInsights | null>(null);
  const [week,        setWeek]        = useState<WeeklyProgress[]>([]);
  const [isPremium,   setIsPremium]   = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('sober_since, is_premium, daily_cost, daily_time_waste')
      .eq('id', user.id)
      .single();

    setIsPremium(profile?.is_premium ?? false);

    const soberDays = profile?.sober_since
      ? Math.floor((Date.now() - new Date(profile.sober_since).getTime()) / 86_400_000)
      : 0;

    // Last 7 checkins
    const since7 = new Date();
    since7.setDate(since7.getDate() - 6);
    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, urge_intensity, mood')
      .eq('user_id', user.id)
      .gte('date', since7.toISOString().split('T')[0])
      .order('date');

    const weekData: WeeklyProgress[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const ci      = checkins?.find(c => c.date === dateStr);
      return {
        date:       dateStr,
        hadRelapse: false,
        urgeLevel:  ci?.urge_intensity ?? 0,
        checkedIn:  !!ci,
      };
    });
    setWeek(weekData);

    // Crisis sessions (last 30 days)
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const { count: crisisCount } = await supabase
      .from('crisis_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('urge_decreased', true)
      .gte('started_at', since30.toISOString());

    // Relapses (last 30 days vs previous 30 days)
    const { count: recentRelapses } = await supabase
      .from('relapses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('occurred_at', since30.toISOString());

    const prev30Start = new Date();
    prev30Start.setDate(prev30Start.getDate() - 60);
    const { count: prevRelapses } = await supabase
      .from('relapses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('occurred_at', prev30Start.toISOString())
      .lt('occurred_at', since30.toISOString());

    const relapseReduction = prevRelapses && prevRelapses > 0
      ? Math.round(((prevRelapses - (recentRelapses ?? 0)) / prevRelapses) * 100)
      : 0;

    setInsights({
      currentStreak:    soberDays,
      longestStreak:    soberDays, // TODO: calculate from relapses
      crisesAvoided:    crisisCount ?? 0,
      relapseReduction: Math.max(0, relapseReduction),
      riskDay:          'quinta-feira',      // TODO: compute from crisis_sessions
      riskTime:         'noite',
      topTrigger:       'anxiety',
      totalSavings:     soberDays * (profile?.daily_cost ?? 0),
      totalTimeSaved:   soberDays * (profile?.daily_time_waste ?? 0),
    });
  }

  useEffect(() => { loadData(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }

  // Bar height 0–1 for weekly chart
  const maxUrge = Math.max(...week.map(w => w.urgeLevel), 1);

  function barColor(w: WeeklyProgress) {
    if (!w.checkedIn)    return Colors.surface;
    if (w.urgeLevel > 6) return Colors.redSoft;
    if (w.urgeLevel > 3) return Colors.blueBorder;
    return Colors.greenBorder;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.pageTitle}>{t('navProgress')}</Text>

        {/* Stat row */}
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{insights?.currentStreak ?? 0}</Text>
            <Text style={styles.statLbl}>{t('soberDays')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.greenText }]}>
              {insights?.relapseReduction ? `-${insights.relapseReduction}%` : '—'}
            </Text>
            <Text style={styles.statLbl}>{t('relapses')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: Colors.blue }]}>
              {insights?.crisesAvoided ?? 0}
            </Text>
            <Text style={styles.statLbl}>{t('crisesAvoided')}</Text>
          </View>
        </View>

        {/* Calculator Results */}
        <Card style={styles.impactCard}>
          <Text style={styles.chartTitle}>IMPACTO ACUMULADO</Text>
          <View style={styles.impactRow}>
            <View style={styles.impactItem}>
              <Text style={styles.impactNum}>R$ {insights?.totalSavings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) ?? '0,00'}</Text>
              <Text style={styles.impactLbl}>Economizados</Text>
            </View>
            <View style={[styles.impactItem, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
              <Text style={styles.impactNum}>{Math.floor((insights?.totalTimeSaved ?? 0) / 60)}h { (insights?.totalTimeSaved ?? 0) % 60}m</Text>
              <Text style={styles.impactLbl}>Tempo Recobrado</Text>
            </View>
          </View>
        </Card>


        {/* Weekly bar chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t('chartTitle')}</Text>
          <View style={styles.chartWrap}>
            {week.map((w, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const label = d.toLocaleDateString('pt-BR', { weekday: 'narrow' });
              const pct   = w.checkedIn ? (w.urgeLevel / maxUrge) : 0.05;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.bar,
                      { height: `${Math.max(pct * 100, 5)}%`, backgroundColor: barColor(w) },
                    ]} />
                  </View>
                  <Text style={styles.barLbl}>{label}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.greenBorder }]} /><Text style={styles.legendTxt}>Baixo</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.blueBorder  }]} /><Text style={styles.legendTxt}>Médio</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.redSoft    }]} /><Text style={styles.legendTxt}>Alto</Text></View>
          </View>
        </Card>

        {/* Streak card */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.streakTitle}>Maior sequência</Text>
              <Text style={styles.streakNum}>{insights?.longestStreak ?? 0} dias</Text>
            </View>
          </View>
        </Card>

        {/* Premium insights — locked or unlocked */}
        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>{t('smartInsights')}</Text>
            {!isPremium && (
              <View style={styles.premiumTag}>
                <Text style={styles.premiumTagText}>⭐ Premium</Text>
              </View>
            )}
          </View>

          {isPremium ? (
            /* UNLOCKED */
            <View style={styles.insightList}>
              {insights?.riskDay && (
                <InsightRow
                  icon="🕐"
                  tag={t('patternLabel')}
                  text={`${insights.riskDay} à ${insights.riskTime ?? 'noite'} é seu maior risco.`}
                />
              )}
              <InsightRow
                icon="😰"
                tag={t('triggerLabel')}
                text="Você recai mais quando está ansioso e sozinho."
              />
              <InsightRow
                icon="📅"
                tag="Progresso"
                text={`Você reduziu recaídas em ${insights?.relapseReduction ?? 0}% este mês.`}
              />
            </View>
          ) : (
            /* LOCKED */
            <>
              <View style={{ opacity: 0.25 }}>
                <InsightRow icon="🕐" tag={t('patternLabel')} text="Quinta à noite é seu maior risco." />
                <InsightRow icon="😰" tag={t('triggerLabel')} text="Você recai mais quando está ansioso." />
              </View>
              <PrimaryButton
                label={t('unlockInsights')}
                onPress={() => { /* navigate to Premium tab */ }}
                style={{ marginTop: Spacing.md }}
              />
            </>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Inline sub-component ─────────────────────────────────────────────
function InsightRow({ icon, tag, text }: { icon: string; tag: string; text: string }) {
  return (
    <View style={iStyles.row}>
      <Text style={iStyles.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={iStyles.tag}>{tag.toUpperCase()}</Text>
        <Text style={iStyles.text}>{text}</Text>
      </View>
    </View>
  );
}

const iStyles = StyleSheet.create({
  row:  { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderColor: Colors.surface },
  icon: { fontSize: 16, width: 22 },
  tag:  { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.blue, letterSpacing: 0.5 },
  text: { fontSize: FontSize.sm, color: Colors.text, marginTop: 2, lineHeight: 18, fontWeight: FontWeight.medium },
});

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing['4xl'] },

  pageTitle: { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },

  statRow: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  statNum: { fontFamily: 'Manrope', fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  statLbl: { fontSize: FontSize.xs, color: Colors.faint, fontWeight: FontWeight.semibold, marginTop: 2, textAlign: 'center' },

  chartCard:  { gap: Spacing.md },
  chartTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.muted },
  chartWrap:  { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 5 },
  barCol:     { flex: 1, alignItems: 'center', gap: 4 },
  barTrack:   { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar:        { width: '100%', borderRadius: 4, minHeight: 4 },
  barLbl:     { fontSize: 9, color: Colors.placeholder, fontWeight: FontWeight.bold },
  legend:     { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendTxt:  { fontSize: FontSize.xs, color: Colors.faint },

  streakCard: { flexDirection: 'row' },
  streakRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  streakEmoji: { fontSize: 32 },
  streakTitle: { fontSize: FontSize.sm, color: Colors.muted, fontWeight: FontWeight.semibold },
  streakNum:   { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },

  insightCard:   { gap: Spacing.sm },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  premiumTag:    { backgroundColor: Colors.blueSoft, borderRadius: Radius.sm, paddingVertical: 3, paddingHorizontal: Spacing.sm },
  premiumTagText: { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.bold },
  insightList:   { gap: 0 },
  impactCard: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blueBorder,
    gap:             Spacing.sm,
  },
  impactRow: {
    flexDirection: 'row',
    marginTop:     Spacing.sm,
  },
  impactItem: {
    flex:        1,
    alignItems:  'center',
    paddingVertical: Spacing.sm,
  },
  impactNum: {
    fontFamily: 'Manrope',
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.blue,
  },
  impactLbl: {
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    fontWeight: FontWeight.semibold,
    marginTop:  2,
  },
});
