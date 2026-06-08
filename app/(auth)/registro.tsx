// Pantalla 03 — Crear cuenta
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { register as registerUser } from '../../services/auth.service';
import { useAuthStore } from '../../stores/authStore';
import { ZONES } from '../../constants/zones';
import type { UserRole } from '../../types';

const schema = z.object({
  fullName: z.string().min(2, 'Ingresá tu nombre completo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  phone: z.string().min(8, 'Ingresá tu teléfono'),
  zone: z.string().min(1, 'Seleccioná una zona'),
  businessName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegistroScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const isCorralon = role === 'corralon';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!accepted) {
      Alert.alert('Términos', 'Debés aceptar los términos y condiciones.');
      return;
    }
    try {
      setLoading(true);
      const profile = await registerUser({
        ...data,
        role: role ?? 'constructor',
      });
      setUser(profile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la cuenta.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.step}>PASO 2 DE 2</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>Tardás menos de 1 minuto. Es gratis.</Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nombre completo"
              placeholder={isCorralon ? 'Ej: Corralón Norte' : 'Ej: Martín García'}
              onChangeText={onChange}
              value={value}
              error={errors.fullName?.message}
              autoCapitalize="words"
            />
          )}
        />

        {isCorralon && (
          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nombre comercial"
                placeholder="Ej: Corralón San Martín"
                onChangeText={onChange}
                value={value}
                error={errors.businessName?.message}
              />
            )}
          />
        )}

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
              placeholder="Mínimo 8 caracteres"
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

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Teléfono"
              placeholder="+54 9 362 555-0000"
              onChangeText={onChange}
              value={value}
              error={errors.phone?.message}
              keyboardType="phone-pad"
            />
          )}
        />

        {/* Zona — selector simple (en sprint 2 se mejora con modal) */}
        <Controller
          control={control}
          name="zone"
          render={({ field: { onChange, value } }) => (
            <View style={styles.zoneContainer}>
              <Text style={styles.fieldLabel}>Zona{isCorralon ? ' de cobertura' : ' de trabajo'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll}>
                {ZONES.slice(0, 5).map((z) => (
                  <TouchableOpacity
                    key={z}
                    onPress={() => onChange(z)}
                    style={[styles.zoneChip, value === z && styles.zoneChipSelected]}
                  >
                    <Text style={[styles.zoneText, value === z && styles.zoneTextSelected]}>
                      {z.split(',')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.zone && <Text style={styles.errorText}>{errors.zone.message}</Text>}
            </View>
          )}
        />

        {/* Checkbox términos */}
        <TouchableOpacity
          onPress={() => setAccepted((a) => !a)}
          style={styles.checkboxRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            Acepto los{' '}
            <Text style={styles.link}>términos y condiciones</Text>
            {' '}y la{' '}
            <Text style={styles.link}>política de privacidad</Text>
          </Text>
        </TouchableOpacity>

        <Button
          label="Crear mi cuenta"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={styles.submitBtn}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={styles.loginLink}
        >
          <Text style={styles.loginText}>
            ¿Ya tenés cuenta?{' '}
            <Text style={styles.link}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.gray[700] },
  step: { fontSize: 13, color: colors.gray[400], fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: colors.gray[900], marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.gray[500], marginBottom: 24 },
  eyeIcon: { fontSize: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 8 },
  zoneContainer: { marginBottom: 14 },
  zoneScroll: { flexDirection: 'row' },
  zoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    marginRight: 8,
    backgroundColor: colors.white,
  },
  zoneChipSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  zoneText: { fontSize: 13, color: colors.gray[600], fontWeight: '500' },
  zoneTextSelected: { color: colors.brand[700], fontWeight: '600' },
  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.brand[500], borderColor: colors.brand[500] },
  checkboxTick: { color: colors.white, fontSize: 12, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: colors.gray[700], flex: 1, lineHeight: 20 },
  link: { color: colors.brand[600], fontWeight: '600' },
  submitBtn: { marginBottom: 0 },
  loginLink: { paddingVertical: 16, alignItems: 'center' },
  loginText: { fontSize: 13, color: colors.gray[500] },
});
