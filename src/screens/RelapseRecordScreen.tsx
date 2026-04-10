// src/screens/RelapseRecordScreen.tsx
// Agora Livre — Relapse Recording Screen (sem culpa)

import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostButton, PrimaryButton, SectionLabel, SelectPill } from '../components';
import { EMOTIONS } from '../hooks/useCrisisMode';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import type { Emotion, RelapseLocation } from '../types';

const LOCATIONS: { id: RelapseLocation; icon: string; label: string }[] = [
  { id: 'home',   icon: '🏠', label: 'Em casa'     },
  { id: 'work',   icon: '💼', label: 'No trabalho' },
  { id: 'social', icon: '👥', label: 'Social'      },
  { id: 'other',  icon: '📍', label: 'Outro'       },
];

type Step = 'when' | 'where' | 'emotion' | 'intensity' | 'done';

export default function RelapseRecordScreen() {
  const nav = useNavigation();

  const [step,      setStep]      = useState<Step>('when');
  const [wasNow,    setWasNow]    = useState<boolean | null>(null);
  const [location,  setLocation]  = useState<RelapseLocation | null>(null);
  const [emotion,   setEmotion]   = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [saving,    setSaving]    = useState(false);

  async function handleSave() {
    if (!location || !emotion) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const occurredAt = wasNow
      ? new Date().toISOString()
      : new Date(Date.now() - 3_600_000).toISOString(); // ~1h ago if "before"

    const { error } = await supabase
      .from('relapses')
      .insert({
        user_id:     user.id,
        occurred_at: occurredAt,
        location,
        emotion,
        intensity,
        notes:       '',

      });

    // Also reset sober_since in profile
    if (!error) {
      await supabase
        .from('profiles')
        .update({ sober_since: new Date().toISOString().split('T')[0] })
        .eq('id', user.id);
    }

    setSaving(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
      return;
    }

    setStep('done');
  }

  // ── Done screen ────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneIcon}>📝</Text>
          <Text style={styles.doneTitle}>Obrigado por registrar.</Text>
          <Text style={styles.doneSub}>
            Isso não apaga o progresso. Cada registro nos ajuda a entender o que aconteceu — para que não se repita.
          </Text>
          <PrimaryButton
            label="Voltar ao início"
            onPress={() => nav.goBack()}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vamos entender o que aconteceu.</Text>
        <Text style={styles.headerSub}>Sem julgamento. Isso é só informação.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Step 1: When */}
        <View style={styles.section}>
          <SectionLabel>Quando foi?</SectionLabel>
          <View style={styles.pills}>
            <SelectPill
              label="🕐 Agora"
              selected={wasNow === true}
              onPress={() => setWasNow(true)}
            />
            <SelectPill
              label="📅 Antes"
              selected={wasNow === false}
              onPress={() => setWasNow(false)}
            />
          </View>
        </View>

        {/* Step 2: Where */}
        <View style={styles.section}>
          <SectionLabel>Onde estava?</SectionLabel>
          <View style={styles.pills}>
            {LOCATIONS.map(l => (
              <SelectPill
                key={l.id}
                label={`${l.icon} ${l.label}`}
                selected={location === l.id}
                onPress={() => setLocation(l.id)}
              />
            ))}
          </View>
        </View>

        {/* Step 3: Emotion */}
        <View style={styles.section}>
          <SectionLabel>Emoção principal</SectionLabel>
          <View style={styles.pills}>
            {EMOTIONS.map(e => (
              <SelectPill
                key={e.id}
                label={`${e.icon} ${t(e.labelKey as any)}`}
                selected={emotion === e.id}
                onPress={() => setEmotion(e.id)}
              />
            ))}
          </View>
        </View>

        {/* Step 4: Intensity */}
        <View style={styles.section}>
          <SectionLabel>Intensidade da vontade que sentiu</SectionLabel>
          <View style={styles.dotRow}>
            {Array.from({ length: 11 }, (_, i) => (
              <SelectPill
                key={i}
                label={String(i)}
                selected={intensity === i}
                onPress={() => setIntensity(i)}
              />
            ))}
          </View>
        </View>

        {/* Support message */}
        <View style={styles.supportBox}>
          <Text style={styles.supportText}>
            💙 Recaída não é fracasso — é informação. O app vai aprender com isso para te ajudar melhor.
          </Text>
        </View>

        <PrimaryButton
          label="Salvar registro"
          onPress={handleSave}
          loading={saving}
          disabled={wasNow === null || !location || !emotion}
        />

        <GhostButton label="Cancelar" onPress={() => nav.goBack()} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.lg, paddingBottom: 0, gap: Spacing.xs },
  headerTitle: { fontFamily: 'Manrope', fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  headerSub:   { fontSize: FontSize.md, color: Colors.muted },
  scroll: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },

  section: { gap: Spacing.sm },
  pills:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dotRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },

  supportBox: {
    backgroundColor: Colors.blueSoft,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.blueBorder,
  },
  supportText: { fontSize: FontSize.sm, color: '#1D4ED8', lineHeight: 20, fontWeight: FontWeight.medium },

  doneWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.md },
  doneIcon:  { fontSize: 56 },
  doneTitle: { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text, textAlign: 'center' },
  doneSub:   { fontSize: FontSize.md, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
});
