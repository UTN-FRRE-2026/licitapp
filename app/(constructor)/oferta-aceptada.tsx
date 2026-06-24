// Pantalla 09 — Oferta Aceptada: confirmación + datos de contacto del corralón
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getUserProfile } from '../../services/auth.service';
import type { UserContactDto } from '../../types';

export default function OfertaAceptadaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    corralonId:     string;
    corralonName:   string;
    solicitudTitle: string;
    totalPrice:     string;
  }>();

  const [corralon, setCorralon] = useState<UserContactDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.corralonId) { setLoading(false); return; }
    getUserProfile(params.corralonId)
      .then(setCorralon)
      .catch(() => setCorralon(null))
      .finally(() => setLoading(false));
  }, [params.corralonId]);

  const price = params.totalPrice ? parseFloat(params.totalPrice) : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroIcon}>✓</Text>
          </View>
          <Text style={styles.heroTitle}>¡Licitación cerrada!</Text>
          <Text style={styles.heroSub}>
            Elegiste la oferta de{' '}
            <Text style={styles.heroStrong}>{params.corralonName}</Text>
          </Text>
          {params.solicitudTitle ? (
            <View style={styles.solicitudTag}>
              <Text style={styles.solicitudTagText} numberOfLines={1}>
                📋 {params.solicitudTitle}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Resumen */}
        {price !== null && (
          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>Precio acordado</Text>
            <Text style={styles.price}>${price.toLocaleString('es-AR')}</Text>
          </Card>
        )}

        {/* Datos de contacto del corralón */}
        <Text style={styles.sectionTitle}>Datos del corralón</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 20 }} />
        ) : corralon ? (
          <Card>
            <Text style={styles.contactName}>
              {corralon.businessName ?? corralon.fullName}
            </Text>

            {/* Teléfono */}
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${corralon.phone}`)}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactValue}>{corralon.phone}</Text>
              <Text style={styles.contactAction}>Llamar</Text>
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              style={[styles.contactRow, styles.contactRowLast]}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${corralon.phone.replace(/\D/g, '')}`
                )
              }
            >
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactValue}>WhatsApp</Text>
              <Text style={styles.contactAction}>Abrir</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <Text style={styles.contactName}>{params.corralonName}</Text>
            <Text style={styles.noContactText}>
              Contactá al corralón directamente para coordinar la entrega.
            </Text>
          </Card>
        )}

        {/* Próximos pasos */}
        <Text style={styles.sectionTitle}>Próximos pasos</Text>
        <Card>
          {[
            { icon: '📞', text: 'Contactá al corralón para coordinar la entrega' },
            { icon: '📦', text: 'Confirmá la lista de materiales antes del despacho' },
            { icon: '✅', text: 'Una vez recibidos, marcá la licitación como completada' },
          ].map((step, i) => (
            <View
              key={i}
              style={[styles.stepRow, i < 2 && styles.stepRowBorder]}
            >
              <Text style={styles.stepIcon}>{step.icon}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          label="Volver al inicio"
          onPress={() => router.replace('/(constructor)')}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  scroll: { padding: 20 },
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  heroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIcon: { fontSize: 36, color: colors.white, fontWeight: '700' },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.gray[900], marginBottom: 8 },
  heroSub: { fontSize: 15, color: colors.gray[600], textAlign: 'center', marginBottom: 12 },
  heroStrong: { fontWeight: '700', color: colors.gray[900] },
  solicitudTag: {
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    maxWidth: 280,
  },
  solicitudTagText: { fontSize: 13, color: colors.gray[600] },
  priceCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
    backgroundColor: colors.brand[50],
    borderWidth: 1.5,
    borderColor: colors.brand[200],
  },
  priceLabel: { fontSize: 12, color: colors.brand[500], fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 36, fontWeight: '900', color: colors.brand[600] },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  contactName: { fontSize: 17, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  contactRowLast: {},
  contactIcon: { fontSize: 18, width: 28 },
  contactValue: { flex: 1, fontSize: 14, color: colors.gray[800] },
  contactAction: { fontSize: 13, color: colors.brand[500], fontWeight: '700' },
  noContactText: { fontSize: 13, color: colors.gray[500], lineHeight: 18 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
  },
  stepRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  stepIcon: { fontSize: 18 },
  stepText: { flex: 1, fontSize: 14, color: colors.gray[700], lineHeight: 19 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
