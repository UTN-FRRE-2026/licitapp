import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

type PillVariant = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'violet' | 'gray';

interface PillProps {
  label: string;
  variant?: PillVariant;
  dot?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<PillVariant, { bg: string; text: string }> = {
  success: { bg: colors.successBg, text: colors.successText },
  warning: { bg: colors.warningBg, text: colors.warningText },
  danger: { bg: colors.dangerBg, text: colors.dangerText },
  info: { bg: colors.infoBg, text: colors.infoText },
  brand: { bg: colors.brand[100], text: colors.brand[700] },
  violet: { bg: colors.violetBg, text: colors.violetText },
  gray: { bg: colors.gray[100], text: colors.gray[600] },
};

export function Pill({ label, variant = 'gray', dot = false, style }: PillProps) {
  const vs = variantStyles[variant];

  return (
    <View style={[styles.pill, { backgroundColor: vs.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: vs.text }]} />}
      <Text style={[styles.text, { color: vs.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
