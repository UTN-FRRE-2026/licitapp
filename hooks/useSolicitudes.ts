import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySolicitudes, createSolicitud } from '../services/solicitudes.service';
import { useAuthStore } from '../stores/authStore';
import type { NuevaSolicitudFormData, Solicitud } from '../types';

// ─── Mis licitaciones ────────────────────────────────────────────────────────

export function useMySolicitudes() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery<Solicitud[]>({
    queryKey: ['solicitudes', 'mias', uid],
    queryFn: () => getMySolicitudes(uid!),
    enabled: !!uid,
  });
}

// ─── Stats derivados de las solicitudes ──────────────────────────────────────

export function useSolicitudesStats() {
  const { data: solicitudes = [] } = useMySolicitudes();

  const activas = solicitudes.filter((s) => s.status === 'OPEN').length;
  const cerradas = solicitudes.filter((s) => s.status === 'CLOSED').length;
  const totalOfertas = solicitudes.reduce((acc, s) => acc + s.ofertasCount, 0);

  return { activas, cerradas, totalOfertas };
}

// ─── Crear solicitud ─────────────────────────────────────────────────────────

export function useCreateSolicitud() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (payload: {
      data: NuevaSolicitudFormData;
      attachmentUrl?: string;
    }) =>
      createSolicitud(
        user!.uid,
        user!.fullName,
        payload.data,
        payload.attachmentUrl
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes', 'mias', user?.uid] });
    },
  });
}
