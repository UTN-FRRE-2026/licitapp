import { File } from 'expo-file-system';
import { getIdToken } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Sube un archivo local (uri) al backend .NET via multipart y retorna la URL
// pública que devuelve el servidor (Location del header o `url` en el body).
//
// Migramos desde Firebase Storage al propio backend porque Storage quedó
// detrás del plan Blaze. El backend persiste el archivo en disco y lo sirve
// como estático, así que la URL final apunta al mismo host de la API.

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

  // expo-file-system v56: la API nueva File maneja correctamente los URIs
  // del DocumentPicker en Expo Go (Android scoped storage) y en builds nativos.
  const file = new File(uri);
  const fileName = storagePath.split('/').pop() ?? file.name;

  const formData = new FormData();
  // En RN, FormData acepta { uri, name, type } para archivos locales.
  // El cast a `any` es necesario porque el tipo DOM de FormData no contempla
  // esta shape RN-específica.
  formData.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append('path', storagePath);

  const res = await fetch(`${BASE_URL}/api/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // NO seteamos Content-Type: fetch arma el boundary del multipart solo.
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Upload falló (${res.status}).`);
  }

  const body = (await res.json()) as UploadFileResponse;
  return body.url;
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
