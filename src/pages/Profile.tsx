// Página del perfil. Ruta en main.tsx: "perfil". Usa estilos compartidos de página y formulario.
// Para personalizarla, añade reglas de .profile-form en styles.css.
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { decodeUser } from '../lib/decoders';
import { profilePayload } from '../lib/forms';
import { Notice } from '../components/ui';
import type { Session } from '../lib/domain';

export default function Profile() {
  const { session, setSession } = useAuth();
  return <div className="page-container profile-page"><div className="page-heading"><span className="eyebrow">TU CUENTA</span><h1>Tu perfil.</h1><p>Actualiza tu nombre, correo electrónico o teléfono. Tu rol y contraseña no se modifican aquí.</p></div>{session ? <ProfileForm session={session} update={setSession} /> : <Notice title="Inicia sesión para ver tu perfil"><Link to="/ingresar">Iniciar sesión</Link></Notice>}</div>;
}
// Formulario de datos personales; no permite modificar el rol ni la contraseña.
function ProfileForm({ session, update }: { session: Session; update: (session: Session) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !hasCapability('updateProfile')) return;
    try {
      const body = profilePayload(new FormData(event.currentTarget), session.user);
      lock.current = true; setBusy(true); setError(null); setSuccess(false);
      const user = await apiRequest('updateProfile', decodeUser, { method: 'PATCH', body, token: session.token, params: { id: String(session.user.id) } });
      // Actualizar el perfil no cambia el rol; algunas respuestas omiten los campos relacionados.
      user.role = user.role || session.user.role;
      update({ ...session, user }); setSuccess(true);
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} className="profile-form"><label>Nombre completo<input name="nombre" defaultValue={session.user.name} autoComplete="name" disabled={busy} /></label><label>Correo electrónico<input name="email" type="email" defaultValue={session.user.email} autoComplete="email" disabled={busy} /></label><label>Teléfono (opcional)<input name="telefono" type="tel" defaultValue={session.user.phone ?? ''} autoComplete="tel" disabled={busy} aria-describedby="profile-phone-help" /><span className="field-help" id="profile-phone-help">Deja el campo vacío para eliminar el teléfono. Se enviará telefono: null si cambió.</span></label><p className="field-help">Modifica al menos un campo para guardar. El nombre y el correo no pueden quedar vacíos cuando se actualizan.</p>{!hasCapability('updateProfile') && <p className="form-note">La actualización de perfil todavía no está conectada al servidor.</p>}{error && <p role="alert" className="form-error">{error}</p>}{success && <p role="status">Tu perfil fue actualizado según la respuesta del servidor.</p>}<button className="button" disabled={busy || !hasCapability('updateProfile')}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></form>;
}
