import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../services/notifications.service';
import { useAuthStore } from '../stores/authStore';
import type { Notification } from '../types';

const NOTIFICATIONS_KEY = (uid?: string) => ['notifications', uid] as const;

// ─── Lista completa ──────────────────────────────────────────────────────────

export function useNotifications() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery<Notification[]>({
    queryKey: NOTIFICATIONS_KEY(uid),
    queryFn: getMyNotifications,
    enabled: !!uid,
    refetchInterval: 30_000, // refresco suave en background
  });
}

// ─── Contador de no leídas (para el badge del tab Alertas) ───────────────────

export function useUnreadCount(): number {
  const { data = [] } = useNotifications();
  return data.filter((n) => !n.read).length;
}

// ─── Marcar una como leída con update optimista ──────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  const key = NOTIFICATIONS_KEY(uid);

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Notification[]>(key);
      if (prev) {
        queryClient.setQueryData<Notification[]>(
          key,
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

// ─── Marcar todas como leídas ────────────────────────────────────────────────

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  const key = NOTIFICATIONS_KEY(uid);

  return useMutation({
    mutationFn: (ids: string[]) => markAllAsRead(ids),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Notification[]>(key);
      if (prev) {
        queryClient.setQueryData<Notification[]>(
          key,
          prev.map((n) => ({ ...n, read: true }))
        );
      }
      return { prev };
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

// ─── Helper para invalidar manualmente (cuando llega un push) ────────────────

export function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);
  return () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(uid) });
}
