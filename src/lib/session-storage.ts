// Guarda únicamente el token durante esta pestaña; no guarda contraseñas, roles ni datos personales.
export const SESSION_TOKEN_KEY = 'veyra.session.token.v1';
type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readSessionToken(storage?: TokenStorage): string | null {
  try {
    const token = (storage ?? globalThis.window?.sessionStorage)?.getItem(SESSION_TOKEN_KEY);
    return typeof token === 'string' && token.trim() && token.length <= 8192 ? token : null;
  } catch { return null; }
}
export function writeSessionToken(token: string | null, storage?: TokenStorage): void {
  try {
    const target = storage ?? globalThis.window?.sessionStorage;
    if (token) target?.setItem(SESSION_TOKEN_KEY, token);
    else target?.removeItem(SESSION_TOKEN_KEY);
  } catch { /* Si el almacenamiento está bloqueado, la sesión puede continuar en memoria. */ }
}
