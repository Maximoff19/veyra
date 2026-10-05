// ARCHIVO PRINCIPAL: aquí se decide qué páginas y secciones se muestran.
// Para ocultar una sección del inicio, elimina o comenta únicamente su llamada JSX.
// Para cambiar sus textos, abre el componente; para cambiar su diseño, busca su clase en styles.css.
// Quitar una página también requiere revisar los enlaces que apuntan a ella.
import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@fontsource-variable/manrope';
import App from './App';
import * as Shell from './components/Layout';
// La importación agrupada evita errores de importaciones sin uso al quitar una sección.
import * as HomeSections from './components/HomeSections';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import './styles.css';

// Cada página secundaria se descarga al visitarla; conserva esta carga diferida.
const Catalog = lazy(() => import('./pages/Catalog'));
const PackageDetails = lazy(() => import('./pages/PackageDetails'));
const Auth = lazy(() => import('./pages/Auth'));
const Reservations = lazy(() => import('./pages/Reservations'));
const ReservationDetails = lazy(() => import('./pages/Reservations').then(module => ({ default: module.ReservationDetails })));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));

// Montaje de React: no elimines StrictMode, BrowserRouter ni App para ocultar una sección.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App>
        <Routes>
          <Route element={
            <Shell.Layout
              // Encabezado compartido: elimina esta propiedad para ocultarlo.
              // Si quitas HeroSection, cambia heroOnHome a false para usar el menú normal.
              header={<Shell.Header heroOnHome />}
              // Pie de página compartido: elimina esta propiedad para ocultarlo.
              footer={<Shell.Footer />}
            />
          }>
            <Route index element={
              <Home>
                {/* Portada con fotografía y título principal. */}
                <HomeSections.HeroSection />
                {/* Presentación de Veyra y collage de fotografías. */}
                <HomeSections.AboutSection />
                {/* Tarjetas de valores de la marca. */}
                <HomeSections.ValuesSection />
                {/* Tarjetas de destinos de inspiración. */}
                <HomeSections.DestinationsSection />
                {/* Paquetes destacados cargados desde el servidor. */}
                <HomeSections.FeaturedPackagesSection />
                {/* Categorías y tarjetas de experiencias. */}
                <HomeSections.ExperiencesSection />
                {/* Acordeón que explica cómo funciona el viaje. */}
                <HomeSections.PlanningSection />
                {/* Invitación a crear una cuenta y pasos de reserva. */}
                <HomeSections.PersonalJourneySection />
                {/* Galería horizontal de momentos. */}
                <HomeSections.MomentsSection />
              </Home>
            } />
            {/* Catálogo y detalle de cada paquete. */}
            <Route path="paquetes" element={<Catalog />} />
            <Route path="paquetes/:id" element={<PackageDetails />} />
            {/* Inicio de sesión y registro: comparten el componente Auth. */}
            <Route path="ingresar" element={<Auth key="login" />} />
            <Route path="registro" element={<Auth registration key="register" />} />
            {/* Listado de reservas y detalle con pago de demostración. */}
            <Route path="reservas" element={<Reservations />} />
            <Route path="reservas/:id" element={<ReservationDetails />} />
            {/* Perfil del usuario y administración con control de rol. */}
            <Route path="perfil" element={<Profile />} />
            <Route path="admin" element={<Admin />} />
            {/* Respuesta para direcciones que no corresponden a una página. */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </App>
    </BrowserRouter>
  </StrictMode>,
);
