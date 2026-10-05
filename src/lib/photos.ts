// Cambia aquí las fotografías editoriales del inicio y del formulario de acceso.
// Estas imágenes son inspiración, no inventario reservable; las fotos de paquetes llegan del servidor.
const image = (id: string, width: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const photos = {
  hero: image('photo-1464822759023-fed622ff2c3b', 2400),
  hiker: image('photo-1551632811-561732d1e306', 1000),
  mountain: image('photo-1454496522488-7a8e488e8606', 1000),
  santorini: image('photo-1613395877344-13d4a8e0d49e', 1000),
  bali: image('photo-1537996194471-e657df975ab4', 1000),
  coast: image('photo-1516483638261-f4dbaf036963', 1000),
  beach: image('photo-1519046904884-53103b34b206', 1000),
};
// Cambia aquí nombres, descripciones y búsquedas de las tarjetas de destinos de inspiración.
export const inspirations = [
  { name: 'Santorini', region: 'Grecia · Islas del Egeo', image: photos.santorini, description: 'El Mediterráneo, sin prisa.', search: 'Santorini' },
  { name: 'Bali', region: 'Indonesia · Sudeste asiático', image: photos.bali, description: 'Un encuentro con lo extraordinario.', search: 'Bali' },
  { name: 'Los Alpes', region: 'Europa · Naturaleza en estado puro', image: photos.mountain, description: 'Un poco más cerca del cielo.', search: 'Alpes' },
];
