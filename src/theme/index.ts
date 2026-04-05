// src/theme/index.ts
// Agora Livre — Design System

export const Colors = {
  // Base
  blue:        '#2563EB',
  blueSoft:    '#EFF6FF',
  blueLight:   '#93C5FD',
  blueBorder:  '#BFDBFE',

  // Backgrounds
  bg:          '#F8FAFC',
  card:        '#FFFFFF',
  surface:     '#F1F5F9',

  // Text
  text:        '#1E293B',
  muted:       '#64748B',
  faint:       '#94A3B8',
  placeholder: '#CBD5E1',

  // Border
  border:      '#E2E8F0',

  // Semantic
  red:         '#EF4444',
  redSoft:     '#FEE2E2',
  redBorder:   '#FECACA',

  green:       '#22C55E',
  greenLight:  '#DCFCE7',
  greenBorder: '#BBF7D0',

  greenText:   '#15803D',
  greenDark:   '#166534',

  yellowSoft:  '#FEF9C3',
  yellowText:  '#854D0E',

  white:       '#FFFFFF',
  black:       '#0F172A',
} as const;

export const Typography = {
  display: 'Manrope',
  body:    'Inter',
} as const;

export const FontSize = {
  xs:   10,
  sm:   11,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 48,
  hero:  62,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: Colors.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  crisisButton: {
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
