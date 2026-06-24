import { File, UploadType } from 'expo-file-system';
import { getIdToken } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Sube un archivo local (uri) al backend .NET via multipart y retorna la URL
// pública que devuelve el servidor.
//
// Migramos desde Firebase Storage al propio backend porque Storage quedó
// detrás del plan Blaze. El backend persiste el archivo en disco y lo sirve
// como estático, así que la URL final apunta al mismo host de la API.
//
// Por qué `File.upload()` y no `fetch + FormData`:
// RN 0.85 con la nueva arquitectura rechaza la shape clásica
// `formData.append('file', { uri, name, type })` con el error
// "unsupported formdatapart implementation". El nuevo módulo de FormData de RN
// solo acepta strings y Blobs reales (y Hermes no soporta crear Blobs desde
// ArrayBuffer). `File.upload()` arma el multipart en código nativo y se saltea
// el JS por completo.

interface UploadFileResponse {
  url: string;
}

export async function uploadFile(
  uri: string,
  storagePath: string,
  mimeType: string
): Promise<string> {
  if (!BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL no está configurada.');
  }

  const token = await getIdToken();
  if (!token) {
    throw new Error('No hay sesión activa.');
  }

  const file = new File(uri);

  const result = await file.upload(`${BASE_URL}/api/files`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    parameters: {
      path: storagePath,
    },
  });

  if (result.status >= 400) {
    throw new Error(result.body || `Upload falló (${result.status}).`);
  }

  const parsed = JSON.parse(result.body) as UploadFileResponse;
  return parsed.url;
}

// Genera un path único para un adjunto de solicitud
export function solicitudAttachmentPath(constructorId: string, fileName: string): string {
  const ts = Date.now();
  return `attachments/${constructorId}/${ts}_${fileName}`;
}

// Genera un path único para un adjunto de oferta (presupuesto / foto del corralón)
export function ofertaAttachmentPath(corralonId: string, fileName: string): string {
  const ts = Date.now();
  return `ofertas-attachments/${corralonId}/${ts}_${fileName}`;
}
