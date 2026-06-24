import { api, poll } from './api';
import type { Notification, NotificationType } from '../types';

// ─── DTO del backend ───────────────────────────────────────────────────────────

interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  solicitudId: string | null;
  ofertaId: string | null;
  read: boolean;
  createdAt: string; // ISO UTC
}

function mapNotification(d: NotificationDto): Notification {
  return {
    id: d.id,
    userId: d.userId,
    type: d.type,
    title: d.title,
    body: d.body,
    solicitudId: d.solicitudId ?? undefined,
    ofertaId: d.ofertaId ?? undefined,
    read: d.read,
    createdAt: new Date(d.createdAt),
  };
}

// ─── Listado del usuario autenticado ──────────────────────────────────────────

export async function getMyNotifications(): Promise<Notification[]> {
  const dtos = await api.get<NotificationDto[]>('/api/notifications');
  return dtos.map(mapNotification);
}

// ─── Marcar una notificación como leída ───────────────────────────────────────

export async function markAsRead(id: string): Promise<void> {
  await api.post<void>(`/api/notifications/${id}/read`);
}

// ─── Marcar todas como leídas (best-effort: ejecuta en paralelo) ─────────────
// El backend (PROMPT-BACKEND-DOTNET.md) no documenta un endpoint bulk; lo
// emulamos disparando las llamadas en paralelo. Si en el futuro existe
// POST /api/notifications/read-all conviene reemplazar esto por una sola request.

export async function markAllAsRead(ids: string[]): Promise<void> {
  await Promise.allSettled(ids.map((id) => markAsRead(id)));
}

// ─── Polling tipo "listener" (mismo contrato que solicitudes/ofertas) ────────

export function listenToMyNotifications(
  callback: (items: Notification[]) => void,
  intervalMs = 30_000
): () => void {
  return poll(
    () => api.get<NotificationDto[]>('/api/notifications'),
    (dtos) => callback(dtos.map(mapNotification)),
    intervalMs
  );
}
