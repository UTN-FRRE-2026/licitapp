// Pantalla 04 — Home / Mis licitaciones
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { useMySolicitudesPaged, useSolicitudesStats } from '../../hooks/useSolicitudes';
import { useUnreadCount } from '../../hooks/useNotifications';
import { SolicitudCard } from '../../components/SolicitudCard';
import type { Solicitud } from '../../types';

export default function HomeConstructorScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount();

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMySolicitudesPaged();
  // Aplanamos las páginas; el backend ya las devuelve con la más nueva primero.
  const solicitudes = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? solicitudes.length;
  const { activas, cerradas, totalOfertas } = useSolicitudesStats();

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const handleNuevaSolicitud = () => router.push('/(constructor)/nueva-solicitud');

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={solicitudes}
        keyExtractor={(item: Solicitud) => item.id}
        renderItem={({ item }) => <SolicitudCard solicitud={item} />}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand[500]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0) ?? '?'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.greeting}>Hola,</Text>
                  <Text style={styles.name}>
                    {user?.fullName?.split(' ')[0]} 👋
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push('/(constructor)/notificaciones')}
              >
                <Text style={styles.notifIcon}>🔔</Text>
                {unread > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Banner CTA */}
            <View style={styles.banner}>
              <View style={styles.bannerCircle} />
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>¿Necesitás materiales?</Text>
                <Text style={styles.bannerSub}>
                  Subí tu lista y recibí ofertas en horas.
                </Text>
                <TouchableOpacity
                  style={styles.bannerBtn}
                  onPress={handleNuevaSolicitud}
                >
                  <Text style={styles.bannerBtnText}>+ Nueva licitación</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardBrand]}>
                <Text style={[styles.statNum, styles.statNumBrand]}>
                  {activas}
                </Text>
                <Text style={[styles.statLabel, styles.statLabelBrand]}>
                  Activas
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{cerradas}</Text>
                <Text style={styles.statLabel}>Cerradas</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{totalOfertas}</Text>
                <Text style={styles.statLabel}>Ofertas totales</Text>
              </View>
            </View>

            {/* Sección header */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Mis licitaciones</Text>
              {total > 0 && (
                <Text style={styles.sectionCount}>
                  {total} en total
                </Text>
              )}
            </View>

            {/* Loading o empty */}
            {isLoading && (
              <ActivityIndicator
                color={colors.brand[500]}
                style={{ marginTop: 40 }}
              />
            )}
            {!isLoading && solicitudes.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Todavía no tenés licitaciones</Text>
                <Text style={styles.emptyDesc}>
                  Creá tu primera solicitud y recibí ofertas de corralones de tu zona.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={handleNuevaSolicitud}
                >
                  <Text style={styles.emptyBtnText}>Crear primera licitación</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              color={colors.brand[500]}
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View style={{ height: 20 }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray[50] },
  list: { padding: 20, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: colors.white },
  greeting: { fontSize: 12, color: colors.gray[500], fontWeight: '500' },
  name: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifIcon: { fontSize: 18 },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  notifBadgeText: { fontSize: 10, color: colors.white, fontWeight: '700', lineHeight: 11 },

  // Banner
  banner: {
    backgroundColor: colors.brand[500],
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bannerContent: { position: 'relative' },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: colors.white, marginBottom: 4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 14 },
  bannerBtn: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  bannerBtnText: { fontSize: 14, fontWeight: '700', color: colors.brand[700] },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  statCardBrand: { backgroundColor: colors.brand[50], borderColor: colors.brand[100] },
  statNum: { fontSize: 24, fontWeight: '700', color: colors.gray[900], lineHeight: 28 },
  statNumBrand: { color: colors.brand[700] },
  statLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4, fontWeight: '500' },
  statLabelBrand: { color: colors.brand[700] },

  // Sección
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  sectionCount: { fontSize: 13, color: colors.gray[400] },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[700], marginBottom: 6 },
  emptyDesc: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: colors.brand[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: colors.white, fontWeight: '600', fontSize: 14 },
});
