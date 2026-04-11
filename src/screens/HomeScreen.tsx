// src/screens/HomeScreen.tsx
// Agora Livre — Home Screen

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, CrisisButton, EditorialCard, InsightBox } from '../components';
import { t } from '../i18n';
import { getPatternInsights, type PatternInsight } from '../lib/insights';
import { cancelAllNotifications, requestNotificationPermissions, scheduleSmartReminders } from '../lib/notifications';
import { deleteAccount, signOut, supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import type { HomeStackParamList, WeeklyProgress } from '../types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

const DAYS_SHORT = ['S','T','Q','Q','S','S','D'];
const STORAGE_REMINDERS = '@agora_livre_reminders';

export default function HomeScreen() {
  const nav = useNavigation<Nav>();

  const [soberDays,       setSoberDays]       = useState(0);
  const [bestStreak,      setBestStreak]      = useState(0);
  const [weekData,        setWeekData]        = useState<WeeklyProgress[]>([]);
  const [refreshing,       setRefreshing]       = useState(false);
  const [settingsVisible,  setSettingsVisible]  = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [recentInvestment, setRecentInvestment] = useState<string | null>(null);
  const [riskPattern,      setRiskPattern]      = useState<PatternInsight | null>(null);

  async function loadData() {
    // Auth & Basic Data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('sober_since').eq('id', user.id).single();
    if (profile?.sober_since) {
      const days = Math.floor((Date.now() - new Date(profile.sober_since).getTime()) / 86_400_000);
      setSoberDays(Math.max(0, days));
    }

    // Recent Investment (Conversão de Energia)
    const { data: lastCheckin } = await supabase
      .from('checkins')
      .select('time_investment')
      .eq('user_id', user.id)
      .not('time_investment', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .single();
    
    setRecentInvestment(lastCheckin?.time_investment ?? null);

    // AI Patterns (IA Preditiva)
    const pattern = await getPatternInsights();
    setRiskPattern(pattern.riskDay ? pattern : null);

    const since = new Date();
    since.setDate(since.getDate() - 6);
    const { data: checkins } = await supabase.from('checkins').select('date, urge_intensity').eq('user_id', user.id).gte('date', since.toISOString().split('T')[0]).order('date');

    const week: WeeklyProgress[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const ci      = checkins?.find(c => c.date === dateStr);
      return { date: dateStr, hadRelapse: false, urgeLevel: ci?.urge_intensity ?? 0, checkedIn: !!ci };
    });
    setWeekData(week);

    // Initial load of reminder settings
    const saved = await AsyncStorage.getItem(STORAGE_REMINDERS);
    setRemindersEnabled(saved === 'true');
  }

  useEffect(() => { loadData(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }

  const toggleReminders = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleSmartReminders();
        setRemindersEnabled(true);
        await AsyncStorage.setItem(STORAGE_REMINDERS, 'true');
      } else {
        Alert.alert("Permissão necessária", "Ative as notificações nas configurações do seu celular para receber os lembretes.");
      }
    } else {
      await cancelAllNotifications();
      setRemindersEnabled(false);
      await AsyncStorage.setItem(STORAGE_REMINDERS, 'false');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('deleteConfirmTitle'),
      t('deleteConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('deleteBtn'), 
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            setSettingsVisible(false);
          }
        },
      ]
    );
  };

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
        {/* Header content ... no changes needed to visual header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            <Text style={styles.welcome}>{t('welcome')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatar} 
            onPress={() => setSettingsVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.avatarText}>AL</Text>
          </TouchableOpacity>
        </View>

        {/* Counter Content ... no changes */}
        <LinearGradient
          colors={Colors.gradientBlue}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.counterCard}
        >
          <Text style={styles.counterEyebrow}>✦ {t('insight')}</Text>
          <Text style={styles.counterNumber}>{soberDays}</Text>
          <Text style={styles.counterUnit}>{t('daysSober')}</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterBadgeText}>
              {t('streakLabel', { days: String(bestStreak || soberDays) })}
            </Text>
          </View>
        </LinearGradient>

        {/* Rest of Home content ... */}
        <View style={styles.crisisWrap}>
          <CrisisButton
            label={t('crisisBtn')}
            onPress={() => nav.navigate('CrisisMode')}
          />
        </View>

        <View style={styles.miniRow}>
          <TouchableOpacity style={styles.miniCard} onPress={() => {}} activeOpacity={0.7}>
            <View style={[styles.miniIcon, { backgroundColor: Colors.blueSoft }]}>
              <Text style={styles.miniIconEmoji}>📋</Text>
            </View>
            <Text style={styles.miniTitle}>{t('checkInCard')}</Text>
            <Text style={styles.miniSub}>{t('checkInSub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniCard} onPress={() => {}} activeOpacity={0.7}>
            <View style={[styles.miniIcon, { backgroundColor: Colors.greenLight }]}>
              <Text style={styles.miniIconEmoji}>📈</Text>
            </View>
            <Text style={styles.miniTitle}>{t('progressCard')}</Text>
            <Text style={styles.miniSub}>{t('progressSub')}</Text>
          </TouchableOpacity>
        </View>

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
                    isToday ? { backgroundColor: Colors.blue } : { backgroundColor: w ? dayColor(w) : Colors.surface },
                  ]}>
                    <Text style={[
                      styles.dayBubbleText,
                      isToday ? { color: Colors.white } : { color: w ? dayTextColor(w) : Colors.placeholder },
                    ]}>
                      {isToday ? '●' : w?.checkedIn ? '✓' : '·'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Predictive AI Alert */}
        {riskPattern && (
          <EditorialCard 
            image="https://images.unsplash.com/photo-1516339901600-2e1a6298ed34?q=80&w=500"
            style={styles.editorialSpace}
          >
            <Text style={styles.editorialTag}>⚠️ ALERTA DE PADRÃO</Text>
            <Text style={styles.editorialTitle}>
              Com base no seu histórico, as {riskPattern.riskDay}s à {riskPattern.riskTime} costumam ser desafiadoras.
            </Text>
            <Text style={styles.editorialSub}>Preparamos uma meditação guiada para você.</Text>
          </EditorialCard>
        )}

        {/* Energy Conversion Insight */}
        {recentInvestment && (
          <EditorialCard 
            image="https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=500"
            style={styles.editorialSpace}
          >
            <Text style={styles.editorialTag}>✨ CONVERSÃO DE ENERGIA</Text>
            <Text style={styles.editorialTitle}>
              Recuperado: {recentInvestment}
            </Text>
            <Text style={styles.editorialSub}>Isso é o que você ganha ao escolher a sobriedade hoje.</Text>
          </EditorialCard>
        )}

        <InsightBox tag={t('insight')} text={t('insightText')} />


        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            O Agora Livre é um apoio motivacional e não substitui consulta médica profissional.
          </Text>
        </View>
      </ScrollView>

      {/* Settings Modal - Updated with Notifications Toggle */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setSettingsVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settingsTitle')}</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {/* Smart Reminders Toggle */}
              <View style={styles.menuItem}>
                <Text style={styles.menuText}>{t('smartReminders')}</Text>
                <Switch 
                  value={remindersEnabled}
                  onValueChange={toggleReminders}
                  trackColor={{ false: Colors.border, true: Colors.blueLight }}
                  thumbColor={remindersEnabled ? Colors.blue : Colors.faint}
                />
              </View>

              <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://github.com/RafaelDePaula333/agora-livre')}>
                <Text style={styles.menuText}>{t('privacyPolicy')}</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://play.google.com/store/account/subscriptions')}>
                <Text style={styles.menuText}>{t('navPremium')} (Google Play)</Text>
                <Text style={styles.menuArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={signOut}>
                <Text style={[styles.menuText, { color: Colors.red }]}>{t('logout')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
              <Text style={styles.deleteBtnText}>{t('deleteAccount')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom:   Spacing.sm,
  },
  greeting: { fontSize: FontSize.base, color: Colors.faint, fontWeight: FontWeight.medium },
  welcome:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, fontFamily: 'Manrope', marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.blueBorder,
    ...Shadow.card,
  },
  avatarText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.blue },

  counterCard: {
    borderRadius:    Radius['2xl'],
    padding:         Spacing['3xl'],
    ...Shadow.premium,
  },
  counterEyebrow: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  counterNumber:  { fontFamily: 'Manrope', fontSize: 72, fontWeight: FontWeight.extrabold, color: Colors.white, lineHeight: 76 },
  counterUnit:    { fontSize: FontSize.md, color: 'rgba(255,255,255,0.6)', fontWeight: FontWeight.medium, marginTop: 2 },
  counterBadge: {
    alignSelf:       'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    Radius.full,
    paddingVertical:   6,
    paddingHorizontal: Spacing.md,
    marginTop:       Spacing.xl,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
  },
  counterBadgeText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: FontWeight.semibold },
  editorialSpace: { marginBottom: Spacing.sm },
  editorialTag: { fontSize: 10, fontWeight: FontWeight.extrabold, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 4 },
  editorialTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white, lineHeight: 22 },
  editorialSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: FontWeight.medium },

  crisisWrap: { 
    marginTop: 4,
    ...Shadow.crisisButton,
  },

  miniRow: { flexDirection: 'row', gap: Spacing.md },
  miniCard: {
    flex:            1,
    backgroundColor: Colors.card,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.card,
  },
  miniIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  miniIconEmoji: { fontSize: 20 },
  miniTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  miniSub:   { fontSize: FontSize.xs, color: Colors.faint, marginTop: 4, fontWeight: FontWeight.medium, lineHeight: 14 },

  weekCard:  { gap: Spacing.md, padding: Spacing.lg, borderRadius: Radius.lg },
  weekLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.faint, letterSpacing: 0.7, textTransform: 'uppercase' },
  weekRow:   { flexDirection: 'row', gap: 6 },
  dayCol:    { flex: 1, alignItems: 'center', gap: 6 },
  dayLetter: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.placeholder },
  dayBubble: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', ...Shadow.card },
  dayBubbleText: { fontSize: 10, fontWeight: FontWeight.bold },

  footer: {
    marginTop:    Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems:    'center',
  },
  disclaimer: {
    fontSize:   FontSize.xs,
    color:      Colors.placeholder,
    textAlign:  'center',
    lineHeight: 16,
    opacity:    0.8,
  },

  // Modal styles
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor:      Colors.card,
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding:              Spacing.xl,
    paddingBottom:        40,
    ...Shadow.premium,
  },
  modalHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing.xl,
  },
  modalTitle: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
  },
  closeBtn: {
    fontSize: 20,
    color:    Colors.faint,
    padding:  Spacing.xs,
  },
  menuList: {
    backgroundColor: Colors.bg,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    marginBottom:    Spacing.xl,
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  menuItem: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    padding:           Spacing.lg,
    backgroundColor:   Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuText: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.text,
  },
  menuArrow: {
    fontSize: 14,
    color:    Colors.placeholder,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     'rgba(239, 68, 68, 0.2)',
  },
  deleteBtnText: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.bold,
    color:      Colors.red,
  },
});


