// Pantalla 12 — Home del Corralón: feed de solicitudes en tiempo real
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { FeedCard } from '../../components/FeedCard';
import { useAuthStore } from '../../stores/authStore';
import { useMyOfertasStats } from '../../hooks/useOfertas';
import { listenToFeedByZone } from '../../services/solicitudes.service';
import type { Solicitud } from '../../types';

export default function HomeCorralónScreen() {
  const user = useAuthStore((s) => s.user);
  const { pendientes, ganadas, perdidas } = useMyOfertasStats();

  const [feed, setFeed] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.zone) return;
    const unsubscribe = listenToFeedByZone(user.zone, (solicitudes) => {
      setFeed(solicitudes);
      setLoading(false);
    });
    return unsubscribe;
  }, [user?.zone]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const businessName = user?.businessName ?? user?.fullName ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {businessName.split(' ')[0]} 👋</Text>
          <Text style={styles.zone}>📍 {(user?.zone ?? '').split(',')[0]}</Text>
        </View>
        <View style={styles.notifBtn}>
          <Text style={styles.notifIcon}>🔔</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatChip label="Activas"  value={pendientes} color={colors.brand[500]} />
        <StatChip label="Ganadas"  value={ganadas}    color={colors.success}    />
        <StatChip label="Perdidas" value={perdidas}   color={colors.gray[400]}  />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FeedCard solicitud={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand[500]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {feed.length > 0
                  ? `${feed.length} pedido${feed.length !== 1 ? 's' : ''} disponible${feed.length !== 1 ? 's' : ''}`
                  : 'Pedidos disponibles'}
              </Text>
              <View style={styles.liveDot} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Sin pedidos por ahora</Text>
              <Text style={styles.emptyDesc}>
                Cuando un constructor publique una licitación en tu zona vas a verla acá.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  greeting: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  zone: { fontSize: 13, color: colors.gray[500], marginTop: 2 },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: { fontSize: 18 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    marginBottom: 4,
  },
  chip: { alignItems: 'center' },
  chipValue: { fontSize: 22, fontWeight: '800' },
  chipLabel: { fontSize: 11, color: colors.gray[500], marginTop: 2 },
  list: { padding: 16 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[700] },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[700], marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
