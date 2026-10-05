import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Contenedor del inicio: las secciones y su orden se definen en main.tsx.
// Conserva la navegación a enlaces como /#experiencias aunque las secciones sean independientes.
export default function Home({ children }: { children: ReactNode }) {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
  }, [hash]);
  return <>{children}</>;
}
