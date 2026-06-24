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
import { Card } from '../../components/ui/Card';
import { useMySolicitudes } from '../../hooks/useSolicitudes';
import type { Solicitud } from '../../types';

export default function MisCierresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: solicitudes = [], isLoading, refetch, isRefetching } = useMySolicitudes();

  const cerradas = useMemo(
    () =>
      solicitudes
        .filter((s) => s.status === 'CLOSED')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [solicitudes]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mis cierres</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <FlatList
          data={cerradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CierreCard solicitud={item} />}
          contentContainerStyle={
            cerradas.length === 0 ? styles.emptyContainer : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>Sin cierres aún</Text>
              <Text style={styles.emptyDesc}>
                Cuando aceptes una oferta y cierres una licitación, vas a verla acá.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function CierreCard({ solicitud }: { solicitud: Solicitud }) {
  const router = useRouter();
  const fecha = format(solicitud.createdAt, "d 'de' MMMM yyyy", { locale: es });

  const handlePress = () => {
    if (!solicitud.winningOfferId) return;
    // Reutilizamos la pantalla "oferta-aceptada" pasando los datos que ya tenemos.
    // El corralonId/corralonName real lo enriquece esa pantalla al cargar el perfil.
    router.push({
      pathname: '/(constructor)/oferta-aceptada',
      params: {
        corralonId: '',
        corralonName: '',
        solicitudTitle: solicitud.title,
        totalPrice: '',
      },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{solicitud.title}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Cerrada</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📍</Text>
          <Text style={styles.cardText} numberOfLines={1}>{solicitud.deliveryZone}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardText}>Publicada el {fecha}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardIcon}>📦</Text>
          <Text style={styles.cardText}>
            {solicitud.ofertasCount} oferta{solicitud.ofertasCount === 1 ? '' : 's'} recibida
            {solicitud.ofertasCount === 1 ? '' : 's'}
          </Text>
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
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },

  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },

  card: { marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  statusBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: '700', color: colors.successText },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardIcon: { fontSize: 12 },
  cardText: { fontSize: 12, color: colors.gray[600] },

  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[700], marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
