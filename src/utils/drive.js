/**
 * Función mock para obtener URLs de imágenes
 * Si la URL no es válida, retorna una cadena vacía o una imagen de prueba.
 */
export const getImageUrl = (url) => {
    if (!url) return null;

    // Si ya es un enlace directo normal o de Drive válido que la app maneja
    if (typeof url === 'string') {
        if (url.startsWith('http') || url.startsWith('https')) {
            return url;
        }
    }

    // Retorna una imagen placeholder confiable para las pruebas visuales
    return 'https://via.placeholder.com/300x200?text=Mock+Image';
};
