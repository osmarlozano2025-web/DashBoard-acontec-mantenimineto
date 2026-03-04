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

## Código de Google Apps Script (Versión Potenciada)
Usa este código en tu Google Script para que el Dashboard funcione al 100%, incluyendo la búsqueda automática de fotos:

```javascript
const SPREADSHEET_ID = 'TU_ID_DE_SHEET_AQUÍ';

function doGet(e) {
  // --- BUSCADOR AUTOMÁTICO DE FOTOS ---
  if (e.parameter.action === 'resolve') {
    const fileName = e.parameter.path;
    const nameOnly = fileName.split('/').pop();
    const files = DriveApp.getFilesByName(nameOnly);
    
    if (files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({ id: files.next().getId() }))
             .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ error: 'No encontrado' }))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // --- LECTORA DE DATOS DEL SHEET ---
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('TIENDAS ESTADO');
  if (!sheet) sheet = ss.getSheets()[0];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const json = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(json))
         .setMimeType(ContentService.MimeType.JSON);
}
```

## Usuarios de Acceso
Los usuarios están configurados en el archivo `src/App.jsx`. Para añadir o quitar personal, se debe modificar el array `allowedUsers`.
