// Contrato verificado con /api/docs.json el 2026-10-02.
// Cambia las rutas del servidor aquí, no en cada componente.
// Las rutas son relativas a la base de la API; las llamadas autenticadas envían un token Bearer.
export const ENDPOINT = {
  PACKAGES: 'packages', PACKAGE: 'package', CATEGORIES: 'categories', HOTELS: 'hotels',
  LOGIN: 'login', REGISTER: 'register', ME: 'me', RESERVE: 'reserve', ITINERARY: 'itinerary',
  RESERVATIONS: 'reservations', RESERVATION: 'reservation', CANCEL: 'cancel',
  REVIEWS: 'reviews', CREATE_REVIEW: 'createReview', EDIT_REVIEW: 'editReview', DELETE_REVIEW: 'deleteReview',
  DEMO_PAYMENT: 'demoPayment',
  UPDATE_PROFILE: 'updateProfile', CREATE_CATEGORY: 'createCategory', CREATE_HOTEL: 'createHotel',
  CREATE_PACKAGE: 'createPackage', CREATE_ITINERARY: 'createItinerary', ADJUST_CAPACITY: 'adjustCapacity',
} as const;
export type Endpoint = typeof ENDPOINT[keyof typeof ENDPOINT];

export const apiContract: { verified: boolean; endpoints: Record<Endpoint, string | null> } = {
  verified: true,
  endpoints: {
    packages: '/paquetes', package: '/paquetes/:id', categories: '/categorias', hotels: '/hoteles',
    login: '/auth/login', register: '/auth/registro', me: '/auth/me', reserve: '/reservas', reservations: '/reservas',
    reservation: '/reservas/:id', cancel: '/reservas/:id/cancelar', itinerary: '/paquetes/:id/itinerario',
    reviews: '/paquetes/:packageId/resenas', createReview: '/paquetes/:packageId/resenas', editReview: '/resenas/:id', deleteReview: '/resenas/:id',
    demoPayment: '/reservas/:id/pagos', updateProfile: '/usuarios/:id', createCategory: '/categorias', createHotel: '/hoteles', createPackage: '/paquetes',
    createItinerary: '/paquetes/:packageId/itinerario', adjustCapacity: '/paquetes/:packageId/cupos',
  },
};
