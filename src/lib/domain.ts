// Modelos de datos del frontend: paquetes, usuarios, reservas, pagos y reseñas.
// Cambia reglas de negocio aquí; los colores y las tarjetas se modifican en componentes y styles.css.
// Estos modelos usan nombres del frontend; decoders.ts adapta los campos recibidos de la API.
// Las funciones son independientes de React y no realizan solicitudes ni modifican el servidor.
// Los identificadores pueden llegar como texto o número sin perder su representación original.
export type EntityId = string | number;
export interface Category { id: EntityId; name: string; description: string }
export interface Hotel { id: EntityId; name: string; location: string; capacity: number }
export interface ItineraryDay { day: number; title: string; description: string }
// null representa relaciones o URLs no disponibles; no se inventan hoteles ni imágenes del catálogo.
export interface TravelPackage {
  id: EntityId;
  title: string;
  description: string;
  imageUrl: string | null;
  imageCredit: string;
  imageSource: string | null;
  imageLicenseUrl: string | null;
  category: Category | null;
  hotel: Hotel | null;
  startsAt: string;
  endsAt: string;
  pricePerPassenger: number;
  availableSpots: number;
  itinerary: ItineraryDay[];
}
export interface User { id: EntityId; name: string; email: string; phone: string | null; role: string }
// La sesión completa vive en memoria; session-storage.ts persiste únicamente su token.
export interface Session { token: string; user: User }
export interface ReservationItem {
  packageId: EntityId;
  passengers: number;
  package: TravelPackage | null;
  title: string | null;
  startsAt: string | null;
  endsAt: string | null;
  subtotal: number | null;
}
// La lista de reservas puede recibir solo este resumen, sin paquetes ni pagos detallados.
export interface ReservationSummary {
  id: EntityId;
  total: number;
  status: string;
}
export interface Reservation extends ReservationSummary {
  items: ReservationItem[];
  // null significa que el servidor no informó los pagos, no que la reserva esté libre de pagos.
  hasPayment: boolean | null;
  payments: Payment[];
}
export interface Payment { id: EntityId; reservationId: EntityId; amount: number; method: string; status: string }
export interface Review { id: EntityId; authorId: EntityId | null; authorName: string | null; rating: number; text: string }
// total desconocido se conserva como null para no confundirlo con un catálogo vacío.
export interface Page<T> { items: T[]; limit: number; offset: number; total: number | null }

// Comprueba cupos y fecha para habilitar la reserva; el servidor vuelve a validar al guardar.
export function canBook(pkg: TravelPackage, now = new Date()): boolean {
  // YYYY-MM-DD permite comparar días ordenadamente; hoy se calcula en la zona horaria local.
  return Number.isInteger(pkg.availableSpots) && pkg.availableSpots > 0 &&
    pkg.startsAt >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Solo permite cancelar una reserva pendiente con ausencia de pagos confirmada.
export function canCancel(reservation: Reservation): boolean {
  // Exige false explícito: si la información de pagos es desconocida, no habilita la cancelación.
  return reservation.status === 'pendiente' && reservation.hasPayment === false;
}

export interface ReservationRequestItem { id_paquete: EntityId; cantidad_pasajeros: number }
// Construye la solicitud sin permitir que el frontend imponga el precio, total o estado.
export function reservationPayload(items: ReservationRequestItem[]) {
  // Acota el tamaño de la solicitud y valida cantidades enteras antes de contactar al backend.
  if (items.length < 1 || items.length > 100) throw new Error('La reserva debe contener entre 1 y 100 paquetes.');
  for (const item of items) {
    if (!item.id_paquete || !Number.isInteger(item.cantidad_pasajeros) || item.cantidad_pasajeros < 1 || item.cantidad_pasajeros > 10000) {
      throw new Error('Cada paquete debe tener entre 1 y 10 000 pasajeros.');
    }
  }
  // Reconstruye cada entrada para excluir campos extra, incluso si existen en el objeto original.
  return { items: items.map(({ id_paquete, cantidad_pasajeros }) => ({ id_paquete, cantidad_pasajeros })) };
}

export function money(value: number): string {
  // El contrato recibido no especifica moneda. No añadas un símbolo sin confirmarla.
  return new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

// Formatea fechas sin desplazar el día por la zona horaria local.
export function dateLabel(value: string): string {
  // UTC conserva el día de las fechas normalizadas por los decodificadores como YYYY-MM-DD.
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

// La contraseña requiere ocho caracteres y admite hasta 72 bytes; caracteres y bytes no son lo mismo.
export function validPassword(value: string): boolean {
  // Array.from cuenta puntos de código; TextEncoder mide la longitud real de la codificación UTF-8.
  return Array.from(value).length >= 8 && new TextEncoder().encode(value).byteLength <= 72;
}
// Filtra parámetros admitidos y normaliza el tamaño de página y el desplazamiento.
export function pageQuery(params: URLSearchParams): URLSearchParams {
  // Construye una consulta nueva: los parámetros ajenos al catálogo no se reenvían al servidor.
  const query = new URLSearchParams();
  for (const key of ['id_categoria', 'id_hotel', 'q']) {
    const value = params.get(key)?.trim();
    if (value) query.set(key, value);
  }
  if (params.get('disponibles') === 'true') query.set('disponibles', 'true');
  // Entradas inválidas vuelven a los valores predeterminados: 12 elementos desde la posición 0.
  const limit = Number(params.get('limit') ?? 12);
  const offset = Number(params.get('offset') ?? 0);
  query.set('limit', String(Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 12));
  query.set('offset', String(Number.isInteger(offset) && offset >= 0 ? offset : 0));
  return query;
}
