// Solo permite volver a rutas internas de paquetes o reservas después del inicio de sesión.
// Conserva esta validación para evitar redirecciones a sitios externos.
// Se aplica al destino de retorno recibido por URL, que puede haber sido manipulado por un usuario.
export function safeNextPath(value: string | null): string {
  // La lista permitida admite subrutas y consultas, pero no fragmentos, barras invertidas ni otros destinos.
  // Si el valor falta o no coincide, dirige a /reservas como ruta interna predeterminada.
  if (!value || !/^\/(paquetes|reservas)(\/[^?#]*)?(\?[^#]*)?$/.test(value) || value.includes('\\')) return '/reservas';
  return value;
}
