import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { useSolicitudesStats } from '../../hooks/useSolicitudes';
import { logout } from '../../services/auth.service';

export default function PerfilConstructorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, clear } = useAuthStore();
  const { activas, cerradas, totalOfertas } = useSolicitudesStats();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Querés cerrar tu sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          clear();
        },
      },
    ]);
  };

  const initial = user?.fullName?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identidad */}
        <View style={styles.identityBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{user?.fullName ?? '—'}</Text>
          <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          {user?.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verificado</Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Tu actividad</Text>
          <View style={styles.statsRow}>
            <Stat value={activas + cerradas} label="Licitaciones" color={colors.brand[500]} />
            <View style={styles.statDivider} />
            <Stat value={totalOfertas} label="Ofertas recibidas" color={colors.info} />
            <View style={styles.statDivider} />
            <Stat value={cerradas} label="Cierres" color={colors.success} />
          </View>
        </Card>

        {/* Datos personales */}
        <Card style={styles.dataCard}>
          <View style={styles.dataHeader}>
            <Text style={styles.cardTitle}>Mis datos</Text>
            <TouchableOpacity
              onPress={() => router.push('/(constructor)/editar-perfil')}
              hitSlop={8}
            >
              <Text style={styles.editLink}>Editar</Text>
            </TouchableOpacity>
          </View>
          <DataRow icon="📞" label="Teléfono" value={user?.phone ?? '—'} />
          <DataRow icon="📍" label="Zona" value={user?.zone ?? '—'} last />
        </Card>

        {/* Historial */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(constructor)/mis-cierres')}
        >
          <Card style={styles.linkCard}>
            <View style={styles.linkRow}>
              <View style={styles.linkLeft}>
                <Text style={styles.linkIcon}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>Mis cierres</Text>
                  <Text style={styles.linkSub}>
                    {cerradas === 0
                      ? 'Tus licitaciones cerradas aparecerán acá'
                      : `${cerradas} licitación${cerradas === 1 ? '' : 'es'} cerrada${cerradas === 1 ? '' : 's'}`}
                  </Text>
                </View>
              </View>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Cerrar sesión */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
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
        <Text style={styles.dataValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.gray[900] },
  scroll: { padding: 16, paddingBottom: 40 },

  identityBlock: { alignItems: 'center', paddingVertical: 20, marginBottom: 16 },
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
  name: { fontSize: 20, fontWeight: '700', color: colors.gray[900], marginBottom: 2 },
  email: { fontSize: 13, color: colors.gray[500] },
  verifiedBadge: {
    marginTop: 8,
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: colors.successText },

  statsCard: { marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[800], marginBottom: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'stretch' },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: {
    fontSize: 11,
    color: colors.gray[500],
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: { width: 1, backgroundColor: colors.gray[100] },

  dataCard: { marginBottom: 12 },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  editLink: { fontSize: 13, color: colors.brand[600], fontWeight: '600' },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  dataRowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  dataIcon: { fontSize: 18 },
  dataLabel: { fontSize: 11, color: colors.gray[500], fontWeight: '500', marginBottom: 2 },
  dataValue: { fontSize: 14, color: colors.gray[800], fontWeight: '600' },

  linkCard: { marginBottom: 24 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  linkIcon: { fontSize: 24 },
  linkTitle: { fontSize: 14, fontWeight: '700', color: colors.gray[900] },
  linkSub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  chev: { fontSize: 22, color: colors.gray[400], fontWeight: '300' },

  logoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
