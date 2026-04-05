// src/screens/onboarding/Onboarding1Screen.tsx
// Agora Livre — Onboarding Step 1: Welcome

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import { t } from '../../i18n';
import { Colors, FontSize, FontWeight, Spacing } from '../../theme';
import type { RootStackParamList } from '../../types';
import { OnboardingDots } from './OnboardingDots';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;

export default function Onboarding1Screen() {
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>

        {/* Progress dots */}
        <OnboardingDots total={3} current={0} />

        {/* Icon */}
        <Text style={styles.icon}>🌅</Text>

        {/* Copy */}
        <View style={styles.copy}>
          <Text style={styles.title}>{t('ob1Title')}</Text>
          <Text style={styles.sub}>{t('ob1Sub')}</Text>
        </View>

        {/* CTA */}
        <PrimaryButton
          label={t('ob1Btn')}
          onPress={() => nav.navigate('Onboarding2')}
        />

        {/* Trust line */}
        <Text style={styles.trust}>Sem julgamento. Sem cobranças.</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.card },
  wrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: Spacing['2xl'],
    gap:             Spacing.xl,
  },
  icon:  { fontSize: 64 },
  copy:  { alignItems: 'center', gap: Spacing.sm },
  title: {
    fontFamily: 'Manrope',
    fontSize:   FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    color:      Colors.text,
    textAlign:  'center',
    lineHeight: 32,
  },
  sub: {
    fontSize:   FontSize.md,
    color:      Colors.muted,
    textAlign:  'center',
    lineHeight: 22,
    fontWeight: FontWeight.medium,
  },
  trust: {
    fontSize:   FontSize.sm,
    color:      Colors.placeholder,
    fontWeight: FontWeight.medium,
  },
});
