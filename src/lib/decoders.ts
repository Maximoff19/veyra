import type { Category, EntityId, Hotel, Page, Payment, Reservation, ReservationSummary, Review, Session, TravelPackage, User } from './domain';

// Convierte respuestas del contrato Swagger en los modelos usados por los componentes.
// Cambia el mapeo de campos aquí si cambia la API; no omitas las validaciones de datos externos.
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('La respuesta del servidor no tiene el formato esperado.');
  return value as Record<string, unknown>;
}
function string(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Falta información en la respuesta del servidor.');
  return value;
}
function optionalText(value: unknown): string { return typeof value === 'string' ? value : ''; }
function imageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function entityId(value: unknown): EntityId {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  throw new Error('El servidor devolvió un identificador inválido.');
}
function number(value: unknown): number {
  const result = typeof value === 'string' && value.trim() ? Number(value) : value;
  if (typeof result !== 'number' || !Number.isFinite(result) || result < 0) throw new Error('El servidor devolvió un valor numérico inválido.');
  return result;
}
function integer(value: unknown): number {
  const result = number(value);
  if (!Number.isSafeInteger(result)) throw new Error('El servidor devolvió una cantidad inválida.');
  return result;
}
function date(value: unknown): string {
  const result = string(value);
  const day = result.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) || new Date(day).toISOString().slice(0, 10) !== day) throw new Error('El servidor devolvió una fecha inválida.');
  return day;
}
export function array<T>(value: unknown, decode: (value: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error('No se pudo leer la lista enviada por el servidor.');
  return value.map(decode);
}
export function decodeCategory(value: unknown): Category {
  const item = object(value);
  return { id: entityId(item.id_categoria), name: string(item.nombre_categoria), description: optionalText(item.descripcion) };
}
export function decodeHotel(value: unknown): Hotel {
  const item = object(value);
  return { id: entityId(item.id_hotel), name: string(item.nombre), location: string(item.ubicacion), capacity: integer(item.capacidad_disponible ?? 0) };
}
export function decodeItineraryDay(value: unknown) {
  const day = object(value);
  return { day: integer(day.dia_numero), title: string(day.titulo_actividad), description: optionalText(day.descripcion_actividad) };
}
export function decodePackage(value: unknown): TravelPackage {
  const item = object(value);
  return {
    id: entityId(item.id_paquete), title: string(item.titulo), description: optionalText(item.descripcion),
    imageUrl: imageUrl(item.imagen_url), imageCredit: optionalText(item.imagen_credito),
    imageSource: imageUrl(item.imagen_fuente), imageLicenseUrl: imageUrl(item.imagen_licencia_url),
    category: item.nombre_categoria ? decodeCategory({ id_categoria: item.id_categoria, nombre_categoria: item.nombre_categoria }) : null,
    hotel: item.nombre_hotel ? decodeHotel({ id_hotel: item.id_hotel, nombre: item.nombre_hotel, ubicacion: item.ubicacion, capacidad_disponible: item.capacidad_disponible_hotel }) : null,
    startsAt: date(item.fecha_inicio), endsAt: date(item.fecha_fin),
    pricePerPassenger: number(item.precio), availableSpots: integer(item.stock_cupos),
    itinerary: array(item.itinerario ?? [], decodeItineraryDay),
  };
}
export function decodePage<T>(value: unknown, decode: (value: unknown) => T, limit = 12, offset = 0): Page<T> {
  // Una lista sin total utiliza su longitud para decidir si puede haber otra página.
  if (Array.isArray(value)) return { items: array(value, decode), limit, offset, total: null };
  const result = object(value);
  return { items: array(result.items, decode), limit: result.limit === undefined ? limit : integer(result.limit), offset: result.offset === undefined ? offset : integer(result.offset), total: result.total === undefined ? null : integer(result.total) };
}
export function decodeUser(value: unknown): User {
  const item = object(value);
   return { id: entityId(item.id_usuario), name: string(item.nombre), email: string(item.email), phone: typeof item.telefono === 'string' ? item.telefono : null, role: optionalText(item.nombre_rol).trim().toLowerCase() };
}
export function decodeSession(value: unknown): Session {
  const item = object(value);
  return { token: string(item.token), user: decodeUser(item.usuario) };
}
export function decodeReservationSummary(value: unknown): ReservationSummary {
  const item = object(value);
  return { id: entityId(item.id_reserva), total: number(item.total_pagar), status: string(item.estado_reserva) };
}
export function decodeReservationStatus(value: unknown) {
  const item = object(value);
  return { id: entityId(item.id_reserva), status: string(item.estado_reserva) };
}
export function decodePayment(value: unknown): Payment {
  const item = object(value);
  return { id: entityId(item.id_pago), reservationId: entityId(item.id_reserva), amount: number(item.monto), method: string(item.metodo_pago), status: string(item.estado_pago) };
}
export function decodeDemoPayment(value: unknown): Payment {
  const item = object(value);
  if (item.simulado !== true || item.metodo_pago !== 'demo' || item.estado_pago !== 'aprobado_demo') throw new Error('El servidor no confirmó el pago de demostración. Revisa los pagos de la reserva.');
  return decodePayment(item);
}
export function decodeReservation(value: unknown): Reservation {
  const item = object(value);
  const items = array(item.items, value => {
    const entry = object(value);
    const passengers = integer(entry.cantidad_pasajeros);
    if (passengers < 1 || passengers > 10000) throw new Error('El servidor devolvió una cantidad de pasajeros inválida.');
    return { packageId: entityId(entry.id_paquete), passengers, package: null, title: optionalText(entry.titulo) || null, startsAt: entry.fecha_inicio ? date(entry.fecha_inicio) : null, endsAt: entry.fecha_fin ? date(entry.fecha_fin) : null, subtotal: entry.subtotal === undefined || entry.subtotal === null ? null : number(entry.subtotal) };
  });
  if (!items.length || items.length > 100) throw new Error('El servidor devolvió una reserva sin una lista válida de paquetes.');
  return {
    ...decodeReservationSummary(item), items,
    // Los pagos desconocidos nunca deben interpretarse como ausencia de pagos.
    hasPayment: Array.isArray(item.pagos) ? item.pagos.length > 0 : null,
    payments: array(item.pagos ?? [], decodePayment),
  };
}
export function decodeReview(value: unknown): Review {
  const item = object(value);
  const rating = integer(item.calificacion);
  if (rating < 1 || rating > 5) throw new Error('El servidor devolvió una valoración inválida.');
  return { id: entityId(item.id_resena), authorId: item.id_usuario === undefined ? null : entityId(item.id_usuario), authorName: optionalText(item.nombre_usuario) || null, rating, text: optionalText(item.comentario) };
}
