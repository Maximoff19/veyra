// Cliente HTTP compartido. Cambia las rutas en api-contract.ts y la base en VITE_API_BASE_URL.
// No contiene diseño visual; conserva la validación de HTTPS, credenciales y errores.
import { apiContract, type Endpoint } from './api-contract';

// Error de solicitud con estado HTTP para distinguir rechazos del servidor y fallos de conexión.
export class ApiError extends Error {
  constructor(message: string, public readonly status: number = 0) { super(message); }
}
interface RequestOptions {
  token?: string;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  params?: Record<string, string>;
  query?: URLSearchParams;
}
// Construye el cliente usado por los componentes y por las pruebas con transporte simulado.
export function createApiClient(baseUrl: string, contract = apiContract) {
function hasCapability(endpoint: Endpoint): boolean {
  return Boolean(baseUrl && contract.verified && contract.endpoints[endpoint]);
}
async function apiRequest<T>(endpoint: Endpoint, decode: (value: unknown) => T, options: RequestOptions = {}): Promise<T> {
  if (!hasCapability(endpoint)) throw new ApiError('Este servicio todavía no está conectado. No se ha realizado ninguna operación.');
  let path = contract.endpoints[endpoint]!;
  for (const [key, value] of Object.entries(options.params ?? {})) path = path.replace(`:${key}`, encodeURIComponent(value));
  if (/:[a-zA-Z]/.test(path)) throw new ApiError('La ruta del servicio no está configurada correctamente.');
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, globalThis.location?.origin ?? 'http://localhost');
  if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) throw new ApiError('La dirección del servicio no es válida.');
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new ApiError('La conexión al servicio debe ser segura (HTTPS).');
  url.search = options.query?.toString() ?? '';
  const response = await fetch(url, {
    method: options.method ?? 'GET', signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });
  if (!response.ok) {
    let message = 'No pudimos completar la solicitud. Inténtalo de nuevo.';
    try {
      const error: unknown = await response.json();
      if (error && typeof error === 'object') {
        if ('error' in error && typeof error.error === 'string') message = error.error;
        else if ('message' in error && typeof error.message === 'string') message = error.message;
      }
    } catch { /* Si el error no es JSON, conserva el mensaje de ayuda predeterminado. */ }
    if (response.status === 401 && options.token) {
      message = 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
      if (options.token) globalThis.window?.dispatchEvent(new CustomEvent('veyra:session-expired', { detail: options.token }));
    }
    throw new ApiError(message, response.status);
  }
  if (response.status === 204) return decode(null);
  return decode(await response.json());
}
return { apiRequest, hasCapability };
}
export const { apiRequest, hasCapability } = createApiClient(import.meta.env?.VITE_API_BASE_URL?.trim() || '/api');
// Convierte errores desconocidos en mensajes visibles para el usuario.
export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  return error instanceof Error ? error.message : 'Ha ocurrido un error. Inténtalo de nuevo.';
}
