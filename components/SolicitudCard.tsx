import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../constants/colors';
import { Card } from './ui/Card';
import { Pill } from './ui/Pill';
import type { Solicitud } from '../types';

interface SolicitudCardProps {
  solicitud: Solicitud;
}

export function SolicitudCard({ solicitud }: SolicitudCardProps) {
  const router = useRouter();
  const { id, title, deliveryZone, deadline, status, ofertasCount } = solicitud;

  const deadlinePassed = isPast(deadline);
  const timeLeft = deadlinePassed
    ? 'Vencida'
    : `Cierra en ${formatDistanceToNow(deadline, { locale: es })}`;

  const handlePress = () => {
    if (status === 'OPEN' && ofertasCount > 0) {
      router.push(`/(constructor)/comparar/${id}`);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.zone} numberOfLines={1}>{deliveryZone}</Text>
        </View>
        <StatusPill status={status} ofertasCount={ofertasCount} />
      </View>

      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeIcon}>🕐</Text>
          <Text style={[styles.timeText, deadlinePassed && styles.timeExpired]}>
            {timeLeft}
          </Text>
        </View>
        {status === 'OPEN' && ofertasCount > 0 ? (
          <TouchableOpacity onPress={handlePress}>
            <Text style={styles.link}>Ver ofertas →</Text>
          </TouchableOpacity>
        ) : status === 'OPEN' ? (
          <Text style={styles.noOffers}>Sin ofertas aún</Text>
        ) : status === 'CLOSED' ? (
          <Text style={styles.closed}>Cerrada</Text>
        ) : null}
      </View>
    </Card>
  );
}

function StatusPill({ status, ofertasCount }: { status: Solicitud['status']; ofertasCount: number }) {
  if (status === 'OPEN' && ofertasCount > 0) {
    return <Pill label={`${ofertasCount} oferta${ofertasCount !== 1 ? 's' : ''}`} variant="success" dot />;
  }
  if (status === 'OPEN') {
    return <Pill label="En espera" variant="warning" dot />;
  }
  if (status === 'CLOSED') {
    return <Pill label="Aceptada" variant="gray" dot />;
  }
  if (status === 'EXPIRED') {
    return <Pill label="Vencida" variant="danger" dot />;
  }
  return <Pill label="Cancelada" variant="gray" dot />;
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
  title: { fontSize: 15, fontWeight: '700', color: colors.gray[900], marginBottom: 2 },
  zone: { fontSize: 12, color: colors.gray[500] },
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
  timeExpired: { color: colors.danger },
  link: { fontSize: 12, fontWeight: '600', color: colors.brand[600] },
  noOffers: { fontSize: 12, color: colors.gray[400] },
  closed: { fontSize: 12, color: colors.gray[400] },
});
