import { useEffect, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// Exportación agrupada para quitar el encabezado o el pie desde main.tsx sin dejar imports sin uso.
export { Header } from './Header';
export { Footer } from './Footer';

// Estructura compartida. El encabezado y el pie se reciben desde main.tsx; ambos son opcionales.
// Conserva el contenido principal, los avisos de sesión y la navegación por teclado.
export function Layout({ header, footer }: { header?: ReactNode; footer?: ReactNode }) {
  const { pathname } = useLocation();
  const { setSession, expired, restoring, restoreError, retryRestore } = useAuth();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const heading = document.querySelector('main h1');
    if (heading instanceof HTMLElement) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [pathname]);
  return <>
    {/* Acceso directo al contenido para quienes navegan con teclado. */}
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    {header}
    {expired && <div className="session-alert" role="alert">Tu sesión ha caducado. <Link to="/ingresar">Vuelve a iniciar sesión</Link>.</div>}
    {/* Outlet coloca aquí la página seleccionada por las rutas de main.tsx. */}
    <main id="main-content">{restoring ? <div className="page-container" role="status">Restaurando tu sesión…</div> : restoreError ? <div className="page-container"><h1>No pudimos restaurar tu sesión.</h1><p role="alert">{restoreError}</p><div className="button-row"><button className="button" onClick={retryRestore}>Volver a intentar</button><button className="text-button" onClick={() => setSession(null)}>Cerrar sesión</button></div></div> : <Outlet />}</main>
    {footer}
  </>;
}
