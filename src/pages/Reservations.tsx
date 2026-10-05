// Listado y detalle de reservas; ambas rutas se llaman desde main.tsx.
// Tarjetas en .reservation-ticket y resumen en .reservation-payment de styles.css.
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarBlankIcon, UsersThreeIcon, ArrowUpRightIcon, TicketIcon, ReceiptIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { decodePage, decodeReservation, decodeReservationStatus, decodeReservationSummary } from '../lib/decoders';
import { canCancel, dateLabel, money, type Reservation, type ReservationSummary } from '../lib/domain';
import { useResource } from '../lib/use-resource';
import { ActionLink, Notice } from '../components/ui';
import { PaymentModal } from '../components/PaymentModal';
import { paymentStatusLabel, reservationPresentation, STATUS_TONE } from '../lib/presentation';

const decodeReservations = (value: unknown) => decodePage(value, decodeReservationSummary);

// Página principal de reservas: encabezado y listado del usuario autenticado.
export default function Reservations() {
  const { session } = useAuth();
  return <div className="page-container reservations-page">
    <div className="page-heading reservations-heading">
      <div><span className="eyebrow">TU VIAJE, BIEN ORGANIZADO</span><h1>Mis reservas.</h1><p>Tus viajes, sus detalles y el siguiente paso. Todo en un solo lugar.</p></div>
      <ActionLink to="/paquetes" className="button-white">Explorar paquetes</ActionLink>
    </div>
    {!session ? <SignInNotice /> : <ReservationList key={session.user.id} token={session.token} />}
  </div>;
}

// Aviso para visitantes sin sesión; conserva el destino después de ingresar.
function SignInNotice({ next = '/reservas' }: { next?: string }) {
  return <Notice title="Tus viajes tienen su propio lugar">Inicia sesión para consultar tus reservas.
    <div className="notice-action"><ActionLink to={`/ingresar?next=${encodeURIComponent(next)}`}>Iniciar sesión</ActionLink></div>
  </Notice>;
}

// Etiqueta del estado. Texto en lib/presentation.ts; color en .status-*.
function ReservationStatus({ status, paidPreview = false }: { status: string; paidPreview?: boolean }) {
  // El estado visual de la demo no sustituye ni guarda el estado recibido del servidor.
  if (paidPreview) return <span className="reservation-status status-confirmed" role="status"><CheckCircleIcon size={16} aria-hidden="true" />Pagado · demo</span>;
  const presentation = reservationPresentation(status);
  const Icon = presentation.tone === STATUS_TONE.CONFIRMED ? CheckCircleIcon : presentation.tone === STATUS_TONE.CANCELLED ? XCircleIcon : ClockIcon;
  return <span className={`reservation-status status-${presentation.tone}`}><Icon size={16} aria-hidden="true" />{presentation.label}</span>;
}

