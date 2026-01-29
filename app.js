// Dashboard Mantenimiento ACONTC 2025
let allData = [];
let charts = {};

// Colores para grupos
const groupColors = {
    'G-ALEXIS': '#22c55e',
    'G-MANU': '#f97316',
    'G-JOSE': '#3b82f6',
    'G-NAZA': '#8b5cf6',
    'G-SOCKO': '#06b6d4'
};

// Grupos válidos (individuales, sin combinaciones)
const validGroups = ['G-ALEXIS', 'G-MANU', 'G-JOSE', 'G-NAZA', 'G-SOCKO'];

// Verificar si es un grupo válido (no combinado)
function isValidGroup(grupo) {
    return validGroups.includes(grupo.trim().toUpperCase()) || validGroups.includes(grupo.trim());
}

// Parsear fecha del formato DD/MM/YYYY HH:MM:SS
function parseDate(fechaStr) {
    if (!fechaStr) return null;
    const parts = fechaStr.split(' ')[0].split('/');
    if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
    }
    return null;
}

// Filtrar datos por período
function filterDataByPeriod(data, period) {
    if (period === 'all') return data;

    const now = new Date();
    let startDate;

    if (period === 'month1') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (period === 'month3') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (period === 'month6') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else if (period === '2025') {
        startDate = new Date(2025, 0, 1);
        const endDate = new Date(2025, 11, 31);
        return data.filter(row => {
            const fecha = parseDate(row['FECHA CT']);
            return fecha && fecha >= startDate && fecha <= endDate;
        });
    } else if (period === '2024') {
        startDate = new Date(2024, 0, 1);
        const endDate = new Date(2024, 11, 31);
        return data.filter(row => {
            const fecha = parseDate(row['FECHA CT']);
            return fecha && fecha >= startDate && fecha <= endDate;
        });
    } else {
        return data;
    }

    return data.filter(row => {
        const fecha = parseDate(row['FECHA CT']);
        return fecha && fecha >= startDate;
    });
}

// Filtrar datos por año
function filterDataByYear(data, year) {
    if (year === 'all') return data;
    const yearNum = parseInt(year);
    return data.filter(row => {
        const fecha = parseDate(row['FECHA CT']);
        return fecha && fecha.getFullYear() === yearNum;
    });
}

// Obtener años disponibles en los datos
function getAvailableYears(data) {
    const years = new Set();
    data.forEach(row => {
        const fecha = parseDate(row['FECHA CT']);
        if (fecha) years.add(fecha.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
}

// Poblar el selector de años dinámicamente
function populateYearSelector(data) {
    const selector = document.getElementById('filterYear');
    if (!selector) return;
    const years = getAvailableYears(data);
    selector.innerHTML = '<option value="all">Todos los años</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `Año ${year}`;
        selector.appendChild(option);
    });
}

// Aplicar todos los filtros combinados
function applyAllFilters(data) {
    const period = document.getElementById('filterPeriod').value;
    const year = document.getElementById('filterYear').value;
    let filteredData = filterDataByPeriod(data, period);
    filteredData = filterDataByYear(filteredData, year);
    return filteredData;
}

// Formatear números como pesos argentinos
function formatPesos(value) {
    if (isNaN(value) || value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Parsear precio del CSV
function parsePrice(priceStr) {
    if (!priceStr || priceStr === '') return 0;
    const cleaned = priceStr.toString().replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

// Cargar CSV
async function loadCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = parseCSV(text);
            resolve(data);
        };
        reader.onerror = reject;
        if (file instanceof File) {
            reader.readAsText(file);
        } else {
            fetch(file)
                .then(res => res.text())
                .then(text => resolve(parseCSV(text)))
                .catch(reject);
        }
    });
}

// Parsear CSV
function parseCSV(text) {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVLine(lines[i]);
        if (values.length >= headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].trim().replace(/\r/g, '') : '';
            });
            data.push(row);
        }
    }
    return data;
}

// Parsear línea CSV (maneja comillas)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    return values;
}

