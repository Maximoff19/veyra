// Pruebas del transporte HTTP con solicitudes simuladas; no modifican datos reales del servidor.
import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { ApiError, createApiClient } from './api';
import { apiContract } from './api-contract';

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;
afterEach(() => { fetchSpy?.mockRestore(); });
const decode = (value: unknown) => value;

describe('API client transport', () => {
  test('enables verified routes through the same-origin API base', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
    const client = createApiClient('/api');
    expect(client.hasCapability('packages')).toBe(true);
    await client.apiRequest('packages', decode, { query: new URLSearchParams('q=Cusco&limit=12&offset=0') });
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('http://localhost/api/paquetes?q=Cusco&limit=12&offset=0');
    expect(options?.cache).toBe('no-store');
  });
  test('forwards bearer credentials, IDs and PATCH profile payloads', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({}));
    await createApiClient('/api').apiRequest('updateProfile', decode, { token: 'test-token', method: 'PATCH', params: { id: '42' }, body: { telefono: null } });
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('http://localhost/api/usuarios/42');
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer test-token');
    expect(options?.method).toBe('PATCH');
    expect(options?.body).toBe('{"telefono":null}');
  });
  test('supports PUT review edits and bodyless DELETE responses', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createApiClient('/api');
    await client.apiRequest('editReview', decode, { method: 'PUT', params: { id: '7' }, body: { calificacion: 4 } });
    expect(fetchSpy.mock.calls[0][1]?.method).toBe('PUT');
    expect(await client.apiRequest('deleteReview', decode, { method: 'DELETE', params: { id: '7' } })).toBeNull();
  });
  test('preserves backend conflict messages rather than assuming a stock conflict', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Email already registered.' }, { status: 409 }));
    await expect(createApiClient('/api').apiRequest('register', decode)).rejects.toThrow('Email already registered.');
  });
  test('does not interpret rejected login credentials as an expired session', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Invalid credentials.' }, { status: 401 }));
    await expect(createApiClient('/api').apiRequest('login', decode)).rejects.toThrow('Invalid credentials.');
  });
  test('marks protected unauthorized requests as expired', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Unauthorized.' }, { status: 401 }));
    await expect(createApiClient('/api').apiRequest('me', decode, { token: 'expired-token' })).rejects.toThrow('Tu sesión ha caducado.');
  });
  test('rejects unresolved IDs before issuing a request', async () => {
    fetchSpy = spyOn(globalThis, 'fetch');
    await expect(createApiClient('/api').apiRequest('package', decode)).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  test('keeps unverified capabilities disabled', () => {
    expect(createApiClient('/api', { ...apiContract, verified: false }).hasCapability('login')).toBe(false);
  });
  test('rejects direct remote HTTP requests, keeping credentials on the proxy path', async () => {
    fetchSpy = spyOn(globalThis, 'fetch');
    await expect(createApiClient('http://20.106.154.149/api').apiRequest('login', decode)).rejects.toThrow('HTTPS');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
