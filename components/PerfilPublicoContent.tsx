// Perfil público de la contraparte (corralón visto por el constructor o viceversa).
// Usa GET /api/users/{uid} (UserContactDto): datos de contacto, sin email ni stats.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { getUserProfile } from '../services/auth.service';
import type { UserContactDto } from '../types';

export function PerfilPublicoContent({ uid }: { uid: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [perfil, setPerfil] = useState<UserContactDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    getUserProfile(uid)
      .then(setPerfil)
      .catch(() => setPerfil(null))
      .finally(() => setLoading(false));
  }, [uid]);

  const navTitle =
    perfil?.role === 'corralon' ? 'Perfil del corralón' : 'Perfil del constructor';

  const callPhone = () => {
    if (perfil?.phone) Linking.openURL(`tel:${perfil.phone}`);
  };

  const openWhatsapp = () => {
    if (!perfil?.phone) return;
    const digits = perfil.phone.replace(/[^\d]/g, '');
    Linking.openURL(`https://wa.me/${digits}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </View>
    );
  }

  if (!perfil) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = perfil.businessName || perfil.fullName;
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const isCorralon = perfil.role === 'corralon';

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>{navTitle}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identidad */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>{displayName}</Text>
          <View style={styles.tags}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {isCorralon ? '🏪 Corralón' : '👷 Constructor'}
              </Text>
            </View>
            {perfil.verified && (
              <View style={styles.verifiedTag}>
                <Text style={styles.verifiedText}>✓ Verificado</Text>
              </View>
            )}
          </View>
        </View>

        {/* Datos */}
        <Card style={styles.dataCard}>
          {isCorralon && perfil.businessName && perfil.fullName !== perfil.businessName && (
            <DataRow icon="🏷️" label="Responsable" value={perfil.fullName} />
          )}
          <DataRow
            icon="📍"
            label={isCorralon ? 'Zona de cobertura' : 'Zona de trabajo'}
            value={perfil.zone}
          />
          <DataRow icon="📞" label="Teléfono" value={perfil.phone} last />
        </Card>

        {/* Contacto */}
        <Text style={styles.sectionTitle}>Contacto directo</Text>
        <Button label="📞 Llamar" onPress={callPhone} variant="secondary" style={{ marginBottom: 10 }} />
        <Button label="💬 Abrir WhatsApp" onPress={openWhatsapp} />

        <Text style={styles.note}>
          Coordiná la entrega y el pago de los materiales directamente con la otra parte.
        </Text>
      </ScrollView>
    </View>
  );
}

function DataRow({
  icon,
  label,
  value,
  last,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.dataRow, !last && styles.dataRowDivider]}>
      <Text style={styles.dataIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataValue}>{value}</Text>
      </View>
    </View>
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
  backIcon: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 16, paddingBottom: 40 },

  identity: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.brand[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: colors.white },
  name: { fontSize: 20, fontWeight: '700', color: colors.gray[900], textAlign: 'center' },
  tags: { flexDirection: 'row', gap: 8, marginTop: 10 },
  roleTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  roleTagText: { fontSize: 12, fontWeight: '600', color: colors.gray[700] },
  verifiedTag: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: { fontSize: 12, fontWeight: '600', color: colors.successText },

  dataCard: { marginTop: 8, marginBottom: 16 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  dataRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  dataIcon: { fontSize: 18 },
  dataLabel: { fontSize: 11, color: colors.gray[500], fontWeight: '500', marginBottom: 2 },
  dataValue: { fontSize: 14, color: colors.gray[800], fontWeight: '600' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
