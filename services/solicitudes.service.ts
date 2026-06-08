import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Solicitud, Material, NuevaSolicitudFormData } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function snapToSolicitud(snap: DocumentSnapshot): Solicitud {
  const d = snap.data()!;
  return {
    id: snap.id,
    constructorId: d.constructorId,
    constructorName: d.constructorName,
    title: d.title,
    deliveryZone: d.deliveryZone,
    deadline: d.deadline?.toDate?.() ?? new Date(),
    notes: d.notes ?? undefined,
    attachmentUrl: d.attachmentUrl ?? undefined,
    status: d.status,
    winningOfferId: d.winningOfferId ?? undefined,
    ofertasCount: d.ofertasCount ?? 0,
    corralonesNotifiedCount: d.corralonesNotifiedCount ?? 0,
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };
}

// ─── Crear solicitud ─────────────────────────────────────────────────────────
// Usa batch para escribir el documento padre y todos sus materiales de forma atómica

export async function createSolicitud(
  constructorId: string,
  constructorName: string,
  data: NuevaSolicitudFormData,
  attachmentUrl?: string
): Promise<string> {
  const batch = writeBatch(db);

  const solicitudRef = doc(collection(db, 'solicitudes'));

  batch.set(solicitudRef, {
    constructorId,
    constructorName,
    title: data.title,
    deliveryZone: data.deliveryZone,
    deadline: Timestamp.fromDate(data.deadline),
    notes: data.notes ?? null,
    attachmentUrl: attachmentUrl ?? null,
    status: 'OPEN',
    winningOfferId: null,
    ofertasCount: 0,
    corralonesNotifiedCount: 0,
    createdAt: serverTimestamp(),
  });

  for (const mat of data.materiales) {
    const matRef = doc(collection(db, 'solicitudes', solicitudRef.id, 'materiales'));
    batch.set(matRef, {
      name: mat.name.trim(),
      quantity: parseFloat(mat.quantity),
      unit: mat.unit,
    });
  }

  await batch.commit();
  return solicitudRef.id;
}

// ─── Mis solicitudes (constructor) ───────────────────────────────────────────

export async function getMySolicitudes(constructorId: string): Promise<Solicitud[]> {
  const q = query(
    collection(db, 'solicitudes'),
    where('constructorId', '==', constructorId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(snapToSolicitud);
}

// ─── Detalle de solicitud con materiales ─────────────────────────────────────

export async function getSolicitudById(id: string): Promise<Solicitud | null> {
  const snap = await getDoc(doc(db, 'solicitudes', id));
  if (!snap.exists()) return null;

  const matsSnap = await getDocs(collection(db, 'solicitudes', id, 'materiales'));
  const materiales: Material[] = matsSnap.docs.map((m) => ({
    id: m.id,
    name: m.data().name,
    quantity: m.data().quantity,
    unit: m.data().unit,
  }));

  return { ...snapToSolicitud(snap), materiales };
}

// ─── Listener en tiempo real (para pantalla "Solicitud publicada") ────────────

export function listenToSolicitud(
  id: string,
  callback: (s: Solicitud) => void
): () => void {
  return onSnapshot(doc(db, 'solicitudes', id), (snap) => {
    if (snap.exists()) callback(snapToSolicitud(snap));
  });
}

// ─── Feed para corralón (Sprint 3) ───────────────────────────────────────────

export async function getSolicitudesByZone(zone: string): Promise<Solicitud[]> {
  const q = query(
    collection(db, 'solicitudes'),
    where('deliveryZone', '==', zone),
    where('status', '==', 'OPEN'),
    orderBy('deadline', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(snapToSolicitud);
}

export function listenToFeedByZone(
  zone: string,
  callback: (solicitudes: Solicitud[]) => void
): () => void {
  const q = query(
    collection(db, 'solicitudes'),
    where('deliveryZone', '==', zone),
    where('status', '==', 'OPEN'),
    orderBy('deadline', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(snapToSolicitud));
  });
}
