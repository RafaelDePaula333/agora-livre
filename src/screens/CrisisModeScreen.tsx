// src/screens/CrisisModeScreen.tsx
// Agora Livre — Crisis Mode Screen (Full Implementation)

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionCard,
  GhostButton,
  PrimaryButton,
  ProgressBar,
  SelectPill,
} from '../components';
import { t } from '../i18n';
import { CRISIS_ACTIONS, EMOTIONS, useCrisisMode } from '../hooks/useCrisisMode';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';

// Replace with actual userId from your auth store
const MOCK_USER_ID = 'user-123';

export default function CrisisModeScreen() {
  const nav = useNavigation();
  const crisis = useCrisisMode(MOCK_USER_ID);

  // ── Step labels ────────────────────────────────────────────────────
  const stepLabel = {
    trigger: t('step1of3'),
    action:  t('step2of3'),
    timer:   t('step3of3'),
    result:  '',
  }[crisis.step];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { crisis.reset(); nav.goBack(); }}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.crisisBadge}>
          <Text style={styles.crisisBadgeText}>{t('crisisBadge')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: Trigger ──────────────────────────────────────── */}
        {crisis.step === 'trigger' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>{stepLabel}</Text>
            <Text style={styles.bigMsg}>{t('whatHappening')}</Text>

            {/* Emotion pills */}
            <View style={styles.pillsWrap}>
              {EMOTIONS.map(e => (
                <SelectPill
                  key={e.id}
                  label={`${e.icon} ${t(e.labelKey as any)}`}
                  selected={crisis.emotions.includes(e.id)}
                  onPress={() => crisis.toggleEmotion(e.id)}
                />
              ))}
            </View>

            {/* Intensity slider */}
            <View style={styles.sliderWrap}>
              <View style={styles.sliderTop}>
                <Text style={styles.sliderLabel}>{t('intensityLabel')}</Text>
                <Text style={styles.sliderValue}>{crisis.intensity}</Text>
              </View>
              {/* React Native Slider — install @react-native-community/slider */}
              {/* <Slider
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={crisis.intensity}
                onValueChange={crisis.setIntensity}
                minimumTrackTintColor={Colors.blue}
                maximumTrackTintColor={Colors.border}
                thumbTintColor={Colors.blue}
              /> */}
              {/* Placeholder row of dots for now */}
              <View style={styles.dotSlider}>
                {Array.from({ length: 11 }, (_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => crisis.setIntensity(i)}
                    style={[
                      styles.dot,
                      i <= crisis.intensity && { backgroundColor: Colors.blue },
                    ]}
                  />
                ))}
              </View>
            </View>

            <PrimaryButton
              label={t('continueBtn')}
              onPress={crisis.submitTrigger}
              disabled={!crisis.canSubmitTrigger}
            />
          </View>
        )}

        {/* ── STEP 2: Action ───────────────────────────────────────── */}
        {crisis.step === 'action' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>{stepLabel}</Text>
            <Text style={styles.bigMsg}>{t('impulseMsg')}</Text>
            <Text style={styles.subMsg}>{t('chooseAction')}</Text>

            <View style={styles.actionGrid}>
              {CRISIS_ACTIONS.map(a => (
                <ActionCard
                  key={a.id}
                  icon={a.icon}
                  label={t(a.labelKey as any)}
                  selected={crisis.selectedAction === a.id}
                  onPress={() => crisis.selectAction(a.id)}
                />
              ))}
            </View>

            <PrimaryButton
              label={t('startTimer')}
              onPress={crisis.startTimer}
              disabled={!crisis.canStartTimer}
            />
          </View>
        )}

        {/* ── STEP 3: Timer ────────────────────────────────────────── */}
        {crisis.step === 'timer' && (
          <View style={styles.stepWrap}>
            <Text style={styles.stepLabel}>{stepLabel}</Text>
            <Text style={styles.bigMsg}>{t('togetherMsg')}</Text>

            {/* Timer display */}
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{crisis.formattedTime}</Text>
              <Text style={styles.timerLbl}>{t('secondsLeft')}</Text>
              <View style={{ marginTop: Spacing.md }}>
                <ProgressBar progress={crisis.timerProgress} />
              </View>
            </View>

            {/* Personalized message */}
            <View style={styles.personalBox}>
              <Text style={styles.personalText}>
                {crisis.getPersonalizedMessage(['night', 'alone'], crisis.emotions[0])}
              </Text>
            </View>

            <PrimaryButton
              label={t('urgeDecreased')}
              onPress={() => crisis.confirmUrgeDecreased(true)}
              style={{ marginBottom: Spacing.sm }}
            />
            <GhostButton
              label={t('stillUrge')}
              onPress={() => crisis.confirmUrgeDecreased(false)}
            />
          </View>
        )}

        {/* ── STEP 4: Result ───────────────────────────────────────── */}
        {crisis.step === 'result' && (
          <View style={[styles.stepWrap, styles.resultWrap]}>
            <Text style={styles.resultEmoji}>💪</Text>
            <Text style={styles.resultMsg}>{t('overcame')}</Text>
            <Text style={styles.resultSub}>{t('stronger')}</Text>
            <PrimaryButton
              label={t('backHome')}
              onPress={() => { crisis.reset(); nav.goBack(); }}
              style={{ marginTop: Spacing.xl }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.card },
  scroll: { flexGrow: 1, padding: Spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.md,
    padding:       Spacing.lg,
    paddingBottom: 0,
  },
  backBtn: {
    width: 34, height: 34,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 16, color: Colors.muted },
  crisisBadge: {
    backgroundColor: Colors.redSoft,
    borderRadius:    Radius.sm,
    paddingVertical: 4, paddingHorizontal: Spacing.sm,
  },
  crisisBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#991B1B' },

  stepWrap: { gap: Spacing.lg, paddingBottom: Spacing['2xl'] },
  stepLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: Colors.placeholder, letterSpacing: 1, textTransform: 'uppercase',
    textAlign: 'center',
  },
  bigMsg: {
    fontFamily: 'Manrope', fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold, color: Colors.text, lineHeight: 28,
  },
  subMsg: { fontSize: FontSize.base, color: Colors.muted, lineHeight: 20 },

  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  sliderWrap: { gap: Spacing.sm },
  sliderTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.faint, letterSpacing: 0.7, textTransform: 'uppercase' },
  sliderValue: { fontFamily: 'Manrope', fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.blue },
  dotSlider:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: Colors.border,
  },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },

  timerBox: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.xl,
    padding:         Spacing['2xl'],
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  timerNum: {
    fontFamily: 'Manrope', fontSize: 56,
    fontWeight: FontWeight.extrabold, color: Colors.blue, letterSpacing: -2,
  },
  timerLbl: { fontSize: FontSize.sm, color: Colors.faint, marginTop: 4 },

  personalBox: {
    backgroundColor: Colors.blueSoft,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.blueBorder,
  },
  personalText: { fontSize: FontSize.sm, color: '#1D4ED8', lineHeight: 18, fontWeight: FontWeight.medium },

  resultWrap: { alignItems: 'center', paddingTop: Spacing['4xl'] },
  resultEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  resultMsg: {
    fontFamily: 'Manrope', fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold, color: Colors.green, textAlign: 'center',
  },
  resultSub: {
    fontSize: FontSize.md, color: Colors.muted,
    lineHeight: 22, textAlign: 'center', marginTop: Spacing.sm,
  },
});
