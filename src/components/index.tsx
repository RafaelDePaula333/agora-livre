// src/components/index.tsx
// Agora Livre — Reusable Components

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';

// ─── PrimaryButton ────────────────────────────────────────────────────
interface PrimaryButtonProps {
  label:      string;
  onPress:    () => void;
  loading?:   boolean;
  disabled?:  boolean;
  style?:     ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, style }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled, style]}
    >
      {loading
        ? <ActivityIndicator color={Colors.white} />
        : <Text style={styles.primaryBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── GhostButton ─────────────────────────────────────────────────────
interface GhostButtonProps {
  label:   string;
  onPress: () => void;
  style?:  ViewStyle;
}

export function GhostButton({ label, onPress, style }: GhostButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.ghostBtn, style]}>
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── CrisisButton (pulsing red) ───────────────────────────────────────
interface CrisisButtonProps {
  label:   string;
  onPress: () => void;
}

export function CrisisButton({ label, onPress }: CrisisButtonProps) {
  const pulse = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.00, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={styles.crisisBtn}
      >
        <View style={styles.crisisDot} />
        <Text style={styles.crisisBtnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?:   ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── SelectPill ───────────────────────────────────────────────────────
interface SelectPillProps {
  label:    string;
  selected: boolean;
  onPress:  () => void;
}

export function SelectPill({ label, selected, onPress }: SelectPillProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── MoodCard ────────────────────────────────────────────────────────
interface MoodCardProps {
  icon:     string;
  label:    string;
  selected: boolean;
  onPress:  () => void;
}

export function MoodCard({ icon, label, selected, onPress }: MoodCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.moodCard, selected && styles.moodCardSelected]}
    >
      <Text style={styles.moodIcon}>{icon}</Text>
      <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── ActionCard ──────────────────────────────────────────────────────
interface ActionCardProps {
  icon:     string;
  label:    string;
  selected: boolean;
  onPress:  () => void;
}

export function ActionCard({ icon, label, selected, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.actionCard, selected && styles.actionCardSelected]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, selected && styles.actionLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0–1
  color?:   string;
}

export function ProgressBar({ progress, color = Colors.blue }: ProgressBarProps) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

// ─── InsightBox ──────────────────────────────────────────────────────
interface InsightBoxProps {
  tag:  string;
  text: string;
}

export function InsightBox({ tag, text }: InsightBoxProps) {
  return (
    <View style={styles.insightBox}>
      <Text style={styles.insightIcon}>💡</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.insightTag}>{tag.toUpperCase()}</Text>
        <Text style={styles.insightText}>{text}</Text>
      </View>
    </View>
  );
}

// ─── SectionLabel ────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: Colors.blue,
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems:      'center',
    ...Shadow.button,
  },
  primaryBtnDisabled: {
    backgroundColor: Colors.faint,
  },
  primaryBtnText: {
    color:      Colors.white,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    fontFamily: 'Manrope',
  },
  ghostBtn: {
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.sm + 3,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  ghostBtnText: {
    color:      Colors.faint,
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
  },
  crisisBtn: {
    backgroundColor: Colors.red,
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.md + 3,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    ...Shadow.crisisButton,
  },
  crisisDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  crisisBtnText: {
    color:          Colors.white,
    fontSize:       FontSize.md,
    fontWeight:     FontWeight.extrabold,
    letterSpacing:  0.5,
    fontFamily:     'Manrope',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.card,
  },
  pill: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.full,
    paddingVertical:   Spacing.xs + 3,
    paddingHorizontal: Spacing.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  pillSelected: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blue,
  },
  pillText: {
    fontSize:   FontSize.base,
    fontWeight: FontWeight.semibold,
    color:      Colors.muted,
  },
  pillTextSelected: {
    color: '#1D4ED8',
  },
  moodCard: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  moodCardSelected: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blue,
  },
  moodIcon: {
    fontSize:     22,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.muted,
  },
  moodLabelSelected: {
    color: Colors.blue,
  },
  actionCard: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  actionCardSelected: {
    backgroundColor: Colors.blueSoft,
    borderColor:     Colors.blue,
  },
  actionIcon: {
    fontSize:     22,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.text,
    textAlign:  'center',
  },
  actionLabelSelected: {
    color: Colors.blue,
  },
  progressTrack: {
    height:          4,
    backgroundColor: Colors.border,
    borderRadius:    2,
    overflow:        'hidden',
  },
  progressFill: {
    height:       '100%',
    borderRadius: 2,
  },
  insightBox: {
    backgroundColor: Colors.greenLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.greenBorder,
    flexDirection:   'row',
    gap:             Spacing.sm,
    alignItems:      'flex-start',
  },
  insightIcon: {
    fontSize: 16,
  },
  insightTag: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    color:         Colors.greenText,
    letterSpacing: 0.6,
    marginBottom:  2,
  },
  insightText: {
    fontSize:   FontSize.sm,
    color:      Colors.greenDark,
    lineHeight: 18,
    fontWeight: FontWeight.medium,
  },
  sectionLabel: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    color:         Colors.faint,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom:  Spacing.sm,
  },
});
