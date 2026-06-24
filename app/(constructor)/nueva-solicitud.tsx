// Pantalla 05 — Nueva solicitud
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { format, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCreateSolicitud } from '../../hooks/useSolicitudes';
import { useAuthStore } from '../../stores/authStore';
import { uploadFile, solicitudAttachmentPath } from '../../services/storage.service';
import { ZONES, MATERIAL_UNITS } from '../../constants/zones';

// ─── Schema ──────────────────────────────────────────────────────────────────

const materialSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  quantity: z
    .string()
    .min(1, 'Ingresá la cantidad')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Cantidad inválida'),
  unit: z.string().min(1, 'Unidad requerida'),
});

const schema = z.object({
  title: z.string().min(3, 'Ingresá un título para el pedido'),
  materiales: z
    .array(materialSchema)
    .min(1, 'Agregá al menos un material'),
  deliveryZone: z.string().min(1, 'Seleccioná una zona de entrega'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Componente ──────────────────────────────────────────────────────────────

export default function NuevaSolicitudScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { mutateAsync: createSolicitud, isPending } = useCreateSolicitud();

  const [deadline, setDeadline] = useState<Date>(addHours(new Date(), 8));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      materiales: [{ name: '', quantity: '', unit: 'unidades' }],
      deliveryZone: user?.zone ?? '',
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'materiales' });
  const deliveryZone = watch('deliveryZone');

  // La pantalla queda montada dentro del Tabs (href: null), así que el state del
  // form sobrevive entre visitas. Cada vez que la pantalla gana foco la reseteamos
  // para que arranque vacía (preservando solo la zona del perfil como sugerencia).
  useFocusEffect(
    useCallback(() => {
      reset({
        title: '',
        materiales: [{ name: '', quantity: '', unit: 'unidades' }],
        deliveryZone: user?.zone ?? '',
        notes: '',
      });
      setDeadline(addHours(new Date(), 8));
      setAttachment(null);
    }, [reset, user?.zone])
  );

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? 'application/octet-stream',
        });
      }
    } catch {
      Alert.alert('Error', 'No se pudo adjuntar el archivo.');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      let attachmentUrl: string | undefined;

      if (attachment) {
        setUploading(true);
        const path = solicitudAttachmentPath(user!.uid, attachment.name);
        attachmentUrl = await uploadFile(attachment.uri, path, attachment.mimeType);
        setUploading(false);
      }

      const solicitudId = await createSolicitud({
        data: { ...data, deadline },
        attachmentUrl,
      });

      router.replace({
        pathname: '/(constructor)/solicitud-publicada',
        params: { solicitudId },
      });
    } catch (err: unknown) {
      setUploading(false);
      const msg = err instanceof Error ? err.message : 'No se pudo publicar la solicitud.';
      Alert.alert('Error', msg);
    }
  };

  const isSubmitting = isPending || uploading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nueva solicitud</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.desc}>
          Cargá los materiales que necesitás y los corralones te van a enviar ofertas.
        </Text>

        {/* Título del pedido */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Título del pedido"
              placeholder="Ej: Materiales para fundación"
              onChangeText={onChange}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        {/* Lista de materiales */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Lista de materiales</Text>
          <Text style={styles.sectionCount}>{fields.length} ítem{fields.length !== 1 ? 's' : ''}</Text>
        </View>

        {errors.materiales?.root?.message && (
          <Text style={styles.errorText}>{errors.materiales.root.message}</Text>
        )}

        {fields.map((field, index) => (
          <View key={field.id} style={styles.matCard}>
            <View style={styles.matCardHeader}>
              <Text style={styles.matCardNum}>Material {index + 1}</Text>
              {fields.length > 1 && (
                <TouchableOpacity onPress={() => remove(index)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Controller
              control={control}
              name={`materiales.${index}.name`}
              render={({ field: { onChange, value } }) => (
                <Input
                  placeholder="Ej: Cemento 50 kg"
                  onChangeText={onChange}
                  value={value}
                  error={errors.materiales?.[index]?.name?.message}
                />
              )}
            />

            <View style={styles.matQtyRow}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name={`materiales.${index}.quantity`}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      placeholder="Cantidad"
                      onChangeText={onChange}
                      value={value}
                      keyboardType="numeric"
                      error={errors.materiales?.[index]?.quantity?.message}
                    />
                  )}
                />
              </View>
              <View style={styles.unitContainer}>
                <UnitPicker
                  control={control}
                  index={index}
                  error={errors.materiales?.[index]?.unit?.message}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addRow}
          onPress={() => append({ name: '', quantity: '', unit: 'unidades' })}
        >
          <Text style={styles.addRowText}>+ Agregar otro material</Text>
        </TouchableOpacity>

        {/* Detalles del pedido */}
        <View style={[styles.sectionRow, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Detalles del pedido</Text>
        </View>

        {/* Zona de entrega */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Zona de entrega</Text>
          <TouchableOpacity
            style={[styles.selectField, !deliveryZone && styles.selectPlaceholder]}
            onPress={() => setShowZonePicker(true)}
          >
            <Text style={[styles.selectText, !deliveryZone && styles.selectTextPlaceholder]}>
              {deliveryZone || 'Seleccioná una zona'}
            </Text>
            <Text>▾</Text>
          </TouchableOpacity>
          {errors.deliveryZone && (
            <Text style={styles.errorText}>{errors.deliveryZone.message}</Text>
          )}
        </View>

        {/* Fecha límite */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Fecha límite para ofertas</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectText}>
              📅 {format(deadline, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
            </Text>
            <Text>▾</Text>
          </TouchableOpacity>
        </View>

        {/* DateTimePicker */}
        {showDatePicker && (
          <DateTimePicker
            value={deadline}
            mode="datetime"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_event, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) setDeadline(selected);
            }}
          />
        )}

        {/* Notas */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Notas (opcional)"
              placeholder="Ej: Es para una fundación. Llegar con factura A."
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          )}
        />

        {/* Adjuntar archivo */}
        <TouchableOpacity style={styles.attachRow} onPress={handlePickFile}>
          <Text style={styles.attachText}>
            {attachment ? `📎 ${attachment.name}` : '📎 Adjuntar PDF o foto'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón sticky */}
      <View style={styles.stickyBtn}>
        <Button
          label={uploading ? 'Subiendo archivo…' : 'Publicar solicitud'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </View>
      </KeyboardAvoidingView>

      {/* Modal selector de zona */}
      <ZonePickerModal
        visible={showZonePicker}
        current={deliveryZone}
        onClose={() => setShowZonePicker(false)}
        control={control}
      />
    </SafeAreaView>
  );
}

// ─── UnitPicker inline ────────────────────────────────────────────────────────

function UnitPicker({ control, index, error }: { control: any; index: number; error?: string }) {
  const [open, setOpen] = useState(false);
  const units = MATERIAL_UNITS.slice(0, 6);

  return (
    <Controller
      control={control}
      name={`materiales.${index}.unit`}
      render={({ field: { onChange, value } }) => (
        <View>
          <TouchableOpacity
            style={styles.unitBtn}
            onPress={() => setOpen((p) => !p)}
          >
            <Text style={styles.unitBtnText}>{value || 'Unidad'}</Text>
            <Text style={styles.unitChevron}>▾</Text>
          </TouchableOpacity>
          {open && (
            <View style={styles.unitDropdown}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={styles.unitOption}
                  onPress={() => { onChange(u); setOpen(false); }}
                >
                  <Text style={[styles.unitOptionText, value === u && styles.unitOptionActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
  );
}

// ─── ZonePicker Modal ─────────────────────────────────────────────────────────

function ZonePickerModal({
  visible,
  current,
  onClose,
  control,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  control: any;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Zona de entrega</Text>
          <Controller
            control={control}
            name="deliveryZone"
            render={({ field: { onChange } }) => (
              <>
                {ZONES.map((z) => (
                  <TouchableOpacity
                    key={z}
                    style={[styles.zoneOption, current === z && styles.zoneOptionSelected]}
                    onPress={() => { onChange(z); onClose(); }}
                  >
                    <Text style={[styles.zoneOptionText, current === z && styles.zoneOptionTextSelected]}>
                      {z}
                    </Text>
                    {current === z && <Text style={styles.zoneCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { padding: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.gray[700] },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  desc: { fontSize: 14, color: colors.gray[500], marginBottom: 20, lineHeight: 20 },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  sectionCount: { fontSize: 12, color: colors.gray[400] },

  // Material card
  matCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  matCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matCardNum: { fontSize: 12, fontWeight: '600', color: colors.gray[500] },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 11, color: colors.dangerText, fontWeight: '700' },

  matQtyRow: { flexDirection: 'row', gap: 8 },
  unitContainer: { width: 110 },
  unitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.white,
    marginBottom: 14,
  },
  unitBtnText: { fontSize: 15, color: colors.gray[900] },
  unitChevron: { fontSize: 12, color: colors.gray[400] },
  unitDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  unitOption: { paddingHorizontal: 14, paddingVertical: 10 },
  unitOptionText: { fontSize: 14, color: colors.gray[700] },
  unitOptionActive: { color: colors.brand[600], fontWeight: '600' },

  addRow: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  addRowText: { fontSize: 14, fontWeight: '600', color: colors.brand[600] },

  // Campos de detalle
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 6 },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  selectPlaceholder: {},
  selectText: { fontSize: 15, color: colors.gray[900] },
  selectTextPlaceholder: { color: colors.gray[400] },

  attachRow: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  attachText: { fontSize: 14, fontWeight: '600', color: colors.brand[600] },

  errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },

  // Sticky button
  stickyBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },

  // Modal zona
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900], marginBottom: 12 },
  zoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  zoneOptionSelected: {},
  zoneOptionText: { fontSize: 15, color: colors.gray[800] },
  zoneOptionTextSelected: { color: colors.brand[600], fontWeight: '600' },
  zoneCheck: { color: colors.brand[500], fontSize: 16, fontWeight: '700' },
});
