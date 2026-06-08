// Pantalla 06 — Solicitud publicada (estado en vivo)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { listenToSolicitud } from '../../services/solicitudes.service';
import type { Solicitud } from '../../types';

export default function SolicitudPublicadaScreen() {
  const router = useRouter();
  const { solicitudId } = useLocalSearchParams<{ solicitudId: string }>();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  useEffect(() => {
    if (!solicitudId) return;
    const unsub = listenToSolicitud(solicitudId, setSolicitud);
    return unsub;
  }, [solicitudId]);

  const timeLeft = solicitud?.deadline
    ? formatDistanceToNow(solicitud.deadline, { locale: es, addSuffix: false })
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Botón cerrar */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.replace('/(constructor)')} style={styles.closeBtn}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Hero confirmación */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>✓</Text>
          </View>
          <Text style={styles.heroTitle}>¡Solicitud publicada!</Text>
          <Text style={styles.heroDesc}>
            Tu pedido fue enviado a los corralones de{' '}
            <Text style={{ fontWeight: '600' }}>{solicitud?.deliveryZone ?? '…'}</Text>.
            Te avisamos cuando lleguen ofertas.
          </Text>
        </View>

        {/* Resumen del pedido */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Resumen del pedido</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Título</Text>
            <Text style={styles.detailValue}>{solicitud?.title ?? '…'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Zona</Text>
            <Text style={styles.detailValue}>{solicitud?.deliveryZone ?? '…'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Cierre</Text>
            <Text style={styles.detailValue}>
              {solicitud?.deadline
                ? solicitud.deadline.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '…'}
            </Text>
          </View>
        </Card>

        {/* Estado en vivo */}
        <Card variant="flat" style={styles.liveCardOuter}>
          <Text style={styles.liveTitle}>Estado en vivo</Text>
          <View style={styles.liveGrid}>
            <View style={styles.liveItem}>
              <Text style={styles.liveNum}>
                {solicitud?.corralonesNotifiedCount ?? 0}
              </Text>
              <Text style={styles.liveLabel}>Notificados</Text>
            </View>
            <View style={[styles.liveItem, styles.liveItemCenter]}>
              <Text style={[styles.liveNum, styles.liveNumBrand]}>
                {solicitud?.ofertasCount ?? 0}
              </Text>
              <Text style={[styles.liveLabel, styles.liveLabelBrand]}>Ofertas</Text>
            </View>
            <View style={styles.liveItem}>
              <Text style={styles.liveNum}>{timeLeft}</Text>
              <Text style={styles.liveLabel}>Restante</Text>
            </View>
          </View>
        </Card>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔔</Text>
          <Text style={styles.infoText}>
            Te vamos a notificar en cuanto llegue una oferta nueva.
          </Text>
        </View>

        {/* Acciones */}
        {(solicitud?.ofertasCount ?? 0) > 0 && (
          <Button
            label={`Ver ofertas (${solicitud?.ofertasCount})`}
            onPress={() => router.push(`/(constructor)/comparar/${solicitudId}`)}
            style={{ marginBottom: 10 }}
          />
        )}

        <Button
          label="Volver al inicio"
          variant="ghost"
          onPress={() => router.replace('/(constructor)')}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: colors.gray[600] },

  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroEmoji: { fontSize: 32, color: colors.success },
  heroTitle: { fontSize: 22, fontWeight: '700', color: colors.gray[900], marginBottom: 8 },
  heroDesc: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  card: { marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 13, color: colors.gray[500] },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.gray[900], maxWidth: '60%', textAlign: 'right' },

  liveCardOuter: { marginBottom: 12, borderWidth: 0 },
  liveTitle: { fontSize: 14, fontWeight: '600', color: colors.brand[700], marginBottom: 12 },
  liveGrid: { flexDirection: 'row' },
  liveItem: { flex: 1, alignItems: 'center' },
  liveItemCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.gray[200],
  },
  liveNum: { fontSize: 24, fontWeight: '800', color: colors.gray[900], lineHeight: 28 },
  liveNumBrand: { color: colors.brand[600] },
  liveLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4, fontWeight: '600' },
  liveLabelBrand: { color: colors.brand[700] },

  infoBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.infoBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, color: colors.infoText, fontWeight: '500', lineHeight: 18 },
});