// Calcular estadísticas
function calculateStats(data) {
    const stats = {
        totalTickets: data.length,
        totalGasto: 0,
        emergencias: { count: 0, valor: 0 },
        presupuestos: { count: 0, valor: 0 },
        tiendas: new Set(),
        grupos: {},
        estadosOperativos: {},
        estadosFinales: {},
        tiendaStats: {},
        timeline: {}
    };

    data.forEach(row => {
        const precio = parsePrice(row['PRECIO']);
        stats.totalGasto += precio;

        // Tipo de visita
        const tipo = row['TIPO VISITA'] || 'DESCONOCIDO';
        if (tipo.toUpperCase() === 'EMERGENCIA') {
            stats.emergencias.count++;
            stats.emergencias.valor += precio;
        } else if (tipo.toUpperCase() === 'PRESUPUESTO') {
            stats.presupuestos.count++;
            stats.presupuestos.valor += precio;
        }

        // Tiendas
        const tiendaId = row['ID TIENDA'] || 'N/A';
        stats.tiendas.add(tiendaId);

        if (!stats.tiendaStats[tiendaId]) {
            stats.tiendaStats[tiendaId] = {
                id: tiendaId,
                localidad: row['LOCALIDAD'] || 'N/A',
                tickets: 0,
                emergencias: 0,
                presupuestos: 0,
                valor: 0
            };
        }
        stats.tiendaStats[tiendaId].tickets++;
        stats.tiendaStats[tiendaId].valor += precio;
        if (tipo.toUpperCase() === 'EMERGENCIA') {
            stats.tiendaStats[tiendaId].emergencias++;
        } else {
            stats.tiendaStats[tiendaId].presupuestos++;
        }

        // Grupos
        const grupo = row['GRUPO'] || 'SIN GRUPO';
        if (!stats.grupos[grupo]) {
            stats.grupos[grupo] = { count: 0, valor: 0, estados: {} };
        }
        stats.grupos[grupo].count++;
        stats.grupos[grupo].valor += precio;

        // Estados Operativos
        const estadoOp = row['ESTADO'] || 'SIN ESTADO';
        if (!stats.estadosOperativos[estadoOp]) {
            stats.estadosOperativos[estadoOp] = { count: 0, valor: 0 };
        }
        stats.estadosOperativos[estadoOp].count++;
        stats.estadosOperativos[estadoOp].valor += precio;

        // Estados Finales (Administrativos)
        const estadoFinal = row['ESTADO FINAL'] || 'SIN ESTADO';
        if (!stats.estadosFinales[estadoFinal]) {
            stats.estadosFinales[estadoFinal] = { count: 0, valor: 0 };
        }
        stats.estadosFinales[estadoFinal].count++;
        stats.estadosFinales[estadoFinal].valor += precio;

        // Estado por grupo
        if (!stats.grupos[grupo].estados[estadoFinal]) {
            stats.grupos[grupo].estados[estadoFinal] = 0;
        }
        stats.grupos[grupo].estados[estadoFinal]++;

        // Timeline
        const fecha = row['FECHA CT'];
        if (fecha) {
            const parts = fecha.split(' ')[0].split('/');
            if (parts.length >= 3) {
                const month = `${parts[1]}/${parts[2]}`;
                if (!stats.timeline[month]) {
                    stats.timeline[month] = { count: 0, valor: 0 };
                }
                stats.timeline[month].count++;
                stats.timeline[month].valor += precio;
            }
        }
    });

    return stats;
}

// Actualizar KPIs
function updateKPIs(stats) {
    document.getElementById('totalTickets').textContent = stats.totalTickets.toLocaleString('es-AR');
    document.getElementById('totalGasto').textContent = formatPesos(stats.totalGasto);
    document.getElementById('totalEmergencias').textContent = stats.emergencias.count.toLocaleString('es-AR');
    document.getElementById('totalEmergenciasValor').textContent = formatPesos(stats.emergencias.valor);
    document.getElementById('totalPresupuestos').textContent = stats.presupuestos.count.toLocaleString('es-AR');
    document.getElementById('totalPresupuestosValor').textContent = formatPesos(stats.presupuestos.valor);
    document.getElementById('totalTiendas').textContent = stats.tiendas.size;

    // Calcular cambio porcentual (simulado)
    const change = Math.floor(Math.random() * 20) + 1;
    document.getElementById('ticketsChange').textContent = `↑${change}%`;
}

