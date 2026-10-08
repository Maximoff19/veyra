// Textos de estados y datos visuales de avatares. Cambia las etiquetas de reservas aquí.
// Cambia sus colores en .status-* y .avatar-tone-* de styles.css.
// Estas funciones presentan datos existentes; no deciden permisos ni cambian estados del backend.
import type { EntityId } from './domain';

export const STATUS_TONE = { PENDING: 'pending', CONFIRMED: 'confirmed', CANCELLED: 'cancelled', NEUTRAL: 'neutral' } as const;
export type StatusTone = (typeof STATUS_TONE)[keyof typeof STATUS_TONE];
interface ReservationPresentation { label: string; tone: StatusTone; description: string }
const reservationStates: Record<string, ReservationPresentation> = {
  pendiente: { label: 'Pendiente', tone: STATUS_TONE.PENDING, description: 'Tu reserva está creada. Revisa el detalle antes de continuar.' },
  confirmada: { label: 'Confirmada', tone: STATUS_TONE.CONFIRMED, description: 'El servidor confirmó tu reserva. Consulta los viajes y sus pagos registrados.' },
  cancelada: { label: 'Cancelada', tone: STATUS_TONE.CANCELLED, description: 'Esta reserva está cancelada. Puedes seguir explorando otros viajes.' },
};
// Un estado desconocido se muestra literalmente y con tono neutro para no sugerir una confirmación falsa.
export function reservationPresentation(status: string): ReservationPresentation {
  return reservationStates[status] ?? { label: status, tone: STATUS_TONE.NEUTRAL, description: 'Consulta el detalle para revisar el estado informado por el servidor.' };
}
// Usa la primera y última palabra del nombre; si solo hay una, devuelve una única inicial.
// Array.from respeta puntos de código Unicode y ? indica que no se recibió un nombre utilizable.
export function travelerInitials(name: string | null): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return '?';
  return [words[0], ...(words.length > 1 ? [words[words.length - 1]] : [])]
    .map(word => Array.from(word)[0]).join('').toLocaleUpperCase('es');
}
// Distribuye identidades entre tres tonos (0, 1, 2) de forma determinista, sin usar aleatoriedad.
// Prioriza el ID para que cambiar el nombre no cambie el color; no es un hash de seguridad.
export function avatarTone(id: EntityId | null, name: string | null): number {
  const seed = String(id ?? name ?? 'traveler');
  return Array.from(seed).reduce((hash, character) => (hash + (character.codePointAt(0) ?? 0)) % 3, 0);
}
// Distingue explícitamente pagos de demostración y conserva cualquier estado no reconocido.
export function paymentStatusLabel(status: string): string {
  return ({ aprobado_demo: 'Aprobado · demostración', pendiente: 'Pendiente', rechazado: 'Rechazado' } as Record<string, string>)[status] ?? status;
}
