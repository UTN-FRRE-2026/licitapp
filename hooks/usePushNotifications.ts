import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  addReceivedListener,
  addResponseListener,
  registerForPushNotifications,
} from '../services/push.service';
import { useAuthStore } from '../stores/authStore';
import { useInvalidateNotifications } from './useNotifications';
import type { NotificationType } from '../types';

// Side-effect hook: registra el dispositivo cuando hay un usuario logueado,
// refresca la lista del centro de alertas cuando llega un push en foreground
// y enruta cuando el usuario toca la notificación.
//
// Se monta una sola vez en el root (`app/_layout.tsx`). El registro de token
// se dispara al cambiar el usuario; los listeners viven mientras la app esté
// montada (se desuscriben en cleanup para evitar duplicados en hot reload).

export function usePushNotifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const invalidate = useInvalidateNotifications();

  // 1. Registrar token cada vez que cambia el usuario logueado.
  useEffect(() => {
    if (!user) return;
    void registerForPushNotifications(user.pushToken);
  }, [user?.uid]);

  // 2. Push recibido con la app abierta → refrescar el centro de alertas.
  useEffect(() => {
    return addReceivedListener(() => invalidate());
  }, [invalidate]);

  // 3. Usuario tocó la notificación → navegar al recurso asociado.
  useEffect(() => {
    return addResponseListener((data) => {
      const type = data.type as NotificationType | undefined;
      const solicitudId = typeof data.solicitudId === 'string' ? data.solicitudId : undefined;

      // Siempre refrescamos antes de navegar para que el badge baje al instante.
      invalidate();

      if (!type) return;

      if (role === 'constructor') {
        if ((type === 'NEW_OFFER' || type === 'DEADLINE_NEAR') && solicitudId) {
          router.push({
            pathname: '/(constructor)/comparar/[id]',
            params: { id: solicitudId },
          });
          return;
        }
        router.push('/(constructor)/notificaciones');
        return;
      }

      if (role === 'corralon') {
        if (type === 'NEW_REQUEST' && solicitudId) {
          router.push({
            pathname: '/(corralon)/solicitud/[id]',
            params: { id: solicitudId },
          });
          return;
        }
        if (type === 'OFFER_WON' && solicitudId) {
          router.push({
            pathname: '/(corralon)/venta-cerrada',
            params: { solicitudId },
          });
          return;
        }
        if (type === 'OFFER_LOST') {
          router.push('/(corralon)/mis-ofertas');
          return;
        }
        router.push('/(corralon)/notificaciones');
      }
    });
  }, [router, role, invalidate]);
}
