// Estado compartido de autenticación; App envuelve las páginas con este proveedor.
// Gestiona inicio, cierre, restauración y caducidad de sesión, no estilos visuales.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from './domain';
import { apiRequest, ApiError, errorMessage } from './api';
import { decodeUser } from './decoders';
import { readSessionToken, writeSessionToken } from './session-storage';

interface AuthState { session: Session | null; setSession: (session: Session | null) => void; expired: boolean; restoring: boolean; restoreError: string | null; retryRestore: () => void }
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, updateSession] = useState<Session | null>(null);
  const [expired, setExpired] = useState(false);
  const [restoring, setRestoring] = useState(() => Boolean(readSessionToken()));
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const tokenRef = useRef(readSessionToken());
  const restoreRequest = useRef<AbortController | null>(null);
  function setSession(value: Session | null) {
    restoreRequest.current?.abort();
    tokenRef.current = value?.token ?? null;
    writeSessionToken(tokenRef.current);
    updateSession(value); setExpired(false); setRestoring(false); setRestoreError(null);
  }
  useEffect(() => {
    const expire = (event: Event) => {
      const failedToken = (event as CustomEvent<string>).detail;
      if (failedToken && failedToken !== tokenRef.current) return;
      restoreRequest.current?.abort(); tokenRef.current = null; writeSessionToken(null);
      updateSession(null); setExpired(true); setRestoring(false); setRestoreError(null);
    };
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
      .then(user => { if (!controller.signal.aborted && tokenRef.current === token) updateSession({ token, user }); })
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          tokenRef.current = null; writeSessionToken(null); updateSession(null); setExpired(true);
        } else setRestoreError(errorMessage(error));
      })
      .finally(() => { if (!controller.signal.aborted) setRestoring(false); });
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
