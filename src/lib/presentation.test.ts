// Pruebas de iniciales, colores estables y etiquetas de reserva sin inventar identidades ni estados.
import { describe, expect, test } from 'bun:test';
import { avatarTone, paymentStatusLabel, reservationPresentation, STATUS_TONE, travelerInitials } from './presentation';

describe('Traveler identity', () => {
  test('uses real first and last initials with whitespace and Unicode support', () => {
    expect(travelerInitials('  Ana   María Torres ')).toBe('AT');
    expect(travelerInitials('Érica')).toBe('É');
    expect(travelerInitials('李 明')).toBe('李明');
  });
  test('does not fabricate an identity for unnamed authors', () => {
    expect(travelerInitials(null)).toBe('?');
    expect(travelerInitials('  ')).toBe('?');
  });
  test('keeps the avatar tone stable for the same author identity', () => {
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
    expect(reservationPresentation('en_revision')).toMatchObject({ label: 'en_revision', tone: STATUS_TONE.NEUTRAL });
    expect(paymentStatusLabel('revision_manual')).toBe('revision_manual');
  });
  test('explicitly marks approved demo payments as demonstrations', () => {
    expect(paymentStatusLabel('aprobado_demo')).toBe('Aprobado · demostración');
    expect(paymentStatusLabel('pendiente')).toBe('Pendiente');
  });
});
