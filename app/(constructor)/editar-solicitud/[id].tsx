// Pantalla — Editar mi licitación (constructor). ABM maestro–detalle: edita la
// cabecera (PUT) y sincroniza los materiales (POST/PUT/DELETE). Solo si está OPEN.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../../constants/colors';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ZoneSelector } from '../../../components/ui/ZoneSelector';
import { MATERIAL_UNITS } from '../../../constants/zones';
import {
  getSolicitudById,
  updateSolicitud,
  deleteSolicitud,
  addMaterial,
  updateMaterial,
  removeMaterial,
} from '../../../services/solicitudes.service';
import type { Material, Solicitud } from '../../../types';

interface MatRow {
  id?: string; // presente = material existente; ausente = nuevo
  name: string;
  quantity: string;
  unit: string;
}

export default function EditarSolicitudScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notEditable, setNotEditable] = useState(false);

  const [original, setOriginal] = useState<Material[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [deadline, setDeadline] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [materiales, setMateriales] = useState<MatRow[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const s = await getSolicitudById(id);
      if (!s) {
        setNotEditable(true);
        setLoading(false);
        return;
      }
      if (s.status !== 'OPEN') setNotEditable(true);
      hydrate(s);
      setLoading(false);
    })();
  }, [id]);

  const hydrate = (s: Solicitud) => {
    setTitle(s.title);
    setNotes(s.notes ?? '');
    setDeliveryZone(s.deliveryZone);
    setDeadline(s.deadline);
    const mats = (s.materiales ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      quantity: String(m.quantity),
      unit: m.unit,
    }));
    setOriginal(s.materiales ?? []);
    setMateriales(mats.length ? mats : [{ name: '', quantity: '', unit: 'unidades' }]);
  };

  const openAndroidPicker = useCallback(() => {
    DateTimePickerAndroid.open({
      value: deadline,
      mode: 'date',
      minimumDate: new Date(),
      onChange: (_e, d) => {
        if (!d) return;
        DateTimePickerAndroid.open({
          value: d,
          mode: 'time',
          is24Hour: true,
          onChange: (_e2, t) => {
            if (!t) return;
            const combined = new Date(d);
            combined.setHours(t.getHours(), t.getMinutes(), 0, 0);
            setDeadline(combined);
          },
        });
      },
    });
  }, [deadline]);

  const setRow = (index: number, patch: Partial<MatRow>) =>
    setMateriales((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRow = () =>
    setMateriales((rows) => [...rows, { name: '', quantity: '', unit: 'unidades' }]);

  const removeRow = (index: number) =>
    setMateriales((rows) => rows.filter((_, i) => i !== index));

  const validate = (): string | null => {
    if (title.trim().length < 3) return 'El título debe tener al menos 3 caracteres.';
    if (!deliveryZone) return 'Seleccioná una zona de entrega.';
    if (materiales.length < 1) return 'Agregá al menos un material.';
    for (const m of materiales) {
      if (m.name.trim().length < 2) return 'Cada material necesita un nombre.';
      const q = parseFloat(m.quantity);
      if (isNaN(q) || q <= 0) return `Cantidad inválida en "${m.name || 'material'}".`;
      if (!m.unit.trim()) return 'Cada material necesita una unidad.';
    }
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Revisá los datos', err);
      return;
    }
    try {
      setSaving(true);

      // 1) Cabecera.
      await updateSolicitud(id!, { title: title.trim(), deliveryZone, deadline, notes: notes.trim() || undefined });

      // 2) Detalle: altas + ediciones primero, bajas al final (nunca queda en 0).
      const kept = new Set(materiales.filter((m) => m.id).map((m) => m.id));

      for (const m of materiales) {
        const payload = { name: m.name.trim(), quantity: parseFloat(m.quantity), unit: m.unit.trim() };
        if (!m.id) {
          await addMaterial(id!, payload);
        } else {
          const orig = original.find((o) => o.id === m.id);
          if (orig && (orig.name !== payload.name || orig.quantity !== payload.quantity || orig.unit !== payload.unit))
            await updateMaterial(id!, m.id, payload);
        }
      }
      for (const o of original) {
        if (!kept.has(o.id)) await removeMaterial(id!, o.id);
      }

      queryClient.invalidateQueries({ queryKey: ['solicitudes', 'mias'] });
      router.back();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudieron guardar los cambios.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar licitación', '¿Seguro que querés eliminarla? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await deleteSolicitud(id!);
            queryClient.invalidateQueries({ queryKey: ['solicitudes', 'mias'] });
            router.replace('/(constructor)');
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'No se pudo eliminar.';
            Alert.alert('Error', msg);
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </View>
    );
  }

  if (notEditable) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.blockedText}>Esta licitación no se puede editar (ya no está abierta).</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar solicitud</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input label="Título del pedido" value={title} onChangeText={setTitle} placeholder="Ej: Materiales para fundación" />

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Lista de materiales</Text>
            <Text style={styles.sectionCount}>
              {materiales.length} ítem{materiales.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {materiales.map((m, index) => (
            <View key={m.id ?? `new-${index}`} style={styles.matCard}>
              <View style={styles.matCardHeader}>
                <Text style={styles.matCardNum}>Material {index + 1}</Text>
                {materiales.length > 1 && (
                  <TouchableOpacity onPress={() => removeRow(index)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Input placeholder="Ej: Cemento 50 kg" value={m.name} onChangeText={(v) => setRow(index, { name: v })} />

              <View style={styles.matQtyRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="Cantidad"
                    value={m.quantity}
                    onChangeText={(v) => setRow(index, { quantity: v })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.unitWrap}>
                {MATERIAL_UNITS.slice(0, 8).map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitChip, m.unit === u && styles.unitChipActive]}
                    onPress={() => setRow(index, { unit: u })}
                  >
                    <Text style={[styles.unitChipText, m.unit === u && styles.unitChipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addRow} onPress={addRow}>
            <Text style={styles.addRowText}>+ Agregar otro material</Text>
          </TouchableOpacity>

          <View style={{ height: 16 }} />

          <ZoneSelector label="Zona de entrega" value={deliveryZone} onChange={setDeliveryZone} />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Fecha límite para ofertas</Text>
            <TouchableOpacity
              style={styles.selectField}
              onPress={() => (Platform.OS === 'android' ? openAndroidPicker() : setShowDatePicker(true))}
            >
              <Text style={styles.selectText}>📅 {format(deadline, "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</Text>
              <Text>▾</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={deadline}
              mode="datetime"
              minimumDate={new Date()}
              display="inline"
              onChange={(_e, selected) => {
                if (selected) setDeadline(selected);
              }}
            />
          )}

          <Input
            label="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej: Llegar con factura A."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <Button label={saving ? 'Guardando…' : 'Guardar cambios'} onPress={onSave} loading={saving} />

          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} disabled={saving}>
            <Text style={styles.deleteBtnText}>Eliminar licitación</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  blockedText: { color: colors.gray[600], textAlign: 'center', marginBottom: 12 },
  backLink: { color: colors.brand[500], fontWeight: '600' },
  container: { padding: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: colors.gray[700] },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.gray[900] },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.gray[900] },
  sectionCount: { fontSize: 12, color: colors.gray[400] },

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

  unitWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  unitChipActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  unitChipText: { fontSize: 13, color: colors.gray[600] },
  unitChipTextActive: { color: colors.brand[700], fontWeight: '600' },

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
  selectText: { fontSize: 15, color: colors.gray[900] },

  deleteBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 6 },
  deleteBtnText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
});
