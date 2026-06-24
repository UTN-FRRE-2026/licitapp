import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { onAuthStateChange, getMyProfile } from '../services/auth.service';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useImmersiveNavBar } from '../hooks/useImmersiveNavBar';

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

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      if (user.role === 'constructor') {
        router.replace('/(constructor)');
      } else {
        router.replace('/(corralon)');
      }
    }
  }, [user, loading, segments]);

  return <Slot />;
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
