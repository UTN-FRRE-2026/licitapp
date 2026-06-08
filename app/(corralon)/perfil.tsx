// Pantalla — Perfil Corralón (placeholder Sprint 7)
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../services/auth.service';

export default function PerfilCorralónScreen() {
  const { user, clear } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    clear();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.name}>{user?.businessName ?? user?.fullName}</Text>
        <Text style={styles.zone}>{user?.zone}</Text>
        <Text style={styles.placeholder}>Sprint 7 — Datos y estadísticas del corralón</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '600', color: colors.gray[900] },
  zone: { fontSize: 13, color: colors.gray[500], marginBottom: 20 },
  placeholder: { color: colors.gray[400], fontSize: 13, marginBottom: 'auto' },
  logoutBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    alignSelf: 'center',
    marginTop: 20,
  },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
