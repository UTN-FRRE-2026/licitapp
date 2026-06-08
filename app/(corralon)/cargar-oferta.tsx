// Pantalla 14 — Cargar Oferta: formulario + banner de competencia
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useCreateOferta, useCompetenciaResumen } from '../../hooks/useOfertas';
import type { ShippingType } from '../../types';

// ─── Schema ──────────────────────────────────────────────────────────────────

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
  { key: 'FREE',        label: 'Gratis',      desc: 'Sin costo de envío' },
  { key: 'CHARGED',     label: 'Con costo',   desc: 'Envío a cargo del constructor' },
  { key: 'FIXED_PRICE', label: 'A convenir',  desc: 'Se coordina al cerrar' },
];

export default function CargarOfertaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    solicitudId: string;
    solicitudTitle: string;
    solicitudDeadline: string;
  }>();

  const solicitudId       = params.solicitudId ?? '';
  const solicitudTitle    = params.solicitudTitle ?? '';
  const solicitudDeadline = new Date(params.solicitudDeadline ?? Date.now());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validUntil, setValidUntil] = useState(solicitudDeadline);

  const { data: competencia } = useCompetenciaResumen(solicitudId);
  const { mutate: createOferta, isPending } = useCreateOferta(solicitudId);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
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

  const shippingType = watch('shippingType');

  const onSubmit = (data: FormData) => {
    createOferta(
      {
        solicitudTitle,
        solicitudDeadline,
        data: { ...data, validUntil },
      },
      {
        onSuccess: () => {
          router.replace('/(corralon)/mis-ofertas');
        },
        onError: (err: Error) => {
          Alert.alert('Error', err.message ?? 'No se pudo enviar la oferta.');
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Tu oferta</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Solicitud header */}
        <View style={styles.solicitudBanner}>
          <Text style={styles.solicitudLabel}>Pedido</Text>
          <Text style={styles.solicitudTitle}>{solicitudTitle}</Text>
        </View>

        {/* Banner competencia */}
        {competencia && (
          <Card style={styles.competenciaBanner}>
            {competencia.count === 0 ? (
              <Text style={styles.competenciaText}>
                🏆 Sos el primero en cotizar. ¡Presentá tu mejor precio!
              </Text>
            ) : (
              <Text style={styles.competenciaText}>
                📊 Ya hay{' '}
                <Text style={styles.competenciaStrong}>{competencia.count}</Text>
                {competencia.count === 1 ? ' oferta' : ' ofertas'}.
                {competencia.bestPrice
                  ? ` La mejor hasta ahora: $${competencia.bestPrice.toLocaleString('es-AR')}`
                  : ''}
              </Text>
            )}
          </Card>
        )}

        {/* Precio total */}
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
              error={errors.totalPrice?.message}
            />
          )}
        />

        {/* Tipo de envío */}
        <Text style={styles.sectionTitle}>Envío</Text>
        <Controller
          control={control}
          name="shippingType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.shippingOptions}>
              {SHIPPING_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.shippingOption,
                    value === opt.key && styles.shippingOptionActive,
                  ]}
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
                error={errors.shippingPrice?.message}
              />
            )}
          />
        )}

        {/* Horas de entrega */}
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
              error={errors.deliveryHours?.message}
            />
          )}
        />

        {/* Válido hasta */}
        <Text style={styles.sectionTitle}>Oferta válida hasta</Text>
        <TouchableOpacity
          style={styles.datePickerBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerIcon}>📅</Text>
          <Text style={styles.datePickerText}>
            {format(validUntil, "d 'de' MMMM, HH:mm", { locale: es })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={validUntil}
            mode="datetime"
            display="default"
            minimumDate={new Date()}
            maximumDate={solicitudDeadline}
            onChange={(_e, date) => {
              setShowDatePicker(false);
              if (date) setValidUntil(date);
            }}
          />
        )}

        {/* Comentario opcional */}
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
              multiline
              numberOfLines={3}
            />
          )}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer sticky */}
      <View style={styles.footer}>
        <Button
          label={isPending ? 'Enviando...' : 'Enviar oferta'}
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          variant="primary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
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
  competenciaBanner: {
    backgroundColor: colors.infoBg,
    borderRadius: 12,
    marginBottom: 12,
  },
  competenciaText: { fontSize: 13, color: colors.infoText, lineHeight: 19 },
  competenciaStrong: { fontWeight: '700' },
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
  shippingOptionActive: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  shippingLabel: { fontSize: 13, fontWeight: '700', color: colors.gray[700], marginBottom: 2 },
  shippingLabelActive: { color: colors.brand[600] },
  shippingDesc: { fontSize: 10, color: colors.gray[400], textAlign: 'center' },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
  datePickerIcon: { fontSize: 18 },
  datePickerText: { fontSize: 14, color: colors.gray[800], fontWeight: '600' },
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
