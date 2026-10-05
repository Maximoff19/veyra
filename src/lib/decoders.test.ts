// Pruebas del contrato de datos: formatos, precios, imágenes, permisos y pagos de demostración.
import { describe, expect, test } from 'bun:test';
import { decodeDemoPayment, decodeItineraryDay, decodePackage, decodePage, decodeReservation, decodeReservationStatus, decodeReservationSummary, decodeReview, decodeSession, decodeUser } from './decoders';
import { canCancel, reservationPayload } from './domain';

const packageResponse = {
  id_paquete: 37, id_categoria: 9, id_hotel: 43,
  titulo: 'Tour package', descripcion: null, precio: '367.50', stock_cupos: 11,
  fecha_inicio: '2027-10-02', fecha_fin: '2027-10-06',
  nombre_categoria: 'Adventure', nombre_hotel: 'Test hotel', ubicacion: 'Lima', capacidad_disponible_hotel: 21,
};
const userResponse = { id_usuario: 10, nombre: 'Test user', email: 'test@example.com', telefono: null, nombre_rol: 'Administrador' };
const summary = { id_reserva: 20, estado_reserva: 'pendiente', total_pagar: '735.00' };
const item = { id_paquete: 37, cantidad_pasajeros: 2, subtotal: '735.00' };
const payment = { id_pago: 30, id_reserva: 20, monto: '735.00', metodo_pago: 'demo', estado_pago: 'aprobado_demo' };

describe('Verified Swagger decoders', () => {
  test('reads flat package joins and decimal prices without invented image fields', () => {
    const pkg = decodePackage(packageResponse);
    expect(pkg.category?.name).toBe('Adventure');
    expect(pkg.hotel).toEqual({ id: 43, name: 'Test hotel', location: 'Lima', capacity: 21 });
    expect(pkg.pricePerPassenger).toBe(367.5);
    expect(pkg.itinerary).toEqual([]);
    expect(pkg.description).toBe('');
    expect(pkg.imageUrl).toBeNull();
    expect(pkg.imageCredit).toBe('');
    expect(pkg.imageSource).toBeNull();
    expect(pkg.imageLicenseUrl).toBeNull();
  });
  test('reads verified package image URLs and licensing metadata', () => {
    const pkg = decodePackage({ ...packageResponse, imagen_url: 'https://images.example.com/cusco.jpg',
      imagen_credito: 'Example photographer · CC BY 4.0', imagen_fuente: 'https://example.com/photo',
      imagen_licencia_url: 'https://creativecommons.org/licenses/by/4.0/' });
    expect(pkg.imageUrl).toBe('https://images.example.com/cusco.jpg');
    expect(pkg.imageCredit).toBe('Example photographer · CC BY 4.0');
    expect(pkg.imageSource).toBe('https://example.com/photo');
    expect(pkg.imageLicenseUrl).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
  test('rejects unsafe image and attribution URLs without breaking the catalog', () => {
    for (const url of ['javascript:alert(1)', 'data:image/svg+xml,content', 'http://example.com/photo',
      'https://user:password@example.com/photo', '/relative.jpg', 'invalid', null]) {
      const pkg = decodePackage({ ...packageResponse, imagen_url: url, imagen_fuente: url, imagen_licencia_url: url });
      expect(pkg.imageUrl).toBeNull();
      expect(pkg.imageSource).toBeNull();
      expect(pkg.imageLicenseUrl).toBeNull();
    }
  });
  test('decodes itineraries from their separate endpoint', () => {
    expect(decodeItineraryDay({ dia_numero: 1, titulo_actividad: 'Arrival', descripcion_actividad: null }))
      .toEqual({ day: 1, title: 'Arrival', description: '' });
  });
  test('normalizes the server role for existing admin UI gates', () => {
    expect(decodeUser(userResponse).role).toBe('administrador');
    expect(decodeSession({ token: 'test-token', usuario: userResponse }).user.id).toBe(10);
  });
  test('accepts summary-only reservation lists without requiring items or payments', () => {
    expect(decodePage([summary], decodeReservationSummary).items).toEqual([{ id: 20, status: 'pendiente', total: 735 }]);
  });
  test('accepts creation response and never assumes missing payments means no payments', () => {
    const reservation = decodeReservation({ ...summary, items: [item] });
    expect(reservation.items[0].passengers).toBe(2);
    expect(reservation.items[0].subtotal).toBe(735);
    expect(reservation.hasPayment).toBeNull();
    expect(canCancel(reservation)).toBe(false);
  });
  test('reads flat item titles/dates and authorizes cancellation only from verified details', () => {
    const reservation = decodeReservation({ ...summary, items: [{ ...item, titulo: 'Tour package', fecha_inicio: '2027-10-02', fecha_fin: '2027-10-06' }], pagos: [] });
    expect(reservation.items[0].title).toBe('Tour package');
    expect(reservation.items[0].startsAt).toBe('2027-10-02');
    expect(canCancel(reservation)).toBe(true);
  });
  test('reads minimal cancellation confirmation', () => {
    expect(decodeReservationStatus({ id_reserva: 20, estado_reserva: 'cancelada' })).toEqual({ id: 20, status: 'cancelada' });
  });
  test('keeps unknown reservation subtotals unknown instead of estimating them', () => {
    const { subtotal, ...withoutSubtotal } = item;
    expect(decodeReservation({ ...summary, items: [withoutSubtotal], pagos: [] }).items[0].subtotal).toBeNull();
    expect(() => decodeReservation({ ...summary, items: [{ ...item, subtotal: '-2' }], pagos: [] })).toThrow();
  });
  test('reads recorded demo payments and prevents cancellation', () => {
    const reservation = decodeReservation({ ...summary, estado_reserva: 'confirmada', items: [item], pagos: [payment] });
    expect(reservation.payments[0].amount).toBe(735);
    expect(canCancel(reservation)).toBe(false);
    expect(decodeDemoPayment({ ...payment, simulado: true }).status).toBe('aprobado_demo');
  });
  test('rejects payment responses that do not confirm a simulation', () => {
    expect(() => decodeDemoPayment(payment)).toThrow();
    expect(() => decodeDemoPayment({ ...payment, simulado: true, metodo_pago: 'card' })).toThrow();
  });
  test('uses flat public review author names and nullable comments', () => {
    expect(decodeReview({ id_resena: 1, id_usuario: 10, nombre_usuario: 'Test user', calificacion: 5, comentario: null }))
      .toEqual({ id: 1, authorId: 10, authorName: 'Test user', rating: 5, text: '' });
  });
  test('rejects invalid ratings, passenger counts and money', () => {
    expect(() => decodeReview({ id_resena: 1, calificacion: 6 })).toThrow();
    expect(() => decodeReservation({ ...summary, items: [{ ...item, cantidad_pasajeros: 0 }] })).toThrow();
    expect(() => decodePackage({ ...packageResponse, precio: 'invalid' })).toThrow();
  });
  test('sends only server-authorized booking fields', () => {
    expect(reservationPayload([{ id_paquete: 37, cantidad_pasajeros: 2 }])).toEqual({ items: [{ id_paquete: 37, cantidad_pasajeros: 2 }] });
  });
});
