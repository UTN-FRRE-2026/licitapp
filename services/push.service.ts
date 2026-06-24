import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { updateMyProfile } from './auth.service';

// Desde Expo SDK 53, Expo Go ya no incluye el módulo nativo de push y solo
// con importar `expo-notifications` se dispara una excepción a nivel módulo.
// Detectamos el entorno y, si estamos en Expo Go, todas las funciones son no-op.
// En dev builds / APK / standalone, el módulo se carga normal.

const isExpoGo = Constants.executionEnvironment === 'storeClient';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;
let warnedOnce = false;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        '[push] Expo Go no soporta push notifications desde SDK 53. ' +
          'Para probar push hacé un dev build (eas build --profile development) o instalá la APK preview.'
      );
    }
    return null;
  }
  if (!cached) {
    // `require` perezoso: evita que Metro evalúe el módulo en Expo Go.
    cached = require('expo-notifications') as NotificationsModule;
  }
  return cached;
}

// ─── Foreground handler ───────────────────────────────────────────────────────
// Se setea la primera vez que getNotifications() devuelve el módulo.

let handlerInitialized = false;
function ensureForegroundHandler(N: NotificationsModule): void {
  if (handlerInitialized) return;
  handlerInitialized = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// ─── Canal de Android ─────────────────────────────────────────────────────────

async function ensureAndroidChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync('default', {
    name: 'Alertas',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// ─── Permisos ─────────────────────────────────────────────────────────────────

async function ensurePermissions(N: NotificationsModule): Promise<boolean> {
  const existing = await N.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const next = await N.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return next.granted;
}

// ─── Registrar el dispositivo y guardar el token en el backend ────────────────

export async function registerForPushNotifications(
  currentSavedToken?: string
): Promise<string | null> {
  const N = getNotifications();
  if (!N) return null;

  try {
    ensureForegroundHandler(N);
    await ensureAndroidChannel(N);
    const granted = await ensurePermissions(N);
    if (!granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

    const { data: token } = await N.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    if (token && token !== currentSavedToken) {
      try {
        await updateMyProfile({ pushToken: token });
      } catch {
        // El backend puede no haber implementado el endpoint todavía: no frenamos.
      }
    }

    return token ?? null;
  } catch {
    return null;
  }
}

// ─── Listeners ────────────────────────────────────────────────────────────────

export function addReceivedListener(handler: () => void): () => void {
  const N = getNotifications();
  if (!N) return () => undefined;
  const sub = N.addNotificationReceivedListener(() => handler());
  return () => sub.remove();
}

export function addResponseListener(
  handler: (data: Record<string, unknown>) => void
): () => void {
  const N = getNotifications();
  if (!N) return () => undefined;
  const sub = N.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    handler(data as Record<string, unknown>);
  });
  return () => sub.remove();
}
