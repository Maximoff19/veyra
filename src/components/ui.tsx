// Componentes visuales reutilizables en inicio, catálogo, reservas y formularios.
// Cambia su apariencia en styles.css; modificar un componente afecta a todas sus llamadas.
import { ArrowUpRightIcon, CompassIcon, ArrowClockwiseIcon, MapPinIcon, CalendarBlankIcon } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { canBook, dateLabel, money, type TravelPackage } from '../lib/domain';

// Icono circular de flecha. Estilo: .arrow-badge.
export function ArrowBadge() { return <span className="arrow-badge"><ArrowUpRightIcon size={17} weight="bold" aria-hidden="true" /></span>; }
// Enlace con aspecto de botón. Estilos: .button y sus variantes.
export function ActionLink({ to, children, className = '' }: { to: string; children: ReactNode; className?: string }) {
  return <Link to={to} className={`button ${className}`}>{children}<ArrowBadge /></Link>;
}
// Tarjeta de aviso, error o estado vacío. Estilos: .notice y .notice-error.
export function Notice({ title, children, retry, error = false }: { title: string; children: ReactNode; retry?: () => void; error?: boolean }) {
  return <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>
    <span className="notice-icon"><CompassIcon size={29} weight="light" aria-hidden="true" /></span>
    <div><h3>{title}</h3><div className="notice-description">{children}</div>{retry && <button className="text-button" onClick={retry}>Volver a intentar <ArrowClockwiseIcon aria-hidden="true" /></button>}</div>
  </div>;
}
// Tarjetas temporales durante la carga. Estilos: .skeleton-card, .skeleton-image y .skeleton-line.
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return <div className="package-grid" role="status" aria-label="Cargando paquetes">{Array.from({ length: count }, (_, i) => <div className="skeleton-card" key={i}><div className="skeleton-image" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>;
}
// Imagen del paquete con alternativa si falla; no reemplaza fotos reales con imágenes inventadas.
export function PackageImage({ pkg, priority = false }: { pkg: TravelPackage; priority?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!pkg.imageUrl || failedUrl === pkg.imageUrl) {
    return <div className="photo-placeholder"><CompassIcon size={48} aria-hidden="true" /><span>Imagen no disponible</span></div>;
  }
  return <img key={pkg.imageUrl} src={pkg.imageUrl} alt={`Imagen referencial de ${pkg.title}`}
    width={1280} height={853} loading={priority ? 'eager' : 'lazy'} decoding="async"
    fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailedUrl(pkg.imageUrl)} />;
}
// Créditos y licencia de la fotografía del paquete. Estilo: .image-credit.
export function PackageImageCredit({ pkg }: { pkg: TravelPackage }) {
  if (!pkg.imageUrl) return null;
  return <p className="image-credit">Imagen referencial · Encuadre adaptado
    {pkg.imageCredit && <> · {pkg.imageSource ? <a href={pkg.imageSource} target="_blank" rel="noopener noreferrer">{pkg.imageCredit}</a> : pkg.imageCredit}</>}
    {pkg.imageLicenseUrl && <> · <a href={pkg.imageLicenseUrl} target="_blank" rel="noopener noreferrer">Licencia</a></>}
  </p>;
}
// Tarjeta de paquete: imagen, destino, fechas, precio y cupos. Estilo: .package-card.
// Cambia aquí su estructura; los datos y precios proceden del servidor.
export function PackageCard({ pkg }: { pkg: TravelPackage }) {
  const bookable = canBook(pkg);
  return <article className={`package-card ${bookable ? '' : 'package-unavailable'}`}>
    <Link className="package-image" to={`/paquetes/${encodeURIComponent(pkg.id)}`} aria-label={`Ver ${pkg.title}`}>
      <PackageImage pkg={pkg} />
      {pkg.category && <span className="image-tag">{pkg.category.name}</span>}
      {!bookable && <span className="unavailable-tag">No disponible para reservar</span>}
    </Link>
    <div className="package-content">{pkg.hotel && <p className="location"><MapPinIcon aria-hidden="true" />{pkg.hotel.location}</p>}<h3><Link to={`/paquetes/${encodeURIComponent(pkg.id)}`}>{pkg.title}</Link></h3>
      {pkg.hotel && <p>{pkg.hotel.name}</p>}<PackageImageCredit pkg={pkg} /><p className="date-row"><CalendarBlankIcon aria-hidden="true" />{dateLabel(pkg.startsAt)} — {dateLabel(pkg.endsAt)}</p>
      <div className="package-bottom"><div><strong>{money(pkg.pricePerPassenger)}</strong><span>por pasajero · {pkg.availableSpots} cupos</span></div><Link className="circle-link" to={`/paquetes/${encodeURIComponent(pkg.id)}`} aria-label={`Ver detalles de ${pkg.title}`}><ArrowUpRightIcon aria-hidden="true" /></Link></div>
    </div>
  </article>;
}
