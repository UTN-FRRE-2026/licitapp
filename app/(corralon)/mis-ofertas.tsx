// Pantalla 15 — Mis Ofertas: tabs Pendientes / Ganadas / Perdidas
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { colors } from '../../constants/colors';
import { OfertaCard } from '../../components/OfertaCard';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { useMyOfertas, useMyOfertasStats } from '../../hooks/useOfertas';
import type { Oferta, OfertaStatus } from '../../types';

type Tab = 'pendientes' | 'ganadas' | 'perdidas';

const ACTIVE_STATUSES: OfertaStatus[]  = ['ACTIVE'];
const WON_STATUSES: OfertaStatus[]    = ['WON'];
const LOST_STATUSES: OfertaStatus[]   = ['LOST', 'EXPIRED', 'WITHDRAWN'];

export default function MisOfertasScreen() {
  const [tab, setTab] = useState<Tab>('pendientes');
  const { data: ofertas = [], isLoading, refetch, isFetching } = useMyOfertas();
  const { pendientes, ganadas, perdidas } = useMyOfertasStats();

  const filtered: Oferta[] = ofertas.filter((o) => {
    if (tab === 'pendientes') return ACTIVE_STATUSES.includes(o.status);
    if (tab === 'ganadas')    return WON_STATUSES.includes(o.status);
    return LOST_STATUSES.includes(o.status);
  });

  const segments = [
    { key: 'pendientes' as Tab, label: 'Activas',  count: pendientes },
    { key: 'ganadas'    as Tab, label: 'Ganadas',  count: ganadas    },
    { key: 'perdidas'   as Tab, label: 'Cerradas', count: perdidas   },
  ];

  const emptyMessages: Record<Tab, { icon: string; title: string; desc: string }> = {
    pendientes: {
      icon: '📋',
      title: 'Sin ofertas activas',
      desc: 'Navegá los pedidos del feed y presentá tu primera oferta.',
    },
    ganadas: {
      icon: '🏆',
      title: 'Sin ventas cerradas',
      desc: 'Cuando el constructor elija tu oferta, aparecerá acá.',
    },
    perdidas: {
      icon: '📁',
      title: 'Sin historial',
      desc: 'Las ofertas vencidas o retiradas se guardan acá.',
    },
  };

  const empty = emptyMessages[tab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis ofertas</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <SegmentedControl
          segments={segments}
          selected={tab}
          onSelect={setTab}
        />
      </View>

      {/* Lista */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OfertaCard oferta={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.brand[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{empty.icon}</Text>
              <Text style={styles.emptyTitle}>{empty.title}</Text>
              <Text style={styles.emptyDesc}>{empty.desc}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.gray[900] },
  tabs: {
    padding: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  list: { padding: 16, paddingBottom: 32 },
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
