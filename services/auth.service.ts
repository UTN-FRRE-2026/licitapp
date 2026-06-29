import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';
import { api, ApiError } from './api';
import type { UserProfile, UserContactDto, RegisterFormData } from '../types';

// ─── Mensajes de error de Firebase Auth ────────────────────────────────────────
// Firebase tira errores con un .code técnico (ej. auth/email-already-in-use) y un
// .message en inglés que no sirve para mostrarle al usuario. Lo traducimos a algo
// entendible en español. Los códigos no contemplados caen a un mensaje genérico.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Iniciá sesión.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/weak-password': 'La contraseña es demasiado débil (mínimo 6 caracteres).',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un momento e intentá de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisá tu internet e intentá de nuevo.',
};

// Convierte cualquier error en un Error con mensaje apto para el usuario. Si es un
// FirebaseError de Auth usa el mapa; de lo contrario reusa el mensaje existente.
function toFriendlyAuthError(err: unknown): Error {
  if (err instanceof FirebaseError) {
    return new Error(
      AUTH_ERROR_MESSAGES[err.code] ?? 'No pudimos completar la operación. Intentá de nuevo.'
    );
  }
  if (err instanceof Error) return err;
  return new Error('No pudimos completar la operación. Intentá de nuevo.');
}

// La autenticación sigue 100% en Firebase Auth (login, registro, sesión).
// El PERFIL del usuario vive en el backend .NET (PostgreSQL); Firebase sólo
// emite el ID Token que el backend valida en cada request.

// ─── DTO del backend ───────────────────────────────────────────────────────────

interface UserDto {
  uid: string;
  email: string;
  fullName: string;
  role: UserProfile['role'];
  phone: string;
  zone: string;
  businessName: string | null;
  verified: boolean;
  pushToken: string | null;
  createdAt: string; // ISO UTC
  stats: {
    totalLicitaciones: number;
    totalOfertas: number;
    totalCierres: number;
  };
}

function mapUser(d: UserDto): UserProfile {
  return {
    uid: d.uid,
    email: d.email,
    fullName: d.fullName,
    role: d.role,
    phone: d.phone,
    zone: d.zone,
    businessName: d.businessName ?? undefined,
    verified: d.verified,
    pushToken: d.pushToken ?? undefined,
    createdAt: new Date(d.createdAt),
    stats: {
      totalLicitaciones: d.stats?.totalLicitaciones ?? 0,
      totalOfertas: d.stats?.totalOfertas ?? 0,
      totalCierres: d.stats?.totalCierres ?? 0,
    },
  };
}

// ─── Registro ────────────────────────────────────────────────────────────────
// 1. Crea el usuario en Firebase  2. Hace upsert del perfil en el backend

export async function register(data: RegisterFormData): Promise<UserProfile> {
  try {
    await createUserWithEmailAndPassword(auth, data.email, data.password);
  } catch (err) {
    throw toFriendlyAuthError(err);
  }

  const dto = await api.post<UserDto>('/api/users/sync', {
    role: data.role,
    fullName: data.fullName,
    phone: data.phone,
    zone: data.zone,
    businessName: data.businessName ?? undefined,
  });

  return mapUser(dto);
}

// ─── Login ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<UserProfile> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    throw toFriendlyAuthError(err);
  }
  return mapUser(await api.get<UserDto>('/api/users/me'));
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await signOut(auth);
}

// ─── Recuperar contraseña ──────────────────────────────────────────────────────
// Firebase envía el correo de reseteo. No revela si el email existe o no (por
// privacidad), así que la pantalla muestra siempre un mensaje de "revisá tu casilla".

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw toFriendlyAuthError(err);
  }
}

// ─── Perfil del usuario autenticado ────────────────────────────────────────────

export async function getMyProfile(): Promise<UserProfile> {
  return mapUser(await api.get<UserDto>('/api/users/me'));
}

// Actualización parcial del propio perfil (ej. guardar el pushToken).
export async function updateMyProfile(
  data: Partial<Pick<UserProfile, 'fullName' | 'phone' | 'zone' | 'businessName' | 'pushToken'>>
): Promise<UserProfile> {
  return mapUser(await api.put<UserDto>('/api/users/me', data));
}

// ─── Datos de contacto de OTRO usuario (contraparte de una operación) ──────────
// Lo usan las pantallas de cierre para mostrar el contacto del corralón ganador /
// del constructor. GET /api/users/{uid} devuelve un subconjunto (UserContactDto).
// 404 → null (sin operación válida o sin perfil); cualquier otro error se propaga.
export async function getUserProfile(uid: string): Promise<UserContactDto | null> {
  try {
    return await api.get<UserContactDto>(`/api/users/${uid}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ─── Observer de auth state ──────────────────────────────────────────────────
// Retorna la función unsubscribe de Firebase

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Obtener token JWT para el backend .NET ───────────────────────────────────

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
