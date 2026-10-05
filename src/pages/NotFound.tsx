import { Link } from 'react-router-dom';
import { Notice } from '../components/ui';

// Página para rutas desconocidas. Cambia el mensaje aquí y el estilo en .page-container y .notice.
export default function NotFound() {
  return <div className="page-container">
    <h1>Este camino no lleva a un destino.</h1>
    <Notice title="Página no encontrada">
      Vuelve al <Link to="/">inicio</Link> o descubre nuestros <Link to="/paquetes">paquetes turísticos</Link>.
    </Notice>
  </div>;
}
