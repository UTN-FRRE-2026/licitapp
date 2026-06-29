// Pantalla — Editar oferta (corralón). Permite modificar precio, envío, tiempo de
// entrega y comentario mientras la licitación siga abierta. El backend no permite
// cambiar la validez (validUntil), así que ese campo se muestra como sólo lectura.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '../../../constants/colors';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useOfertaById, useUpdateOferta } from '../../../hooks/useOfertas';
import type { ShippingType } from '../../../types';

const schema = z
  .object({
    totalPrice: z
      .string()
      .min(1, 'Requerido')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Precio inválido'),
    shippingType: z.enum(['FREE', 'CHARGED', 'FIXED_PRICE'] as const),
    shippingPrice: z.string().optional(),
    deliveryHours: z
      .string()
      .min(1, 'Requerido')
      .refine((v) => !isNaN(parseInt(v)) && parseInt(v) > 0, 'Horas inválidas'),
    comment: z.string().optional(),
  })
  .refine(
    (data) =>
      data.shippingType !== 'CHARGED' ||
      (data.shippingPrice && parseFloat(data.shippingPrice) > 0),
    { message: 'Ingresá el costo de envío', path: ['shippingPrice'] }
  );

type FormData = z.infer<typeof schema>;

const SHIPPING_OPTIONS: { key: ShippingType; label: string; desc: string }[] = [
  { key: 'FREE', label: 'Gratis', desc: 'Sin costo de envío' },
  { key: 'CHARGED', label: 'Con costo', desc: 'Envío a cargo del constructor' },
  { key: 'FIXED_PRICE', label: 'A convenir', desc: 'Se coordina al cerrar' },
];

export default function EditarOfertaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; solicitudId: string; solicitudTitle: string }>();

  const ofertaId = params.id ?? '';
  const solicitudId = params.solicitudId ?? '';
  const solicitudTitle = params.solicitudTitle ?? '';

  const { data: oferta, isLoading } = useOfertaById(solicitudId, ofertaId);
  const { mutateAsync: updateOferta, isPending } = useUpdateOferta(solicitudId, ofertaId);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      totalPrice: '',
      shippingType: 'FREE',
      shippingPrice: '',
      deliveryHours: '',
      comment: '',
    },
  });

  // Precarga el formulario cuando llega la oferta del backend.
  useEffect(() => {
    if (!oferta) return;
    reset({
      totalPrice: String(oferta.totalPrice),
      shippingType: oferta.shippingType,
      shippingPrice: oferta.shippingPrice ? String(oferta.shippingPrice) : '',
      deliveryHours: String(oferta.deliveryHours),
      comment: oferta.comment ?? '',
    });
  }, [oferta, reset]);

  const shippingType = watch('shippingType');

  const onSubmit = async (data: FormData) => {
    try {
      await updateOferta({
        totalPrice: parseFloat(data.totalPrice),
        shippingType: data.shippingType,
        shippingPrice:
          data.shippingType === 'CHARGED' && data.shippingPrice
            ? parseFloat(data.shippingPrice)
            : undefined,
        deliveryHours: parseInt(data.deliveryHours, 10),
        comment: data.comment?.trim() || undefined,
      });
      Alert.alert('Listo', 'Tu oferta se actualizó.');
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar la oferta.';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </View>
    );
  }

  if (!oferta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontró la oferta.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const editable = oferta.status === 'ACTIVE';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Editar oferta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {solicitudTitle ? (
          <View style={styles.solicitudBanner}>
            <Text style={styles.solicitudLabel}>Pedido</Text>
            <Text style={styles.solicitudTitle}>{solicitudTitle}</Text>
          </View>
        ) : null}

        {!editable && (
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>
              Esta oferta ya no se puede editar porque la licitación está cerrada.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Precio total (materiales)</Text>
        <Controller
          control={control}
          name="totalPrice"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Precio total $"
              placeholder="0.00"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              editable={editable}
              error={errors.totalPrice?.message}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Envío</Text>
        <Controller
          control={control}
          name="shippingType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.shippingOptions}>
              {SHIPPING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  disabled={!editable}
                  style={[styles.shippingOption, value === opt.key && styles.shippingOptionActive]}
                  onPress={() => onChange(opt.key)}
                >
                  <Text style={[styles.shippingLabel, value === opt.key && styles.shippingLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.shippingDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        {shippingType === 'CHARGED' && (
          <Controller
            control={control}
            name="shippingPrice"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Costo de envío $"
                placeholder="0.00"
                value={value ?? ''}
                onChangeText={onChange}
                keyboardType="numeric"
                editable={editable}
                error={errors.shippingPrice?.message}
              />
            )}
          />
        )}

        <Text style={styles.sectionTitle}>Tiempo de entrega</Text>
        <Controller
          control={control}
          name="deliveryHours"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Horas hábiles estimadas"
              placeholder="ej: 24"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              editable={editable}
              error={errors.deliveryHours?.message}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Comentario (opcional)</Text>
        <Controller
          control={control}
          name="comment"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Notas adicionales"
              placeholder="Ej: incluye flete a pie de obra"
              value={value ?? ''}
              onChangeText={onChange}
              editable={editable}
              multiline
              numberOfLines={3}
            />
          )}
        />

        <View style={styles.readOnlyCard}>
          <Text style={styles.readOnlyLabel}>Validez de la oferta</Text>
          <Text style={styles.readOnlyHint}>
            La fecha de validez no se puede modificar. Si necesitás cambiarla, retirá la
            oferta y cargá una nueva.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={isPending ? 'Guardando…' : 'Guardar cambios'}
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          disabled={!editable || !isDirty}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.gray[500], marginBottom: 12 },
  backLink: { color: colors.brand[500], fontWeight: '600' },
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
  backBtnText: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 16 },

  solicitudBanner: {
    backgroundColor: colors.brand[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  solicitudLabel: { fontSize: 11, color: colors.brand[500], fontWeight: '700', marginBottom: 4 },
  solicitudTitle: { fontSize: 15, fontWeight: '700', color: colors.brand[700] },

  lockedBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  lockedText: { fontSize: 13, color: colors.warningText, lineHeight: 19 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  shippingOptions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  shippingOption: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  shippingOptionActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  shippingLabel: { fontSize: 13, fontWeight: '700', color: colors.gray[700], marginBottom: 2 },
  shippingLabelActive: { color: colors.brand[600] },
  shippingDesc: { fontSize: 10, color: colors.gray[400], textAlign: 'center' },

  readOnlyCard: {
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  readOnlyLabel: { fontSize: 12, color: colors.gray[600], marginBottom: 4, fontWeight: '600' },
  readOnlyHint: { fontSize: 11, color: colors.gray[500], lineHeight: 16 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
});
