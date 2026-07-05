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

// Contrato de paginado del backend: { items, page, pageSize, total, totalPages }.
interface PagedResultDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Página de solicitudes ya mapeadas al modelo del front.
export interface SolicitudesPage {
  items: Solicitud[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
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

// ─── Mis solicitudes (constructor) — paginado real desde la API ──────────────
// El backend ordena por createdAt desc (la más nueva primero) y resuelve el
// Skip/Take en la DB. Devolvemos la página ya mapeada.

export async function getMySolicitudesPage(
  page = 1,
  pageSize = 10
): Promise<SolicitudesPage> {
  const res = await api.get<PagedResultDto<SolicitudDto>>(
    `/api/solicitudes/mine?page=${page}&pageSize=${pageSize}`
  );
  return {
    items: res.items.map(mapSolicitud),
    page: res.page,
    pageSize: res.pageSize,
    total: res.total,
    totalPages: res.totalPages,
  };
}

// Todas mis solicitudes en una sola llamada, para pantallas que agregan sobre el
// total (stats, cierres, resumen). Pide el máximo tamaño de página que permite el
// backend (100); alcanza de sobra para el uso real.
export async function getMySolicitudes(_constructorId?: string): Promise<Solicitud[]> {
  const res = await api.get<PagedResultDto<SolicitudDto>>(
    '/api/solicitudes/mine?page=1&pageSize=100'
  );
  return res.items.map(mapSolicitud);
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

// ─── ABM: editar / eliminar cabecera y detalle (materiales) ──────────────────

export interface MaterialInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface UpdateSolicitudInput {
  title: string;
  deliveryZone: string;
  deadline: Date;
  notes?: string;
  attachmentUrl?: string;
}

function mapMaterial(d: MaterialDto): Material {
  return { id: d.id, name: d.name, quantity: d.quantity, unit: d.unit };
}

export async function updateSolicitud(id: string, data: UpdateSolicitudInput): Promise<Solicitud> {
  const dto = await api.put<SolicitudDto>(`/api/solicitudes/${id}`, {
    title: data.title,
    deliveryZone: data.deliveryZone,
    deadline: data.deadline.toISOString(),
    notes: data.notes ?? undefined,
    attachmentUrl: data.attachmentUrl ?? undefined,
  });
  return mapSolicitud(dto);
}

export async function deleteSolicitud(id: string): Promise<void> {
  await api.del(`/api/solicitudes/${id}`);
}

export async function addMaterial(solicitudId: string, m: MaterialInput): Promise<Material> {
  return mapMaterial(await api.post<MaterialDto>(`/api/solicitudes/${solicitudId}/materiales`, m));
}

export async function updateMaterial(
  solicitudId: string,
  materialId: string,
  m: MaterialInput
): Promise<Material> {
  return mapMaterial(
    await api.put<MaterialDto>(`/api/solicitudes/${solicitudId}/materiales/${materialId}`, m)
  );
}

export async function removeMaterial(solicitudId: string, materialId: string): Promise<void> {
  await api.del(`/api/solicitudes/${solicitudId}/materiales/${materialId}`);
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
