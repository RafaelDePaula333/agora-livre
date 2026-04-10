import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components';
import { t } from '../../i18n';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../../theme';
import type { RootStackParamList } from '../../types';
import { OnboardingDots } from './OnboardingDots';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;

export default function Onboarding1Screen() {
  const nav = useNavigation<Nav>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={Colors.gradientSky}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.wrap}>
          {/* Progress dots */}
          <OnboardingDots total={3} current={0} />

          {/* Icon Section with floating effect */}
          <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
            <Text style={styles.icon}>🌅</Text>
          </Animated.View>

          {/* Copy - Animated */}
          <Animated.View 
            style={[
              styles.copy, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.title}>{t('ob1Title')}</Text>
            <Text style={styles.sub}>{t('ob1Sub')}</Text>
          </Animated.View>

          {/* CTA & Trust */}
          <View style={styles.footer}>
            <PrimaryButton
              label={t('ob1Btn')}
              onPress={() => nav.navigate('Onboarding2')}
              style={styles.buttonShadow}
            />
            
            <Text style={styles.trust}>Sem julgamento. Sem cobranças.</Text>
            
            {/* Play Store Compliance Disclaimer */}
            <Text style={styles.disclaimer}>
              O Agora Livre é um apoio motivacional. Não substitui consulta médica ou tratamento profissional.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  wrap: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical:   Spacing['3xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.card,
  },
  icon:  { fontSize: 64 },
  copy:  { alignItems: 'center', gap: Spacing.md, width: '100%' },
  title: {
    fontFamily: 'Manrope',
    fontSize:   FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    color:      Colors.text,
    textAlign:  'center',
    lineHeight: 36,
  },
  sub: {
    fontSize:   FontSize.lg,
    color:      Colors.muted,
    textAlign:  'center',
    lineHeight: 24,
    fontWeight: FontWeight.medium,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  buttonShadow: {
    ...Shadow.button,
    width: '100%',
  },
  trust: {
    fontSize:   FontSize.sm,
    color:      Colors.placeholder,
    fontWeight: FontWeight.medium,
  },
  disclaimer: {
    fontSize:   FontSize.xs,
    color:      Colors.placeholder,
    textAlign:  'center',
    marginTop:  Spacing.sm,
    opacity:    0.7,
    paddingHorizontal: Spacing.md,
  },
});