// Actualizar Estados
function updateEstados(stats) {
    // Estados Operativos
    const opContainer = document.getElementById('estadosOperativos');
    opContainer.innerHTML = '';

    Object.entries(stats.estadosOperativos)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([estado, data]) => {
            const item = document.createElement('div');
            item.className = 'estado-item';
            item.innerHTML = `
                <span class="estado-item-name">${estado}</span>
                <span class="estado-item-count">${data.count.toLocaleString('es-AR')}</span>
                <span class="estado-item-value">${formatPesos(data.valor)}</span>
            `;
            opContainer.appendChild(item);
        });

    // Estados Finales (Administrativos)
    const adminContainer = document.getElementById('estadosAdministrativos');
    adminContainer.innerHTML = '';

    Object.entries(stats.estadosFinales)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([estado, data]) => {
            const item = document.createElement('div');
            item.className = 'estado-item';
            item.innerHTML = `
                <span class="estado-item-name">${estado}</span>
                <span class="estado-item-count">${data.count.toLocaleString('es-AR')}</span>
                <span class="estado-item-value">${formatPesos(data.valor)}</span>
            `;
            adminContainer.appendChild(item);
        });
}

// Crear gráfico de línea temporal
function createTimelineChart(stats) {
    const ctx = document.getElementById('timelineChart').getContext('2d');

    const labels = Object.keys(stats.timeline).sort((a, b) => {
        const [mA, yA] = a.split('/');
        const [mB, yB] = b.split('/');
        return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const data = labels.map(l => stats.timeline[l].count);
    const valores = labels.map(l => stats.timeline[l].valor);

    if (charts.timeline) charts.timeline.destroy();

    charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const tickets = data[index];
                            const facturacion = formatPesos(valores[index]);
                            return [`Tickets: ${tickets}`, `Facturación: ${facturacion}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

// Crear gráfico de donut para grupos
function createGroupChart(stats) {
    const ctx = document.getElementById('groupChart').getContext('2d');

    // Filtrar solo grupos válidos (sin combinaciones)
    const grupos = Object.entries(stats.grupos)
        .filter(([grupo]) => isValidGroup(grupo))
        .sort((a, b) => b[1].count - a[1].count);
    const labels = grupos.map(g => g[0]);
    const data = grupos.map(g => g[1].count);
    const valores = grupos.map(g => g[1].valor);
    const colors = labels.map(l => groupColors[l] || '#6b7280');

    if (charts.group) charts.group.destroy();

    charts.group = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const tickets = data[index];
                            const facturacion = formatPesos(valores[index]);
                            return [`Tickets: ${tickets}`, `Facturación: ${facturacion}`];
                        }
                    }
                }
            }
        }
    });

    // Legend
    const legendContainer = document.getElementById('groupLegend');
    legendContainer.innerHTML = labels.map((label, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${colors[i]}"></span>
            <span>${label}</span>
        </div>
    `).join('');
}

// Crear gráfico de barras para tipo de visita
function createTipoChart(stats) {
    const ctx = document.getElementById('tipoChart').getContext('2d');

    const tipoData = [stats.emergencias.count, stats.presupuestos.count];
    const tipoValores = [stats.emergencias.valor, stats.presupuestos.valor];

    if (charts.tipo) charts.tipo.destroy();

    charts.tipo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['EMERGENCIA', 'PRESUPUESTO'],
            datasets: [{
                label: 'Cantidad',
                data: tipoData,
                backgroundColor: ['#f97316', '#8b5cf6'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const tickets = tipoData[index];
                            const facturacion = formatPesos(tipoValores[index]);
                            return [`Tickets: ${tickets}`, `Facturación: ${facturacion}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

// Crear gráfico de grupos por estado
function createGrupoEstadoChart(stats) {
    const ctx = document.getElementById('grupoEstadoChart').getContext('2d');

    // Filtrar solo grupos válidos (sin combinaciones)
    const grupos = Object.keys(stats.grupos).filter(g => isValidGroup(g));
    const estados = [...new Set(Object.values(stats.grupos).flatMap(g => Object.keys(g.estados)))];

    const datasets = estados.map((estado, i) => ({
        label: estado,
        data: grupos.map(g => stats.grupos[g].estados[estado] || 0),
        backgroundColor: `hsl(${i * 60}, 70%, 50%)`,
        borderRadius: 4
    }));

    if (charts.grupoEstado) charts.grupoEstado.destroy();

    charts.grupoEstado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: grupos,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#9ca3af', boxWidth: 12 }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

// Actualizar tabla de tiendas
function updateTiendasTable(stats) {
    const tbody = document.getElementById('tiendasBody');
    tbody.innerHTML = '';

    const tiendas = Object.values(stats.tiendaStats)
        .sort((a, b) => b.tickets - a.tickets);

    const maxTickets = tiendas[0]?.tickets || 1;

    tiendas.forEach((tienda, index) => {
        const row = document.createElement('tr');
        const progress = (tienda.tickets / maxTickets) * 100;

        row.innerHTML = `
            <td><span class="badge">#${index + 1}</span></td>
            <td><strong>${tienda.id}</strong></td>
            <td>${tienda.localidad}</td>
            <td><strong>${tienda.tickets}</strong></td>
            <td><span class="badge badge-emergency">${tienda.emergencias}</span></td>
            <td><span class="badge badge-budget">${tienda.presupuestos}</span></td>
            <td>${formatPesos(tienda.valor)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Búsqueda en tabla
function setupSearch() {
    const searchInput = document.getElementById('searchTienda');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tiendasBody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// Actualizar dashboard
function updateDashboard(data) {
    const stats = calculateStats(data);
    updateKPIs(stats);
    updateEstados(stats);
    createTimelineChart(stats);
    createGroupChart(stats);
    createTipoChart(stats);
    createGrupoEstadoChart(stats);
    updateTiendasTable(stats);

    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('es-AR');
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Configurar upload
    const uploadBtn = document.getElementById('uploadBtn');
    const csvInput = document.getElementById('csvInput');

    uploadBtn.addEventListener('click', () => csvInput.click());

    csvInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            allData = await loadCSV(e.target.files[0]);
            populateYearSelector(allData);
            updateDashboard(allData);
        }
    });

    // Configurar refresh
    document.getElementById('refreshBtn').addEventListener('click', () => {
        if (allData.length > 0) {
            const filteredData = applyAllFilters(allData);
            updateDashboard(filteredData);
        }
    });

    // Configurar filtro de período
    document.getElementById('filterPeriod').addEventListener('change', () => {
        if (allData.length > 0) {
            const filteredData = applyAllFilters(allData);
            updateDashboard(filteredData);
            console.log(`Filtrado, registros: ${filteredData.length}`);
        }
    });

    // Configurar filtro de año
    document.getElementById('filterYear').addEventListener('change', () => {
        if (allData.length > 0) {
            const filteredData = applyAllFilters(allData);
            updateDashboard(filteredData);
            console.log(`Filtrado por año, registros: ${filteredData.length}`);
        }
    });

    // Configurar búsqueda
    setupSearch();

    // Cargar datos por defecto
    try {
        allData = await loadCSV('data.csv');
        populateYearSelector(allData); // Poblar selector de años dinámicamente
        updateDashboard(allData);
        console.log('Datos cargados correctamente:', allData.length, 'registros');
    } catch (error) {
        console.log('Error cargando CSV:', error);
        console.log('Por favor usa el botón "Subir CSV" para cargar el archivo manualmente.');
    }
});
