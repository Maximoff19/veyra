// Estado compartido de autenticación; App envuelve las páginas con este proveedor.
// Gestiona inicio, cierre, restauración y caducidad de sesión, no estilos visuales.
// Conserva usuario y rol en memoria; tras recargar, vuelve a consultarlos al backend con el token.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from './domain';
import { apiRequest, ApiError, errorMessage } from './api';
import { decodeUser } from './decoders';
import { readSessionToken, writeSessionToken } from './session-storage';

// Distingue una sesión caducada de una restauración en curso o un fallo de red recuperable.
interface AuthState { session: Session | null; setSession: (session: Session | null) => void; expired: boolean; restoring: boolean; restoreError: string | null; retryRestore: () => void }
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, updateSession] = useState<Session | null>(null);
  const [expired, setExpired] = useState(false);
  const [restoring, setRestoring] = useState(() => Boolean(readSessionToken()));
  const [restoreError, setRestoreError] = useState<string | null>(null);
  // Permite reintentar /auth/me sin recargar toda la página.
  const [revision, setRevision] = useState(0);
  // Las referencias conservan el token vigente y la petición activa entre renders y callbacks.
  const tokenRef = useRef(readSessionToken());
  const restoreRequest = useRef<AbortController | null>(null);
  // Se utiliza al acceder o salir: cancela restauraciones antiguas y sincroniza memoria y token.
  function setSession(value: Session | null) {
    restoreRequest.current?.abort();
    tokenRef.current = value?.token ?? null;
    writeSessionToken(tokenRef.current);
    updateSession(value); setExpired(false); setRestoring(false); setRestoreError(null);
  }
  useEffect(() => {
    const expire = (event: Event) => {
      const failedToken = (event as CustomEvent<string>).detail;
      // Una respuesta 401 de un token anterior no debe cerrar una sesión iniciada después.
      if (failedToken && failedToken !== tokenRef.current) return;
      restoreRequest.current?.abort(); tokenRef.current = null; writeSessionToken(null);
      updateSession(null); setExpired(true); setRestoring(false); setRestoreError(null);
    };
    // api.ts emite este evento cuando una solicitud autenticada recibe un 401.
    window.addEventListener('veyra:session-expired', expire);
    return () => window.removeEventListener('veyra:session-expired', expire);
  }, []);
  useEffect(() => {
    const token = tokenRef.current;
    if (!token) { setRestoring(false); return; }
    const controller = new AbortController(); restoreRequest.current = controller;
    setRestoring(true); setRestoreError(null);
    // Solo el servidor puede restaurar la identidad y el rol; el almacenamiento no guarda datos del usuario.
    apiRequest('me', decodeUser, { token, signal: controller.signal })
      // Solo aplica la identidad si la petición sigue activa y corresponde al token vigente.
      .then(user => { if (!controller.signal.aborted && tokenRef.current === token) updateSession({ token, user }); })
      .catch(error => {
        if (controller.signal.aborted) return;
        // Un 401 elimina el token; otros fallos conservan el token para permitir un reintento.
        if (error instanceof ApiError && error.status === 401) {
          tokenRef.current = null; writeSessionToken(null); updateSession(null); setExpired(true);
        } else setRestoreError(errorMessage(error));
      })
      .finally(() => { if (!controller.signal.aborted) setRestoring(false); });
    // Evita que una restauración terminada tarde actualice un proveedor desmontado.
    return () => controller.abort();
  }, [revision]);
  return <AuthContext value={{ session, expired, setSession, restoring, restoreError, retryRestore: () => setRevision(value => value + 1) }}>{children}</AuthContext>;
}
// Permite que los componentes consulten la misma sesión sin duplicar su estado.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required.');
  return context;
}
