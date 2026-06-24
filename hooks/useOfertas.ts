import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyOfertas,
  getOfertaById,
  createOferta,
  acceptOffer,
  getCompetenciaResumen,
  withdrawOferta,
} from '../services/ofertas.service';
import { useAuthStore } from '../stores/authStore';
import type { NuevaOfertaFormData, Oferta } from '../types';

// ─── Mis ofertas (corralón) ───────────────────────────────────────────────────

export function useMyOfertas() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery<Oferta[]>({
    queryKey: ['ofertas', 'mias', uid],
    queryFn: () => getMyOfertas(uid!),
    enabled: !!uid,
  });
}

// ─── Stats derivados de las propias ofertas ──────────────────────────────────

export function useMyOfertasStats() {
  const { data: ofertas = [] } = useMyOfertas();

  const pendientes = ofertas.filter((o) => o.status === 'ACTIVE').length;
  const ganadas   = ofertas.filter((o) => o.status === 'WON').length;
  const perdidas  = ofertas.filter((o) => o.status === 'LOST').length;

  return { pendientes, ganadas, perdidas };
}

// ─── Info de competencia para banner en "Cargar oferta" ──────────────────────

export function useCompetenciaResumen(solicitudId: string) {
  return useQuery({
    queryKey: ['competencia', solicitudId],
    queryFn: () => getCompetenciaResumen(solicitudId),
    enabled: !!solicitudId,
    staleTime: 30_000,   // 30s — el banner no necesita ser exacto en tiempo real
  });
}

// ─── Crear oferta ─────────────────────────────────────────────────────────────

export function useCreateOferta(solicitudId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload: {
      solicitudTitle: string;
      solicitudDeadline: Date;
      data: NuevaOfertaFormData;
      attachmentUrl?: string;
    }) =>
      createOferta(
        solicitudId,
        payload.solicitudTitle,
        payload.solicitudDeadline,
        user!.uid,
        user!.businessName ?? user!.fullName,
        payload.data,
        payload.attachmentUrl
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas', 'mias', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['competencia', solicitudId] });
    },
  });
}

// ─── Detalle de una oferta ────────────────────────────────────────────────────

export function useOfertaById(solicitudId: string, ofertaId: string) {
  return useQuery({
    queryKey: ['oferta', solicitudId, ofertaId],
    queryFn: () => getOfertaById(solicitudId, ofertaId),
    enabled: !!solicitudId && !!ofertaId,
  });
}

// ─── Aceptar oferta (constructor) ─────────────────────────────────────────────

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: ({
      solicitudId,
      ofertaId,
      corralonId,
    }: {
      solicitudId: string;
      ofertaId: string;
      corralonId: string;
    }) => acceptOffer(solicitudId, ofertaId, user!.uid, corralonId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes', 'mias', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['ofertas', vars.solicitudId] });
    },
  });
}

// ─── Retirar oferta ───────────────────────────────────────────────────────────

export function useWithdrawOferta() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.user?.uid);

  return useMutation({
    mutationFn: ({ solicitudId, ofertaId }: { solicitudId: string; ofertaId: string }) =>
      withdrawOferta(solicitudId, ofertaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas', 'mias', uid] });
    },
  });
}
