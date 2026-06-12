import { api, poll } from './api';
import type { Solicitud, Material, NuevaSolicitudFormData } from '../types';

// ─── DTO del backend ───────────────────────────────────────────────────────────

interface MaterialDto {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface SolicitudDto {
  id: string;
  constructorId: string;
  constructorName: string;
  title: string;
  deliveryZone: string;
  deadline: string; // ISO UTC
  notes: string | null;
  attachmentUrl: string | null;
  status: Solicitud['status'];
  winningOfferId: string | null;
  ofertasCount: number;
  corralonesNotifiedCount: number;
  createdAt: string; // ISO UTC
  materiales?: MaterialDto[];
}

function mapSolicitud(d: SolicitudDto): Solicitud {
  return {
    id: d.id,
    constructorId: d.constructorId,
    constructorName: d.constructorName,
    title: d.title,
    deliveryZone: d.deliveryZone,
    deadline: new Date(d.deadline),
    notes: d.notes ?? undefined,
    attachmentUrl: d.attachmentUrl ?? undefined,
    status: d.status,
    winningOfferId: d.winningOfferId ?? undefined,
    ofertasCount: d.ofertasCount ?? 0,
    corralonesNotifiedCount: d.corralonesNotifiedCount ?? 0,
    createdAt: new Date(d.createdAt),
    materiales: d.materiales?.map(
      (m): Material => ({ id: m.id, name: m.name, quantity: m.quantity, unit: m.unit })
    ),
  };
}

// ─── Crear solicitud ─────────────────────────────────────────────────────────
// constructorId/constructorName los deriva el backend del token (se ignoran acá,
// se conservan en la firma para no tocar el hook que la consume).

export async function createSolicitud(
  _constructorId: string,
  _constructorName: string,
  data: NuevaSolicitudFormData,
  attachmentUrl?: string
): Promise<string> {
  const dto = await api.post<SolicitudDto>('/api/solicitudes', {
    title: data.title,
    deliveryZone: data.deliveryZone,
    deadline: data.deadline.toISOString(),
    notes: data.notes ?? undefined,
    attachmentUrl: attachmentUrl ?? undefined,
    materiales: data.materiales.map((m) => ({
      name: m.name.trim(),
      quantity: parseFloat(m.quantity),
      unit: m.unit,
    })),
  });
  return dto.id;
}

// ─── Mis solicitudes (constructor) ───────────────────────────────────────────

export async function getMySolicitudes(_constructorId?: string): Promise<Solicitud[]> {
  const dtos = await api.get<SolicitudDto[]>('/api/solicitudes/mine');
  return dtos.map(mapSolicitud);
}

// ─── Detalle de solicitud con materiales ─────────────────────────────────────

export async function getSolicitudById(id: string): Promise<Solicitud | null> {
  try {
    return mapSolicitud(await api.get<SolicitudDto>(`/api/solicitudes/${id}`));
  } catch {
    return null;
  }
}

// ─── "Listener" en tiempo real → polling (pantalla "Solicitud publicada") ──────

export function listenToSolicitud(
  id: string,
  callback: (s: Solicitud) => void
): () => void {
  return poll(
    () => api.get<SolicitudDto>(`/api/solicitudes/${id}`),
    (dto) => callback(mapSolicitud(dto))
  );
}

// ─── Feed para corralón por zona ──────────────────────────────────────────────

export async function getSolicitudesByZone(zone: string): Promise<Solicitud[]> {
  const dtos = await api.get<SolicitudDto[]>(
    `/api/solicitudes?zone=${encodeURIComponent(zone)}&status=OPEN`
  );
  return dtos.map(mapSolicitud);
}

export function listenToFeedByZone(
  zone: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  return poll(
    () =>
      api.get<SolicitudDto[]>(
        `/api/solicitudes?zone=${encodeURIComponent(zone)}&status=OPEN`
      ),
    (dtos) => callback(dtos.map(mapSolicitud))
  );
}
