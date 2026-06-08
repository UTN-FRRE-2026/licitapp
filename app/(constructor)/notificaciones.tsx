// Pantalla 10 — Notificaciones (placeholder Sprint 6)
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../../constants/colors';

export default function NotificacionesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Notificaciones</Text>
        <Text style={styles.placeholder}>Sprint 6 — Centro de alertas</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.gray[900], marginBottom: 16 },
  placeholder: { color: colors.gray[400], fontSize: 13 },
});
