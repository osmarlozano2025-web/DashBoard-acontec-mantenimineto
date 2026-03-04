/**
 * Función para obtener URLs de imágenes de Google Drive de forma directa.
 * Detecta IDs de archivos y URLs compartidas de Drive.
 */
export const getImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    // 1. Limpiar espacios
    const cleanUrl = url.trim();

    // 2. Si ya es una URL directa de imagen (no Drive)
    if (cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) && !cleanUrl.includes('drive.google.com')) {
        return cleanUrl;
    }

    // 3. Extraer ID de Google Drive
    let driveId = null;

    // Patrones comunes de Drive
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]{25,})\//,     // URL de visualización
        /id=([a-zA-Z0-9_-]{25,})/,              // URL de apertura
        /^([a-zA-Z0-9_-]{25,})$/                // Solo el ID
    ];

    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
            driveId = match[1];
            break;
        }
    }

    // Si encontramos un ID, usamos el endpoint de previsualización de Google
    if (driveId) {
        return `https://lh3.googleusercontent.com/d/${driveId}`;
    }

    // Si no es nada de lo anterior, retornamos null para que PhotoCard maneje el error o placeholder
    return null;
};
