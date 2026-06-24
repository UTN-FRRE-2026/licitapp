// Pantalla 02 — Elegir rol
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import type { UserRole } from '../../types';

export default function ElegirRolScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole>('constructor');

  const handleContinuar = () => {
    router.push({ pathname: '/(auth)/registro', params: { role: selected } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.step}>PASO 1 DE 2</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.title}>¿Cómo vas a usar LicitApp?</Text>
        <Text style={styles.subtitle}>Elegí tu rol para personalizar la experiencia.</Text>

        {/* Tarjeta Constructor */}
        <TouchableOpacity
          onPress={() => setSelected('constructor')}
          style={[styles.roleCard, selected === 'constructor' && styles.roleCardSelected]}
          activeOpacity={0.9}
        >
          {selected === 'constructor' && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
          <View style={[styles.iconCircle, styles.iconCircleBrand]}>
            <Text style={styles.roleEmoji}>💼</Text>
          </View>
          <Text style={styles.roleTitle}>Soy Constructor</Text>
          <Text style={styles.roleDesc}>
            Arquitecto, maestro mayor de obras o particular que necesita comprar
            materiales para una obra.
          </Text>
        </TouchableOpacity>

        {/* Tarjeta Corralón */}
        <TouchableOpacity
          onPress={() => setSelected('corralon')}
          style={[styles.roleCard, selected === 'corralon' && styles.roleCardSelected]}
          activeOpacity={0.9}
        >
          {selected === 'corralon' && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
          <View style={[styles.iconCircle, styles.iconCircleGray]}>
            <Text style={styles.roleEmoji}>🏪</Text>
          </View>
          <Text style={styles.roleTitle}>Soy Corralón / Proveedor</Text>
          <Text style={styles.roleDesc}>
            Comercio local que vende materiales y quiere acceder a compradores
            activos de su zona.
          </Text>
        </TouchableOpacity>

        <View style={styles.bottom}>
          <Button label="Continuar →" onPress={handleContinuar} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.gray[700] },
  step: { fontSize: 13, color: colors.gray[400], fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: colors.gray[900], marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray[500], marginBottom: 24 },
  roleCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    position: 'relative',
  },
  roleCardSelected: {
    borderColor: colors.brand[500],
    borderWidth: 2,
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconCircleBrand: { backgroundColor: colors.brand[100] },
  iconCircleGray: { backgroundColor: colors.gray[100] },
  roleEmoji: { fontSize: 24 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  roleDesc: { fontSize: 13, color: colors.gray[500], lineHeight: 20 },
  bottom: { marginTop: 'auto', paddingTop: 24 },
});
