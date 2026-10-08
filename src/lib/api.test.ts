// Pruebas del transporte HTTP con solicitudes simuladas; no modifican datos reales del servidor.
// Sustituyen fetch para comprobar URL, método, cabeceras, cuerpo y tratamiento de errores.
import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { ApiError, createApiClient } from './api';
import { apiContract } from './api-contract';

// Restaura el transporte tras cada caso para que las simulaciones no se filtren a otras pruebas.
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined;
afterEach(() => { fetchSpy?.mockRestore(); });
// Aquí se prueba el transporte, no la validación del JSON; el decodificador devuelve el valor recibido.
const decode = (value: unknown) => value;

describe('API client transport', () => {
  test('enables verified routes through the same-origin API base', async () => {
    // Sin navegador, /api se resuelve respecto a localhost y mantiene los filtros de consulta.
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
    // Simula dos respuestas consecutivas: JSON para editar y 204 sin cuerpo para eliminar.
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({})).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createApiClient('/api');
    await client.apiRequest('editReview', decode, { method: 'PUT', params: { id: '7' }, body: { calificacion: 4 } });
    expect(fetchSpy.mock.calls[0][1]?.method).toBe('PUT');
    expect(await client.apiRequest('deleteReview', decode, { method: 'DELETE', params: { id: '7' } })).toBeNull();
  });
  test('deletes a package with admin credentials and accepts an empty 204 response', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient('/api');
    expect(client.hasCapability('deletePackage')).toBe(true);
    await client.apiRequest('deletePackage', () => undefined, { method: 'DELETE', token: 'admin-test-token', params: { id: '42' } });
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('http://localhost/api/paquetes/42');
    expect(options?.method).toBe('DELETE');
    expect(options?.body).toBeUndefined();
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer admin-test-token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
  test('preserves the reservation-protection conflict and does not retry deletion', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'This package has reservations.' }, { status: 409 }));
    await expect(createApiClient('/api').apiRequest('deletePackage', decode, {
      method: 'DELETE', token: 'admin-test-token', params: { id: '42' },
    })).rejects.toMatchObject({ status: 409, message: 'This package has reservations.' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
  test('preserves backend conflict messages rather than assuming a stock conflict', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Email already registered.' }, { status: 409 }));
    await expect(createApiClient('/api').apiRequest('register', decode)).rejects.toThrow('Email already registered.');
  });
  test('does not interpret rejected login credentials as an expired session', async () => {
    // La solicitud no lleva token: conserva el error de acceso en vez del mensaje de caducidad.
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Invalid credentials.' }, { status: 401 }));
    await expect(createApiClient('/api').apiRequest('login', decode)).rejects.toThrow('Invalid credentials.');
  });
  test('marks protected unauthorized requests as expired', async () => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Unauthorized.' }, { status: 401 }));
    await expect(createApiClient('/api').apiRequest('me', decode, { token: 'expired-token' })).rejects.toThrow('Tu sesión ha caducado.');
  });
  test('rejects unresolved IDs before issuing a request', async () => {
    // Además de lanzar un error, debe impedir que fetch reciba una ruta con :id sin sustituir.
    fetchSpy = spyOn(globalThis, 'fetch');
    await expect(createApiClient('/api').apiRequest('package', decode)).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  test('keeps unverified capabilities disabled', () => {
    expect(createApiClient('/api', { ...apiContract, verified: false }).hasCapability('login')).toBe(false);
  });
  test('rejects direct remote HTTP requests, keeping credentials on the proxy path', async () => {
    // Comprueba la protección del cliente ante HTTP remoto; no comprueba el enlace interno del proxy.
    fetchSpy = spyOn(globalThis, 'fetch');
    await expect(createApiClient('http://20.106.154.149/api').apiRequest('login', decode)).rejects.toThrow('HTTPS');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
