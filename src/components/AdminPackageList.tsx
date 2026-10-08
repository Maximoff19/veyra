import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { dateLabel, type TravelPackage } from '../lib/domain';

interface AdminPackageListProps {
  items: TravelPackage[];
  token: string;
  loading: boolean;
  disabled: boolean;
  offset: number;
  onPageChange: (offset: number) => void;
  onDeleted: () => void;
}

export function AdminPackageList({ items, token, loading, disabled, offset, onPageChange, onDeleted }: AdminPackageListProps) {
  const [selected, setSelected] = useState<TravelPackage | null>(null);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const lock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const visibleItems = items.filter(pkg => !deletedIds.includes(String(pkg.id)));
  const unavailable = disabled || loading || busy || !hasCapability('deletePackage');

  useEffect(() => {
    if (success) heading.current?.focus();
  }, [success]);

  async function removePackage() {
    if (!selected || lock.current || unavailable) return;
    const pkg = selected;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await apiRequest('deletePackage', () => undefined, {
        method: 'DELETE', token, params: { id: String(pkg.id) },
      });
      // Remove only after acknowledgement, even if refreshing the list fails.
      setDeletedIds(previous => [...previous, String(pkg.id)]);
      setSelected(null);
      setSuccess(`Se eliminó «${pkg.title}» del catálogo.`);
      if (visibleItems.length === 1 && offset > 0) onPageChange(Math.max(0, offset - 100));
      onDeleted();
    } catch (cause) {
      setError(errorMessage(cause));
      // A lost response may follow a completed deletion; refresh, never retry automatically.
      onDeleted();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function close() {
    if (lock.current) return;
    setSelected(null);
    setError(null);
  }

  return <section className="admin-package-manager" aria-labelledby={titleId}>
    <h2 id={titleId} ref={heading} tabIndex={-1}>Gestionar paquetes</h2>
    <p>La eliminación es permanente e incluye el itinerario y las reseñas. Los paquetes con reservas no se pueden eliminar.</p>
    {success && <p className="feedback-success" role="status">{success}</p>}
    {!hasCapability('deletePackage') && <p role="status">La eliminación de paquetes todavía no está conectada.</p>}
    {loading && <p role="status">Actualizando paquetes…</p>}
    {!loading && visibleItems.length === 0 && <p>No hay paquetes en esta página.</p>}
    <ul className="admin-package-list" aria-busy={loading}>
      {visibleItems.map(pkg => <li key={pkg.id}>
        <div><Link to={`/paquetes/${encodeURIComponent(pkg.id)}`}>{pkg.title}</Link>
          <p>ID {pkg.id} · {dateLabel(pkg.startsAt)} · {pkg.availableSpots} cupos</p></div>
        <button className="button button-danger" type="button" disabled={unavailable}
          aria-label={`Eliminar paquete ${pkg.title}`} onClick={() => {
            setError(null); setSuccess(null); setSelected(pkg);
          }}>Eliminar</button>
      </li>)}
    </ul>
    <div className="button-row">
      <button className="text-button" type="button" disabled={loading || busy || offset === 0}
        onClick={() => onPageChange(Math.max(0, offset - 100))}>Paquetes anteriores</button>
      <span> Página {Math.floor(offset / 100) + 1} </span>
      <button className="text-button" type="button" disabled={loading || busy || items.length < 100}
        onClick={() => onPageChange(offset + 100)}>Más paquetes</button>
    </div>
    {selected && <DeletePackageDialog pkg={selected} busy={busy} error={error} onClose={close} onConfirm={removePackage} />}
  </section>;
}

interface DeletePackageDialogProps {
  pkg: TravelPackage;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

function DeletePackageDialog({ pkg, busy, error, onClose, onConfirm }: DeletePackageDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    cancel.current?.focus();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} className="admin-delete-dialog" aria-labelledby={titleId}
    aria-describedby={descriptionId} aria-busy={busy} onCancel={event => { event.preventDefault(); onClose(); }}>
    <h2 id={titleId}>¿Eliminar este paquete?</h2>
    <p className="admin-delete-target">{pkg.title} <span>· ID {pkg.id}</span></p>
    <p id={descriptionId}>Esta acción no se puede deshacer. Se eliminarán también su itinerario y sus reseñas. Si tiene reservas, el servidor rechazará la eliminación.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="button-row">
      <button ref={cancel} className="text-button" type="button" disabled={busy} onClick={onClose}>Mantener paquete</button>
      <button className="button button-danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Sí, eliminar paquete'}</button>
    </div>
  </dialog>;
}
