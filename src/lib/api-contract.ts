// Contrato verificado con /api/docs.json el 2026-10-02.
// Cambia las rutas del servidor aquí, no en cada componente.
// Las rutas son relativas a la base de la API; las llamadas autenticadas envían un token Bearer.
// Los componentes usan claves lógicas (packages, login), no URLs concretas del servidor.
// Así, un cambio de ruta se concentra en este archivo y no en cada pantalla.
export const ENDPOINT = {
  PACKAGES: 'packages', PACKAGE: 'package', CATEGORIES: 'categories', HOTELS: 'hotels',
  LOGIN: 'login', REGISTER: 'register', ME: 'me', RESERVE: 'reserve', ITINERARY: 'itinerary',
  RESERVATIONS: 'reservations', RESERVATION: 'reservation', CANCEL: 'cancel',
  REVIEWS: 'reviews', CREATE_REVIEW: 'createReview', EDIT_REVIEW: 'editReview', DELETE_REVIEW: 'deleteReview',
  DEMO_PAYMENT: 'demoPayment',
  UPDATE_PROFILE: 'updateProfile', CREATE_CATEGORY: 'createCategory', CREATE_HOTEL: 'createHotel',
  CREATE_PACKAGE: 'createPackage', DELETE_PACKAGE: 'deletePackage', CREATE_ITINERARY: 'createItinerary', ADJUST_CAPACITY: 'adjustCapacity',
} as const;
// Deriva las claves admitidas de las constantes para detectar endpoints mal escritos al compilar.
export type Endpoint = typeof ENDPOINT[keyof typeof ENDPOINT];

// verified deshabilita globalmente el contrato; una ruta null deshabilita solo esa operación.
// Esta bandera es configuración local, no una comprobación de disponibilidad del servidor.
export const apiContract: { verified: boolean; endpoints: Record<Endpoint, string | null> } = {
  verified: true,
  endpoints: {
    // Catálogo público y autenticación. apiRequest antepone la base configurada (por defecto, /api).
    packages: '/paquetes', package: '/paquetes/:id', categories: '/categorias', hotels: '/hoteles',
    login: '/auth/login', register: '/auth/registro', me: '/auth/me', reserve: '/reservas', reservations: '/reservas',
    // Los marcadores :id y :packageId se sustituyen con RequestOptions.params.
    reservation: '/reservas/:id', cancel: '/reservas/:id/cancelar', itinerary: '/paquetes/:id/itinerario',
    reviews: '/paquetes/:packageId/resenas', createReview: '/paquetes/:packageId/resenas', editReview: '/resenas/:id', deleteReview: '/resenas/:id',
    // Compartir una ruta no implica compartir la operación: cada llamada indica su método HTTP.
    demoPayment: '/reservas/:id/pagos', updateProfile: '/usuarios/:id', createCategory: '/categorias', createHotel: '/hoteles', createPackage: '/paquetes',
    deletePackage: '/paquetes/:id', createItinerary: '/paquetes/:packageId/itinerario', adjustCapacity: '/paquetes/:packageId/cupos',
  },
};
