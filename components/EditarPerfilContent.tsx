import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../constants/colors';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ZoneSelector } from './ui/ZoneSelector';
import { useAuthStore } from '../stores/authStore';
import { updateMyProfile } from '../services/auth.service';

const schema = z.object({
  fullName: z.string().min(2, 'Ingresá tu nombre'),
  phone: z.string().min(8, 'Ingresá un teléfono válido'),
  zone: z.string().min(1, 'Seleccioná una zona'),
  businessName: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function EditarPerfilContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const isCorralon = user?.role === 'corralon';

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      zone: user?.zone ?? '',
      businessName: user?.businessName ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true);
      const updated = await updateMyProfile({
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        zone: data.zone,
        businessName: isCorralon ? data.businessName?.trim() || undefined : undefined,
      });
      setUser(updated);
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No pudimos guardar los cambios.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Editar perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <Controller
          control={control}
          name="zone"
          render={({ field: { onChange, value } }) => (
            <ZoneSelector
              label={`Zona${isCorralon ? ' de cobertura' : ' de trabajo'}`}
              value={value ?? ''}
              onChange={onChange}
              error={errors.zone?.message}
            />
          )}
        />

        <View style={styles.readOnlyCard}>
          <Text style={styles.readOnlyLabel}>Correo electrónico</Text>
          <Text style={styles.readOnlyValue}>{user?.email}</Text>
          <Text style={styles.readOnlyHint}>
            El correo no se puede modificar desde la app.
          </Text>
        </View>

        <Button
          label={saving ? 'Guardando…' : 'Guardar cambios'}
          onPress={handleSubmit(onSubmit)}
          disabled={saving || !isDirty}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 20, paddingBottom: 40 },
  readOnlyCard: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  readOnlyLabel: { fontSize: 12, color: colors.gray[500], marginBottom: 4, fontWeight: '500' },
  readOnlyValue: { fontSize: 15, color: colors.gray[800], fontWeight: '600' },
  readOnlyHint: { fontSize: 11, color: colors.gray[500], marginTop: 6 },
});
