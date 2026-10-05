import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ListIcon, XIcon, SignOutIcon } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { ActionLink } from './ui';

// Encabezado y menú móvil. Cambia los enlaces aquí y el estilo en .site-header y .main-nav.
// main.tsx decide si se muestra; heroOnHome usa un encabezado transparente sobre la portada.
export function Header({ heroOnHome = false }: { heroOnHome?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { session, setSession } = useAuth();
  const home = heroOnHome && pathname === '/';
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  return <header className={`site-header ${home ? 'header-over-hero' : ''}`}>
      <Link className="wordmark" to="/" aria-label="Veyra, inicio">veyra<span className="brand-dot" /></Link>
      <button className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <XIcon size={23} /> : <ListIcon size={23} />}</button>
      <nav id="main-navigation" className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="Navegación principal">
        <NavLink to="/" end>Inicio</NavLink><NavLink to="/paquetes">Paquetes</NavLink><Link to="/#experiencias" onClick={() => setMenuOpen(false)}>Experiencias</Link><Link to="/#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</Link>
        {session && <NavLink to="/reservas">Mis reservas</NavLink>}
        {session && <NavLink to="/perfil">Mi perfil</NavLink>}
        {session?.user.role === 'administrador' && <NavLink to="/admin">Administración</NavLink>}
        <span className="mobile-account">{session ? <button className="text-button" onClick={() => setSession(null)}>Cerrar sesión</button> : <Link to="/ingresar">Iniciar sesión</Link>}</span>
      </nav>
      <div className="header-account">{session ? <button className="account-button" onClick={() => setSession(null)} aria-label="Cerrar sesión"><span>{session.user.name.split(' ')[0]}</span><SignOutIcon size={19} /></button> : <ActionLink to="/ingresar" className="button-white button-small">Tu próximo viaje</ActionLink>}</div>
    </header>;
}
