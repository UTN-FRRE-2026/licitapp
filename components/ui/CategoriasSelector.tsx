import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../constants/colors';
import { Button } from './Button';
import {
  getAllCategorias,
  getMyCategorias,
  setMyCategorias,
  type Categoria,
} from '../../services/categorias.service';

/**
 * Selector de rubros (categorías) del corralón. Refleja la relación N↔N: carga
 * todos los rubros + los del corralón, permite marcar/desmarcar y guarda el
 * conjunto con PUT /api/users/me/categorias.
 */
export function CategoriasSelector() {
  const [all, setAll] = useState<Categoria[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [todas, mias] = await Promise.all([getAllCategorias(), getMyCategorias()]);
        setAll(todas);
        setSelected(new Set(mias.map((c) => c.id)));
      } catch {
        // silencioso: si falla, el selector queda vacío
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const onSave = async () => {
    try {
      setSaving(true);
      await setMyCategorias([...selected]);
      Alert.alert('Listo', 'Tus rubros se actualizaron.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Rubros que ofrecés</Text>
      {loading ? (
        <ActivityIndicator color={colors.brand[500]} style={{ marginVertical: 12 }} />
      ) : (
        <>
          <View style={styles.chips}>
            {all.map((c) => {
              const active = selected.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggle(c.id)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button
            label={saving ? 'Guardando…' : 'Guardar rubros'}
            variant="secondary"
            onPress={onSave}
            loading={saving}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '500', color: colors.gray[700], marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  chipActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  chipText: { fontSize: 13, color: colors.gray[600] },
  chipTextActive: { color: colors.brand[700], fontWeight: '600' },
});
