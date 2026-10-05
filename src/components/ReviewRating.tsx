// Elementos visuales de reseñas. Cambia colores y tamaños en .rating-stars, .traveler-avatar y .star-choice.
import { useId, useState } from 'react';
import { StarIcon, StarHalfIcon } from '@phosphor-icons/react';
import type { EntityId } from '../lib/domain';
import { avatarTone, travelerInitials } from '../lib/presentation';

const values = [1, 2, 3, 4, 5];
const descriptions = ['Selecciona tu valoración', 'No fue lo esperado', 'Puede mejorar', 'Buena experiencia', 'Muy buena experiencia', 'Una experiencia excelente'];

// Estrellas de lectura con medias estrellas para promedios; incluye una descripción accesible.
export function RatingStars({ rating }: { rating: number }) {
  return <span className="rating-stars" role="img" aria-label={`${rating.toLocaleString('es', { maximumFractionDigits: 1 })} de 5 estrellas`}>
    {values.map(value => value > rating && value - .5 <= rating
      ? <StarHalfIcon key={value} size={17} weight="fill" aria-hidden="true" />
      : <StarIcon key={value} size={17} weight={value <= rating ? 'fill' : 'regular'} aria-hidden="true" />)}
  </span>;
}
// Avatar con iniciales del viajero y color estable; no inventa un nombre si falta.
export function TravelerAvatar({ name, id }: { name: string | null; id: EntityId | null }) {
  return <span className={`traveler-avatar avatar-tone-${avatarTone(id, name)}`} aria-hidden="true">{travelerInitials(name)}</span>;
}
// Selector de valoración del formulario, utilizable con ratón y teclado.
export function StarRating({ initialValue = 0, disabled = false }: { initialValue?: number; disabled?: boolean }) {
  const [rating, setRating] = useState(initialValue);
  const [hovered, setHovered] = useState(0);
  const descriptionId = useId();
  const preview = hovered || rating;
  return <fieldset className="star-rating-field" disabled={disabled}>
    <legend>Tu valoración</legend>
    <div className="star-rating-options" onMouseLeave={() => setHovered(0)}>
      {values.map(value => <label key={value} className={`star-choice ${value <= preview ? 'star-selected' : ''}`}
        onMouseEnter={() => { if (!disabled) setHovered(value); }}>
        <input type="radio" name="calificacion" value={value} checked={rating === value} required
          aria-label={value === 1 ? '1 estrella' : `${value} estrellas`} aria-describedby={descriptionId}
          onChange={() => setRating(value)} />
        <StarIcon size={32} weight={value <= preview ? 'fill' : 'regular'} aria-hidden="true" />
      </label>)}
    </div>
    <p className="star-rating-description" id={descriptionId} aria-live="polite">{descriptions[rating]}{rating > 0 && <span> · {rating} de 5</span>}</p>
  </fieldset>;
}
