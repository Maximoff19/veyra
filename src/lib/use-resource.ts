// Hook compartido para cargar datos: devuelve datos, carga, error, conexión y reintento.
// Cancela solicitudes al desmontar una sección, por ejemplo al quitarla de main.tsx.
// endpoint selecciona la ruta, decode valida la respuesta, query añade filtros y params sustituye IDs.
import { useEffect, useState } from 'react';
import { apiRequest, errorMessage, hasCapability } from './api';
import type { Endpoint } from './api-contract';

export function useResource<T>(endpoint: Endpoint, decode: (value: unknown) => T, query = '', token?: string, params?: Record<string, string>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: hasCapability(endpoint), error: null });
  // Cambiar revision vuelve a ejecutar la carga sin modificar filtros, ruta ni credenciales.
  const [revision, setRevision] = useState(0);
  // Usa el contenido de params como dependencia, no la referencia de un objeto nuevo en cada render.
  const paramsKey = JSON.stringify(params ?? {});
  useEffect(() => {
    // No realiza solicitudes para operaciones deshabilitadas en el contrato.
    if (!hasCapability(endpoint)) return;
    const controller = new AbortController();
    // Mantiene los datos anteriores durante una recarga y también si la nueva solicitud falla.
    setState(previous => ({ data: previous.data, loading: true, error: null }));
    apiRequest(endpoint, decode, { query: new URLSearchParams(query), token, signal: controller.signal, params: JSON.parse(paramsKey) as Record<string, string> })
      // Ignora resultados de cargas canceladas para que no sobrescriban una consulta más reciente.
      .then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState(previous => ({ data: previous.data, loading: false, error: errorMessage(error) })); });
    // React limpia el efecto al desmontar o al cambiar sus dependencias; cancela la carga anterior.
    return () => controller.abort();
  }, [endpoint, decode, query, token, paramsKey, revision]);
  // connected indica configuración habilitada, no una comprobación en vivo de conexión al servidor.
  return { ...state, connected: hasCapability(endpoint), reload: () => setRevision(value => value + 1) };
}
