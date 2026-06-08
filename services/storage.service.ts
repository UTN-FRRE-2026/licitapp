import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Sube un archivo local (uri) a Firebase Storage y retorna la URL pública.
// En la migración a .NET: reemplazar por un POST multipart al endpoint /api/files.

export async function uploadFile(
  uri: string,
  storagePath: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: mimeType });

  return getDownloadURL(storageRef);
}

// Genera un path único para un adjunto de solicitud
export function solicitudAttachmentPath(constructorId: string, fileName: string): string {
  const ts = Date.now();
  return `attachments/${constructorId}/${ts}_${fileName}`;
}
