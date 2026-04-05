// src/screens/HomeScreen.tsx
// Agora Livre — Home Screen

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { Card, CrisisButton, InsightBox } from '../components';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import type { HomeStackParamList, WeeklyProgress } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const DAYS_SHORT = ['S','T','Q','Q','S','S','D'];

export default function HomeScreen() {
  const nav = useNavigation<Nav>();

  const [soberDays,   setSoberDays]   = useState(0);
  const [bestStreak,  setBestStreak]  = useState(0);
  const [weekData,    setWeekData]    = useState<WeeklyProgress[]>([]);
  const [refreshing,  setRefreshing]  = useState(false);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile for sober_since
    const { data: profile } = await supabase
      .from('profiles')
      .select('sober_since')
      .eq('id', user.id)
      .single();

    if (profile?.sober_since) {
      const days = Math.floor(
        (Date.now() - new Date(profile.sober_since).getTime()) / 86_400_000
      );
      setSoberDays(Math.max(0, days));
    }

    // Fetch last 7 check-ins
    const since = new Date();
    since.setDate(since.getDate() - 6);

    const { data: checkins } = await supabase
      .from('checkins')
      .select('date, urge_intensity')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date');

    // Build 7-day array
    const week: WeeklyProgress[] = Array.from({ length: 7 }, (_, i) => {
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
    setWeekData(week);
  }

  useEffect(() => { loadData(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }

  function dayColor(w: WeeklyProgress): string {
    if (!w.checkedIn)    return Colors.surface;
    if (w.hadRelapse)    return Colors.redSoft;
    if (w.urgeLevel > 6) return Colors.yellowSoft;
    return Colors.greenLight;
  }

  function dayTextColor(w: WeeklyProgress): string {
    if (!w.checkedIn)    return Colors.placeholder;
    if (w.hadRelapse)    return Colors.red;
    if (w.urgeLevel > 6) return Colors.yellowText;
    return Colors.greenText;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            <Text style={styles.welcome}>{t('welcome')}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AL</Text>
          </View>
        </View>

        {/* Counter Card */}
        <View style={styles.counterCard}>
          <Text style={styles.counterEyebrow}>✦ {t('insight')}</Text>
          <Text style={styles.counterNumber}>{soberDays}</Text>
          <Text style={styles.counterUnit}>{t('daysSober')}</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>
              {t('streakLabel', { days: String(bestStreak || soberDays) })}
            </Text>
          </View>
        </View>

        {/* Crisis Button */}
        <View style={styles.crisisWrap}>
          <CrisisButton
            label={t('crisisBtn')}
            onPress={() => nav.navigate('CrisisMode')}
          />
        </View>

        {/* Mini Cards */}
        <View style={styles.miniRow}>
          <TouchableOpacity
            style={styles.miniCard}
            onPress={() => {/* navigate to CheckIn tab */}}
            activeOpacity={0.7}
          >
            <View style={[styles.miniIcon, { backgroundColor: Colors.blueSoft }]}>
              <Text style={styles.miniIconEmoji}>📋</Text>
            </View>
            <Text style={styles.miniTitle}>{t('checkInCard')}</Text>
            <Text style={styles.miniSub}>{t('checkInSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.miniCard}
            onPress={() => {/* navigate to Progress tab */}}
            activeOpacity={0.7}
          >
            <View style={[styles.miniIcon, { backgroundColor: Colors.greenLight }]}>
              <Text style={styles.miniIconEmoji}>📈</Text>
            </View>
            <Text style={styles.miniTitle}>{t('progressCard')}</Text>
            <Text style={styles.miniSub}>{t('progressSub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly dots */}
        <Card style={styles.weekCard}>
          <Text style={styles.weekLabel}>{t('thisWeek')}</Text>
          <View style={styles.weekRow}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = d.toISOString().split('T')[0];
              const isToday = dateStr === today;
              const w       = weekData[i];
              return (
                <View key={i} style={styles.dayCol}>
                  <Text style={styles.dayLetter}>{DAYS_SHORT[i]}</Text>
                  <View style={[
                    styles.dayBubble,
                    isToday
                      ? { backgroundColor: Colors.blue }
                      : { backgroundColor: w ? dayColor(w) : Colors.surface },
                  ]}>
                    <Text style={[
                      styles.dayBubbleText,
                      isToday
                        ? { color: Colors.white }
                        : { color: w ? dayTextColor(w) : Colors.placeholder },
                    ]}>
                      {isToday ? '●' : w?.checkedIn ? '✓' : '·'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Insight strip */}
        <InsightBox tag={t('insight')} text={t('insightText')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  greeting: { fontSize: FontSize.base, color: Colors.faint, fontWeight: FontWeight.medium },
  welcome:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: 'Manrope', marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.blueBorder,
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#1D4ED8' },

  counterCard: {
    backgroundColor: Colors.blue,
    borderRadius:    Radius.xl,
    padding:         Spacing['2xl'],
    overflow:        'hidden',
  },
  counterEyebrow: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.blueLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  counterNumber:  { fontFamily: 'Manrope', fontSize: 64, fontWeight: FontWeight.extrabold, color: Colors.white, lineHeight: 68 },
  counterUnit:    { fontSize: FontSize.md, color: Colors.blueBorder, fontWeight: FontWeight.medium, marginTop: 2 },
  counterBadge: {
    alignSelf:       'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius:    Radius.full,
    paddingVertical:   4,
    paddingHorizontal: Spacing.md,
    marginTop:       Spacing.md,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.15)',
  },
  counterBadgeText: { fontSize: FontSize.sm, color: '#DBEAFE', fontWeight: FontWeight.semibold },

  crisisWrap: { marginTop: 4 },

  miniRow: { flexDirection: 'row', gap: Spacing.sm },
  miniCard: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  miniIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  miniIconEmoji: { fontSize: 16 },
  miniTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.text },
  miniSub:   { fontSize: FontSize.xs, color: Colors.faint, marginTop: 2, fontWeight: FontWeight.medium },

  weekCard:  { gap: Spacing.sm },
  weekLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.faint, letterSpacing: 0.7, textTransform: 'uppercase' },
  weekRow:   { flexDirection: 'row', gap: 4 },
  dayCol:    { flex: 1, alignItems: 'center', gap: 4 },
  dayLetter: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.placeholder },
  dayBubble: { width: 30, height: 30, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  dayBubbleText: { fontSize: 9, fontWeight: FontWeight.bold },
});
