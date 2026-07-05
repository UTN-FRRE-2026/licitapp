import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getMySolicitudes,
  getMySolicitudesPage,
  createSolicitud,
} from '../services/solicitudes.service';
import { useAuthStore } from '../stores/authStore';
import type { NuevaSolicitudFormData, Solicitud } from '../types';

export const SOLICITUDES_PAGE_SIZE = 10;

// ─── Mis licitaciones (todas, para stats/agregados) ──────────────────────────

export function useMySolicitudes() {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery<Solicitud[]>({
    queryKey: ['solicitudes', 'mias', uid],
    queryFn: () => getMySolicitudes(uid!),
    enabled: !!uid,
  });
}

// ─── Mis licitaciones por página (paginado con números Anterior/Siguiente) ───
// Paginado real: cada página es una llamada a la API con Skip/Take en la DB.
// keepPreviousData evita el parpadeo al cambiar de página.

export function useMySolicitudesPage(page: number) {
  const uid = useAuthStore((s) => s.user?.uid);

  return useQuery({
    queryKey: ['solicitudes', 'mias', 'page', uid, page],
    queryFn: () => getMySolicitudesPage(page, SOLICITUDES_PAGE_SIZE),
    enabled: !!uid,
    placeholderData: keepPreviousData,
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
      // Prefijo: invalida tanto la lista completa (stats) como la paginada del home.
      queryClient.invalidateQueries({ queryKey: ['solicitudes', 'mias'] });
    },
  });
}
