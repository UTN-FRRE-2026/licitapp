// Pantalla — Login
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { login } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const profile = await login(data.email, data.password);
      setUser(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Email o contraseña incorrectos.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Logo pequeño */}
        <Text style={styles.logo}>
          Licit<Text style={styles.logoAccent}>App</Text>
        </Text>

        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>Ingresá con tu cuenta para continuar.</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Correo electrónico"
              placeholder="vos@ejemplo.com"
              onChangeText={onChange}
              value={value}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Contraseña"
              placeholder="Tu contraseña"
              onChangeText={onChange}
              value={value}
              error={errors.password?.message}
              secureTextEntry={!showPassword}
              rightIcon={
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPassword((p) => !p)}
            />
          )}
        />

        <Button
          label="Iniciar sesión"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitBtn}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/elegir-rol')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>
            ¿No tenés cuenta?{' '}
            <Text style={styles.link}>Registrate gratis</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { marginBottom: 32 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.gray[700] },
  logo: { fontSize: 32, fontWeight: '800', color: colors.gray[900], marginBottom: 24, letterSpacing: -1 },
  logoAccent: { color: colors.brand[500] },
  title: { fontSize: 26, fontWeight: '700', color: colors.gray[900], marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray[500], marginBottom: 28 },
  eyeIcon: { fontSize: 18 },
  submitBtn: { marginTop: 8 },
  registerLink: { paddingVertical: 16, alignItems: 'center' },
  registerText: { fontSize: 13, color: colors.gray[500] },
  link: { color: colors.brand[600], fontWeight: '600' },
});
