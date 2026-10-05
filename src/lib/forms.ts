// Definición de campos administrativos: cambia etiquetas, ayudas y campos en adminForms.
// Los controles usan estilos compartidos; puedes añadir reglas de .admin-form en styles.css.
import type { EntityId, User } from './domain';
import type { Endpoint } from './api-contract';

export const FORM_KIND = { CATEGORY: 'category', HOTEL: 'hotel', PACKAGE: 'package', ITINERARY: 'itinerary', CAPACITY: 'capacity' } as const;
export type FormKind = typeof FORM_KIND[keyof typeof FORM_KIND];
export const INPUT = { TEXT: 'text', NUMBER: 'number', DATE: 'date', TEXTAREA: 'textarea', CATEGORY: 'category-select', HOTEL: 'hotel-select' } as const;
type InputType = typeof INPUT[keyof typeof INPUT];
export interface FormField {
  name: string;
  label: string;
  type: InputType;
  required: boolean;
  integer?: boolean;
  defaultValue?: string;
  help: string;
}
interface AdminFormDefinition { title: string; endpoint: Endpoint; fields: FormField[] }
export const adminForms: Record<FormKind, AdminFormDefinition> = {
  category: {
    title: 'Categorías', endpoint: 'createCategory', fields: [
      { name: 'nombre_categoria', label: 'Nombre de la categoría', type: INPUT.TEXT, required: true, help: 'Texto obligatorio, no puede quedar vacío.' },
      { name: 'descripcion', label: 'Descripción (opcional)', type: INPUT.TEXTAREA, required: false, help: 'Texto opcional.' },
    ],
  },
  hotel: {
    title: 'Hoteles', endpoint: 'createHotel', fields: [
      { name: 'nombre', label: 'Nombre del hotel', type: INPUT.TEXT, required: true, help: 'Texto obligatorio.' },
      { name: 'ubicacion', label: 'Ubicación', type: INPUT.TEXT, required: true, help: 'Texto obligatorio.' },
      { name: 'capacidad_disponible', label: 'Capacidad disponible', type: INPUT.NUMBER, required: false, defaultValue: '0', help: 'Número. Si se omite, el servidor utiliza 0. No representa un inventario de habitaciones.' },
    ],
  },
  package: {
    title: 'Paquetes', endpoint: 'createPackage', fields: [
      { name: 'id_categoria', label: 'Categoría', type: INPUT.CATEGORY, required: true, help: 'Selecciona una categoría existente del catálogo del servidor.' },
      { name: 'id_hotel', label: 'Hotel asociado', type: INPUT.HOTEL, required: true, help: 'Selecciona un hotel existente.' },
      { name: 'titulo', label: 'Título del paquete', type: INPUT.TEXT, required: true, help: 'Texto obligatorio.' },
      { name: 'descripcion', label: 'Descripción (opcional)', type: INPUT.TEXTAREA, required: false, help: 'Texto opcional.' },
      { name: 'precio', label: 'Precio por pasajero', type: INPUT.NUMBER, required: true, help: 'Número decimal. La moneda no fue especificada en el contrato.' },
      { name: 'stock_cupos', label: 'Cupos disponibles', type: INPUT.NUMBER, required: true, integer: true, help: 'Número entero. Las restricciones adicionales las valida el servidor.' },
      { name: 'fecha_inicio', label: 'Fecha de inicio', type: INPUT.DATE, required: true, help: 'Fecha válida en formato YYYY-MM-DD.' },
      { name: 'fecha_fin', label: 'Fecha de fin', type: INPUT.DATE, required: true, help: 'Fecha válida YYYY-MM-DD, igual o posterior a la fecha de inicio.' },
    ],
  },
  itinerary: {
    title: 'Itinerarios', endpoint: 'createItinerary', fields: [
      { name: 'dia_numero', label: 'Número de día', type: INPUT.NUMBER, required: true, integer: true, help: 'Número entero.' },
      { name: 'titulo_actividad', label: 'Título de la actividad', type: INPUT.TEXT, required: true, help: 'Texto obligatorio.' },
      { name: 'descripcion_actividad', label: 'Descripción de la actividad (opcional)', type: INPUT.TEXTAREA, required: false, help: 'Texto opcional.' },
    ],
  },
  capacity: {
    title: 'Ajustar cupos', endpoint: 'adjustCapacity', fields: [
      { name: 'ajuste', label: 'Ajuste de cupos', type: INPUT.NUMBER, required: true, integer: true, help: 'Entero distinto de 0. Los valores negativos reducen los cupos.' },
    ],
  },
};

// Valida y selecciona únicamente los campos admitidos para la operación administrativa.
export function adminPayload(kind: FormKind, data: FormData, ids: Record<string, EntityId> = {}) {
  const payload: Record<string, string | number> = {};
  for (const field of adminForms[kind].fields) {
    const raw = String(data.get(field.name) ?? '').trim();
    if (!raw) {
      if (field.required) throw new Error(`Completa el campo «${field.label}».`);
      continue;
    }
    if (field.type === INPUT.CATEGORY || field.type === INPUT.HOTEL) {
      if (ids[field.name] === undefined || String(ids[field.name]) !== raw) throw new Error(`Selecciona un valor existente para «${field.label}».`);
      payload[field.name] = ids[field.name];
    } else if (field.type === INPUT.NUMBER) {
      const value = Number(raw);
      if (!Number.isFinite(value) || (field.integer && !Number.isSafeInteger(value))) throw new Error(`«${field.label}» debe ser un número ${field.integer ? 'entero' : 'válido'}.`);
      if (field.name === 'ajuste' && value === 0) throw new Error('El ajuste de cupos debe ser distinto de 0.');
      payload[field.name] = value;
    } else if (field.type === INPUT.DATE) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || !Number.isFinite(Date.parse(raw)) || new Date(raw).toISOString().slice(0, 10) !== raw) throw new Error(`«${field.label}» debe tener una fecha válida YYYY-MM-DD.`);
      payload[field.name] = raw;
    } else payload[field.name] = raw;
  }
  if (kind === FORM_KIND.PACKAGE && String(payload.fecha_fin) < String(payload.fecha_inicio)) throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
  return payload;
}
// Envía solo los datos personales modificados; el teléfono vacío se transforma en null.
export function profilePayload(data: FormData, previous: User) {
  const payload: Record<string, string | null> = {};
  const nombre = String(data.get('nombre') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const telefono = String(data.get('telefono') ?? '').trim() || null;
  if (nombre !== previous.name) {
    if (!nombre) throw new Error('El nombre no puede quedar vacío.');
    payload.nombre = nombre;
  }
  if (email !== previous.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo electrónico válido.');
    payload.email = email;
  }
  if (telefono !== previous.phone) payload.telefono = telefono;
  if (!Object.keys(payload).length) throw new Error('Modifica al menos uno de estos campos: nombre, correo electrónico o teléfono.');
  return payload;
}
