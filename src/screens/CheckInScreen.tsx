// src/screens/CheckInScreen.tsx
// Agora Livre — Daily Check-In Screen

import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, InsightBox, MoodCard, PrimaryButton, SectionLabel, SelectPill } from '../components';
import { EMOTIONS } from '../hooks/useCrisisMode';
import { t } from '../i18n';
import { supabase } from '../lib/supabase';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../theme';
import type { Emotion, Mood } from '../types';

const INVESTMENTS = [
  { id: 'study',    icon: '📚', label: 'Estudos' },
  { id: 'family',   icon: '👨‍👩‍👧', label: 'Família' },
  { id: 'work',     icon: '💼', label: 'Trabalho' },
  { id: 'hobby',    icon: '🎨', label: 'Hobby' },
  { id: 'health',   icon: '🏃', label: 'Saúde' },
  { id: 'rest',     icon: '😴', label: 'Descanso' },
];

export default function CheckInScreen() {
  const [mood,           setMood]           = useState<Mood | null>(null);
  const [emotions,       setEmotions]       = useState<Emotion[]>([]);
  const [intensity,      setIntensity]      = useState<number>(3);
  const [timeInvestment, setTimeInvestment] = useState<string>('');
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);


  const MOODS: { id: Mood; icon: string; labelKey: string }[] = [
    { id: 'good',    icon: '😌', labelKey: 'moodGood'    },
    { id: 'neutral', icon: '😐', labelKey: 'moodNeutral' },
    { id: 'bad',     icon: '😔', labelKey: 'moodBad'     },
  ];

  function toggleEmotion(e: Emotion) {
    setEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
    );
  }

  // Derive insight based on mood + intensity
  function getInsight(): string {
    if (intensity >= 7) return 'Intensidade alta hoje. Fique longe de gatilhos conhecidos.';
    if (mood === 'bad') return 'Dia difícil. Foque em uma ação pequena de cada vez.';
    if (mood === 'good') return 'Ótimo dia. Aproveite para reforçar hábitos positivos.';
    return t('insightText');
  }

  async function handleSave() {
    if (!mood) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('checkins')
      .upsert({
        user_id:         user.id,
        date:            today,
        mood,
        emotions,
        urge_intensity:  intensity,
        time_investment: timeInvestment,
        notes:           '',
      }, { onConflict: 'user_id,date' });

    setSaving(false);
    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
      return;
    }
    setSaved(true);
  }

  if (saved) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.savedWrap}>
          <Text style={styles.savedEmoji}>✅</Text>
          <Text style={styles.savedTitle}>Check-in salvo!</Text>
          <Text style={styles.savedSub}>Continue assim. Um dia de cada vez.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>{t('ciTitle')}</Text>
        <Text style={styles.sub}>{t('ciSub')}</Text>

        {/* Mood selection */}
        <View style={styles.moodRow}>
          {MOODS.map(m => (
            <MoodCard
              key={m.id}
              icon={m.icon}
              label={t(m.labelKey as any)}
              selected={mood === m.id}
              onPress={() => setMood(m.id)}
            />
          ))}
        </View>

        {/* Emotion pills */}
        <SectionLabel>{t('mainEmotion')}</SectionLabel>
        <View style={styles.pillsWrap}>
          {EMOTIONS.map(e => (
            <SelectPill
              key={e.id}
              label={`${e.icon} ${t(e.labelKey as any)}`}
              selected={emotions.includes(e.id)}
              onPress={() => toggleEmotion(e.id)}
            />
          ))}
        </View>

        {/* Intensity */}
        <Card style={styles.sliderCard}>
          <View style={styles.sliderTop}>
            <Text style={styles.sliderLabel}>{t('intensity')}</Text>
            <Text style={styles.sliderValue}>{intensity}</Text>
          </View>
          <View style={styles.dotRow}>
            {Array.from({ length: 11 }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setIntensity(i)}
                style={[
                  styles.dot,
                  { backgroundColor: i <= intensity ? Colors.blue : Colors.border },
                ]}
              />
            ))}
          </View>
          <View style={styles.dotLabels}>
            <Text style={styles.dotLabelText}>0</Text>
            <Text style={styles.dotLabelText}>10</Text>
          </View>
        </Card>

        {/* Energy Conversion (New Section) */}
        <SectionLabel>Conversão de Energia</SectionLabel>
        <Text style={styles.sectionDesc}>Onde você investiu o tempo que antes gastava no vício?</Text>
        <View style={styles.pillsWrap}>
          {INVESTMENTS.map(item => (
            <SelectPill
              key={item.id}
              label={`${item.icon} ${item.label}`}
              selected={timeInvestment.includes(item.label)}
              onPress={() => {
                const labels = timeInvestment ? timeInvestment.split(', ') : [];
                const next = labels.includes(item.label)
                  ? labels.filter(l => l !== item.label)
                  : [...labels, item.label];
                setTimeInvestment(next.join(', '));
              }}
            />
          ))}
        </View>

        {/* Insight */}
        {mood && <InsightBox tag={t('insight')} text={getInsight()} />}


        <PrimaryButton
          label={t('saveCheckIn')}
          onPress={handleSave}
          loading={saving}
          disabled={!mood}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, gap: Spacing.lg },

  title: { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  sub:   { fontSize: FontSize.base, color: Colors.faint, marginTop: -Spacing.sm },
  sectionDesc: { fontSize: FontSize.xs, color: Colors.faint, marginTop: -Spacing.md, marginBottom: Spacing.sm },

  moodRow: { flexDirection: 'row', gap: Spacing.sm },


  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: -Spacing.sm },

  sliderCard: { gap: Spacing.sm },
  sliderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.faint, letterSpacing: 0.7, textTransform: 'uppercase' },
  sliderValue: { fontFamily: 'Manrope', fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, color: Colors.blue },
  dotRow: { flexDirection: 'row', gap: 5 },
  dot: { flex: 1, height: 6, borderRadius: 3 },
  dotLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  dotLabelText: { fontSize: FontSize.xs, color: Colors.placeholder },

  savedWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing['2xl'] },
  savedEmoji: { fontSize: 64 },
  savedTitle: { fontFamily: 'Manrope', fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, color: Colors.text },
  savedSub:   { fontSize: FontSize.md, color: Colors.muted, textAlign: 'center' },
});
