// Pantalla — Estadísticas del corralón. Dashboard derivado de /api/ofertas/mine.
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { Card } from '../../components/ui/Card';
import { useMyOfertas } from '../../hooks/useOfertas';

export default function EstadisticasCorralonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: ofertas = [], isLoading } = useMyOfertas();

  const stats = useMemo(() => {
    const total = ofertas.length;
    const activas = ofertas.filter((o) => o.status === 'ACTIVE').length;
    const ganadas = ofertas.filter((o) => o.status === 'WON').length;
    const perdidas = ofertas.filter((o) => o.status === 'LOST').length;
    const resueltas = ganadas + perdidas;
    const tasaExito = resueltas > 0 ? Math.round((ganadas / resueltas) * 100) : 0;
    const facturado = ofertas
      .filter((o) => o.status === 'WON')
      .reduce((acc, o) => acc + o.totalPrice, 0);
    const ticket = ganadas > 0 ? Math.round(facturado / ganadas) : 0;
    return { total, activas, ganadas, perdidas, tasaExito, facturado, ticket };
  }, [ofertas]);

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mis estadísticas</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero — facturado */}
          <Card style={styles.hero}>
            <Text style={styles.heroNum}>${stats.facturado.toLocaleString('es-AR')}</Text>
            <Text style={styles.heroLabel}>facturado en ventas cerradas</Text>
            {stats.ticket > 0 && (
              <Text style={styles.heroSub}>
                Ticket promedio: ${stats.ticket.toLocaleString('es-AR')}
              </Text>
            )}
          </Card>

          {/* Grid */}
          <View style={styles.grid}>
            <MetricCard value={String(stats.total)} label="Ofertas enviadas" color={colors.gray[800]} />
            <MetricCard value={String(stats.activas)} label="En competencia" color={colors.brand[500]} />
            <MetricCard value={String(stats.ganadas)} label="Ganadas" color={colors.success} />
            <MetricCard value={String(stats.perdidas)} label="Perdidas" color={colors.gray[400]} />
          </View>

          {/* Tasa de éxito */}
          <Text style={styles.sectionTitle}>Tasa de éxito</Text>
          <Card style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateLabel}>Ofertas ganadas sobre resueltas</Text>
              <Text style={[styles.ratePercent, { color: colors.success }]}>
                {stats.tasaExito}%
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${stats.tasaExito}%`, backgroundColor: colors.success }]}
              />
            </View>
            <Text style={styles.rateHint}>
              {stats.ganadas + stats.perdidas === 0
                ? 'Todavía no tenés ofertas resueltas.'
                : `${stats.ganadas} ganadas de ${stats.ganadas + stats.perdidas} resueltas.`}
            </Text>
          </Card>

          {stats.total === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                Cuando empieces a presentar ofertas vas a ver acá tu rendimiento.
              </Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

function MetricCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
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
  scroll: { padding: 16 },

  hero: { alignItems: 'center', paddingVertical: 28, marginBottom: 16 },
  heroNum: { fontSize: 40, fontWeight: '900', color: colors.success, lineHeight: 44 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginTop: 6 },
  heroSub: { fontSize: 12, color: colors.gray[500], marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  metricCard: { width: '47.5%', alignItems: 'center', paddingVertical: 20 },
  metricValue: { fontSize: 28, fontWeight: '800' },
  metricLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4, textAlign: 'center', fontWeight: '500' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  rateCard: { paddingVertical: 18 },
  rateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rateLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  ratePercent: { fontSize: 16, fontWeight: '800' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.gray[100], overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  rateHint: { fontSize: 11, color: colors.gray[400], marginTop: 6 },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
