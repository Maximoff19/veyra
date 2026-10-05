// Sección de reseñas del detalle de paquete. Estilos: .reviews-section, .review-list y .review-form.
// Cambia aquí las tarjetas y el formulario; las estrellas y avatares están en ReviewRating.tsx.
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import { useAuth } from '../lib/auth';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { array, decodeReview } from '../lib/decoders';
import { useResource } from '../lib/use-resource';
import type { Review } from '../lib/domain';
import { Notice } from './ui';
import { RatingStars, StarRating, TravelerAvatar } from './ReviewRating';

const decodeReviews = (value: unknown) => array(value, decodeReview);
export function Reviews({ packageId }: { packageId: string }) {
  const { session } = useAuth();
  const reviews = useResource('reviews', decodeReviews, '', undefined, { packageId });
  const [editing, setEditing] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const lock = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  // Crea o actualiza la reseña del usuario; valida la valoración antes de enviarla.
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || lock.current) return;
    if (editing && editing.authorId !== session.user.id) return;
    const data = new FormData(event.currentTarget);
    const comentario = String(data.get('comentario') ?? '').trim();
    const calificacion = Number(data.get('calificacion'));
    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) { setError('Selecciona una valoración entre 1 y 5. El comentario es opcional.'); return; }
    lock.current = true; setBusy(true); setError(null); setSuccess(false);
    try {
      await apiRequest(editing ? 'editReview' : 'createReview', decodeReview, { token: session.token, method: editing ? 'PUT' : 'POST', params: { packageId, ...(editing ? { id: String(editing.id) } : {}) }, body: { calificacion, comentario } });
      form.current?.reset(); setEditing(null); setFormVersion(value => value + 1); setSuccess(true); reviews.reload();
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  // El autor o un administrador pueden solicitar la eliminación; el servidor decide el permiso final.
  async function removeReview() {
    if (!session || !deleting || lock.current) return;
    if (session.user.id !== deleting.authorId && session.user.role !== 'administrador') return;
    lock.current = true; setBusy(true); setError(null); setSuccess(false);
    try {
      await apiRequest('deleteReview', () => undefined, { token: session.token, method: 'DELETE', params: { id: String(deleting.id) } });
      if (editing?.id === deleting.id) setEditing(null);
      setDeleting(null); reviews.reload();
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  const average = reviews.data?.length ? reviews.data.reduce((sum, item) => sum + item.rating, 0) / reviews.data.length : null;
  return <section className="reviews-section"><div className="section-row"><div><span className="eyebrow">EXPERIENCIAS COMPARTIDAS</span><h2>Historias de otros viajeros.</h2><p className="reviews-intro">Cada viaje se vive de una manera. Estas son sus impresiones.</p></div>{average !== null && <div className="review-score"><strong>{average.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<small> / 5</small></strong><RatingStars rating={average} /><span>{reviews.data!.length} {reviews.data!.length === 1 ? 'reseña visible' : 'reseñas visibles'}</span></div>}</div>
    {reviews.loading ? <p role="status">Cargando reseñas…</p> : reviews.error ? <Notice title="No pudimos cargar las reseñas" error retry={reviews.reload}>{reviews.error}</Notice> : !reviews.connected ? <p className="muted">Las reseñas estarán disponibles cuando se conecte el servicio.</p> : reviews.data?.length ? <div className="review-list">{reviews.data.map(review => <article key={review.id}><div className="review-header"><TravelerAvatar name={review.authorName} id={review.authorId} /><div className="review-author"><strong dir="auto">{review.authorName ?? 'Nombre no disponible'}</strong><RatingStars rating={review.rating} /></div><span className="review-score-number">{review.rating}<small> / 5</small></span></div>{review.text ? <p dir="auto">{review.text}</p> : <p className="muted">El viajero compartió su valoración sin comentario.</p>}<div className="review-actions">{session?.user.id === review.authorId && hasCapability('editReview') && <button className="text-button" disabled={busy} onClick={() => { setEditing(review); setError(null); setSuccess(false); form.current?.scrollIntoView({ block: 'center' }); }}>Editar mi reseña <PencilSimpleIcon aria-hidden="true" /></button>}{session && (session.user.id === review.authorId || session.user.role === 'administrador') && hasCapability('deleteReview') && <button className="text-button" disabled={busy} onClick={() => { setDeleting(review); setError(null); }}>Eliminar reseña</button>}</div></article>)}</div> : <div className="review-empty"><StarIcon size={30} aria-hidden="true" /><div><h3>La primera historia puede ser la tuya.</h3><p>Todavía no hay reseñas de este paquete. Comparte tu impresión.</p></div></div>}
    {deleting && <div className="cancellation"><h3>¿Eliminar esta reseña?</h3><p>Esta acción no se puede deshacer.</p><div className="button-row"><button className="button button-danger" disabled={busy} onClick={removeReview}>{busy ? 'Eliminando…' : 'Sí, eliminar reseña'}</button><button className="text-button" disabled={busy} onClick={() => setDeleting(null)}>Mantener reseña</button></div>{error && <p className="form-error" role="alert">{error}</p>}</div>}
    {!session ? <p><Link className="inline-link" to={`/ingresar?next=${encodeURIComponent(`/paquetes/${packageId}`)}`}>Inicia sesión</Link> para compartir tu experiencia. No necesitas una compra previa.</p> : hasCapability(editing ? 'editReview' : 'createReview') && <form className="review-form" onSubmit={submit} ref={form} key={editing?.id ?? `new-${formVersion}`} aria-busy={busy}><div className="review-form-heading"><TravelerAvatar name={session.user.name} id={session.user.id} /><div><h3>{editing ? 'Edita tu experiencia' : 'Comparte tu experiencia'}</h3><p>Publicas como <strong>{session.user.name}</strong>.</p></div></div><StarRating initialValue={editing?.rating ?? 0} disabled={busy} /><label>Comentario (opcional)<textarea name="comentario" rows={4} defaultValue={editing?.text ?? ''} disabled={busy} placeholder="¿Qué te gustaría que supiera otro viajero?" /></label>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="feedback-success" role="status">Tu reseña se guardó correctamente.</p>}<div className="button-row"><button className="button" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar reseña'}</button>{editing && <button type="button" className="text-button" disabled={busy} onClick={() => { setEditing(null); setError(null); }}>Cancelar edición</button>}</div></form>}
  </section>;
}
