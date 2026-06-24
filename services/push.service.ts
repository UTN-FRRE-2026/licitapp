import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { updateMyProfile } from './auth.service';

// ─── Foreground handler ───────────────────────────────────────────────────────
// Cuando llega un push y la app está abierta, lo mostramos como banner + lista.
// No reproducimos sonido (lo dejamos al sistema operativo del usuario) ni
// incrementamos el badge nativo (la lógica de "no leídas" la maneja el backend).

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Canal de Android ─────────────────────────────────────────────────────────
// Android 8.0+ exige declarar al menos un canal para mostrar notificaciones.
// Usamos el canal "default" con prioridad alta para que aparezcan como heads-up.

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Alertas',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ─── Permisos ─────────────────────────────────────────────────────────────────

async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  // No volvemos a pedir si el usuario ya denegó explícitamente.
  if (!existing.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return next.granted;
}

// ─── Registrar el dispositivo y guardar el token en el backend ────────────────
// Devuelve el Expo Push Token (o null si no se obtuvo). Idempotente: solo
// actualiza el perfil cuando el token cambió respecto del almacenado.

export async function registerForPushNotifications(
  currentSavedToken?: string
): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    const granted = await ensurePermissions();
    if (!granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    if (token && token !== currentSavedToken) {
      try {
        await updateMyProfile({ pushToken: token });
      } catch {
        // No frenamos el flujo si el backend rechaza el token: el centro
        // in-app sigue funcionando, y reintentamos al próximo login.
      }
    }

    return token ?? null;
  } catch {
    // expo-notifications puede tirar en emuladores / web. Lo ignoramos.
    return null;
  }
}

// ─── Listeners ────────────────────────────────────────────────────────────────
// onReceived → push entró con la app abierta: usado para refrescar el centro.
// onResponded → el usuario tocó la notificación (foreground o desde lockscreen).

export function addReceivedListener(handler: () => void): () => void {
  const sub = Notifications.addNotificationReceivedListener(() => handler());
  return () => sub.remove();
}

export function addResponseListener(
  handler: (data: Record<string, unknown>) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    handler(data as Record<string, unknown>);
  });
  return () => sub.remove();
}
