// Tarjeta de solicitud para el feed del corralón (pantalla 12)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../constants/colors';
import { Card } from './ui/Card';
import { Pill } from './ui/Pill';
import type { Solicitud } from '../types';

interface FeedCardProps {
  solicitud: Solicitud;
}

export function FeedCard({ solicitud }: FeedCardProps) {
  const router = useRouter();
  const { id, title, constructorName, deliveryZone, deadline, ofertasCount } = solicitud;

  const deadlinePassed = isPast(deadline);
  const timeLeft = deadlinePassed
    ? 'Vencida'
    : `Cierra en ${formatDistanceToNow(deadline, { locale: es })}`;

  const isUrgent =
    !deadlinePassed &&
    deadline.getTime() - Date.now() < 3 * 60 * 60 * 1000; // menos de 3h

  const handleVerPedido = () => router.push(`/(corralon)/solicitud/${id}`);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>👤 {constructorName.split(' ')[0]}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>📍 {deliveryZone.split(',')[0]}</Text>
          </View>
        </View>
        {ofertasCount === 0 ? (
          <Pill label="Nueva" variant="brand" dot />
        ) : (
          <Pill label={`${ofertasCount} oferta${ofertasCount !== 1 ? 's' : ''}`} variant="info" />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={[styles.timeText, isUrgent && styles.timeUrgent, deadlinePassed && styles.timeExpired]}>
            {timeLeft}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.verBtn, ofertasCount > 0 && styles.verBtnSecondary]}
          onPress={handleVerPedido}
        >
          <Text style={[styles.verBtnText, ofertasCount > 0 && styles.verBtnTextSecondary]}>
            Ver pedido
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: { flex: 1, marginRight: 10 },
  title: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginBottom: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { fontSize: 12, color: colors.gray[500] },
  metaDot: { fontSize: 12, color: colors.gray[300] },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeIcon: { fontSize: 12 },
  timeText: { fontSize: 12, color: colors.gray[500], fontWeight: '500' },
  timeUrgent: { color: colors.warningText, fontWeight: '700' },
  timeExpired: { color: colors.danger },
  verBtn: {
    backgroundColor: colors.brand[500],
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  verBtnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  verBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
  verBtnTextSecondary: { color: colors.gray[900] },
});
