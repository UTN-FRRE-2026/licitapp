import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { UserProfile, RegisterFormData } from '../types';

// ─── Registro ────────────────────────────────────────────────────────────────

export async function register(data: RegisterFormData): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    data.email,
    data.password
  );

  const profile: Omit<UserProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    uid: credential.user.uid,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    phone: data.phone,
    zone: data.zone,
    businessName: data.businessName ?? undefined,
    verified: false,
    stats: {
      totalLicitaciones: 0,
      totalOfertas: 0,
      totalCierres: 0,
    },
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', credential.user.uid), profile);

  return {
    ...profile,
    createdAt: new Date(),
  };
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) throw new Error('Perfil de usuario no encontrado.');
  return profile;
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(auth);
}

// ─── Obtener perfil ──────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    ...data,
    uid: snap.id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as UserProfile;
}

// ─── Observer de auth state ──────────────────────────────────────────────────
// Retorna la función unsubscribe de Firebase

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Obtener token JWT (para futuro backend .NET) ────────────────────────────

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
