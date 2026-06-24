import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { storage } from './firebase';

// Sube un archivo local (uri) a Firebase Storage y retorna la URL pública.
//
// Por qué no usamos `fetch(uri).blob()` + uploadBytes:
// Hermes (motor JS de RN) no soporta construir Blobs desde ArrayBuffer/ArrayBufferView,
// y ese es el camino interno que toma `Response.blob()` cuando devuelve binarios.
// Resultado: error "Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported".
// Solución: leer el archivo a base64 con expo-file-system y subirlo con uploadString,
// que toma el string directamente y maneja la codificación del lado del SDK.
//
// En la migración a .NET: reemplazar por POST multipart al endpoint /api/files.

export async function uploadFile(
  uri: string,
  storagePath: string,
  mimeType: string
): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const storageRef = ref(storage, storagePath);
  await uploadString(storageRef, base64, 'base64', { contentType: mimeType });

  return getDownloadURL(storageRef);
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
