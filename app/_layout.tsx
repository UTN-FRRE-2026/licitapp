import React, { useEffect } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { onAuthStateChange, getMyProfile } from '../services/auth.service';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useImmersiveNavBar } from '../hooks/useImmersiveNavBar';
import { LoadingScreen } from '../components/ui/LoadingScreen';

// Mantener el splash nativo visible hasta que sepamos si hay sesión (evita el
// parpadeo del login cuando el usuario ya está logueado).
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { user, loading, setUser, setLoading, clear } = useAuthStore();

  usePushNotifications();
  useImmersiveNavBar();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Reintentos cortos: justo después del registro el perfil puede estar
        // sincronizándose en el backend y /me devolver 404 por un instante.
        let profile = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            profile = await getMyProfile();
            break;
          } catch {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
        if (profile) setUser(profile);
        else clear();
      } else {
        clear();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Re-sincroniza el perfil desde el backend cada vez que la app vuelve al primer
  // plano (y por ende tras iniciar sesión). Así, si cambia el rol/datos en la DB,
  // la app lo toma sin necesidad de re-registrarse ni reiniciar.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (!useAuthStore.getState().user) return;
      getMyProfile()
        .then((fresh) => setUser(fresh))
        .catch(() => {
          /* silencioso: si falla, se mantiene el perfil actual */
        });
    });
    return () => sub.remove();
  }, []);

  const group = segments[0];
  const inAuthGroup = group === '(auth)';

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)');
      return;
    }

    // Con usuario: asegurar que esté en el layout que corresponde a su rol.
    // Cubre el login (viene de (auth)) y un cambio de rol en caliente (quedó en el
    // grupo equivocado tras el re-sync).
    if (user.role === 'constructor') {
      if (inAuthGroup || group === '(corralon)') router.replace('/(constructor)');
    } else {
      if (inAuthGroup || group === '(constructor)') router.replace('/(corralon)');
    }
  }, [user, loading, segments]);

  // "Listo" = sesión resuelta Y el usuario ya está en el grupo que le corresponde.
  // Mientras no lo esté, se muestra la pantalla de carga por encima del Slot, así
  // nunca se ve el login si hay sesión (ni la pantalla equivocada durante el redirect).
  const onDestinationGroup = user
    ? user.role === 'constructor'
      ? group === '(constructor)'
      : group === '(corralon)'
    : inAuthGroup;
  const ready = !loading && segments.length > 0 && onDestinationGroup;

  // Ocultar el splash nativo recién cuando estamos en la pantalla final.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // El Slot se mantiene SIEMPRE montado (expo-router lo necesita para navegar);
  // la pantalla de carga se superpone como overlay hasta que todo esté listo.
  return (
    <>
      <Slot />
      {!ready && (
        <View style={StyleSheet.absoluteFill}>
          <LoadingScreen />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
