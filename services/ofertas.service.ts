import { api, poll } from './api';
import type { Oferta, NuevaOfertaFormData, ShippingType } from '../types';

// ─── DTO del backend ───────────────────────────────────────────────────────────

interface OfertaDto {
  id: string;
  solicitudId: string;
  corralonId: string;
  corralonName: string;
  corralonRating: number | null;
  totalPrice: number;
  shippingType: ShippingType;
  shippingPrice: number | null;
  deliveryHours: number;
  validUntil: string; // ISO UTC
  comment: string | null;
  attachmentUrl: string | null;
  status: Oferta['status'];
  isBestPrice: boolean;
  isFastDelivery: boolean;
  createdAt: string; // ISO UTC
  solicitudTitle?: string | null;    // sólo en /api/ofertas/mine
  solicitudDeadline?: string | null; // sólo en /api/ofertas/mine
}

function mapOferta(d: OfertaDto): Oferta {
  return {
    id: d.id,
    solicitudId: d.solicitudId,
    solicitudTitle: d.solicitudTitle ?? undefined,
    solicitudDeadline: d.solicitudDeadline ? new Date(d.solicitudDeadline) : undefined,
    corralonId: d.corralonId,
    corralonName: d.corralonName,
    corralonRating: d.corralonRating ?? undefined,
    totalPrice: d.totalPrice,
    shippingType: d.shippingType,
    shippingPrice: d.shippingPrice ?? undefined,
    deliveryHours: d.deliveryHours,
    validUntil: new Date(d.validUntil),
    comment: d.comment ?? undefined,
    attachmentUrl: d.attachmentUrl ?? undefined,
    status: d.status,
    isBestPrice: d.isBestPrice ?? false,
    isFastDelivery: d.isFastDelivery ?? false,
    createdAt: new Date(d.createdAt),
  };
}

// ─── Crear oferta ─────────────────────────────────────────────────────────────
// corralonId/corralonName los deriva el backend del token; solicitudTitle/Deadline
// ya no se envían (el backend los desnormaliza). Se conservan en la firma para no
// tocar el hook que la consume.

export async function createOferta(
  solicitudId: string,
  _solicitudTitle: string,
  solicitudDeadline: Date,
  _corralonId: string,
  _corralonName: string,
  data: NuevaOfertaFormData,
  attachmentUrl?: string
): Promise<string> {
  const dto = await api.post<OfertaDto>(`/api/solicitudes/${solicitudId}/ofertas`, {
    totalPrice: parseFloat(data.totalPrice),
    shippingType: data.shippingType,
    shippingPrice: data.shippingPrice ? parseFloat(data.shippingPrice) : undefined,
    deliveryHours: parseInt(data.deliveryHours, 10),
    validUntil: (data.validUntil ?? solicitudDeadline).toISOString(),
    comment: data.comment ?? undefined,
    attachmentUrl: attachmentUrl ?? undefined,
  });
  return dto.id;
}

// ─── Ofertas de una solicitud (constructor compara) ───────────────────────────

export async function getOfertasBySolicitud(solicitudId: string): Promise<Oferta[]> {
  const dtos = await api.get<OfertaDto[]>(`/api/solicitudes/${solicitudId}/ofertas`);
  return dtos.map(mapOferta);
}

export function listenToOfertasBySolicitud(
  solicitudId: string,
  callback: (ofertas: Oferta[]) => void
): () => void {
  return poll(
    () => api.get<OfertaDto[]>(`/api/solicitudes/${solicitudId}/ofertas`),
    (dtos) => callback(dtos.map(mapOferta))
  );
}

// ─── Mis ofertas (corralón) ────────────────────────────────────────────────────

export async function getMyOfertas(_corralonId?: string): Promise<Oferta[]> {
  const dtos = await api.get<OfertaDto[]>('/api/ofertas/mine');
  return dtos.map(mapOferta);
}

// ─── Resumen de competencia para banner de "Cargar oferta" ───────────────────

export async function getCompetenciaResumen(
  solicitudId: string
): Promise<{ count: number; bestPrice: number | null }> {
  return api.get<{ count: number; bestPrice: number | null }>(
    `/api/solicitudes/${solicitudId}/ofertas/resumen`
  );
}

// ─── Obtener una oferta por id ────────────────────────────────────────────────

export async function getOfertaById(
  solicitudId: string,
  ofertaId: string
): Promise<Oferta | null> {
  try {
    return mapOferta(
      await api.get<OfertaDto>(`/api/solicitudes/${solicitudId}/ofertas/${ofertaId}`)
    );
  } catch {
    return null;
  }
}

// ─── Aceptar oferta (constructor) ─────────────────────────────────────────────
// El backend cierra la licitación y actualiza WON/LOST + stats en una transacción.

export async function acceptOffer(
  solicitudId: string,
  winningOfertaId: string,
  _constructorId: string,
  _corralonId: string
): Promise<void> {
  await api.post(`/api/solicitudes/${solicitudId}/accept`, {
    ofertaId: winningOfertaId,
  });
}

// ─── Editar oferta (sólo si la solicitud está OPEN) ──────────────────────────
// Nota: el backend NO permite editar validUntil en la edición.

export async function updateOferta(
  solicitudId: string,
  ofertaId: string,
  data: Partial<{
    totalPrice: number;
    shippingType: ShippingType;
    shippingPrice: number;
    deliveryHours: number;
    comment: string;
  }>
): Promise<void> {
  await api.put(`/api/solicitudes/${solicitudId}/ofertas/${ofertaId}`, data);
}

// ─── Retirar oferta ───────────────────────────────────────────────────────────

export async function withdrawOferta(
  solicitudId: string,
  ofertaId: string
): Promise<void> {
  await api.post(`/api/solicitudes/${solicitudId}/ofertas/${ofertaId}/withdraw`);
}
