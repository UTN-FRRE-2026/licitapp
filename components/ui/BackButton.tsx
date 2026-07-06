import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';

/**
 * Botón "volver" reutilizable. Chip gris redondeado con un chevron grueso,
 * consistente con el resto de la UI (mismo estilo que el botón de engranaje).
 * Por defecto hace router.back(); se puede pasar un onPress propio.
 */
export function BackButton({
  onPress,
  style,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.back())}
      style={[styles.btn, style]}
      hitSlop={10}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 30,
    lineHeight: 32,
    color: colors.gray[800],
    fontWeight: '700',
    marginTop: -3,
  },
});
