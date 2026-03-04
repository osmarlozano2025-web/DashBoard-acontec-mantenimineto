# Guía para Replicar el Proyecto (Nueva Empresa)

Si deseas crear una aplicación idéntica para otra empresa, sigue estos pasos detallados y utiliza el prompt adjunto.

## Paso 1: Preparar la Base de Datos (Google Sheets)
1. Crea una copia de la hoja de cálculo original.
2. Asegúrate de que los encabezados coincidan con los requeridos:
   - `ID TICKET`
   - `NUMERO TICKET`
   - `ID TIENDA`
   - `MOTIVO`
   - `ESTADO`
   - ... (ver GUIA_IMPORTANTE.md)

## Paso 2: Configurar Google Apps Script
1. En el Sheet, ve a **Extensiones** -> **Apps Script**.
2. Pega el código del script motor (ubicado en las capturas del proyecto).
3. **Importante**: Actualiza la variable `SPREADSHET_ID` con el ID de la nueva hoja de cálculo.
4. Implementa como App Web, ejecutando como "Yo" y con acceso para "Cualquiera".
5. Copia la URL de la implementación.

## Paso 3: Actualizar la Aplicación (React)
1. Abre el archivo `src/hooks/useTickets.js`.
2. Reemplaza la constante `SCRIPT_URL` con la nueva URL obtenida en el paso anterior.
3. En `src/App.jsx`, actualiza el nombre de la marca en `BRAND_NAME` y los usuarios en `allowedUsers`.

---

## Prompt para el Agente IA de Programación
Copia y pega este prompt en tu próxima sesión de chat para replicar la app con ayuda de la IA:

> "Hola, quiero replicar un Dashboard de Tickets basado en el motor AppTicket. Tengo una nueva empresa llamada [NOMBRE_EMPRESA]. 
> 
> Necesito que configures la aplicación para que:
> 1. Use un nuevo Google Script URL: [INSERTAR_URL_AQUI].
> 2. Cambie el nombre de la marca a '[NOMBRE_EMPRESA]'.
> 3. Configure los siguientes usuarios de acceso: [USUARIO_1, USUARIO_2].
> 4. Mantenga el diseño Glassmorphism, los filtros por mes y las estadísticas de 'Total en Sheet'.
> 
> Por favor, verifica que la conexión a la API sea correcta y ajusta los colores principales de la interfaz a un tono que combine con la marca: [COLOR_DESEADO, ej. Azul Navy y Esmeralda]."
