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
3. **Imágenes**: La app resuelve imágenes mediante IDs de Google Drive. 
   > [!IMPORTANT]
   > **PERMISOS DE DRIVE**: Para que las fotos se vean en el Dashboard, la carpeta donde guardas las fotos en Google Drive DEBE estar compartida como **"Cualquier persona con el enlace puede ver"**. Si la carpeta es privada, la app no podrá mostrar la imagen aunque encuentre el archivo.

## Código de Google Apps Script (VERSIÓN FINAL)
Copia este código y reemplaza **TODO** el contenido de tu script actual. Luego, dale a **Implementar -> Nueva implementación** (esto es clave).

```javascript
const SPREADSHEET_ID = 'TU_ID_DE_SHEET_AQUÍ';

function doGet(e) {
  // --- PRUEBA DE CONEXIÓN ---
  if (e.parameter.action === 'test') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'OK', message: 'El script está funcionando correctamente.' }))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // --- BUSCADOR DE FOTOS ---
  if (e.parameter.action === 'resolve') {
    const fullPath = e.parameter.path;
    // Extraemos solo el nombre del archivo (ej: foto.jpg) por si viene con carpetas
    const fileName = fullPath.split('/').pop().split('\\').pop();
    
    const files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      return ContentService.createTextOutput(JSON.stringify({ id: files.next().getId() }))
             .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Archivo "' + fileName + '" no encontrado en tu Drive.' }))
           .setMimeType(ContentService.MimeType.JSON);
  }

  // --- LECTURA DE TICKETS (Dashboard) ---
  try {
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
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
           .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 🛑 Cómo verificar que el script funciona
Una vez que hayas hecho la **Nueva Implementación**, copia la URL que te da Google y pégala en tu navegador agregando `?action=test` al final.

**Ejemplo:**
`https://script.google.com/macros/s/XXXXX/exec?action=test`

Si ves un mensaje que dice `{"status":"OK"...}`, entonces el script está bien. Si no, revisa los permisos (debe ser "Cualquiera").

## Usuarios de Acceso
Los usuarios están configurados en el archivo `src/App.jsx`. Para añadir o quitar personal, se debe modificar el array `allowedUsers`.
