import { Link } from 'react-router-dom';
import { AirplaneTiltIcon, ArrowUpRightIcon, InstagramLogoIcon } from '@phosphor-icons/react';
import { ActionLink } from './ui';

// Pie de página: invitación a explorar, enlaces y derechos reservados.
// Cambia el contenido aquí y el diseño en .site-footer, .footer-top y .footer-links de styles.css.
export function Footer() {
  return <footer className="site-footer">
    <div className="footer-top"><div><span className="eyebrow">EL PRÓXIMO CAPÍTULO ES TUYO</span><h2>Hay un mundo<br />por descubrir.</h2><ActionLink to="/paquetes" className="button-white">Explorar paquetes</ActionLink></div><AirplaneTiltIcon className="footer-plane" size={125} weight="thin" aria-hidden="true" /></div>
    <div className="footer-links"><Link className="wordmark" to="/">veyra<span className="brand-dot" /></Link><p>Viajes con intención.<br />Recuerdos que se quedan.</p><div><Link to="/paquetes">Paquetes turísticos</Link><Link to="/reservas">Mis reservas</Link></div><div><Link to="/ingresar">Iniciar sesión</Link><Link to="/registro">Crear una cuenta</Link></div><a className="back-top" href="#main-content">Volver arriba <ArrowUpRightIcon aria-hidden="true" /></a></div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Veyra. Todos los derechos reservados.</span><span className="footer-social"><InstagramLogoIcon aria-hidden="true" /> Un viaje empieza con una idea.</span></div>
  </footer>;
}
