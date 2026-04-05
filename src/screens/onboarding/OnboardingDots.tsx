// src/screens/onboarding/OnboardingDots.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../../theme';

interface Props { total: number; current: number; }

export function OnboardingDots({ total, current }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.dotActive,
            i < current  && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24, borderRadius: Radius.sm,
    backgroundColor: Colors.blue,
  },
  dotDone: { backgroundColor: Colors.blue, opacity: 0.4 },
});