// Tarjetas temporales de carga. Estilos: .reservation-skeleton*.
function ReservationSkeleton({ count = 3 }: { count?: number }) {
  return <div className="reservation-skeletons" role="status" aria-label="Cargando reservas">
    {Array.from({ length: count }, (_, index) => <div className="reservation-skeleton" key={index}><div className="skeleton-line short" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}
  </div>;
}

// Tarjeta de una reserva: referencia, estado, importe y enlace al detalle.
function ReservationCard({ reservation }: { reservation: ReservationSummary }) {
  return <article className="reservation-ticket">
    <div className="ticket-symbol"><TicketIcon size={29} weight="light" aria-hidden="true" /></div>
    <div className="ticket-information">
      <div className="ticket-reference"><span className="reservation-code">REFERENCIA #{reservation.id}</span><ReservationStatus status={reservation.status} /></div>
      <h2>Reserva #{reservation.id}</h2><p>{reservationPresentation(reservation.status).description}</p>
    </div>
    <div className="ticket-total"><span>Importe de la reserva</span><strong>{money(reservation.total)}</strong>
      <Link className="text-button" aria-label={`Ver detalle de la reserva ${reservation.id}`} to={`/reservas/${encodeURIComponent(reservation.id)}`}>Ver detalle <ArrowUpRightIcon aria-hidden="true" /></Link>
    </div>
  </article>;
}

// Lista paginada de reservas; solo consulta datos, no registra pagos.
function ReservationList({ token }: { token: string }) {
  const [offset, setOffset] = useState(0);
  const limit = 12;
  const resource = useResource('reservations', decodeReservations, `limit=${limit}&offset=${offset}`, token);
  const hasNext = resource.data ? (resource.data.total !== null ? offset + resource.data.items.length < resource.data.total : resource.data.items.length === limit) : false;
  return <>
    {resource.loading ? <ReservationSkeleton /> : resource.error ? <Notice title="No pudimos cargar tus reservas" error retry={resource.reload}>{resource.error}</Notice>
      : !resource.connected ? <Notice title="El servicio de reservas no está conectado">Tus reservas aparecerán aquí cuando el servicio esté disponible.</Notice>
      : resource.data?.items.length ? <>
        <div className="reservation-list-heading"><span>{resource.data.items.length} {resource.data.items.length === 1 ? 'reserva en esta página' : 'reservas en esta página'}</span><p>Consulta el detalle para ver los paquetes, viajeros y pagos.</p></div>
        <div className="reservation-list">{resource.data.items.map(reservation => <ReservationCard key={reservation.id} reservation={reservation} />)}</div>
      </> : <div className="reservation-empty">
        <TicketIcon size={48} weight="light" aria-hidden="true" /><span className="eyebrow">EL PRIMER VIAJE ESTÁ POR DELANTE</span><h2>Todavía no tienes reservas.</h2>
        <p>Cuando elijas un paquete, encontrarás aquí sus detalles y el estado de tu reserva.</p><ActionLink to="/paquetes">Encontrar mi próximo viaje</ActionLink>
      </div>}
    {resource.data && (offset > 0 || hasNext) && <nav className="pagination" aria-label="Páginas de reservas">
      <button disabled={resource.loading || offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}><ArrowLeftIcon aria-hidden="true" /> Anterior</button>
      <span>Desde el resultado {offset + 1}</span>
      <button disabled={resource.loading || !hasNext} onClick={() => setOffset(offset + limit)}>Siguiente <ArrowUpRightIcon aria-hidden="true" /></button>
    </nav>}
  </>;
}

// Página de detalle. Estilos: .reservation-detail-heading y .reservation-layout.
export function ReservationDetails() {
  const { session } = useAuth();
  const { id = '' } = useParams();
  return <div className="page-container reservation-detail">
    <Link className="text-button" to="/reservas"><ArrowLeftIcon aria-hidden="true" /> Mis reservas</Link>
    <div className="reservation-detail-heading"><span className="eyebrow">CADA DETALLE, EN SU LUGAR</span><h1>Tu viaje, en detalle.</h1><p>Revisa los viajeros, las fechas y las opciones de tu reserva.</p></div>
    {session ? <ReservationRecord key={`${session.user.id}-${id}`} token={session.token} id={id} /> : <SignInNotice next={`/reservas/${encodeURIComponent(id)}`} />}
  </div>;
}

// Viajes, viajeros, fechas y subtotales. Estilo: .reservation-trip.
function ReservationItems({ reservation }: { reservation: Reservation }) {
  return <section className="reservation-trips">
    <div className="reservation-section-heading"><h3>Los viajes de esta reserva</h3><span>{reservation.items.length} {reservation.items.length === 1 ? 'paquete' : 'paquetes'}</span></div>
    <div className="reservation-items">{reservation.items.map((item, index) => <section className="reservation-trip" key={`${item.packageId}-${index}`}>
      <span className="trip-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="trip-information"><h4>{item.title ?? `Paquete ${item.packageId}`}</h4>
        <div className="trip-facts">{item.startsAt && item.endsAt && <p><CalendarBlankIcon size={18} aria-hidden="true" />{dateLabel(item.startsAt)} — {dateLabel(item.endsAt)}</p>}
          <p><UsersThreeIcon size={18} aria-hidden="true" />{item.passengers} {item.passengers === 1 ? 'viajero' : 'viajeros'}</p>
        </div>
        <Link className="text-button" to={`/paquetes/${encodeURIComponent(item.packageId)}`}>Ver el paquete <ArrowUpRightIcon aria-hidden="true" /></Link>
      </div>
      {item.subtotal !== null && <div className="trip-subtotal"><span>Subtotal</span><strong>{money(item.subtotal)}</strong></div>}
    </section>)}</div>
  </section>;
}

// Resumen de importes y pago visual; no registra pagos ni modifica la reserva del servidor.
function ReservationPayment({ reservation, disabled, paidPreview, onOpen }: { reservation: Reservation; disabled: boolean; paidPreview: boolean; onOpen: () => void }) {
  const demoPaid = reservation.payments.some(payment => payment.method === 'demo' && payment.status === 'aprobado_demo');
  return <aside className="reservation-payment">
    <span className="eyebrow">RESUMEN DE TU RESERVA</span><h2>Importe total</h2><strong className="reservation-total">{money(reservation.total)}</strong>
    <p className="payment-total-caption">Importe confirmado por el servidor.</p>
    <dl className="reservation-costs">{reservation.items.map((item, index) => <div key={`${item.packageId}-${index}`}>
      <dt>{item.title ?? `Paquete ${item.packageId}`}<span>{item.passengers} {item.passengers === 1 ? 'viajero' : 'viajeros'}</span></dt>
      <dd>{item.subtotal === null ? 'No informado' : money(item.subtotal)}</dd>
    </div>)}</dl>
    {paidPreview ? <div className="payment-state-note"><CheckCircleIcon size={23} aria-hidden="true" /><div><h3>Pagado</h3><p>Demostración sin cobro real.</p></div></div>
      : reservation.hasPayment === null ? <p className="form-note">No hay información de pagos confirmada. Actualiza la reserva antes de realizar una operación.</p>
      : reservation.hasPayment ? <div className="payment-state-note"><CheckCircleIcon size={23} aria-hidden="true" /><div><h3>{demoPaid ? 'Pago demo registrado' : 'Hay pagos registrados'}</h3><p>{demoPaid ? 'Esta operación fue una simulación. No se movió dinero.' : 'Consulta los métodos y estados informados en el historial de esta reserva.'}</p></div></div>
      : reservation.status === 'cancelada' ? <div className="payment-state-note"><XCircleIcon size={23} aria-hidden="true" /><div><h3>Reserva cancelada</h3><p>No puedes registrar pagos para esta reserva.</p></div></div>
      : canCancel(reservation) ? <section className="demo-checkout">
        <div className="demo-checkout-heading"><ReceiptIcon size={23} aria-hidden="true" /><h3>Datos de pago</h3><span>Solo vista previa</span></div>
        <p>Explora el formulario con datos ficticios. No se guardan ni se envían los campos.</p>
        <button className="button full-width" disabled={disabled} onClick={onOpen}>Ingresar datos de pago</button>
      </section> : <p className="form-note">La vista previa de pago no está disponible para esta reserva.</p>}
    <p className="payment-disclaimer">Crear una reserva no realiza ningún cobro. Los pagos reales con tarjeta o transferencia no están habilitados.</p>
  </aside>;
}

// Ficha de reserva, historial de pagos y cancelación. El modal es únicamente una vista previa local.
function ReservationRecord({ token, id }: { token: string; id: string }) {
  const resource = useResource('reservation', decodeReservation, '', token, { id });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  // Solo guarda si se completó la demo; nunca guarda valores de los campos del modal.
  const [paidLocally, setPaidLocally] = useState(false);
  const lock = useRef(false);

  // La cancelación conserva su solicitud real; nunca incluye datos del formulario de pago.
  async function cancel() {
    if (paidLocally || lock.current || resource.loading || resource.error || !resource.data || !canCancel(resource.data)) return;
    lock.current = true; setBusy(true); setError(null);
    try {
      const result = await apiRequest('cancel', decodeReservationStatus, { method: 'PATCH', token, params: { id } });
      if (result.status !== 'cancelada') throw new Error('El servidor no confirmó la cancelación. Revisa el estado actualizado de tu reserva.');
      setSuccess(true); setConfirming(false); resource.reload();
    } catch (error) { setError(errorMessage(error)); resource.reload(); }
    finally { lock.current = false; setBusy(false); }
  }

  if (resource.loading && !resource.data) return <ReservationSkeleton count={1} />;
  if (resource.error && !resource.data) return <Notice title="No pudimos cargar esta reserva" error retry={resource.reload}>{resource.error}</Notice>;
  if (!resource.data) return <Notice title="La reserva no está disponible">Conecta el servicio para consultar su estado y sus detalles.</Notice>;
  const reservation = resource.data;
  const disabled = busy || resource.loading || Boolean(resource.error);
  const passengers = reservation.items.reduce((total, item) => total + item.passengers, 0);
  const demoPaid = reservation.payments.some(payment => payment.method === 'demo' && payment.status === 'aprobado_demo');
  // Si el servidor cambia la reserva, su estado tiene prioridad sobre la demostración local.
  const paidPreview = paidLocally && canCancel(reservation);

  return <>
    {resource.error && <Notice title="No pudimos actualizar la reserva" error retry={resource.reload}>{resource.error} Las acciones están deshabilitadas hasta actualizar los datos.</Notice>}
    {resource.loading && <p className="reservation-refresh" role="status">Actualizando el estado de tu reserva…</p>}
    <div className="reservation-layout">
      <article className="reservation-record" aria-busy={resource.loading}>
        <header className="reservation-overview"><div><span className="reservation-code">REFERENCIA #{reservation.id}</span><h2>Tu reserva #{reservation.id}</h2></div><ReservationStatus status={reservation.status} paidPreview={paidPreview} /></header>
        <p className="reservation-state-description">{paidPreview ? 'Pago completado en modo demo. Sin cobro real.' : reservationPresentation(reservation.status).description}</p>
        <div className="reservation-facts"><span><TicketIcon size={20} aria-hidden="true" />{reservation.items.length} {reservation.items.length === 1 ? 'paquete' : 'paquetes'}</span><span><UsersThreeIcon size={20} aria-hidden="true" />{passengers} {passengers === 1 ? 'viajero' : 'viajeros'}</span></div>
        {['pendiente', 'confirmada'].includes(reservation.status) && <ol className="reservation-progress" aria-label="Estado de la reserva">
          <li className="step-complete"><CheckCircleIcon aria-hidden="true" /><span>Reserva creada</span></li>
          <li className={paidPreview || demoPaid ? 'step-complete' : ''}><ReceiptIcon aria-hidden="true" /><span>{paidPreview ? 'Pagado · demo' : demoPaid ? 'Pago demo registrado' : 'Consulta los pagos'}</span></li>
          <li className={reservation.status === 'confirmada' ? 'step-complete' : ''}><TicketIcon aria-hidden="true" /><span>{reservation.status === 'confirmada' ? 'Reserva confirmada' : 'Confirmación pendiente'}</span></li>
        </ol>}
        <ReservationItems reservation={reservation} />
        {reservation.payments.length > 0 && <section className="reservation-payments">
          <div className="reservation-section-heading"><h3>Pagos registrados</h3><ReceiptIcon size={20} aria-hidden="true" /></div>
          {reservation.payments.map(payment => <article className="payment-entry" key={payment.id}><div><h4>Pago #{payment.id}</h4><p>{payment.method === 'demo' ? 'Pago de demostración · sin cobro real' : `Método informado: ${payment.method}`}</p><span>{paymentStatusLabel(payment.status)}</span></div><strong>{money(payment.amount)}</strong></article>)}
        </section>}
        {success && <p className="feedback-success" role="status"><CheckCircleIcon size={20} aria-hidden="true" />Tu reserva fue cancelada.</p>}
        {error && <p role="alert" className="form-error">{error}</p>}
        {!paidPreview && canCancel(reservation) && hasCapability('cancel') && <section className="cancellation">
          {confirming ? <><h3>¿Quieres cancelar esta reserva?</h3><p>Solo se pueden cancelar reservas pendientes sin pagos. El servidor verificará las condiciones y devolverá los cupos.</p>
            <div className="button-row"><button className="button button-danger" disabled={disabled} onClick={cancel}>{busy ? 'Cancelando…' : 'Sí, cancelar reserva'}</button><button className="text-button" disabled={disabled} onClick={() => setConfirming(false)}>Mantener mi reserva</button></div>
          </> : <><h3>¿Cambió tu plan?</h3><p>Mientras la reserva esté pendiente y sin pagos, puedes cancelarla.</p><button className="text-button cancellation-link" disabled={disabled} onClick={() => setConfirming(true)}>Cancelar reserva</button></>}
        </section>}
      </article>
      <ReservationPayment reservation={reservation} disabled={disabled} paidPreview={paidPreview} onOpen={() => { setPaymentOpen(true); setConfirming(false); }} />
    </div>
    {/* Ninguna devolución del modal contiene valores de los campos ni dispara una petición. */}
    {paymentOpen && <PaymentModal amount={reservation.total} onClose={() => setPaymentOpen(false)} onComplete={() => { setPaymentOpen(false); setPaidLocally(true); }} />}
  </>;
}
