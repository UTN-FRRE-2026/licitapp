// Pantalla — Detalle de mi licitación (constructor): vista de sólo lectura del
// pedido propio, con materiales, condiciones y acceso a comparar ofertas.
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../../constants/colors';
import { BackButton } from '../../../components/ui/BackButton';
import { Card } from '../../../components/ui/Card';
import { Pill } from '../../../components/ui/Pill';
import { Button } from '../../../components/ui/Button';
import { getSolicitudById } from '../../../services/solicitudes.service';
import type { Solicitud } from '../../../types';

const STATUS_META = {
  OPEN: { label: 'Abierta', variant: 'success' as const },
  CLOSED: { label: 'Cerrada', variant: 'gray' as const },
  CANCELLED: { label: 'Cancelada', variant: 'danger' as const },
  EXPIRED: { label: 'Expirada', variant: 'warning' as const },
};

export default function DetalleLicitacionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setSolicitud(await getSolicitudById(id));
    } catch {
      setSolicitud(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brand[500]} size="large" />
      </View>
    );
  }

  if (!solicitud) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se pudo cargar la licitación.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_META[solicitud.status];
  const isOpen = solicitud.status === 'OPEN';
  const isClosed = solicitud.status === 'CLOSED';
  const hasOfertas = solicitud.ofertasCount > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.nav, { paddingTop: insets.top + 12 }]}>
        <BackButton />
        <Text style={styles.navTitle}>Mi licitación</Text>
        {isOpen ? (
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/(constructor)/editar-solicitud/[id]', params: { id } })
            }
            style={styles.editBtn}
          >
            <Text style={styles.editLink}>Editar</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brand[500]}
          />
        }
      >
        {/* Encabezado */}
        <Card style={styles.headerCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{solicitud.title}</Text>
            <Pill label={status.label} variant={status.variant} />
          </View>
          <View style={styles.metaGrid}>
            <MetaItem icon="📍" label="Zona de entrega" value={solicitud.deliveryZone} />
            <MetaItem
              icon="📅"
              label="Cierra"
              value={format(solicitud.deadline, "d 'de' MMMM, HH:mm", { locale: es })}
            />
            <MetaItem
              icon="🕒"
              label="Publicada"
              value={format(solicitud.createdAt, "d 'de' MMMM yyyy", { locale: es })}
            />
          </View>
        </Card>

        {/* Resumen de actividad */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, styles.statBoxBrand]}>
            <Text style={[styles.statNum, { color: colors.brand[700] }]}>
              {solicitud.ofertasCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.brand[700] }]}>
              Ofertas recibidas
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{solicitud.corralonesNotifiedCount}</Text>
            <Text style={styles.statLabel}>Corralones avisados</Text>
          </View>
        </View>

        {/* Materiales */}
        <Text style={styles.sectionTitle}>Materiales solicitados</Text>
        <Card>
          {solicitud.materiales && solicitud.materiales.length > 0 ? (
            solicitud.materiales.map((mat, i) => (
              <View
                key={mat.id}
                style={[
                  styles.materialRow,
                  i < (solicitud.materiales?.length ?? 0) - 1 && styles.materialRowBorder,
                ]}
              >
                <Text style={styles.materialName}>{mat.name}</Text>
                <Text style={styles.materialQty}>
                  {mat.quantity} {mat.unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noMateriales}>Sin materiales cargados.</Text>
          )}
        </Card>

        {/* Notas */}
        {solicitud.notes ? (
          <>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Card>
              <Text style={styles.notes}>{solicitud.notes}</Text>
            </Card>
          </>
        ) : null}

        {/* Adjunto */}
        {solicitud.attachmentUrl ? (
          <>
            <Text style={styles.sectionTitle}>Archivo adjunto</Text>
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => Linking.openURL(solicitud.attachmentUrl!)}
            >
              <Text style={styles.pdfIcon}>📎</Text>
              <Text style={styles.pdfText}>Ver documento adjunto</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isClosed ? (
          <View style={styles.closedBox}>
            <Text style={styles.closedIcon}>🏆</Text>
            <Text style={styles.closedText}>Licitación cerrada</Text>
          </View>
        ) : (
          <Button
            label={
              hasOfertas
                ? `Comparar ${solicitud.ofertasCount} oferta${solicitud.ofertasCount === 1 ? '' : 's'}`
                : 'Aún no hay ofertas'
            }
            onPress={() =>
              router.push({ pathname: '/(constructor)/comparar/[id]', params: { id } })
            }
            disabled={!isOpen || !hasOfertas}
            variant="primary"
          />
        )}
      </View>
    </View>
  );
}

function MetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
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
  editBtn: { height: 36, justifyContent: 'center', paddingHorizontal: 4 },
  editLink: { fontSize: 15, fontWeight: '600', color: colors.brand[600] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 16 },

  headerCard: { marginBottom: 12 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] },
  metaGrid: { gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  metaLabel: { fontSize: 11, color: colors.gray[500] },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  statBoxBrand: { backgroundColor: colors.brand[50], borderColor: colors.brand[100] },
  statNum: { fontSize: 26, fontWeight: '800', color: colors.gray[900] },
  statLabel: { fontSize: 11, color: colors.gray[500], marginTop: 4, fontWeight: '500' },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  materialRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  materialName: { fontSize: 14, color: colors.gray[800], flex: 1 },
  materialQty: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[700],
    backgroundColor: colors.gray[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  noMateriales: { color: colors.gray[400], fontSize: 13 },
  notes: { fontSize: 14, color: colors.gray[700], lineHeight: 20 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: 12,
    padding: 14,
  },
  pdfIcon: { fontSize: 20 },
  pdfText: { fontSize: 14, fontWeight: '600', color: colors.brand[600] },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  closedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 14,
  },
  closedIcon: { fontSize: 18 },
  closedText: { fontSize: 14, color: colors.gray[600], fontWeight: '600' },
});
