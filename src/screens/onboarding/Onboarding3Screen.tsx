// src/screens/onboarding/Onboarding3Screen.tsx
// Agora Livre — Onboarding Step 3: Triggers + Save Profile

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SectionLabel, SelectPill } from '../../components';
import { t } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';
import type {
  CopingStrategy,
  RootStackParamList,
  TriggerCause,
  TriggerTime,
} from '../../types';
import { OnboardingDots } from './OnboardingDots';
import { useOnboardingStore } from './onboardingStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding3'>;

// ── Option lists ──────────────────────────────────────────────────────
const TRIGGER_TIMES: { id: TriggerTime; icon: string; labelKey: string }[] = [
  { id: 'night',  icon: '🌙', labelKey: 'trigNight'  },
  { id: 'alone',  icon: '🧍', labelKey: 'trigAlone'  },
  { id: 'social', icon: '👥', labelKey: 'trigSocial' },
  { id: 'stress', icon: '😤', labelKey: 'trigStress' },
];

const TRIGGER_CAUSES: { id: TriggerCause; icon: string; labelKey: string }[] = [
  { id: 'emotional', icon: '💔', labelKey: 'causeEmo'    },
  { id: 'habit',     icon: '🔄', labelKey: 'causeHabit'  },
  { id: 'tiredness', icon: '😴', labelKey: 'causeTired'  },
  { id: 'social',    icon: '👥', labelKey: 'causeSocial' },
];

const COPING: { id: CopingStrategy; icon: string; labelKey: string }[] = [
  { id: 'support',     icon: '🤝', labelKey: 'copeSupport'  },
  { id: 'distraction', icon: '🎯', labelKey: 'copeDistract' },
  { id: 'control',     icon: '🔒', labelKey: 'copeControl'  },
  { id: 'silence',     icon: '🤫', labelKey: 'copeSilence'  },
];

export default function Onboarding3Screen() {
  const nav    = useNavigation<Nav>();
  const store  = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    if (!store.addictionType) return;
    setSaving(true);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({
          addiction_type:    store.addictionType,
          trigger_times:     store.triggerTimes,
          trigger_causes:    store.triggerCauses,
          coping_strategies: store.copingStrategies,
          sober_since:       new Date().toISOString().split('T')[0],
        })
        .eq('id', user.id);
    }

    setSaving(false);

    store.reset();
    nav.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  const canFinish =
    store.triggerTimes.length > 0 ||
    store.triggerCauses.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingDots total={3} current={2} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('ob3Title')}</Text>
          <Text style={styles.sub}>{t('ob3Sub')}</Text>
        </View>

        {/* Q1: Trigger times */}
        <View style={styles.section}>
          <SectionLabel>{t('ob3Q1')}</SectionLabel>
          <View style={styles.pills}>
            {TRIGGER_TIMES.map(o => (
              <SelectPill
                key={o.id}
                label={`${o.icon} ${t(o.labelKey as any)}`}
                selected={store.triggerTimes.includes(o.id)}
                onPress={() => store.toggleTriggerTime(o.id)}
              />
            ))}
          </View>
        </View>

        {/* Q2: Trigger causes */}
        <View style={styles.section}>
          <SectionLabel>{t('ob3Q2')}</SectionLabel>
          <View style={styles.pills}>
            {TRIGGER_CAUSES.map(o => (
              <SelectPill
                key={o.id}
                label={`${o.icon} ${t(o.labelKey as any)}`}
                selected={store.triggerCauses.includes(o.id)}
                onPress={() => store.toggleTriggerCause(o.id)}
              />
            ))}
          </View>
        </View>

        {/* Q3: Coping strategies */}
        <View style={styles.section}>
          <SectionLabel>{t('ob3Q3')}</SectionLabel>
          <View style={styles.pills}>
            {COPING.map(o => (
              <SelectPill
                key={o.id}
                label={`${o.icon} ${t(o.labelKey as any)}`}
                selected={store.copingStrategies.includes(o.id)}
                onPress={() => store.toggleCoping(o.id)}
              />
            ))}
          </View>
        </View>

        <PrimaryButton
          label={t('ob3Btn')}
          onPress={handleFinish}
          loading={saving}
          disabled={!canFinish}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.card },
  scroll: { padding: Spacing['2xl'], gap: Spacing.xl, paddingBottom: Spacing['4xl'] },

  header: { gap: Spacing.xs },
  title:  { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  sub:    { fontSize: FontSize.md, color: Colors.muted, fontWeight: FontWeight.medium },

  section: { gap: Spacing.sm },
  pills:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
