// Secciones independientes del inicio. Se agregan, reordenan o quitan desde main.tsx.
// Cambia los textos aquí, las fotografías en lib/photos.ts y los estilos en styles.css.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, ArrowLeftIcon, ArrowRightIcon, CompassIcon, MountainsIcon, UsersThreeIcon, PlusIcon, MinusIcon, MapPinIcon, SunHorizonIcon, CalendarBlankIcon, ShieldCheckIcon, LeafIcon } from '@phosphor-icons/react';
import { photos, inspirations } from '../lib/photos';
import { decodeCategory, decodePackage, decodePage, array } from '../lib/decoders';
import { useResource } from '../lib/use-resource';
import { ActionLink, ArrowBadge, Notice, PackageCard, SkeletonCards } from './ui';

const decodePackages = (value: unknown) => decodePage(value, decodePackage);
const decodeCategories = (value: unknown) => array(value, decodeCategory);
const services = [
  { title: 'Una escapada que se siente tuya', text: 'Explora los paquetes por destino, fechas y estilo de viaje. Encuentra la experiencia que encaja contigo, no al revés.', icon: CompassIcon },
  { title: 'Todos los detalles, en un solo lugar', text: 'Consulta el hotel asociado, el itinerario, el precio por pasajero y los cupos disponibles antes de reservar.', icon: CalendarBlankIcon },
  { title: 'Tu reserva, siempre a mano', text: 'Elige cuántas personas viajan y gestiona tu reserva desde tu cuenta. La disponibilidad y el total los confirma el servicio de reservas.', icon: ShieldCheckIcon },
];

// Portada principal y tarjeta de aventura. Estilos: .hero y .hero-postcard.
export function HeroSection() {
  return <section className="hero" aria-labelledby="hero-heading">
      <img className="hero-image" src={photos.hero} alt="Cumbres alpinas entre nubes bajo un cielo azul" width="2400" height="1600" fetchPriority="high" />
      <div className="hero-scrim" />
      <div className="hero-title" aria-hidden="true">Veyra</div>
      <div className="hero-bottom"><div className="hero-copy"><span className="hero-eyebrow"><span /> VIAJA MÁS ALLÁ DE LO HABITUAL</span><h1 id="hero-heading">El mundo,<br />a tu manera.</h1><p>Paquetes turísticos para salir de la rutina<br className="desktop-break" /> y volver con algo que contar.</p><ActionLink to="/paquetes" className="button-white">Explorar paquetes</ActionLink></div>
        <Link to="/#experiencias" className="hero-postcard"><div className="postcard-heading"><span>Menos rutina.<br /><strong>Más momentos así.</strong></span><ArrowUpRightIcon aria-hidden="true" /></div><img src={photos.hiker} alt="Viajeros recorriendo un sendero de montaña" width="450" height="300" /><span className="postcard-caption"><span>Encuentra tu próxima aventura</span><CompassIcon size={18} aria-hidden="true" /></span></Link>
      </div>
      <div className="hero-footnote"><span>UN NUEVO PUNTO DE VISTA.</span><a href="#nosotros">Desliza para descubrir <span>↓</span></a><span>01 / EXPLORA</span></div>
    </section>;
}

// Presentación de la marca y collage. Estilos: .intro, .intro-copy y .intro-collage.
export function AboutSection() {
  return <section id="nosotros" className="intro section-container">
      <div className="intro-collage"><img className="intro-photo-main" src={photos.hiker} alt="Senderistas explorando las montañas" width="800" height="900" loading="lazy" /><span className="photo-note"><CompassIcon size={17} aria-hidden="true" /> El camino también es el destino.</span><img className="intro-photo-small" src={photos.coast} alt="Casas de colores junto al mar en la costa italiana" width="420" height="500" loading="lazy" /><span className="image-sticker">Un viaje.<br />Mil maneras<br />de vivirlo.<ArrowUpRightIcon size={23} aria-hidden="true" /></span></div>
      <div className="intro-copy"><span className="eyebrow">NO SOLO VIAJES. VIVE EL VIAJE.</span><h2>Los mejores recuerdos<br />no vienen en una maleta.</h2><p>Vienen de perder la noción del tiempo. De conocer otro lugar y encontrarte un poco más contigo.</p><p className="muted">En Veyra creemos en los viajes con intención. Descubre paquetes que reúnen destinos, alojamiento y experiencias en un itinerario para disfrutar de principio a fin.</p><Link className="text-button" to="/#como-funciona">Así empieza tu viaje <ArrowBadge /></Link></div>
    </section>;
}

