// Guarda únicamente el token durante esta pestaña; no guarda contraseñas, roles ni datos personales.
// sessionStorage permite restaurarlo tras recargar y limita su duración a la sesión de la pestaña.
// El sufijo v1 distingue esta clave si el formato de almacenamiento cambia en el futuro.
export const SESSION_TOKEN_KEY = 'veyra.session.token.v1';
// Solo exige las operaciones utilizadas: las pruebas pueden inyectar un almacenamiento en memoria.
type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

// Leer no valida identidad ni permisos: AuthProvider verifica el token después con /auth/me.
export function readSessionToken(storage?: TokenStorage): string | null {
  try {
    const token = (storage ?? globalThis.window?.sessionStorage)?.getItem(SESSION_TOKEN_KEY);
    // Descarta valores vacíos o desmesurados antes de intentar restaurar la sesión.
    return typeof token === 'string' && token.trim() && token.length <= 8192 ? token : null;
  } catch { return null; }
}
// null o un texto vacío eliminan la clave; no se guarda una representación textual de null.
export function writeSessionToken(token: string | null, storage?: TokenStorage): void {
  try {
    const target = storage ?? globalThis.window?.sessionStorage;
    if (token) target?.setItem(SESSION_TOKEN_KEY, token);
    else target?.removeItem(SESSION_TOKEN_KEY);
  } catch { /* Si el almacenamiento está bloqueado, la sesión puede continuar en memoria. */ }
}
