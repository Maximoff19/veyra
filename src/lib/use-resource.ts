// Hook compartido para cargar datos: devuelve datos, carga, error, conexión y reintento.
// Cancela solicitudes al desmontar una sección, por ejemplo al quitarla de main.tsx.
import { useEffect, useState } from 'react';
import { apiRequest, errorMessage, hasCapability } from './api';
import type { Endpoint } from './api-contract';

export function useResource<T>(endpoint: Endpoint, decode: (value: unknown) => T, query = '', token?: string, params?: Record<string, string>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: hasCapability(endpoint), error: null });
  const [revision, setRevision] = useState(0);
  const paramsKey = JSON.stringify(params ?? {});
  useEffect(() => {
    if (!hasCapability(endpoint)) return;
    const controller = new AbortController();
    setState(previous => ({ data: previous.data, loading: true, error: null }));
    apiRequest(endpoint, decode, { query: new URLSearchParams(query), token, signal: controller.signal, params: JSON.parse(paramsKey) as Record<string, string> })
      .then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState(previous => ({ data: previous.data, loading: false, error: errorMessage(error) })); });
    return () => controller.abort();
  }, [endpoint, decode, query, token, paramsKey, revision]);
  return { ...state, connected: hasCapability(endpoint), reload: () => setRevision(value => value + 1) };
}