// Tarjetas de valores: descubrir, elegir y disfrutar. Estilos: .values y .value-tile.
export function ValuesSection() {
  return <section className="values section-container" aria-label="Una forma diferente de viajar">
      <div className="value-tile"><span>01 / DESCUBRE</span><CompassIcon aria-hidden="true" size={22} /><h3>Más allá<br />de lo de siempre.</h3><p>Destinos que despiertan tu curiosidad.</p></div>
      <div className="value-tile value-blue"><span>02 / ELIGE</span><LeafIcon aria-hidden="true" size={22} /><h3>A tu ritmo.<br />A tu manera.</h3><p>Encuentra el paquete que va contigo.</p></div>
      <div className="value-tile"><span>03 / DISFRUTA</span><SunHorizonIcon aria-hidden="true" size={22} /><h3>Menos pendientes.<br />Más presente.</h3><p>Tu itinerario, claro desde el principio.</p></div>
    </section>;
}

// Tarjetas de destinos de inspiración; no son ofertas reservables. Estilos: .destination-card.
export function DestinationsSection() {
  return <section className="destinations section-container" id="destinos"><div className="destination-heading"><span className="eyebrow">LUGARES QUE INSPIRAN</span><h2>Hay lugares que<br />se quedan contigo.</h2><p>Una isla, un sendero, un horizonte nuevo.<br />¿Dónde empieza tu próxima historia?</p><span className="editorial-disclaimer">Inspiración de viaje · No son ofertas disponibles</span></div>
      <div className="destination-grid">{inspirations.map((destination, index) => <Link to={`/paquetes?q=${encodeURIComponent(destination.search)}`} className={`destination-card destination-${index}`} key={destination.name}><img src={destination.image} alt={`Paisaje de ${destination.name}`} width="650" height="850" loading="lazy" /><div className="destination-overlay"><span className="destination-number">0{index + 1}</span><div><p><MapPinIcon aria-hidden="true" />{destination.region}</p><h3>{destination.name}</h3><span>{destination.description}</span></div><span className="destination-arrow"><ArrowUpRightIcon aria-hidden="true" size={22} /></span></div></Link>)}</div>
    </section>;
}

// Paquetes destacados: esta sección administra su propia carga, error y reintento.
// Tarjetas: PackageCard en ui.tsx. Estilos: .featured-section y .package-card.
export function FeaturedPackagesSection() {
  const packages = useResource('packages', decodePackages, 'disponibles=true&limit=3&offset=0');
  return <section className="featured-section" id="paquetes"><div className="section-container"><div className="center-heading"><span className="eyebrow">TU PRÓXIMO GRAN RECUERDO</span><h2>Un viaje completo.<br />Espacio para hacerlo tuyo.</h2><p>Paquetes turísticos con fechas, alojamiento e itinerarios claros.<br />Tú eliges la experiencia. El viaje empieza aquí.</p></div>
      {packages.loading ? <SkeletonCards /> : packages.error ? <Notice title="No pudimos cargar los paquetes" error retry={packages.reload}>{packages.error}</Notice> : packages.data?.items.length ? <div className="package-grid">{packages.data.items.slice(0, 3).map(pkg => <PackageCard pkg={pkg} key={pkg.id} />)}</div> : <div className="catalog-preview"><div className="preview-photo"><img src={photos.beach} width="850" height="550" alt="Una playa tranquila de aguas turquesas" loading="lazy" /><span>Tu próxima escapada empieza aquí.</span></div><div className="preview-message"><CompassIcon size={35} weight="light" aria-hidden="true" /><h3>{packages.connected ? 'Nuevos viajes en el horizonte.' : 'El mundo está ahí fuera.'}</h3><p>{packages.connected ? 'Todavía no hay paquetes publicados. Vuelve pronto para descubrir las próximas salidas.' : 'Estamos preparando nuestro catálogo. Los destinos de esta página son inspiración; los precios y cupos aparecerán cuando el servicio esté conectado.'}</p><ActionLink to="/paquetes" className="button-white">Explorar paquetes</ActionLink></div></div>}
      {packages.data?.items.length ? <div className="center-action"><ActionLink to="/paquetes" className="button-white">Explorar paquetes</ActionLink></div> : null}
    </div></section>;
}

// Categorías del servidor y tarjetas de inspiración. Estilos: .experiences y .experience-grid.
export function ExperiencesSection() {
  const categories = useResource('categories', decodeCategories);
  return <section className="experiences section-container" id="experiencias"><div className="experience-top"><h2>No todos soñamos<br />con el mismo viaje.</h2><p>Y eso es lo mejor.<br />Encuentra tu manera de explorar.</p></div>
      {categories.loading ? <p role="status">Cargando categorías…</p> : categories.error ? <Notice title="No pudimos cargar las categorías" error retry={categories.reload}>{categories.error}</Notice> : categories.data?.length ? <div className="category-links">{categories.data.map(category => <Link key={category.id} to={`/paquetes?id_categoria=${encodeURIComponent(category.id)}`}>{category.name}<ArrowUpRightIcon aria-hidden="true" /></Link>)}</div> : <div className="experience-grid"><Link className="experience-large" to="/paquetes?q=naturaleza"><img src={photos.mountain} width="1000" height="650" alt="Montañas rodeadas de nubes" loading="lazy" /><span className="experience-tag"><MountainsIcon aria-hidden="true" size={17} /> Naturaleza & aventura</span><div><h3>Donde el aire<br />se siente diferente.</h3><ArrowBadge /></div></Link><Link className="experience-small" to="/paquetes?q=playa"><img src={photos.beach} width="650" height="650" alt="Mar turquesa junto a una playa" loading="lazy" /><span className="experience-tag"><SunHorizonIcon aria-hidden="true" size={17} /> Mar & desconexión</span><div><h3>Un horizonte.<br />Cero prisa.</h3><ArrowBadge /></div></Link><Link className="experience-small experience-culture" to="/paquetes?q=cultura"><img src={photos.coast} width="650" height="650" alt="Pueblo mediterráneo junto al mar" loading="lazy" /><span className="experience-tag"><UsersThreeIcon aria-hidden="true" size={17} /> Cultura & encuentros</span><div><h3>Otra forma<br />de ver el mundo.</h3><ArrowBadge /></div></Link></div>}
      {!categories.connected && <p className="subtle-note">Ideas para inspirarte. Las categorías disponibles se mostrarán con el catálogo.</p>}
    </section>;
}

