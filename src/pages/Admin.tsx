// Página administrativa. Ruta en main.tsx: "admin". Usa estilos compartidos de página y formulario.
// Para personalizar las pestañas y el editor, añade reglas de .admin-tabs y .admin-editor en styles.css.
// La interfaz comprueba el rol; el servidor debe autorizar también cada operación.
import { Link } from 'react-router-dom';
import { LockKeyIcon } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { Notice } from '../components/ui';
import { AdminForms } from '../components/AdminForms';

export default function Admin() {
  const { session } = useAuth();
  return <div className="page-container admin-page"><span className="eyebrow">ÁREA PRIVADA</span><h1>Administración.</h1>{session?.user.role !== 'administrador' ? <Notice title="Acceso restringido"><LockKeyIcon aria-hidden="true" /> Esta sección requiere una cuenta con el rol de administrador otorgado por el servidor. {session ? 'Tu cuenta no tiene acceso.' : <Link to="/ingresar">Inicia sesión con una cuenta autorizada.</Link>}</Notice> : <AdminForms token={session.token} />}</div>;
}
