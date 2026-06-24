// Pantalla 08 — Detalle de Oferta + "Elegir esta oferta"
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../../constants/colors';
import { Card } from '../../../components/ui/Card';
import { Pill } from '../../../components/ui/Pill';
import { Button } from '../../../components/ui/Button';
import { useOfertaById, useAcceptOffer } from '../../../hooks/useOfertas';
import { getSolicitudById } from '../../../services/solicitudes.service';
import type { Solicitud } from '../../../types';

export default function DetalleOfertaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; solicitudId: string }>();
  const ofertaId   = params.id         ?? '';
  const solicitudId = params.solicitudId ?? '';

  const { data: oferta, isLoading } = useOfertaById(solicitudId, ofertaId);
  const { mutate: accept, isPending } = useAcceptOffer();

  const [solicitud, setSolicitud] = React.useState<Solicitud | null>(null);

  React.useEffect(() => {
    if (!solicitudId) return;
    getSolicitudById(solicitudId).then(setSolicitud);
  }, [solicitudId]);

  const isOpen = solicitud?.status === 'OPEN';

  const handleElegir = () => {
    if (!oferta) return;
    Alert.alert(
      'Confirmar elección',
      `¿Elegís la oferta de ${oferta.corralonName} por $${oferta.totalPrice.toLocaleString('es-AR')}? Esta acción cierra la licitación.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            accept(
              {
                solicitudId,
                ofertaId,
                corralonId: oferta.corralonId,
              },
              {
                onSuccess: () => {
                  router.replace({
                    pathname: '/(constructor)/oferta-aceptada',
                    params: {
                      corralonId:     oferta.corralonId,
                      corralonName:   oferta.corralonName,
                      solicitudTitle: solicitud?.title ?? '',
                      totalPrice:     String(oferta.totalPrice),
                    },
                  });
                },
                onError: (err: Error) => {
                  Alert.alert('Error', err.message);
                },
              }
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </View>
    );
  }

  if (!oferta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontró la oferta.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shippingLabel = {
    FREE:        { text: 'Incluido', variant: 'success' as const },
    CHARGED:     { text: `$${(oferta.shippingPrice ?? 0).toLocaleString('es-AR')}`, variant: 'warning' as const },
    FIXED_PRICE: { text: 'A convenir', variant: 'gray' as const },
  }[oferta.shippingType];

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detalle de oferta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Corralón + precio */}
        <Card style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>
                {oferta.corralonName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{oferta.corralonName}</Text>
              <View style={styles.heroBadges}>
                {oferta.isBestPrice && <Pill label="⭐ Mejor precio" variant="brand" />}
                {oferta.isFastDelivery && <Pill label="⚡ Entrega rápida" variant="info" />}
              </View>
            </View>
          </View>
          <Text style={styles.heroPrice}>
            ${oferta.totalPrice.toLocaleString('es-AR')}
          </Text>
          <Text style={styles.heroPriceLabel}>Precio total (materiales)</Text>
        </Card>

        {/* Condiciones */}
        <Text style={styles.sectionTitle}>Condiciones</Text>
        <Card>
          <DetailRow
            label="Envío"
            value={shippingLabel.text}
            pill={<Pill label={shippingLabel.text} variant={shippingLabel.variant} />}
          />
          <DetailRow label="Tiempo de entrega" value={`${oferta.deliveryHours} horas hábiles`} />
          <DetailRow
            label="Oferta válida hasta"
            value={format(oferta.validUntil, "d 'de' MMMM, HH:mm", { locale: es })}
          />
        </Card>

        {/* Comentario */}
        {oferta.comment ? (
          <>
            <Text style={styles.sectionTitle}>Nota del corralón</Text>
            <Card>
              <Text style={styles.commentText}>"{oferta.comment}"</Text>
            </Card>
          </>
        ) : null}

        {/* Fecha */}
        <Text style={styles.dateText}>
          Oferta presentada el{' '}
          {format(oferta.createdAt, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
        </Text>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      {isOpen && oferta.status === 'ACTIVE' && (
        <View style={styles.footer}>
          <Button
            label={isPending ? 'Cerrando licitación...' : 'Elegir esta oferta'}
            onPress={handleElegir}
            loading={isPending}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

function DetailRow({
  label,
  value,
  pill,
}: {
  label: string;
  value: string;
  pill?: React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {pill ?? <Text style={styles.detailValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.gray[500], marginBottom: 12 },
  backLink: { color: colors.brand[500], fontWeight: '600' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 16 },
  heroCard: { marginBottom: 16, alignItems: 'center', paddingVertical: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, alignSelf: 'flex-start' },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: { fontSize: 20, fontWeight: '700', color: colors.brand[600] },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  heroBadges: { flexDirection: 'row', gap: 6 },
  heroPrice: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.brand[600],
    marginBottom: 4,
  },
  heroPriceLabel: { fontSize: 13, color: colors.gray[500] },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: { fontSize: 14, color: colors.gray[600] },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  commentText: { fontSize: 14, color: colors.gray[700], fontStyle: 'italic', lineHeight: 20 },
  dateText: { fontSize: 12, color: colors.gray[400], textAlign: 'center', marginTop: 16 },
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
