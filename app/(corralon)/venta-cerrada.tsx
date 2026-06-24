// Pantalla 16 — Venta Cerrada (corralón): felicitación + datos del constructor
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
import { getSolicitudById } from '../../services/solicitudes.service';
import type { UserContactDto, Solicitud } from '../../types';

export default function VentaCerradaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    solicitudId:   string;
    solicitudTitle?: string;
    totalPrice?:    string;
  }>();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [constructor_, setConstructor] = useState<UserContactDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.solicitudId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const sol = await getSolicitudById(params.solicitudId);
        setSolicitud(sol);
        if (sol?.constructorId) {
          const profile = await getUserProfile(sol.constructorId).catch(() => null);
          setConstructor(profile);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.solicitudId]);

  const title = solicitud?.title ?? params.solicitudTitle ?? 'Licitación';
  const price = params.totalPrice ? parseFloat(params.totalPrice) : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.heroCircle}>
            <Text style={styles.heroIcon}>🏆</Text>
          </View>
          <Text style={styles.heroTitle}>¡Ganaste la venta!</Text>
          <Text style={styles.heroSub}>
            El constructor eligió tu oferta
          </Text>
          <View style={styles.solicitudTag}>
            <Text style={styles.solicitudTagText} numberOfLines={1}>
              📋 {title}
            </Text>
          </View>
        </View>

        {/* Precio */}
        {price !== null && (
          <Card style={styles.priceCard}>
            <Text style={styles.priceLabel}>Monto de la venta</Text>
            <Text style={styles.price}>${price.toLocaleString('es-AR')}</Text>
          </Card>
        )}

        {/* Datos del constructor */}
        <Text style={styles.sectionTitle}>Datos del constructor</Text>
        {loading ? (
          <ActivityIndicator color={colors.brand[500]} style={{ marginTop: 20 }} />
        ) : constructor_ ? (
          <Card>
            <Text style={styles.contactName}>{constructor_.fullName}</Text>

            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${constructor_.phone}`)}
            >
              <Text style={styles.contactIcon}>📞</Text>
              <Text style={styles.contactValue}>{constructor_.phone}</Text>
              <Text style={styles.contactAction}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactRow, styles.contactRowLast]}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/${constructor_.phone.replace(/\D/g, '')}`
                )
              }
            >
              <Text style={styles.contactIcon}>💬</Text>
              <Text style={styles.contactValue}>WhatsApp</Text>
              <Text style={styles.contactAction}>Abrir</Text>
            </TouchableOpacity>

            {solicitud?.deliveryZone ? (
              <View style={styles.zoneRow}>
                <Text style={styles.contactIcon}>📍</Text>
                <Text style={styles.contactValue}>{solicitud.deliveryZone}</Text>
              </View>
            ) : null}
          </Card>
        ) : (
          <Card>
            <Text style={styles.noContactText}>
              Esperá que el constructor te contacte para coordinar la entrega.
            </Text>
          </Card>
        )}

        {/* Próximos pasos */}
        <Text style={styles.sectionTitle}>Próximos pasos</Text>
        <Card>
          {[
            { icon: '📞', text: 'El constructor te va a contactar para coordinar la entrega' },
            { icon: '📦', text: 'Preparás los materiales según la lista de la licitación' },
            { icon: '🚚', text: 'Coordinás fecha y horario de entrega o retiro' },
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
          label="Ver mis ofertas"
          onPress={() => router.replace('/(corralon)/mis-ofertas')}
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
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIcon: { fontSize: 36 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: colors.gray[900], marginBottom: 8 },
  heroSub: { fontSize: 15, color: colors.gray[600], textAlign: 'center', marginBottom: 12 },
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
    backgroundColor: colors.successBg,
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  priceLabel: { fontSize: 12, color: colors.successText, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 36, fontWeight: '900', color: colors.successText },
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
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
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
