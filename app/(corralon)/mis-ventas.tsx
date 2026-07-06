// Pantalla — Mis ventas (corralón): historial de ofertas ganadas. Deriva de
// /api/ofertas/mine filtrando las WON (no requiere endpoints nuevos).
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../constants/colors';
import { BackButton } from '../../components/ui/BackButton';
import { Card } from '../../components/ui/Card';
import { useMyOfertas } from '../../hooks/useOfertas';
import type { Oferta } from '../../types';

export default function MisVentasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: ofertas = [], isLoading, refetch, isRefetching } = useMyOfertas();

  const ganadas = useMemo(
    () =>
      ofertas
        .filter((o) => o.status === 'WON')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [ofertas]
  );

  const totalFacturado = useMemo(
    () => ganadas.reduce((acc, o) => acc + o.totalPrice, 0),
    [ganadas]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <BackButton />
        <Text style={styles.navTitle}>Mis ventas</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <FlatList
          data={ganadas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VentaCard oferta={item} />}
          contentContainerStyle={ganadas.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand[500]}
            />
          }
          ListHeaderComponent={
            ganadas.length > 0 ? (
              <Card style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryNum}>{ganadas.length}</Text>
                  <Text style={styles.summaryLabel}>Ventas cerradas</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNum, { color: colors.success }]}>
                    ${totalFacturado.toLocaleString('es-AR')}
                  </Text>
                  <Text style={styles.summaryLabel}>Total facturado</Text>
                </View>
              </Card>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Todavía no cerraste ventas</Text>
              <Text style={styles.emptyDesc}>
                Cuando un constructor elija una de tus ofertas, la vas a ver acá.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function VentaCard({ oferta }: { oferta: Oferta }) {
  const router = useRouter();
  const fecha = format(oferta.createdAt, "d 'de' MMMM yyyy", { locale: es });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(corralon)/venta-cerrada',
          params: { solicitudId: oferta.solicitudId },
        })
      }
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {oferta.solicitudTitle ?? 'Pedido'}
          </Text>
          <View style={styles.wonBadge}>
            <Text style={styles.wonText}>Ganada</Text>
          </View>
        </View>
        <Text style={styles.price}>${oferta.totalPrice.toLocaleString('es-AR')}</Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>🚚</Text>
          <Text style={styles.cardText}>Entrega en {oferta.deliveryHours} h</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardText}>Ofertada el {fecha}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
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
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },

  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },

  summaryCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, paddingVertical: 18 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  summaryLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4, fontWeight: '500' },
  summaryDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.gray[100] },

  card: { marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  wonBadge: { backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  wonText: { fontSize: 11, fontWeight: '700', color: colors.successText },
  price: { fontSize: 22, fontWeight: '800', color: colors.brand[600], marginBottom: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardIcon: { fontSize: 12 },
  cardText: { fontSize: 12, color: colors.gray[600] },

  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[700], marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
