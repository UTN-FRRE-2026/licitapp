import { getIdToken } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  console.warn('[api] EXPO_PUBLIC_API_URL no está definida. Revisá tu .env');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Intenta extraer el mensaje de error que devuelve el backend (.NET suele
// mandar { message } o ProblemDetails { title, detail }). Cae al texto crudo.
async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text);
    return body.message ?? body.detail ?? body.title ?? text;
  } catch {
    return text || `Error ${res.status}`;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  // 204 No Content u otra respuesta sin cuerpo
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Reemplazo de los listeners en tiempo real de Firestore (onSnapshot).
// El backend .NET no expone realtime (SignalR queda fuera de alcance), así que
// emulamos el contrato `(callback) => unsubscribe` con polling: una primera
// lectura inmediata + refetch cada `intervalMs`. Devuelve la función de limpieza.
export function poll<T>(
  fetcher: () => Promise<T>,
  callback: (value: T) => void,
  intervalMs = 15000
): () => void {
  let cancelled = false;

  const run = async () => {
    try {
      const value = await fetcher();
      if (!cancelled) callback(value);
    } catch {
      // silencioso: el próximo tick reintenta
    }
  };

  run();
  const id = setInterval(run, intervalMs);

  return () => {
    cancelled = true;
    clearInterval(id);
  };
}
