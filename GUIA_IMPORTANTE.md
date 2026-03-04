# Guía Importante y Configuración

Aquí se detalla información crítica para el correcto funcionamiento y mantenimiento del Dashboard.

## Configuración de los Datos (Google Sheets)
Los datos se cargan desde una hoja de cálculo. Para que la app funcione, el Sheet debe tener las siguientes columnas (encabezados) exactos:
- `ID TICKET`, `NUMERO TICKET`, `ID TIENDA`, `MOTIVO`, `ESTADO`, `ESTADO FINAL`, `ESTADO_OPERATIVO`, `GRUPO`, `PRECIO`, `LOCALIDAD`, `PROVINCIA`, `PENDIENTES`, `TIPO DE OBRA`, `FECHA CT`.

## Puntos Críticos de Mantenimiento
1. **Google Apps Script**:
   - Cada vez que realices un cambio en el script de Google, debes hacer una **Nueva Implementación** (New Deployment).
   - El acceso debe estar configurado como **"Cualquiera" (Anyone)** para evitar errores de CORS.
2. **Cierre de Sesión**: La autenticación es por sesión. Al recargar la página o cerrar el explorador, los usuarios deberán ingresar sus credenciales nuevamente.
3. **Imágenes**: La app resuelve imágenes mediante IDs de Google Drive. Asegúrate de que las fotos en el Sheet tengan el formato de ruta o ID correcto que el script pueda interpretar.

## Usuarios de Acceso
Los usuarios están configurados en el archivo `src/App.jsx`. Para añadir o quitar personal, se debe modificar el array `allowedUsers`.
