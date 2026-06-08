// Pantalla 07 — Comparar Ofertas: lista en tiempo real, ordenable
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../../../constants/colors';
import { Card } from '../../../components/ui/Card';
import { Pill } from '../../../components/ui/Pill';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { getSolicitudById } from '../../../services/solicitudes.service';
import { listenToOfertasBySolicitud } from '../../../services/ofertas.service';
import type { Solicitud, Oferta } from '../../../types';

type SortKey = 'precio' | 'envio' | 'tiempo';

function totalConEnvio(o: Oferta): number {
  return o.totalPrice + (o.shippingType === 'CHARGED' ? (o.shippingPrice ?? 0) : 0);
}

export default function CompararOfertasScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loadingSol, setLoadingSol] = useState(true);
  const [sort, setSort] = useState<SortKey>('precio');

  // Carga la solicitud una vez
  useEffect(() => {
    if (!id) return;
    getSolicitudById(id).then((sol) => {
      setSolicitud(sol);
      setLoadingSol(false);
    });
  }, [id]);

  // Listener en tiempo real sobre las ofertas
  useEffect(() => {
    if (!id) return;
    const unsubscribe = listenToOfertasBySolicitud(id, setOfertas);
    return unsubscribe;
  }, [id]);

  const sorted = [...ofertas].sort((a, b) => {
    if (sort === 'precio') return totalConEnvio(a) - totalConEnvio(b);
    if (sort === 'envio') {
      // FREE primero, luego FIXED_PRICE, luego CHARGED
      const order = { FREE: 0, FIXED_PRICE: 1, CHARGED: 2 };
      return order[a.shippingType] - order[b.shippingType];
    }
    return a.deliveryHours - b.deliveryHours;
  });

  const isOpen = solicitud?.status === 'OPEN';

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.navCenter}>
          {loadingSol ? (
            <ActivityIndicator size="small" color={colors.brand[500]} />
          ) : (
            <>
              <Text style={styles.navTitle} numberOfLines={1}>
                {solicitud?.title ?? 'Comparar ofertas'}
              </Text>
              <Text style={styles.navSub}>
                {ofertas.length} oferta{ofertas.length !== 1 ? 's' : ''}
                {isOpen ? ' · En curso' : ' · Cerrada'}
              </Text>
            </>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Ordenar */}
      <View style={styles.sortBar}>
        <SegmentedControl
          segments={[
            { key: 'precio' as SortKey,  label: 'Precio'   },
            { key: 'envio'  as SortKey,  label: 'Envío'    },
            { key: 'tiempo' as SortKey,  label: 'Entrega'  },
          ]}
          selected={sort}
          onSelect={setSort}
        />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <OfertaRow
            oferta={item}
            rank={index + 1}
            solicitudId={id!}
            solicitudIsOpen={isOpen}
            onPress={() =>
              router.push(
                `/(constructor)/oferta/${item.id}?solicitudId=${id}`
              )
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>
              {loadingSol ? 'Cargando...' : 'Sin ofertas todavía'}
            </Text>
            {isOpen && (
              <Text style={styles.emptyDesc}>
                Los corralones de tu zona van a ver la licitación y presentar sus precios.
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

// ─── Fila individual de oferta ────────────────────────────────────────────────

function OfertaRow({
  oferta,
  rank,
  solicitudId,
  solicitudIsOpen,
  onPress,
}: {
  oferta: Oferta;
  rank: number;
  solicitudId: string;
  solicitudIsOpen: boolean;
  onPress: () => void;
}) {
  const shippingLabel = {
    FREE:        'Envío gratis',
    CHARGED:     `+$${(oferta.shippingPrice ?? 0).toLocaleString('es-AR')} envío`,
    FIXED_PRICE: 'Envío a convenir',
  }[oferta.shippingType];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={[styles.row, rank === 1 && styles.rowFirst]}>
        {/* Rank */}
        <View style={[styles.rankBadge, rank === 1 && styles.rankBadgeFirst]}>
          <Text style={[styles.rankText, rank === 1 && styles.rankTextFirst]}>
            {rank === 1 ? '🥇' : `#${rank}`}
          </Text>
        </View>

        <View style={styles.rowBody}>
          {/* Nombre + badges */}
          <View style={styles.rowTop}>
            <Text style={styles.corralonName}>{oferta.corralonName}</Text>
            <View style={styles.badges}>
              {oferta.isBestPrice && (
                <Pill label="Mejor precio" variant="brand" />
              )}
              {oferta.isFastDelivery && (
                <Pill label="⚡ Rápido" variant="info" />
              )}
            </View>
          </View>

          {/* Precio */}
          <Text style={styles.price}>
            ${oferta.totalPrice.toLocaleString('es-AR')}
          </Text>

          {/* Detalle */}
          <View style={styles.rowMeta}>
            <Text style={styles.metaItem}>🚚 {shippingLabel}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaItem}>⏱ {oferta.deliveryHours}h</Text>
          </View>
        </View>

        <Text style={styles.chevron}>›</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: 8,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: colors.gray[800] },
  navCenter: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '700', color: colors.gray[900] },
  navSub: { fontSize: 12, color: colors.gray[500] },
  sortBar: {
    padding: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  list: { padding: 16, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  rowFirst: {
    borderWidth: 2,
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeFirst: { backgroundColor: colors.brand[100] },
  rankText: { fontSize: 13, fontWeight: '700', color: colors.gray[500] },
  rankTextFirst: { fontSize: 18 },
  rowBody: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  corralonName: { fontSize: 14, fontWeight: '700', color: colors.gray[900], flex: 1 },
  badges: { flexDirection: 'row', gap: 4 },
  price: { fontSize: 22, fontWeight: '800', color: colors.brand[600], marginBottom: 4 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { fontSize: 12, color: colors.gray[500] },
  metaDot: { fontSize: 12, color: colors.gray[300] },
  chevron: { fontSize: 22, color: colors.gray[300], paddingLeft: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[700], marginBottom: 8 },
  emptyDesc: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
