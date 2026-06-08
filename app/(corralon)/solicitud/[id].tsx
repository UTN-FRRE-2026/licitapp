// Pantalla 13 — Ver Solicitud (corralón): materiales, condiciones, "Presentar oferta"
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { colors } from '../../../constants/colors';
import { Card } from '../../../components/ui/Card';
import { Pill } from '../../../components/ui/Pill';
import { Button } from '../../../components/ui/Button';
import { getSolicitudById } from '../../../services/solicitudes.service';
import { getMyOfertas } from '../../../services/ofertas.service';
import { useAuthStore } from '../../../stores/authStore';
import type { Solicitud } from '../../../types';

export default function VerSolicitudScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [yaOferto, setYaOferto] = useState(false);

  useEffect(() => {
    if (!id || !user?.uid) return;

    const fetchData = async () => {
      try {
        const [sol, misOfertas] = await Promise.all([
          getSolicitudById(id),
          getMyOfertas(user.uid),
        ]);
        setSolicitud(sol);
        const yaExiste = misOfertas.some(
          (o) => o.solicitudId === id && o.status === 'ACTIVE'
        );
        setYaOferto(yaExiste);
      } catch {
        setSolicitud(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user?.uid]);

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
        <Text style={styles.errorText}>No se pudo cargar la solicitud.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOpen = solicitud.status === 'OPEN';

  const handlePresentarOferta = () => {
    router.push({
      pathname: '/(corralon)/cargar-oferta',
      params: {
        solicitudId: id,
        solicitudTitle: solicitud.title,
        solicitudDeadline: solicitud.deadline.toISOString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Detalle del pedido</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Encabezado */}
        <Card style={styles.headerCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{solicitud.title}</Text>
            <Pill
              label={
                solicitud.status === 'OPEN' ? 'Abierta' :
                solicitud.status === 'CLOSED' ? 'Cerrada' : 'Expirada'
              }
              variant={solicitud.status === 'OPEN' ? 'success' : 'gray'}
            />
          </View>

          <View style={styles.metaGrid}>
            <MetaItem icon="👤" label="Constructor" value={solicitud.constructorName} />
            <MetaItem icon="📍" label="Zona" value={solicitud.deliveryZone} />
            <MetaItem
              icon="📅"
              label="Cierra"
              value={format(solicitud.deadline, "d 'de' MMMM, HH:mm", { locale: es })}
            />
            <MetaItem
              icon="📦"
              label="Ofertas recibidas"
              value={String(solicitud.ofertasCount)}
            />
          </View>
        </Card>

        {/* Lista de materiales */}
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

        {/* Notas / condiciones */}
        {solicitud.notes ? (
          <>
            <Text style={styles.sectionTitle}>Condiciones y notas</Text>
            <Card>
              <Text style={styles.notes}>{solicitud.notes}</Text>
            </Card>
          </>
        ) : null}

        {/* PDF adjunto */}
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

      {/* Botón presentar oferta */}
      <View style={styles.footer}>
        {yaOferto ? (
          <View style={styles.yaOferto}>
            <Text style={styles.yaOfertIcon}>✓</Text>
            <Text style={styles.yaOfertText}>Ya presentaste una oferta en esta licitación</Text>
          </View>
        ) : (
          <Button
            label={isOpen ? 'Presentar oferta' : 'Licitación cerrada'}
            onPress={handlePresentarOferta}
            disabled={!isOpen}
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
      <View>
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
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backBtnText: { fontSize: 22, color: colors.gray[800] },
  navTitle: { fontSize: 16, fontWeight: '700', color: colors.gray[900] },
  scroll: { padding: 16 },
  headerCard: { marginBottom: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.gray[900] },
  metaGrid: { gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  metaLabel: { fontSize: 11, color: colors.gray[500] },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.gray[800] },
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
  materialRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
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
  yaOferto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.successBg,
    borderRadius: 12,
    padding: 14,
  },
  yaOfertIcon: { fontSize: 16, color: colors.success },
  yaOfertText: { fontSize: 14, color: colors.success, fontWeight: '600' },
});
