// Solo permite volver a rutas internas de paquetes o reservas después del inicio de sesión.
// Conserva esta validación para evitar redirecciones a sitios externos.
export function safeNextPath(value: string | null): string {
  if (!value || !/^\/(paquetes|reservas)(\/[^?#]*)?(\?[^#]*)?$/.test(value) || value.includes('\\')) return '/reservas';
  return value;
}
