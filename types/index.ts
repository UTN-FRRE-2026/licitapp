// ─── Usuarios ───────────────────────────────────────────────────────────────

export type UserRole = 'constructor' | 'corralon';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  zone: string;
  businessName?: string;
  verified: boolean;
  pushToken?: string;
  createdAt: Date;
  stats: {
    totalLicitaciones: number;
    totalOfertas: number;
    totalCierres: number;
  };
}

// Subconjunto público devuelto por GET /api/users/{uid}: datos de contacto de
// la contraparte de una operación (no incluye email / pushToken / stats).
export interface UserContactDto {
  uid: string;
  fullName: string;
  role: UserRole;
  phone: string;
  zone: string;
  businessName: string | null;
  verified: boolean;
}

// ─── Solicitudes / Licitaciones ─────────────────────────────────────────────

export type SolicitudStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'EXPIRED';

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Solicitud {
  id: string;
  constructorId: string;
  constructorName: string;
  title: string;
  deliveryZone: string;
  deadline: Date;
  notes?: string;
  attachmentUrl?: string;
  status: SolicitudStatus;
  winningOfferId?: string;
  ofertasCount: number;
  corralonesNotifiedCount: number;
  createdAt: Date;
  materiales?: Material[];
}

// ─── Ofertas ─────────────────────────────────────────────────────────────────

export type ShippingType = 'FREE' | 'CHARGED' | 'FIXED_PRICE';
export type OfertaStatus = 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'WITHDRAWN';

export interface Oferta {
  id: string;
  solicitudId: string;
  solicitudTitle?: string;   // desnormalizado para listas del corralón
  solicitudDeadline?: Date;  // desnormalizado para countdown en mis-ofertas
  corralonId: string;
  corralonName: string;
  corralonRating?: number;
  totalPrice: number;
  shippingType: ShippingType;
  shippingPrice?: number;
  deliveryHours: number;
  validUntil: Date;
  comment?: string;
  status: OfertaStatus;
  isBestPrice: boolean;
  isFastDelivery: boolean;
  createdAt: Date;
}

// ─── Notificaciones ──────────────────────────────────────────────────────────

export type NotificationType =
  | 'NEW_OFFER'
  | 'DEADLINE_NEAR'
  | 'OFFER_WON'
  | 'OFFER_LOST'
  | 'NEW_REQUEST';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  solicitudId?: string;
  ofertaId?: string;
  read: boolean;
  createdAt: Date;
}

// ─── Formularios ─────────────────────────────────────────────────────────────

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  zone: string;
  role: UserRole;
  businessName?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface MaterialFormItem {
  name: string;
  quantity: string;
  unit: string;
}

export interface NuevaSolicitudFormData {
  title: string;
  materiales: MaterialFormItem[];
  deliveryZone: string;
  deadline: Date;
  notes?: string;
}

export interface NuevaOfertaFormData {
  totalPrice: string;
  shippingType: ShippingType;
  shippingPrice?: string;
  deliveryHours: string;
  validUntil: Date;
  comment?: string;
}
