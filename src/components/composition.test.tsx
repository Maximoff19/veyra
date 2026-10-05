// Pruebas de composición: las secciones se pueden quitar sin perder la estructura ni otras secciones.
// Renderiza sin navegador ni solicitudes reales. Ejecuta con bun test.
import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import App from '../App';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import { Header } from './Header';
import { Footer } from './Footer';
import { Layout } from './Layout';
import * as HomeSections from './HomeSections';

// Montaje equivalente al de main.tsx, con dirección y encabezado/pie seleccionables para cada prueba.
function renderPage(content: ReactNode, { header, footer, path = '/' }: { header?: ReactNode; footer?: ReactNode; path?: string } = {}) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <App>
        <Routes>
          <Route element={<Layout header={header} footer={footer} />}>
            <Route index element={<Home>{content}</Home>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </App>
    </MemoryRouter>,
  );
}

describe('Page composition', () => {
  test('renders every home section in the supplied order', () => {
    const markup = renderPage(<>
      <HomeSections.HeroSection />
      <HomeSections.AboutSection />
      <HomeSections.ValuesSection />
      <HomeSections.DestinationsSection />
      <HomeSections.FeaturedPackagesSection />
      <HomeSections.ExperiencesSection />
      <HomeSections.PlanningSection />
      <HomeSections.PersonalJourneySection />
      <HomeSections.MomentsSection />
    </>);
    const classes = ['hero', 'intro section-container', 'values section-container', 'destinations section-container', 'featured-section', 'experiences section-container', 'planning section-container', 'personal-section', 'moments'];
    let previous = -1;
    for (const className of classes) {
      const position = markup.indexOf(`class="${className}"`);
      expect(position).toBeGreaterThan(previous);
      previous = position;
    }
  });

  test('omits a section when its call is removed and keeps adjacent content', () => {
    const markup = renderPage(<><HomeSections.AboutSection /><HomeSections.PlanningSection /></>);
    expect(markup).toContain('id="nosotros"');
    expect(markup).toContain('id="como-funciona"');
    expect(markup).not.toContain('class="featured-section"');
    expect(markup).not.toContain('class="hero"');
  });

  test('renders shared header and footer when provided', () => {
    const markup = renderPage(<HomeSections.HeroSection />, { header: <Header heroOnHome />, footer: <Footer /> });
    expect(markup).toContain('site-header header-over-hero');
    expect(markup).toContain('class="site-footer"');
    expect(markup).toContain('id="main-content"');
  });

  test('keeps the main landmark and keyboard skip link without header or footer', () => {
    const markup = renderPage(<HomeSections.AboutSection />);
    expect(markup).not.toContain('class="site-header');
    expect(markup).not.toContain('class="site-footer"');
    expect(markup).toContain('href="#main-content"');
    expect(markup).toContain('<main id="main-content">');
  });

  test('supports a normal header on home without the hero section', () => {
    const markup = renderPage(<HomeSections.AboutSection />, { header: <Header /> });
    expect(markup).toContain('class="site-header "');
    expect(markup).not.toContain('header-over-hero');
  });

  test('keeps the fallback page and shared layout on unknown routes', () => {
    const markup = renderPage(null, { path: '/unknown', header: <Header heroOnHome />, footer: <Footer /> });
    expect(markup).toContain('Página no encontrada');
    expect(markup).not.toContain('header-over-hero');
    expect(markup).toContain('class="site-footer"');
  });
});
