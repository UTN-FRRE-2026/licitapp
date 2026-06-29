// Configuración / Ajustes. Contenido compartido por ambos roles. Las preferencias
// de notificaciones se guardan localmente en AsyncStorage (no afectan al backend;
// controlan el comportamiento visual de avisos dentro de la app).
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { Card } from './ui/Card';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../services/auth.service';
import {
  PREF_PUSH_OFERTAS_KEY,
  PREF_PUSH_DEADLINE_KEY,
  PREF_SONIDO_KEY,
} from '../constants/storage';

export function ConfiguracionContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, role, clear } = useAuthStore();

  const isCorralon = role === 'corralon';

  const [pushOfertas, setPushOfertas] = useState(true);
  const [pushDeadline, setPushDeadline] = useState(true);
  const [sonido, setSonido] = useState(true);

  useEffect(() => {
    (async () => {
      const [o, d, s] = await AsyncStorage.multiGet([
        PREF_PUSH_OFERTAS_KEY,
        PREF_PUSH_DEADLINE_KEY,
        PREF_SONIDO_KEY,
      ]);
      // null = nunca configurado → default activado
      setPushOfertas(o[1] !== '0');
      setPushDeadline(d[1] !== '0');
      setSonido(s[1] !== '0');
    })();
  }, []);

  const persist = (key: string, value: boolean) => {
    AsyncStorage.setItem(key, value ? '1' : '0').catch(() => {});
  };

  const goEditarPerfil = () => {
    if (isCorralon) router.push('/(corralon)/editar-perfil');
    else router.push('/(constructor)/editar-perfil');
  };

  const goAyuda = () => {
    if (isCorralon) router.push('/(corralon)/ayuda');
    else router.push('/(constructor)/ayuda');
  };

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

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Configuración</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cuenta */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={goEditarPerfil} activeOpacity={0.7}>
            <Text style={styles.rowIcon}>👤</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Editar perfil</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{user?.email}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Notificaciones */}
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <Card style={styles.card}>
          <ToggleRow
            icon="📦"
            title={isCorralon ? 'Nuevos pedidos' : 'Nuevas ofertas'}
            subtitle={
              isCorralon
                ? 'Avisarme cuando haya un pedido en mi zona'
                : 'Avisarme cuando reciba una oferta'
            }
            value={pushOfertas}
            onChange={(v) => {
              setPushOfertas(v);
              persist(PREF_PUSH_OFERTAS_KEY, v);
            }}
          />
          <ToggleRow
            icon="⏰"
            title="Cierres próximos"
            subtitle="Recordarme cuando una licitación está por cerrar"
            value={pushDeadline}
            onChange={(v) => {
              setPushDeadline(v);
              persist(PREF_PUSH_DEADLINE_KEY, v);
            }}
          />
          <ToggleRow
            icon="🔊"
            title="Sonido"
            subtitle="Reproducir un sonido con cada aviso"
            value={sonido}
            onChange={(v) => {
              setSonido(v);
              persist(PREF_SONIDO_KEY, v);
            }}
            last
          />
        </Card>

        {/* Soporte */}
        <Text style={styles.sectionTitle}>Soporte</Text>
        <Card style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={goAyuda} activeOpacity={0.7}>
            <Text style={styles.rowIcon}>❓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Centro de ayuda</Text>
              <Text style={styles.rowSub}>Preguntas frecuentes</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('mailto:soporte@licitapp.com')}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Contactar soporte</Text>
              <Text style={styles.rowSub}>soporte@licitapp.com</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Acerca de</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowIcon}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Versión</Text>
              <Text style={styles.rowSub}>LicitApp 1.0.0</Text>
            </View>
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
  last,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.gray[200], true: colors.brand[400] }}
        thumbColor={colors.white}
      />
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

  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  card: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  divider: { height: 1, backgroundColor: colors.gray[100] },
  rowIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.gray[900] },
  rowSub: { fontSize: 12, color: colors.gray[500], marginTop: 2 },
  chev: { fontSize: 22, color: colors.gray[400], fontWeight: '300' },

  logoutBtn: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
