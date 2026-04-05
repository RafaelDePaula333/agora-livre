// src/screens/onboarding/Onboarding2Screen.tsx
// Agora Livre — Onboarding Step 2: Addiction Type

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import { t } from '../../i18n';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../../theme';
import type { AddictionType, RootStackParamList } from '../../types';
import { OnboardingDots } from './OnboardingDots';
import { useOnboardingStore } from './onboardingStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding2'>;

const OPTIONS: { id: AddictionType; icon: string; labelKey: string; desc: string }[] = [
  { id: 'alcohol', icon: '🍺', labelKey: 'ob2Alcohol', desc: 'Cerveja, vinho, destilados' },
  { id: 'drugs',   icon: '💊', labelKey: 'ob2Drugs',   desc: 'Qualquer substância'       },
];

export default function Onboarding2Screen() {
  const nav    = useNavigation<Nav>();
  const store  = useOnboardingStore();
  const [selected, setSelected] = useState<AddictionType | null>(store.addictionType ?? null);

  function handleContinue() {
    if (!selected) return;
    store.setAddictionType(selected);
    nav.navigate('Onboarding3');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>

        <OnboardingDots total={3} current={1} />

        <View style={styles.header}>
          <Text style={styles.title}>{t('ob2Title')}</Text>
          <Text style={styles.sub}>Isso personaliza o app para você.</Text>
        </View>

        {/* Choice cards */}
        <View style={styles.grid}>
          {OPTIONS.map(o => {
            const isSelected = selected === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => setSelected(o.id)}
                activeOpacity={0.75}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <Text style={styles.cardIcon}>{o.icon}</Text>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {t(o.labelKey as any)}
                </Text>
                <Text style={styles.cardDesc}>{o.desc}</Text>
                {isSelected && <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <PrimaryButton
          label={t('ob2Btn')}
          onPress={handleContinue}
          disabled={!selected}
        />

        <Text style={styles.note}>Você pode mudar isso depois nas configurações.</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  wrap: {
    flex:              1,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical:   Spacing['2xl'],
    gap:               Spacing.xl,
    alignItems:        'stretch',
  },
  header: { gap: Spacing.xs },
  title:  { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  sub:    { fontSize: FontSize.md, color: Colors.muted, fontWeight: FontWeight.medium },

  grid: { flexDirection: 'row', gap: Spacing.md },
  card: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    alignItems:      'center',
    gap:             Spacing.xs,
    borderWidth:     2,
    borderColor:     Colors.border,
    position:        'relative',
    ...Shadow.card,
  },
  cardSelected: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blue,
  },
  cardIcon:  { fontSize: 36, marginBottom: Spacing.xs },
  cardLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  cardLabelSelected: { color: Colors.blue },
  cardDesc:  { fontSize: FontSize.xs, color: Colors.faint, textAlign: 'center', fontWeight: FontWeight.medium },
  checkmark: {
    position:        'absolute',
    top:             Spacing.sm,
    right:           Spacing.sm,
    width:           20, height: 20,
    borderRadius:    10,
    backgroundColor: Colors.blue,
    alignItems:      'center',
    justifyContent:  'center',
  },
  checkmarkText: { fontSize: 11, color: Colors.white, fontWeight: FontWeight.bold },

  note: { fontSize: FontSize.xs, color: Colors.placeholder, textAlign: 'center' },
});
