// Página del catálogo. Se habilita en main.tsx con la ruta "paquetes".
// Cambia filtros y títulos aquí; tarjetas en components/ui.tsx y estilos en .catalog-*.
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, SlidersHorizontalIcon, ArrowLeftIcon, ArrowRightIcon, XIcon } from '@phosphor-icons/react';
import { array, decodeCategory, decodeHotel, decodePackage, decodePage } from '../lib/decoders';
import { pageQuery } from '../lib/domain';
import { useResource } from '../lib/use-resource';
import { Notice, PackageCard, SkeletonCards } from '../components/ui';

const decodePackages = (value: unknown) => decodePage(value, decodePackage);
const decodeCategories = (value: unknown) => array(value, decodeCategory);
const decodeHotels = (value: unknown) => array(value, decodeHotel);

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = pageQuery(params);
  const limit = Number(query.get('limit'));
  const offset = Number(query.get('offset'));
  const packages = useResource('packages', decodePackages, query.toString());
  const categories = useResource('categories', decodeCategories);
  const hotels = useResource('hotels', decodeHotels);
  // Guarda filtros en la URL y vuelve a la primera página cuando cambia la búsqueda.
  function update(key: string, value: string) {
    setParams(current => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); if (key !== 'offset') next.delete('offset'); return next; });
  }
  const hasNext = packages.data ? (packages.data.total !== null ? offset + packages.data.items.length < packages.data.total : packages.data.items.length === limit) : false;
  return <div className="page-container catalog-page"><div className="page-heading"><span className="eyebrow">ENCUENTRA TU PRÓXIMA HISTORIA</span><h1>¿A dónde te<br />lleva la curiosidad?</h1><p>Explora paquetes turísticos. Elige tu destino, tus fechas y tu manera de viajar.</p></div>
    <form className="catalog-filters" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); update('q', String(data.get('q') ?? '').trim()); }}>
      <label className="search-field"><span>Busca tu próximo destino</span><div><MagnifyingGlassIcon size={20} aria-hidden="true" /><input name="q" type="search" defaultValue={params.get('q') ?? ''} key={params.get('q') ?? ''} placeholder="Destino o nombre del paquete" /><button type="submit" className="search-submit" aria-label="Buscar paquetes"><ArrowRightIcon size={19} /></button></div></label>
      <label><span>Categoría</span><select name="id_categoria" value={params.get('id_categoria') ?? ''} onChange={event => update('id_categoria', event.target.value)} disabled={!categories.connected || categories.loading || Boolean(categories.error)}><option value="">Todas las experiencias</option>{categories.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label><span>Hotel</span><select name="id_hotel" value={params.get('id_hotel') ?? ''} onChange={event => update('id_hotel', event.target.value)} disabled={!hotels.connected || hotels.loading || Boolean(hotels.error)}><option value="">Todos los hoteles</option>{hotels.data?.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="checkbox-field"><input name="disponibles" type="checkbox" checked={params.get('disponibles') === 'true'} onChange={event => update('disponibles', event.target.checked ? 'true' : '')} /><span>Solo disponibles</span></label>
    </form>
    {(categories.error || hotels.error) && <Notice title="Algunos filtros no están disponibles" error retry={() => { categories.reload(); hotels.reload(); }}>{categories.error ?? hotels.error}</Notice>}
    <div className="catalog-result-heading"><span><SlidersHorizontalIcon aria-hidden="true" />{packages.data?.total !== null && packages.data?.total !== undefined ? `${packages.data.total} paquetes encontrados` : 'Paquetes turísticos'}</span><div className="catalog-toolbar"><label>Resultados por página<input name="limit" type="number" min={1} max={100} step={1} value={limit} onChange={event => { if (event.target.validity.valid) update('limit', event.target.value); }} /></label>{params.size > 0 && <button className="text-button" onClick={() => setParams({})}>Limpiar filtros <XIcon aria-hidden="true" /></button>}</div></div>
    {packages.loading ? <SkeletonCards count={6} /> : packages.error ? <Notice title="No pudimos cargar tus próximos destinos" error retry={packages.reload}>{packages.error}</Notice> : !packages.connected ? <Notice title="Estamos preparando nuevas experiencias">El catálogo aún no está conectado al servicio de reservas. No hay precios ni cupos confirmados por ahora. Vuelve pronto para descubrir los paquetes disponibles.</Notice> : packages.data?.items.length ? <div className="package-grid">{packages.data.items.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}</div> : <Notice title="Tu próxima historia todavía está por llegar">No hay paquetes que coincidan con tu búsqueda. Prueba otro destino o limpia los filtros.</Notice>}
    {packages.connected && packages.data && (offset > 0 || hasNext) && <nav className="pagination" aria-label="Páginas del catálogo"><button disabled={packages.loading || offset === 0} onClick={() => update('offset', String(Math.max(0, offset - limit)))}><ArrowLeftIcon aria-hidden="true" /> Anterior</button><span>Desde el resultado {offset + 1}</span><button disabled={packages.loading || !hasNext} onClick={() => update('offset', String(offset + limit))}>Siguiente <ArrowRightIcon aria-hidden="true" /></button></nav>}
    <div className="catalog-bottom-note"><span>Un viaje completo, no solo una habitación.</span><p>Consulta el alojamiento, el itinerario y las condiciones en los detalles de cada paquete.</p></div>
  </div>;
}