// Acordeón de cómo funciona el viaje. Cambia sus textos en services y su estilo en .planning.
export function PlanningSection() {
  const [openService, setOpenService] = useState(0);
  return <section className="planning section-container" id="como-funciona"><div className="planning-copy"><span className="eyebrow">DE LA IDEA AL ITINERARIO</span><h2>Más emoción.<br />Menos complicaciones.</h2><p>Elegir tu próxima experiencia debería<br />ser parte de disfrutarla.</p><div className="service-list">{services.map((service, index) => <div className={`service-item ${openService === index ? 'service-open' : ''}`} key={service.title}><button aria-expanded={openService === index} aria-controls={`service-${index}`} onClick={() => setOpenService(openService === index ? -1 : index)}><span className="service-index">0{index + 1}</span><span>{service.title}</span>{openService === index ? <MinusIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}</button><div id={`service-${index}`} hidden={openService !== index}><p>{service.text}</p></div></div>)}</div></div><div className="planning-image"><img src={photos.bali} alt="Paisaje tropical y arquitectura de Bali" width="900" height="1200" loading="lazy" /><div className="planning-note"><CompassIcon size={24} aria-hidden="true" /><span>No hace falta ir más lejos.<br /><strong>Solo vivirlo diferente.</strong></span></div></div></section>;
}

// Invitación a crear una cuenta y tarjetas de pasos. Estilos: .personal-section y .journey-steps.
export function PersonalJourneySection() {
  return <section className="personal-section"><div className="section-container personal-inner"><div><span className="eyebrow">TU VIAJE EMPIEZA CONTIGO</span><h2>Un destino nuevo.<br />Una versión nueva de ti.</h2><p>Viaja en pareja, con amigos o con tu propia compañía.<br />Elige cuántos viajan. Comparte lo que importa.</p><ActionLink to="/registro">Crear mi cuenta</ActionLink></div><div className="journey-steps"><div><span>01</span><h3>Encuentra tu lugar</h3><p>Explora paquetes y consulta cada detalle.</p><CompassIcon size={24} aria-hidden="true" /></div><div><span>02</span><h3>Haz espacio para el viaje</h3><p>Selecciona tus pasajeros y solicita tu reserva.</p><UsersThreeIcon size={24} aria-hidden="true" /></div><div><span>03</span><h3>Ten todo a mano</h3><p>Consulta el estado y el total desde tu cuenta.</p><CalendarBlankIcon size={24} aria-hidden="true" /></div></div></div></section>;
}

// Galería horizontal de momentos y botones de desplazamiento. Estilos: .moments-gallery.
export function MomentsSection() {
  const gallery = useRef<HTMLDivElement>(null);
  return <section className="moments"><div className="center-heading"><h2>Al final, no son lugares.<br />Son momentos.</h2><p>Y algunos merecen quedarse para siempre.</p></div><div className="moments-gallery" ref={gallery}>{[{ image: photos.coast, label: 'Un lugar por descubrir.' }, { image: photos.hiker, label: 'El camino compartido.' }, { image: photos.mountain, label: 'Una nueva perspectiva.' }, { image: photos.beach, label: 'Tiempo para desconectar.' }, { image: photos.santorini, label: 'El viaje que imaginas.' }].map(moment => <figure key={moment.label}><img src={moment.image} alt={moment.label} width="650" height="800" loading="lazy" /><figcaption>{moment.label}<ArrowUpRightIcon aria-hidden="true" /></figcaption></figure>)}</div><div className="gallery-controls"><span>Pequeños momentos. Grandes recuerdos.</span><div><button aria-label="Ver momentos anteriores" onClick={() => gallery.current?.scrollBy({ left: -380, behavior: 'smooth' })}><ArrowLeftIcon size={20} /></button><button aria-label="Ver más momentos" onClick={() => gallery.current?.scrollBy({ left: 380, behavior: 'smooth' })}><ArrowRightIcon size={20} /></button></div></div></section>;
}
