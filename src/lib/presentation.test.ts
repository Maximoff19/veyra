// Pruebas de iniciales, colores estables y etiquetas de reserva sin inventar identidades ni estados.
// Son pruebas puras: no necesitan React, DOM, almacenamiento ni conexión al servidor.
import { describe, expect, test } from 'bun:test';
import { avatarTone, paymentStatusLabel, reservationPresentation, STATUS_TONE, travelerInitials } from './presentation';

describe('Traveler identity', () => {
  test('uses real first and last initials with whitespace and Unicode support', () => {
    // Combina nombres compuestos, espacios repetidos y caracteres de distintos alfabetos.
    expect(travelerInitials('  Ana   María Torres ')).toBe('AT');
    expect(travelerInitials('Érica')).toBe('É');
    expect(travelerInitials('李 明')).toBe('李明');
  });
  test('does not fabricate an identity for unnamed authors', () => {
    expect(travelerInitials(null)).toBe('?');
    expect(travelerInitials('  ')).toBe('?');
  });
  test('keeps the avatar tone stable for the same author identity', () => {
    // Un ID estable debe mantener el tono aunque cambie el nombre o el ID llegue como texto.
    expect(avatarTone(42, 'Ana Torres')).toBe(avatarTone(42, 'Ana María Torres'));
    expect(avatarTone(42, 'Ana Torres')).toBe(avatarTone('42', 'Ana Torres'));
    expect([0, 1, 2]).toContain(avatarTone(null, '李 明'));
  });
});
describe('Reservation and payment presentation', () => {
  test('translates verified states with distinct visual tones', () => {
    expect(reservationPresentation('pendiente').label).toBe('Pendiente');
    expect(reservationPresentation('confirmada').tone).toBe(STATUS_TONE.CONFIRMED);
    expect(reservationPresentation('cancelada').tone).toBe(STATUS_TONE.CANCELLED);
  });
  test('preserves unknown server statuses instead of inventing a known state', () => {
    // Un estado nuevo del backend debe seguir visible, sin presentarse como confirmado o aprobado.
    expect(reservationPresentation('en_revision')).toMatchObject({ label: 'en_revision', tone: STATUS_TONE.NEUTRAL });
    expect(paymentStatusLabel('revision_manual')).toBe('revision_manual');
  });
  test('explicitly marks approved demo payments as demonstrations', () => {
    // La etiqueta evita confundir una simulación aprobada con un cobro real.
    expect(paymentStatusLabel('aprobado_demo')).toBe('Aprobado · demostración');
    expect(paymentStatusLabel('pendiente')).toBe('Pendiente');
  });
});
