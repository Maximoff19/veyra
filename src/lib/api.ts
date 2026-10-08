// Punto único de acceso HTTP al backend: construye URLs, envía JSON y traduce errores.
// Las rutas se definen en api-contract.ts; VITE_API_BASE_URL permite cambiar la base.
// Los decodificadores recibidos validan cada respuesta antes de entregarla a la interfaz.
import { apiContract, type Endpoint } from './api-contract';

// Conserva el estado HTTP para que los consumidores puedan tratar un 401 de forma específica.
// El valor 0 identifica errores del cliente que todavía no tienen una respuesta HTTP.
export class ApiError extends Error {
  constructor(message: string, public readonly status: number = 0) { super(message); }
}
// Separa parámetros de ruta (:id), filtros de consulta y cuerpo JSON de la solicitud.
// El token es opcional: las rutas públicas no necesitan enviar Authorization.
interface RequestOptions {
  token?: string;
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  params?: Record<string, string>;
  query?: URLSearchParams;
}
// Inyectar base y contrato permite probar el transporte sin alterar el cliente de la aplicación.
export function createApiClient(baseUrl: string, contract = apiContract) {
// Una capacidad requiere una base, un contrato verificado y una ruta habilitada.
function hasCapability(endpoint: Endpoint): boolean {
  return Boolean(baseUrl && contract.verified && contract.endpoints[endpoint]);
}
async function apiRequest<T>(endpoint: Endpoint, decode: (value: unknown) => T, options: RequestOptions = {}): Promise<T> {
  if (!hasCapability(endpoint)) throw new ApiError('Este servicio todavía no está conectado. No se ha realizado ninguna operación.');
  let path = contract.endpoints[endpoint]!;
  // Codifica cada identificador para que sus caracteres no se interpreten como parte de la ruta.
  for (const [key, value] of Object.entries(options.params ?? {})) path = path.replace(`:${key}`, encodeURIComponent(value));
  // Impide enviar rutas incompletas como /paquetes/:id cuando falta el identificador.
  if (/:[a-zA-Z]/.test(path)) throw new ApiError('La ruta del servicio no está configurada correctamente.');
  // Una base relativa utiliza el origen del navegador; localhost sirve de base en las pruebas.
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, globalThis.location?.origin ?? 'http://localhost');
  if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) throw new ApiError('La dirección del servicio no es válida.');
  // Solo se admite HTTP directo en loopback; una dirección remota debe utilizar HTTPS.
  // Esta comprobación no inspecciona el destino del proxy configurado en Vite o Vercel.
  if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new ApiError('La conexión al servicio debe ser segura (HTTPS).');
  url.search = options.query?.toString() ?? '';
  // Todas las operaciones usan este transporte. signal permite cancelar cargas obsoletas.
  const response = await fetch(url, {
    method: options.method ?? 'GET', signal: options.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    // Solicita datos actuales sin reutilizar la caché HTTP del navegador.
    cache: 'no-store',
  });
  if (!response.ok) {
    // Mantiene el mensaje del backend cuando existe; si no es JSON, usa una ayuda genérica.
    let message = 'No pudimos completar la solicitud. Inténtalo de nuevo.';
    try {
      const error: unknown = await response.json();
      if (error && typeof error === 'object') {
        if ('error' in error && typeof error.error === 'string') message = error.error;
        else if ('message' in error && typeof error.message === 'string') message = error.message;
      }
    } catch { /* Si el error no es JSON, conserva el mensaje de ayuda predeterminado. */ }
    if (response.status === 401 && options.token) {
      // Un 401 con token indica caducidad; un login rechazado sin token no cierra la sesión.
      // El evento incluye el token fallido para no invalidar una sesión nueva por una respuesta antigua.
      message = 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
      if (options.token) globalThis.window?.dispatchEvent(new CustomEvent('veyra:session-expired', { detail: options.token }));
    }
    throw new ApiError(message, response.status);
  }
  // Un 204 no contiene JSON. El decodificador decide cómo representar la respuesta vacía.
  if (response.status === 204) return decode(null);
  return decode(await response.json());
}
return { apiRequest, hasCapability };
}
// Sin una variable de entorno, el navegador solicita /api en su propio origen.
// vite.config.ts y vercel.json redirigen esas solicitudes al backend en cada entorno.
export const { apiRequest, hasCapability } = createApiClient(import.meta.env?.VITE_API_BASE_URL?.trim() || '/api');
// Convierte errores desconocidos en mensajes visibles para el usuario.
export function errorMessage(error: unknown): string {
  if (error instanceof TypeError) return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  return error instanceof Error ? error.message : 'Ha ocurrido un error. Inténtalo de nuevo.';
}
