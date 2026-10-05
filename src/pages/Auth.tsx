// Componente para iniciar sesión o registrarse; main.tsx selecciona el modo con registration.
// Cambia los textos aquí y el diseño en .auth-page, .auth-visual y .auth-form-wrap.
import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, CompassIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { photos } from '../lib/photos';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { decodeSession, decodeUser } from '../lib/decoders';
import { useAuth } from '../lib/auth';
import { ArrowBadge } from '../components/ui';
import { safeNextPath } from '../lib/navigation';
import { validPassword } from '../lib/domain';
export default function Auth({ registration = false }: { registration?: boolean }) {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const endpoint = registration ? 'register' : 'login';
  const connected = hasCapability(endpoint);
  const next = safeNextPath(params.get('next'));
  // Valida el formulario y confirma la identidad con el servidor antes de guardar la sesión.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !connected) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const nombre = String(data.get('nombre') ?? '').trim();
    const telefono = String(data.get('telefono') ?? '').trim();
    if (registration && (!nombre || !validPassword(password))) { setError('La contraseña debe tener al menos 8 caracteres y no superar 72 bytes UTF-8.'); return; }
    lock.current = true; setBusy(true); setError(null);
    try {
      const session = await apiRequest(endpoint, decodeSession, { method: 'POST', body: { email, password, ...(registration ? { nombre, ...(telefono ? { telefono } : {}) } : {}) } });
      const user = await apiRequest('me', decodeUser, { token: session.token });
      setSession({ ...session, user }); navigate(next, { replace: true });
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-visual"><img src={photos.mountain} alt="Montañas alpinas entre nubes" width="1100" height="1400" /><span className="auth-visual-top"><CompassIcon aria-hidden="true" /> LA PRÓXIMA HISTORIA ES TUYA</span><div><span className="auth-watermark">Veyra</span><h2>El primer paso<br />es querer ir.</h2><p>El resto empieza aquí.</p></div><span className="auth-visual-bottom">Un mundo por descubrir.<ArrowUpRightIcon aria-hidden="true" /></span></div><div className="auth-content"><Link className="text-button" to="/"><ArrowLeftIcon aria-hidden="true" /> Volver al inicio</Link><div className="auth-form-wrap"><span className="eyebrow">{registration ? 'EMPIEZA ALGO NUEVO' : 'QUÉ BUENO VERTE DE NUEVO'}</span><h1>{registration ? 'Tu próxima aventura\nempieza aquí.' : 'El viaje continúa.'}</h1><p>{registration ? 'Crea tu cuenta para reservar y gestionar tus viajes.' : 'Ingresa para encontrar tus reservas y seguir explorando.'}</p>
    <form onSubmit={submit} aria-describedby={!connected ? 'auth-not-connected' : undefined}>{registration && <label>Nombre completo<input name="nombre" autoComplete="name" required disabled={busy} onInput={event => event.currentTarget.setCustomValidity(event.currentTarget.value.trim() ? '' : 'Escribe tu nombre.')} /></label>}<label>Correo electrónico<input name="email" type="email" autoComplete="email" placeholder="tu@correo.com" required disabled={busy} /></label><label>Contraseña<div className="password-field"><input name="password" type={visible ? 'text' : 'password'} autoComplete={registration ? 'new-password' : 'current-password'} required disabled={busy} aria-describedby={registration ? 'password-help' : undefined} onInput={event => event.currentTarget.setCustomValidity(registration && !validPassword(event.currentTarget.value) ? 'Usa al menos 8 caracteres y como máximo 72 bytes UTF-8.' : '')} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}</button></div>{registration && <span className="field-help" id="password-help">Al menos 8 caracteres y como máximo 72 bytes UTF-8. Algunos caracteres ocupan varios bytes.</span>}</label>{registration && <label>Teléfono (opcional)<input name="telefono" type="tel" autoComplete="tel" disabled={busy} /></label>}
      {!connected && <p className="form-note" id="auth-not-connected">El servicio de {registration ? 'registro' : 'inicio de sesión'} todavía no está conectado. Por ahora no se enviarán tus datos ni se creará una cuenta.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button full-width" disabled={busy || !connected}>{busy ? 'Un momento…' : registration ? 'Crear mi cuenta' : 'Iniciar sesión'}<ArrowBadge /></button>
    </form><p className="auth-switch">{registration ? '¿Ya tienes una cuenta?' : '¿Tu primera vez por aquí?'} <Link to={`${registration ? '/ingresar' : '/registro'}?next=${encodeURIComponent(next)}`}>{registration ? 'Inicia sesión' : 'Crea tu cuenta'}</Link></p><p className="auth-privacy"><ShieldText />Tu contraseña no se guarda. La sesión se conserva al recargar esta pestaña.</p></div></div></div>;
}
// Símbolo decorativo del aviso de privacidad; no añade texto al lector de pantalla.
function ShieldText() { return <span aria-hidden="true">↳ </span>; }
