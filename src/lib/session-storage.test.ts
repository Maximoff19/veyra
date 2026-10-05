// Pruebas del token por pestaña, cierre de sesión y almacenamiento bloqueado.
import { describe, expect, test } from 'bun:test';
import { readSessionToken, SESSION_TOKEN_KEY, writeSessionToken } from './session-storage';

describe('Tab session token storage', () => {
  test('persists only the token and clears it on logout', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    writeSessionToken('test-token', storage);
    expect(readSessionToken(storage)).toBe('test-token');
    expect([...values.keys()]).toEqual([SESSION_TOKEN_KEY]);
    writeSessionToken(null, storage);
    expect(readSessionToken(storage)).toBeNull();
  });
  test('handles blocked storage without crashing authentication', () => {
    const blocked = { getItem: () => { throw new Error('Blocked'); }, setItem: () => { throw new Error('Blocked'); }, removeItem: () => { throw new Error('Blocked'); } };
    expect(readSessionToken(blocked)).toBeNull();
    expect(() => writeSessionToken('test-token', blocked)).not.toThrow();
  });
  test('rejects empty or oversized stored values', () => {
    const storage = { getItem: () => ' '.repeat(3), setItem: () => {}, removeItem: () => {} };
    expect(readSessionToken(storage)).toBeNull();
    expect(readSessionToken({ ...storage, getItem: () => 'a'.repeat(8193) })).toBeNull();
  });
});
