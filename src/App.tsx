import { Suspense, type ReactNode } from 'react';
import { AuthProvider } from './lib/auth';

// Infraestructura compartida: sesión y carga de páginas. No contiene secciones visuales.
// Las llamadas a las páginas y componentes principales están en main.tsx.
export default function App({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="route-loading" role="status">Preparando tu próximo destino…</div>}>
        {children}
      </Suspense>
    </AuthProvider>
  );
}
