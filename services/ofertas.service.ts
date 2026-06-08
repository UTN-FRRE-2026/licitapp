import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  DocumentSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Oferta, NuevaOfertaFormData, ShippingType } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function snapToOferta(snap: DocumentSnapshot, solicitudId?: string): Oferta {
  const d = snap.data()!;
  return {
    id: snap.id,
    solicitudId: solicitudId ?? d.solicitudId ?? '',
    solicitudTitle: d.solicitudTitle ?? undefined,
    solicitudDeadline: d.solicitudDeadline?.toDate?.() ?? undefined,
    corralonId: d.corralonId,
    corralonName: d.corralonName,
    corralonRating: d.corralonRating ?? undefined,
    totalPrice: d.totalPrice,
    shippingType: d.shippingType as ShippingType,
    shippingPrice: d.shippingPrice ?? undefined,
    deliveryHours: d.deliveryHours,
    validUntil: d.validUntil?.toDate?.() ?? new Date(),
    comment: d.comment ?? undefined,
    status: d.status,
    isBestPrice: d.isBestPrice ?? false,
    isFastDelivery: d.isFastDelivery ?? false,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

// ─── Crear oferta ─────────────────────────────────────────────────────────────
// Guarda en subcollección + recalcula isBestPrice en transacción

export async function createOferta(
  solicitudId: string,
  solicitudTitle: string,
  solicitudDeadline: Date,
  corralonId: string,
  corralonName: string,
  data: NuevaOfertaFormData
): Promise<string> {
  const newPrice = parseFloat(data.totalPrice);

  await runTransaction(db, async (tx) => {
    // Verifica que la solicitud sigue abierta
    const solicitudRef = doc(db, 'solicitudes', solicitudId);
    const solicitudSnap = await tx.get(solicitudRef);
    if (!solicitudSnap.exists() || solicitudSnap.data().status !== 'OPEN') {
      throw new Error('Esta licitación ya no está activa.');
    }

    // Obtiene ofertas existentes para recalcular badges
    const ofertasSnap = await getDocs(
      collection(db, 'solicitudes', solicitudId, 'ofertas')
    );
    const precios = ofertasSnap.docs
      .filter((d) => d.data().status === 'ACTIVE')
      .map((d) => d.data().totalPrice as number);

    const isBestPrice = precios.length === 0 || newPrice <= Math.min(...precios);
    const minDelivery = solicitudSnap.data().deadline?.toDate?.() ?? new Date();
    const isFastDelivery =
      data.deliveryHours !== undefined &&
      parseInt(data.deliveryHours) <= 24;

    // Si la nueva es la mejor → quitar badge a la anterior
    if (isBestPrice) {
      ofertasSnap.docs.forEach((d) => {
        if (d.data().isBestPrice) {
          tx.update(d.ref, { isBestPrice: false });
        }
      });
    }

    // Crea la nueva oferta
    const nuevaRef = doc(collection(db, 'solicitudes', solicitudId, 'ofertas'));
    tx.set(nuevaRef, {
      solicitudId,
      solicitudTitle,
      solicitudDeadline: Timestamp.fromDate(solicitudDeadline),
      corralonId,
      corralonName,
      totalPrice: newPrice,
      shippingType: data.shippingType,
      shippingPrice: data.shippingPrice ? parseFloat(data.shippingPrice) : null,
      deliveryHours: parseInt(data.deliveryHours),
      validUntil: Timestamp.fromDate(data.validUntil ?? solicitudDeadline),
      comment: data.comment ?? null,
      status: 'ACTIVE',
      isBestPrice,
      isFastDelivery,
      createdAt: serverTimestamp(),
    });

    // Incrementa el contador en la solicitud
    tx.update(solicitudRef, {
      ofertasCount: (solicitudSnap.data().ofertasCount ?? 0) + 1,
    });
  });

  // Retorna el id de la nueva oferta (busca la última del corralón)
  const q = query(
    collection(db, 'solicitudes', solicitudId, 'ofertas'),
    where('corralonId', '==', corralonId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs[0]?.id ?? '';
}

// ─── Ofertas de una solicitud (para comparar — constructor) ───────────────────

export async function getOfertasBySolicitud(solicitudId: string): Promise<Oferta[]> {
  const q = query(
    collection(db, 'solicitudes', solicitudId, 'ofertas'),
    where('status', '==', 'ACTIVE'),
    orderBy('totalPrice', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => snapToOferta(d, solicitudId));
}

export function listenToOfertasBySolicitud(
  solicitudId: string,
  callback: (ofertas: Oferta[]) => void
): () => void {
  const q = query(
    collection(db, 'solicitudes', solicitudId, 'ofertas'),
    where('status', '==', 'ACTIVE'),
    orderBy('totalPrice', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => snapToOferta(d, solicitudId)));
  });
}

// ─── Mis ofertas (corralón) — collectionGroup ─────────────────────────────────
// Requiere índice en Firestore: ofertas → corralonId ASC + createdAt DESC

export async function getMyOfertas(corralonId: string): Promise<Oferta[]> {
  const q = query(
    collectionGroup(db, 'ofertas'),
    where('corralonId', '==', corralonId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    // El path es solicitudes/{solicitudId}/ofertas/{ofertaId}
    const solicitudId = d.ref.parent.parent?.id ?? '';
    return snapToOferta(d, solicitudId);
  });
}

// ─── Resumen de competencia para banner de "Cargar oferta" ───────────────────

export async function getCompetenciaResumen(
  solicitudId: string
): Promise<{ count: number; bestPrice: number | null }> {
  const snap = await getDocs(
    query(
      collection(db, 'solicitudes', solicitudId, 'ofertas'),
      where('status', '==', 'ACTIVE')
    )
  );
  const active = snap.docs.map((d) => d.data().totalPrice as number);
  return {
    count: active.length,
    bestPrice: active.length > 0 ? Math.min(...active) : null,
  };
}

// ─── Obtener una oferta por id ────────────────────────────────────────────────

export async function getOfertaById(
  solicitudId: string,
  ofertaId: string
): Promise<Oferta | null> {
  const snap = await getDoc(doc(db, 'solicitudes', solicitudId, 'ofertas', ofertaId));
  if (!snap.exists()) return null;
  return snapToOferta(snap, solicitudId);
}

// ─── Aceptar oferta — transaction atómica ─────────────────────────────────────
// 1. Verifica OPEN, 2. WON al ganador, 3. LOST al resto, 4. CLOSED en solicitud

export async function acceptOffer(
  solicitudId: string,
  winningOfertaId: string,
  constructorId: string,
  corralonId: string
): Promise<void> {
  // Obtiene refs de todas las ofertas antes del transaction
  const ofertasSnap = await getDocs(
    collection(db, 'solicitudes', solicitudId, 'ofertas')
  );

  await runTransaction(db, async (tx) => {
    const solicitudRef = doc(db, 'solicitudes', solicitudId);
    const solicitudSnap = await tx.get(solicitudRef);

    if (!solicitudSnap.exists() || solicitudSnap.data().status !== 'OPEN') {
      throw new Error('Esta licitación ya no está disponible.');
    }

    // Marcar ofertas WON / LOST
    ofertasSnap.docs.forEach((d) => {
      if (d.data().status === 'ACTIVE') {
        tx.update(d.ref, {
          status: d.id === winningOfertaId ? 'WON' : 'LOST',
        });
      }
    });

    // Cerrar la solicitud
    tx.update(solicitudRef, {
      status: 'CLOSED',
      winningOfferId: winningOfertaId,
    });

    // Incrementar stats constructor
    const constructorRef = doc(db, 'users', constructorId);
    const constructorSnap = await tx.get(constructorRef);
    tx.update(constructorRef, {
      'stats.totalCierres': ((constructorSnap.data()?.stats?.totalCierres ?? 0) as number) + 1,
    });

    // Incrementar stats corralón
    const corralonRef = doc(db, 'users', corralonId);
    const corralonSnap = await tx.get(corralonRef);
    tx.update(corralonRef, {
      'stats.totalCierres': ((corralonSnap.data()?.stats?.totalCierres ?? 0) as number) + 1,
    });
  });
}

// ─── Editar oferta (sólo si la solicitud está OPEN) ──────────────────────────

export async function updateOferta(
  solicitudId: string,
  ofertaId: string,
  data: Partial<{ totalPrice: number; shippingType: ShippingType; shippingPrice: number; deliveryHours: number; comment: string }>
): Promise<void> {
  await updateDoc(
    doc(db, 'solicitudes', solicitudId, 'ofertas', ofertaId),
    data
  );
}

// ─── Retirar oferta ───────────────────────────────────────────────────────────

export async function withdrawOferta(solicitudId: string, ofertaId: string): Promise<void> {
  await updateDoc(
    doc(db, 'solicitudes', solicitudId, 'ofertas', ofertaId),
    { status: 'WITHDRAWN' }
  );
}
