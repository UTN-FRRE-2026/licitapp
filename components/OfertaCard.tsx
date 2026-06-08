// Tarjeta de oferta para "Mis Ofertas" del corralón (pantalla 15)
import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../constants/colors';
import { Card } from './ui/Card';
import { Pill } from './ui/Pill';
import { useWithdrawOferta } from '../hooks/useOfertas';
import type { Oferta } from '../types';

const STATUS_MAP: Record<
  string,
  { label: string; variant: React.ComponentProps<typeof Pill>['variant'] }
> = {
  ACTIVE:    { label: 'Activa',    variant: 'success' },
  WON:       { label: 'Ganada ✓', variant: 'brand'   },
  LOST:      { label: 'Perdida',  variant: 'danger'   },
  EXPIRED:   { label: 'Vencida',  variant: 'gray'     },
  WITHDRAWN: { label: 'Retirada', variant: 'gray'     },
};

interface OfertaCardProps {
  oferta: Oferta;
}

export function OfertaCard({ oferta }: OfertaCardProps) {
  const router = useRouter();
  const { mutate: withdraw, isPending } = useWithdrawOferta();

  const handlePress = () => {
    if (oferta.status === 'WON') {
      router.push({
        pathname: '/(corralon)/venta-cerrada',
        params: {
          solicitudId:    oferta.solicitudId,
          solicitudTitle: oferta.solicitudTitle ?? '',
          totalPrice:     String(oferta.totalPrice),
        },
      });
    }
  };

  const statusInfo = STATUS_MAP[oferta.status] ?? STATUS_MAP.ACTIVE;
  const deadlinePast = oferta.solicitudDeadline ? isPast(oferta.solicitudDeadline) : false;
  const timeLeft =
    oferta.solicitudDeadline && !deadlinePast
      ? formatDistanceToNow(oferta.solicitudDeadline, { addSuffix: true, locale: es })
      : undefined;

  const handleRetirar = () => {
    Alert.alert(
      'Retirar oferta',
      '¿Estás seguro? No podrás volver a presentar oferta en esta licitación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar',
          style: 'destructive',
          onPress: () =>
            withdraw({ solicitudId: oferta.solicitudId, ofertaId: oferta.id }),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={oferta.status === 'WON' ? 0.7 : 1}
    >
    <Card style={[styles.card, oferta.status === 'WON' && styles.cardWon]}>
      {/* Header: título + estado */}
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {oferta.solicitudTitle ?? 'Licitación'}
        </Text>
        <Pill label={statusInfo.label} variant={statusInfo.variant} />
      </View>

      {/* Badges */}
      {(oferta.isBestPrice || oferta.isFastDelivery) && (
        <View style={styles.badges}>
          {oferta.isBestPrice && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⭐ Mejor precio</Text>
            </View>
          )}
          {oferta.isFastDelivery && (
            <View style={[styles.badge, styles.badgeFast]}>
              <Text style={[styles.badgeText, styles.badgeFastText]}>⚡ Entrega rápida</Text>
            </View>
          )}
        </View>
      )}

      {/* Precio + detalle */}
      <View style={styles.priceRow}>
        <Text style={styles.price}>${oferta.totalPrice.toLocaleString('es-AR')}</Text>
        <Text style={styles.delivery}>
          Entrega: {oferta.deliveryHours}h
          {oferta.shippingType === 'FREE' ? '  · Envío gratis' : ''}
          {oferta.shippingType === 'CHARGED' ? `  · +$${oferta.shippingPrice ?? 0} envío` : ''}
        </Text>
      </View>

      {/* Countdown + boton retirar */}
      <View style={styles.footer}>
        {timeLeft ? (
          <Text style={styles.timeLeft}>Cierra {timeLeft}</Text>
        ) : deadlinePast ? (
          <Text style={[styles.timeLeft, styles.timeExpired]}>Vencida</Text>
        ) : (
          <View />
        )}
        {oferta.status === 'ACTIVE' && (
          <TouchableOpacity
            style={styles.retirarBtn}
            onPress={handleRetirar}
            disabled={isPending}
          >
            <Text style={styles.retirarText}>
              {isPending ? 'Retirando...' : 'Retirar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  cardWon: {
    borderWidth: 2,
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  badges: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: {
    backgroundColor: colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeFast: { backgroundColor: colors.infoBg },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.warningText },
  badgeFastText: { color: colors.infoText },
  priceRow: { marginBottom: 10 },
  price: { fontSize: 22, fontWeight: '800', color: colors.brand[600] },
  delivery: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  timeLeft: { fontSize: 12, color: colors.gray[500] },
  timeExpired: { color: colors.danger },
  retirarBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  retirarText: { fontSize: 12, fontWeight: '600', color: colors.danger },
});
