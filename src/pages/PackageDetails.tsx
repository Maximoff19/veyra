// Página de detalle del paquete. Ruta en main.tsx: "paquetes/:id".
// Estilos: .package-detail-heading, .detail-layout, .itinerary y .booking-card.
import { useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarBlankIcon, MapPinIcon, UsersThreeIcon, ShieldCheckIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { apiRequest, ApiError, errorMessage, hasCapability } from '../lib/api';
import { useAuth } from '../lib/auth';
import { array, decodeItineraryDay, decodePackage, decodeReservation } from '../lib/decoders';
import { canBook, dateLabel, money, reservationPayload, type Reservation, type TravelPackage } from '../lib/domain';
import { useResource } from '../lib/use-resource';
import { ActionLink, ArrowBadge, Notice, SkeletonCards, PackageImage, PackageImageCredit } from '../components/ui';
import { Reviews } from '../components/Reviews';

const decodeItinerary = (value: unknown) => array(value, decodeItineraryDay);

export default function PackageDetails() {
  const { id = '' } = useParams();
  const resource = useResource('package', decodePackage, '', undefined, { id });
  return <div className="page-container detail-page"><Link className="text-button" to="/paquetes"><ArrowLeftIcon aria-hidden="true" /> Todos los paquetes</Link>
    {resource.error && <Notice title="No pudimos actualizar este paquete" error retry={resource.reload}>{resource.error}</Notice>}
    {resource.data ? <PackageContent key={resource.data.id} pkg={resource.data} reload={resource.reload} refreshing={resource.loading || Boolean(resource.error)} /> : resource.loading ? <SkeletonCards count={1} /> : !resource.error && <><h1>El viaje está por comenzar.</h1><Notice title="Este paquete todavía no está disponible">No tenemos información confirmada de este paquete. El servicio de catálogo debe estar conectado para mostrar sus detalles y permitir reservas.</Notice></>}
  </div>;
}
// Contenido del paquete: fotografía, descripción, itinerario y componentes de reserva y reseñas.
function PackageContent({ pkg, reload, refreshing }: { pkg: TravelPackage; reload: () => void; refreshing: boolean }) {
  const itinerary = useResource('itinerary', decodeItinerary, '', undefined, { id: String(pkg.id) });
  return <><div className="package-detail-heading">{pkg.category && <span className="eyebrow">{pkg.category.name}</span>}<h1>{pkg.title}</h1>{pkg.hotel && <p className="location"><MapPinIcon aria-hidden="true" />{pkg.hotel.location} · {pkg.hotel.name}</p>}</div>
    <div className="detail-hero detail-hero-neutral"><PackageImage pkg={pkg} priority /></div><PackageImageCredit pkg={pkg} />
    <div className="detail-layout"><div className="detail-content"><div className="detail-facts"><span><CalendarBlankIcon aria-hidden="true" />{dateLabel(pkg.startsAt)} — {dateLabel(pkg.endsAt)}</span><span><UsersThreeIcon aria-hidden="true" />{pkg.availableSpots} cupos disponibles</span></div><section><h2>Un nuevo lugar. Una nueva historia.</h2><p className="preserve-lines">{pkg.description || 'El paquete no tiene una descripción publicada.'}</p></section><section className="itinerary"><h2>Tu viaje, día a día.</h2>{itinerary.loading ? <p role="status">Cargando itinerario…</p> : itinerary.error ? <Notice title="No pudimos cargar el itinerario" error retry={itinerary.reload}>{itinerary.error}</Notice> : itinerary.data?.length ? <ol>{itinerary.data.map((day, index) => <li key={`${day.day}-${index}`}><span className="day-number">{String(day.day).padStart(2, '0')}</span><div><h3>{day.title}</h3>{day.description && <p className="preserve-lines">{day.description}</p>}</div></li>)}</ol> : <p className="muted">El itinerario todavía no ha sido publicado.</p>}</section></div><Booking pkg={pkg} reload={reload} refreshing={refreshing} /></div><Reviews packageId={String(pkg.id)} />
  </>;
}
// Tarjeta de reserva y confirmación. Cambia el diseño en .booking-card y .confirmation-card.
function Booking({ pkg, reload, refreshing }: { pkg: TravelPackage; reload: () => void; refreshing: boolean }) {
  const { session } = useAuth();
  const [passengers, setPassengers] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);
  const lock = useRef(false);
  const bookable = canBook(pkg);
  // Evita solicitudes duplicadas; el servidor verifica cupos y confirma el total.
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session || lock.current || uncertain || confirmation || refreshing) return;
    if (!canBook(pkg) || passengers > pkg.availableSpots || !Number.isInteger(passengers) || passengers < 1 || passengers > 10000) { setError('La cantidad de pasajeros debe ser de 1 a 10 000 y no superar los cupos disponibles.'); return; }
    lock.current = true; setBusy(true); setError(null);
    try {
      const result = await apiRequest('reserve', decodeReservation, { method: 'POST', token: session.token, body: reservationPayload([{ id_paquete: pkg.id, cantidad_pasajeros: passengers }]) });
      setConfirmation(result);
    } catch (error) {
      if (error instanceof ApiError && error.status > 0 && error.status < 500) {
        setError(errorMessage(error));
        if (error.status === 409) reload();
      } else {
        // Una respuesta perdida no garantiza que la reserva haya fallado; consulta antes de repetir.
        setUncertain(true);
        setError('No pudimos confirmar la respuesta. La reserva podría haberse creado. Revisa «Mis reservas» antes de volver a intentarlo para evitar duplicados.');
      }
    } finally { lock.current = false; setBusy(false); }
  }
  if (confirmation) return <aside className="booking-card confirmation-card" aria-live="polite"><CheckCircleIcon size={44} weight="light" aria-hidden="true" /><h2>Tu reserva fue creada.</h2><p>Identificador de reserva</p><strong className="confirmation-code">{confirmation.id}</strong><dl><div><dt>Total confirmado</dt><dd>{money(confirmation.total)}</dd></div><div><dt>Estado</dt><dd><span className="status-pill">{confirmation.status}</span></dd></div></dl><ul className="confirmation-items">{confirmation.items.map((item, index) => <li key={`${item.packageId}-${index}`}>{item.package?.title ?? `Paquete ${item.packageId}`} · {item.passengers} pasajeros</li>)}</ul><p>Crear la reserva no realiza ningún cobro. Esta confirmación no es un comprobante de pago.</p><ActionLink to={`/reservas/${encodeURIComponent(confirmation.id)}`}>Ver mi reserva</ActionLink></aside>;
  return <aside className="booking-card"><span className="eyebrow">HAZ ESPACIO PARA LA AVENTURA</span><h2>{money(pkg.pricePerPassenger)}</h2><p className="price-caption">por pasajero</p><hr />{pkg.hotel && <p>{pkg.hotel.name}<br /><span className="muted">{pkg.hotel.location}</span></p>}
    {!bookable ? <Notice title="No disponible para reservar">Este paquete no tiene cupos o su fecha de inicio ya pasó.</Notice> : <form onSubmit={submit}><label>¿Cuántos viajan?<input name="cantidad_pasajeros" type="number" inputMode="numeric" min={1} max={Math.min(10000, pkg.availableSpots)} step={1} value={Number.isNaN(passengers) ? '' : passengers} onChange={event => setPassengers(event.target.valueAsNumber)} required disabled={busy || uncertain} aria-describedby="passenger-help" /></label><span className="field-help" id="passenger-help">De 1 a 10 000 pasajeros por paquete, sin superar los {pkg.availableSpots} cupos disponibles. El servidor vuelve a verificar los cupos y calcula el total.</span>{error && <p className="form-error" role="alert">{error}</p>}
      {!session ? <ActionLink to={`/ingresar?next=${encodeURIComponent(`/paquetes/${pkg.id}`)}`}>Ingresar para reservar</ActionLink> : !hasCapability('reserve') ? <p className="form-note">El servicio de reservas no está habilitado. No se realizará ninguna operación.</p> : <button className="button full-width" disabled={busy || uncertain || refreshing} type="submit">{busy ? 'Creando reserva…' : refreshing ? 'Actualizando cupos…' : 'Crear reserva'}<ArrowBadge /></button>}
      {uncertain && <ActionLink to="/reservas">Revisar mis reservas</ActionLink>}
      <p className="booking-reassurance"><ShieldCheckIcon size={18} aria-hidden="true" />Reservar no realiza ningún cobro.</p>
    </form>}
  </aside>;
}
