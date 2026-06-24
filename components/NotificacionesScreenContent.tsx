import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useAuthStore } from '../stores/authStore';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '../hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import type { Notification, UserRole } from '../types';

export function NotificacionesScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const role = useAuthStore((s) => s.role);

  const { data: notifications = [], isLoading, refetch, isFetching } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const unreadIds = useMemo(
    () => notifications.filter((n) => !n.read).map((n) => n.id),
    [notifications]
  );

  const handleOpen = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    routeForNotification(router, role, n);
  };

  const handleMarkAll = () => {
    if (unreadIds.length === 0) return;
    markAllAsRead(unreadIds);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        {unreadIds.length > 0 && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.markAll}>Marcar todas leídas</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={handleOpen} />
          )}
          contentContainerStyle={notifications.length === 0 ? styles.empty : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.brand[500]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyInner}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptyDesc}>
                Vas a ver acá las novedades de tus licitaciones y ofertas.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function routeForNotification(
  router: ReturnType<typeof useRouter>,
  role: UserRole | null,
  n: Notification
) {
  // Constructor — su contexto es la solicitud; las notificaciones le piden
  // revisar las ofertas recibidas o el cierre de la licitación.
  if (role === 'constructor') {
    if (n.type === 'NEW_OFFER' && n.solicitudId) {
      router.push({ pathname: '/(constructor)/comparar/[id]', params: { id: n.solicitudId } });
      return;
    }
    if (n.type === 'DEADLINE_NEAR' && n.solicitudId) {
      router.push({ pathname: '/(constructor)/comparar/[id]', params: { id: n.solicitudId } });
      return;
    }
    return;
  }

  // Corralón — abre el detalle de la solicitud (feed) o el cierre cuando ganó/perdió.
  if (role === 'corralon') {
    if (n.type === 'NEW_REQUEST' && n.solicitudId) {
      router.push({ pathname: '/(corralon)/solicitud/[id]', params: { id: n.solicitudId } });
      return;
    }
    if (n.type === 'OFFER_WON' && n.solicitudId) {
      router.push({
        pathname: '/(corralon)/venta-cerrada',
        params: { solicitudId: n.solicitudId },
      });
      return;
    }
    if (n.type === 'OFFER_LOST') {
      router.push('/(corralon)/mis-ofertas');
      return;
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  markAll: { fontSize: 13, color: colors.brand[600], fontWeight: '600' },
  empty: { flexGrow: 1, justifyContent: 'center' },
  emptyInner: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[700], marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
