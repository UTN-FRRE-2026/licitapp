// Pantalla 01 — Splash / Bienvenida
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';

export default function SplashScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.brand[50]} />
      <View style={styles.container}>

        {/* Fondo decorativo */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        {/* Logo y tagline */}
        <View style={styles.top}>
          <Text style={styles.logo}>
            Licit<Text style={styles.logoAccent}>App</Text>
            <Text style={styles.logoDot}>.</Text>
          </Text>
          <Text style={styles.tagline}>
            Cotizá materiales de obra.{'\n'}
            Recibí ofertas comparables.{'\n'}
            Cerrá el trato con un toque.
          </Text>
        </View>

        {/* Ilustración */}
        <View style={styles.illustration}>
          <View style={styles.illustrationBox}>
            <Text style={styles.illustrationEmoji}>🧱</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Button
            label="Empezar ahora"
            onPress={() => router.push('/(auth)/elegir-rol')}
          />
          <View style={styles.spacer} />
          <Button
            label="Ya tengo cuenta"
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
          />
          <TouchableOpacity
            onPress={() => router.push('/(auth)/elegir-rol')}
            style={styles.providerLink}
          >
            <Text style={styles.providerText}>
              ¿Sos corralón?{' '}
              <Text style={styles.providerTextBold}>Registrate como proveedor</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.brand[50],
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFE0BD',
    opacity: 0.6,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FFD4BD',
    opacity: 0.5,
  },
  top: {
    zIndex: 1,
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: colors.gray[900],
  },
  logoAccent: {
    color: colors.brand[500],
  },
  logoDot: {
    color: colors.brand[500],
  },
  tagline: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 12,
    lineHeight: 26,
    fontWeight: '500',
    maxWidth: 280,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  illustrationBox: {
    width: 180,
    height: 180,
    borderRadius: 40,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 12,
  },
  illustrationEmoji: {
    fontSize: 80,
  },
  cta: {
    zIndex: 1,
  },
  spacer: {
    height: 10,
  },
  providerLink: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  providerText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  providerTextBold: {
    color: colors.brand[600],
    fontWeight: '600',
  },
});
