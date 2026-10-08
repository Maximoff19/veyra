// Formularios administrativos. Campos y ayudas en lib/forms.ts; estilos compartidos de controles.
// Para personalizar su distribución, añade reglas de .admin-form en styles.css.
import { useRef, useState, type FormEvent } from 'react';
import { adminForms, adminPayload, FORM_KIND, INPUT, type FormKind } from '../lib/forms';
import { apiRequest, errorMessage, hasCapability } from '../lib/api';
import { array, decodeCategory, decodeHotel, decodePackage, decodePage } from '../lib/decoders';
import { useResource } from '../lib/use-resource';
import type { Category, EntityId, Hotel } from '../lib/domain';
import { Notice } from './ui';
import { AdminPackageList } from './AdminPackageList';

const decodeCategories = (value: unknown) => array(value, decodeCategory);
const decodeHotels = (value: unknown) => array(value, decodeHotel);
const decodePackages = (value: unknown) => decodePage(value, decodePackage);
const passthrough = (value: unknown) => value;

// Pestañas para categorías, hoteles, paquetes, itinerarios y ajustes de cupos.
export function AdminForms({ token }: { token: string }) {
  const [kind, setKind] = useState<FormKind>(FORM_KIND.CATEGORY);
  return <><nav className="admin-tabs" aria-label="Gestión administrativa">{Object.values(FORM_KIND).map(value => <button key={value} aria-current={value === kind ? 'page' : undefined} onClick={() => setKind(value)}>{adminForms[value].title}</button>)}</nav><AdminEditor key={kind} kind={kind} token={token} /></>;
}
// Editor de la pestaña seleccionada; carga referencias reales y envía solo los campos permitidos.
function AdminEditor({ kind, token }: { kind: FormKind; token: string }) {
  const definition = adminForms[kind];
  const categories = useResource('categories', decodeCategories);
  const hotels = useResource('hotels', decodeHotels);
  const [offset, setOffset] = useState(0);
  const packages = useResource('packages', decodePackages, `limit=100&offset=${offset}`);
  const [packageId, setPackageId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const contextRequired = kind === FORM_KIND.ITINERARY || kind === FORM_KIND.CAPACITY;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !hasCapability(definition.endpoint)) return;
    const data = new FormData(event.currentTarget);
    const ids: Record<string, EntityId> = {};
    const category = categories.data?.find(item => String(item.id) === data.get('id_categoria'));
    const hotel = hotels.data?.find(item => String(item.id) === data.get('id_hotel'));
    if (category) ids.id_categoria = category.id;
    if (hotel) ids.id_hotel = hotel.id;
    try {
      const body = adminPayload(kind, data, ids);
      if (contextRequired && !packages.data?.items.some(item => String(item.id) === packageId)) throw new Error('Selecciona un paquete existente.');
      lock.current = true; setBusy(true); setError(null); setSuccess(false);
      await apiRequest(definition.endpoint, passthrough, { method: contextRequired && kind === FORM_KIND.CAPACITY ? 'PATCH' : 'POST', token, body, params: contextRequired ? { packageId } : undefined });
      setSuccess(true);
      categories.reload(); hotels.reload(); packages.reload();
    } catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="admin-editor"><div className="admin-form-header"><h2>{definition.title}</h2><p>Solo se enviarán los campos del contrato indicado. No hay cambios de roles ni acciones de pago.</p></div>
    {!hasCapability(definition.endpoint) && <Notice title="Operación todavía no conectada">El formulario refleja el contrato histórico. Para guardar se necesita verificar la ruta, el método y la autorización en el servidor.</Notice>}
    {(categories.error || hotels.error || packages.error) && <Notice title="No pudimos cargar los datos de referencia" error retry={() => { categories.reload(); hotels.reload(); packages.reload(); }}>{categories.error ?? hotels.error ?? packages.error}</Notice>}
    <form onSubmit={submit} className="admin-form">
      {contextRequired && <div className="admin-context"><label>Paquete del itinerario o ajuste<select value={packageId} required onChange={event => setPackageId(event.target.value)} disabled={!packages.connected || packages.loading || busy}><option value="">Selecciona un paquete existente</option>{packages.data?.items.map(pkg => <option key={pkg.id} value={pkg.id}>{pkg.title}</option>)}</select><span className="field-help">Selecciona el registro a gestionar. El identificador va en la ruta, no se añade al cuerpo del formulario.</span></label>{packages.connected && <div className="button-row"><button className="text-button" type="button" disabled={offset === 0 || packages.loading} onClick={() => { setOffset(Math.max(0, offset - 100)); setPackageId(''); }}>Paquetes anteriores</button><button className="text-button" type="button" disabled={packages.loading || (packages.data?.items.length ?? 0) < 100} onClick={() => { setOffset(offset + 100); setPackageId(''); }}>Más paquetes</button></div>}</div>}
      {definition.fields.map(field => <label key={field.name}>{field.label}{field.type === INPUT.CATEGORY || field.type === INPUT.HOTEL ? <select name={field.name} required={field.required} disabled={busy || !(field.type === INPUT.CATEGORY ? categories.connected : hotels.connected)}><option value="">Selecciona una opción</option>{(field.type === INPUT.CATEGORY ? categories.data : hotels.data)?.map((item: Category | Hotel) => <option key={item.id} value={item.id}>{item.name}</option>)}</select> : field.type === INPUT.TEXTAREA ? <textarea name={field.name} rows={3} required={field.required} disabled={busy} /> : <input name={field.name} type={field.type} required={field.required} defaultValue={field.defaultValue} step={field.type === INPUT.NUMBER ? field.integer ? 1 : 'any' : undefined} disabled={busy} onInput={event => { const input = event.currentTarget; input.setCustomValidity(field.required && field.type === INPUT.TEXT && !input.value.trim() ? 'Este campo no puede estar vacío.' : field.name === 'ajuste' && Number(input.value) === 0 ? 'El ajuste no puede ser 0.' : ''); }} aria-describedby={`help-${field.name}`} />}<span className="field-help" id={`help-${field.name}`}>{field.help} <code>{field.name}</code></span></label>)}
      {error && <p className="form-error" role="alert">{error}</p>}{success && <p role="status">El servidor aceptó la solicitud. Verifica el registro en la respuesta o el listado actualizado.</p>}<button className="button" disabled={busy || !hasCapability(definition.endpoint)}>{busy ? 'Enviando…' : 'Guardar en el servidor'}</button>
    </form>
    {kind === FORM_KIND.PACKAGE && <AdminPackageList items={packages.data?.items ?? []} token={token}
      loading={packages.loading} disabled={busy || !packages.connected || Boolean(packages.error)} offset={offset}
      onPageChange={setOffset} onDeleted={packages.reload} />}
    </div>;
}
