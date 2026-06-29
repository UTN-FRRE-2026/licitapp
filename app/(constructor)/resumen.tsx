// Pantalla — Resumen / Estadísticas del constructor. Dashboard derivado de las
// licitaciones propias (no requiere endpoints nuevos).
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
import { useMySolicitudes } from '../../hooks/useSolicitudes';

export default function ResumenConstructorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: solicitudes = [], isLoading } = useMySolicitudes();

  const stats = useMemo(() => {
    const total = solicitudes.length;
    const activas = solicitudes.filter((s) => s.status === 'OPEN').length;
    const cerradas = solicitudes.filter((s) => s.status === 'CLOSED').length;
    const expiradas = solicitudes.filter((s) => s.status === 'EXPIRED').length;
    const totalOfertas = solicitudes.reduce((acc, s) => acc + s.ofertasCount, 0);
    const promedio = total > 0 ? totalOfertas / total : 0;
    const tasaCierre = total > 0 ? Math.round((cerradas / total) * 100) : 0;
    const conRespuesta = solicitudes.filter((s) => s.ofertasCount > 0).length;
    const tasaRespuesta = total > 0 ? Math.round((conRespuesta / total) * 100) : 0;
    return {
      total,
      activas,
      cerradas,
      expiradas,
      totalOfertas,
      promedio,
      tasaCierre,
      tasaRespuesta,
    };
  }, [solicitudes]);

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Mi actividad</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Card style={styles.hero}>
            <Text style={styles.heroNum}>{stats.totalOfertas}</Text>
            <Text style={styles.heroLabel}>ofertas recibidas en total</Text>
            <Text style={styles.heroSub}>
              en {stats.total} licitación{stats.total === 1 ? '' : 'es'} publicada
              {stats.total === 1 ? '' : 's'}
            </Text>
          </Card>

          {/* Grid de métricas */}
          <View style={styles.grid}>
            <MetricCard value={String(stats.activas)} label="Activas" color={colors.brand[500]} />
            <MetricCard value={String(stats.cerradas)} label="Cerradas" color={colors.success} />
            <MetricCard value={String(stats.expiradas)} label="Expiradas" color={colors.warning} />
            <MetricCard
              value={stats.promedio.toFixed(1)}
              label="Ofertas por licitación"
              color={colors.info}
            />
          </View>

          {/* Tasas */}
          <Text style={styles.sectionTitle}>Rendimiento</Text>
          <Card style={styles.rateCard}>
            <RateBar
              label="Tasa de respuesta"
              hint="Licitaciones que recibieron al menos una oferta"
              percent={stats.tasaRespuesta}
              color={colors.info}
            />
            <View style={{ height: 18 }} />
            <RateBar
              label="Tasa de cierre"
              hint="Licitaciones que terminaron en una compra"
              percent={stats.tasaCierre}
              color={colors.success}
            />
          </Card>

          {stats.total === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                Cuando publiques tu primera licitación vas a ver acá tus estadísticas.
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

function RateBar({
  label,
  hint,
  percent,
  color,
}: {
  label: string;
  hint: string;
  percent: number;
  color: string;
}) {
  return (
    <View>
      <View style={styles.rateHeader}>
        <Text style={styles.rateLabel}>{label}</Text>
        <Text style={[styles.ratePercent, { color }]}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.rateHint}>{hint}</Text>
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
  scroll: { padding: 16 },

  hero: { alignItems: 'center', paddingVertical: 28, marginBottom: 16 },
  heroNum: { fontSize: 52, fontWeight: '900', color: colors.brand[600], lineHeight: 56 },
  heroLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[700], marginTop: 4 },
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
  rateLabel: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
  ratePercent: { fontSize: 16, fontWeight: '800' },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.gray[100], overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  rateHint: { fontSize: 11, color: colors.gray[400], marginTop: 6 },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.gray[500], textAlign: 'center', lineHeight: 20 },
});
