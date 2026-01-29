# Guía de Reconstrucción: Dashboard Mantenimiento ACONTC 2025

Este documento resume la estructura técnica, las decisiones de diseño y el prompt optimizado para replicar este dashboard de forma instantánea en el futuro.

## 🏗️ Estructura del Proyecto

1.  **Tecnologías**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Chart.js (CDN).
2.  **Concepto Visual**: "Glassmorphism" con tema oscuro profundo, gradientes vibrantes y tipografía Inter.
3.  **Procesamiento**: Lector de CSV integrado que maneja comillas y limpia formatos de precio (pesos argentinos).

---

## 📝 Paso a Paso del Desarrollo

1.  **Carga de Datos**: Implementación de un parser de CSV personalizado para leer archivos directamente del navegador o de una URL local (`data.csv`).
2.  **Limpieza de Datos**: Función `parsePrice` para limpiar strings como "$ 1.250.000,00" y convertirlos a números operables.
3.  **Filtrado Dinámico**: Sistema de dos niveles (Período de tiempo + Año del ticket) que filtra todos los componentes del dashboard simultáneamente.
4.  **Gráficos (Chart.js)**:
    - **Línea**: Evolución de tickets y facturación por mes.
    - **Dona**: Distribución por grupos operativos (con filtrado de grupos combinados).
    - **Barras**: Comparativa Emergencias vs Presupuestos.
    - **Barras Apiladas**: Estados finales administrativos por grupo.
5.  **Tabla de Tiendas**: Sistema de ordenamiento de mayor a menor con buscador integrado.
6.  **Tooltips**: Inyección de lógica personalizada para mostrar múltiples datos (Tickets + Facturación) al pasar el cursor.

---

## ⚡ El "Super Prompt" (Copia y Pesta para la próxima)

Usa este prompt exacto para obtener este resultado de inmediato:

> **Actúa como un experto en Data Visualization y Frontend Senior.**
>
> **Objetivo**: Crear un dashboard de mantenimiento interactivo llamado "Mantenimiento ACONTC 2025" basado en un CSV con estas columnas: `FECHA CT, NUMERO TICKET, TIPO VISITA, GRUPO, ESTADO, PRECIO, ESTADO FINAL, ID TIENDA, LOCALIDAD`.
>
> **Diseño**: 
> - Estilo "Premium Dark Mode" con glassmorphism (fondos azul muy oscuro, tarjetas con borde sutil y fondo translúcido).
> - Gradientes para los acentos de color. Fuente: Inter (Google Fonts).
> - Responsive total.
>
> **Lógica y Filtros**:
> 1. Carga automática de `data.csv` y opción de subir CSV manualmente.
> 2. Dos Selectores en el header: 
>    - Período (Todo, Último mes, Trimestre, Semestre).
>    - Año (Generado dinámicamente según los años encontrados en el CSV).
> 3. Limpiar precios de formato argentino ($ 1.253.000,00) a números.
>
> **Visualizaciones**:
> 1. **KPIs**: Facturación Total (formato pesos), Total Tickets, Emergencias (con su valor), Presupuestos (con su valor) y Tiendas Activas.
> 2. **Gráfico de Línea**: Evolución de tickets y facturación mes a mes.
> 3. **Gráfico de Dona**: Distribución de tickets por GRUPO. **IMPORTANTE**: Filtrar para que solo muestre grupos individuales (G-ALEXIS, G-MANU, G-JOSE, G-NAZA, G-SOCKO), excluyendo combinaciones.
> 4. **Tooltips**: Todos los gráficos deben mostrar cantidad de TICKETS Y FACTURACIÓN en el hover.
> 5. **Tabla**: Listado de tiendas ordenado de mayor a menor tickets, con buscador, localidad, cantidad de tickets por tipo y barra de progreso.
>
> **Entregables**: Dame el `index.html`, `styles.css` y `app.js` en archivos separados que funcionen en conjunto desde un servidor local.

---

## 💡 Consejos para la próxima vez
- **Nombre del archivo**: Siempre asegúrate de que el CSV se llame `data.csv` o cámbialo en la línea de carga de `app.js`.
- **Bibliotecas**: Chart.js es la mejor opción para este tipo de interacción rápida sin sobrecargar la página.
- **Iconos**: Se usaron Emojis nativos para minimizar la carga de dependencias externas.
