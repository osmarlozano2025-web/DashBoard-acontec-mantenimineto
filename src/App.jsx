import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Maximize2,
  Calendar,
  DollarSign,
  Briefcase,
  Store,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Share2,
  FileText,
  Mail,
  Download
} from 'lucide-react';
import { useTickets, SCRIPT_URL } from './hooks/useTickets';
import ReactApexChart from 'react-apexcharts';
import { format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { getImageUrl } from './utils/drive';

// Perfil del Dashboard
// Perfil del Dashboard
const BRAND_NAME = "APPTICKET";

// Helper para formatear fechas de forma segura (soporta ISO y strings locales)
const safeFormatDate = (dateStr) => {
  if (!dateStr || String(dateStr).toLowerCase() === 'pendiente') return 'Pendiente';
  try {
    // Si ya es un objeto Date
    if (dateStr instanceof Date) return format(dateStr, 'PPP', { locale: es });

    // Intentar parseo manual básico para evitar crashes de date-fns
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return format(d, 'PPP', { locale: es });
    }

    // Si es un ISO string específico
    const iso = parseISO(String(dateStr));
    if (!isNaN(iso.getTime())) {
      return format(iso, 'PPP', { locale: es });
    }

    return String(dateStr); // Retornar tal cual si no se puede formatear
  } catch (e) {
    console.error("Error formateando fecha:", dateStr, e);
    return String(dateStr);
  }
};

const PhotoCard = ({ label, url }) => {
  const [imgError, setImgError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const resolve = async () => {
      if (!url) {
        setResolvedUrl(null);
        return;
      }

      const rawUrl = getImageUrl(url);
      if (rawUrl && rawUrl.includes('lh3.googleusercontent.com')) {
        if (isMounted) {
          setResolvedUrl(rawUrl);
          setResolving(false);
          setImgError(false);
        }
        return;
      }

      if (typeof url === 'string' && (url.startsWith('/') || url.includes('/'))) {
        if (isMounted) setResolving(true);
        try {
          const fetchUrl = `${SCRIPT_URL}?action=resolve&path=${encodeURIComponent(url)}`;
          const res = await fetch(fetchUrl);
          const data = await res.json();
          if (isMounted) {
            if (data && data.id) {
              setResolvedUrl(`https://lh3.googleusercontent.com/d/${data.id}`);
              setImgError(false);
            } else {
              setImgError(true);
            }
          }
        } catch {
          if (isMounted) setImgError(true);
        } finally {
          if (isMounted) setResolving(false);
        }
      } else {
        if (isMounted) {
          setResolvedUrl(rawUrl);
          setImgError(!rawUrl);
        }
      }
    };

    resolve();
    return () => { isMounted = false; };
  }, [url, label]);

  return (
    <div className="photo-card vertical-photo">
      {resolving ? (
        <div className="photo-placeholder">
          <div className="spinner" style={{ width: '24px', height: '24px', marginBottom: '10px' }}></div>
          <span style={{ fontSize: '0.7rem' }}>Buscando foto...</span>
        </div>
      ) : resolvedUrl && !imgError ? (
        <>
          <img
            src={resolvedUrl}
            alt={label}
            onError={() => setImgError(true)}
            onClick={() => window.open(resolvedUrl, '_blank')}
          />
          <div className="photo-actions">
            <button className="expand-btn" onClick={() => window.open(resolvedUrl, '_blank')}>
              <Maximize2 size={14} /> Ver en grande
            </button>
          </div>
        </>
      ) : (
        <div className="photo-placeholder">
          <ImageIcon size={32} />
          <span style={{ fontWeight: 600, color: '#ff4444', fontSize: '0.8rem' }}>
            {imgError ? 'Imagen No Encontrada' : `Sin ${label}`}
          </span>
          {url && (
            <div style={{ marginTop: '8px', padding: '0 10px', width: '100%', overflow: 'hidden' }}>
              <p style={{ fontSize: '0.55rem', opacity: 0.6 }}>Ruta:</p>
              <code style={{ fontSize: '0.5rem', wordBreak: 'break-all', display: 'block', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '4px' }}>
                {String(url)}
              </code>
            </div>
          )}
        </div>
      )}
      <div className="photo-label">{label}</div>
    </div>
  );
};

const App = () => {
  const { data, loading, error } = useTickets();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCredentials, setUserCredentials] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    estado: 'TODOS',
    tienda: 'TODOS',
    obra: 'TODOS',
    localidad: 'TODOS',
    provincia: 'TODOS',
    mes: 'TODOS'
  });
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Usuarios permitidos (esto es lo que simularíamos en Configuración)
  const allowedUsers = [
    { name: 'Nazareno Lozano', user: 'Naza', pass: 'Naza2026' },
    { name: 'Agustín', user: 'Agus', pass: 'Agus2026' },
    { name: 'Administrador', user: 'Admin', pass: 'Admin123' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const found = allowedUsers.find(u => u.user === userCredentials.user && u.pass === userCredentials.pass);
    if (found) {
      setIsAuthenticated(found);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos');
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch =
        String(item['NUMERO TICKET']).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item['MOTIVO']).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(item['DIRECCION']).toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filters.estado === 'TODOS' ||
        (activeTab === 'admin' ? item['ESTADO FINAL'] : (item['ESTADO'] || item['ESTADO_OPERATIVO'])) === filters.estado;
      const matchesTienda = filters.tienda === 'TODOS' || item['ID TIENDA'] === filters.tienda;
      const matchesObra = filters.obra === 'TODOS' || (item['PENDIENTES'] || item['TIPO DE OBRA']) === filters.obra;
      const matchesLocalidad = filters.localidad === 'TODOS' || item['LOCALIDAD'] === filters.localidad;
      const matchesProvincia = filters.provincia === 'TODOS' || item['PROVINCIA'] === filters.provincia;

      const ticketDate = item['FECHA CT'] ? parseISO(item['FECHA CT']) : null;
      const ticketMonth = ticketDate && !isNaN(ticketDate.getTime()) ? format(ticketDate, 'yyyy-MM') : null;
      const matchesMes = filters.mes === 'TODOS' || ticketMonth === filters.mes;

      return matchesSearch && matchesEstado && matchesTienda && matchesObra && matchesLocalidad && matchesProvincia && matchesMes;
    });
  }, [data, searchTerm, filters, activeTab]);

  // --- ESTADÍSTICAS ---
  const stats = useMemo(() => {
    const total = filteredData.length;

    // Filtros flexibles para NUEVA, EN PROCESO, TERMINADAS
    const nuevas = filteredData.filter(t => {
      const val = String(t.ESTADO || t.ESTADO_OPERATIVO || '').toUpperCase().trim();
      return val === 'NUEVA' || val === 'NUEVAS';
    }).length;

    const enProceso = filteredData.filter(t => {
      const val = String(t.ESTADO || t.ESTADO_OPERATIVO || '').toUpperCase().trim();
      return val === 'EN PROCESO' || val === 'EN ESPERA';
    }).length;

    const finalizadas = filteredData.filter(t => {
      const val = String(t.ESTADO || t.ESTADO_OPERATIVO || '').toUpperCase().trim();
      return val === 'TERMINADAS' || val === 'TERMINADO' || val === 'TERMINADA';
    }).length;

    const precioTotal = filteredData.reduce((acc, t) => acc + (t.PRECIO || 0), 0);
    const tiendasUnicas = new Set(filteredData.map(t => t['ID TIENDA'])).size;
    const totalSheet = data.length;

    return { total, nuevas, enProceso, finalizadas, precioTotal, tiendasUnicas, totalSheet };
  }, [filteredData, data.length]);

  // --- OPCIONES DE FILTRO ---
  const options = useMemo(() => {
    return {
      estados: [...new Set(data.map(t => t.ESTADO || t.ESTADO_OPERATIVO))].filter(Boolean),
      adminEstados: [...new Set(data.map(t => t['ESTADO FINAL']))].filter(Boolean),
      tiendas: [...new Set(data.map(t => t['ID TIENDA']))].filter(Boolean).sort(),
      obras: [...new Set(data.map(t => t['PENDIENTES'] || t['TIPO DE OBRA']))].filter(Boolean).sort(),
      localidades: [...new Set(data.map(t => t['LOCALIDAD']))].filter(Boolean).sort(),
      provincias: [...new Set(data.map(t => t['PROVINCIA']))].filter(Boolean).sort(),
      meses: [...new Set(data.map(t => {
        const d = t['FECHA CT'] ? parseISO(t['FECHA CT']) : null;
        return d && !isNaN(d.getTime()) ? format(d, 'yyyy-MM') : null;
      }))].filter(Boolean).sort().reverse()
    };
  }, [data]);

  // --- CONFIGURACIÓN DE GRÁFICAS ---
  const chartGroupData = useMemo(() => {
    const groupStats = {};
    filteredData.forEach(t => {
      const group = t.GRUPO || 'S/G';
      if (!groupStats[group]) groupStats[group] = { count: 0, price: 0 };
      groupStats[group].count += 1;
      groupStats[group].price += (t.PRECIO || 0);
    });

    const labels = Object.keys(groupStats);
    const counts = labels.map(l => groupStats[l].count);
    const prices = labels.map(l => groupStats[l].price);

    return {
      series: counts,
      options: {
        chart: { type: 'donut', foreColor: '#94a3b8' },
        labels: labels,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        legend: { position: 'bottom' },
        stroke: { show: false },
        tooltip: {
          theme: 'dark',
          y: {
            formatter: (val, { seriesIndex }) => {
              return `${val} Tickets - $${prices[seriesIndex].toLocaleString()}`;
            }
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '75%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'TOTAL GRUPOS',
                  formatter: () => `$${stats.precioTotal.toLocaleString()}`,
                  color: '#f8fafc'
                }
              }
            }
          }
        }
      }
    };
  }, [filteredData, stats.precioTotal]);

  const chartTimelineData = useMemo(() => {
    const weeks = {};
    filteredData.forEach(t => {
      if (t['FECHA CT']) {
        const date = parseISO(t['FECHA CT']);
        if (!isNaN(date.getTime())) {
          const weekStart = startOfWeek(date, { weekStartsOn: 1 });
          const weekLabel = format(weekStart, 'dd/MM/yyyy');
          weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
        }
      }
    });

    // Ordenar las semanas cronológicamente
    const sortedWeekLabels = Object.keys(weeks).sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
    });

    return {
      series: [{ name: 'Tickets', data: sortedWeekLabels.map(l => weeks[l]) }],
      options: {
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#94a3b8' },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, colors: ['#3b82f6'] },
        markers: { size: 5 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 90, 100] } },
        xaxis: { categories: sortedWeekLabels, title: { text: 'Semana de Inicio' } },
        grid: { borderColor: 'rgba(255,255,255,0.05)' },
        tooltip: { theme: 'dark' }
      }
    };
  }, [filteredData]);

  // --- ESTADÍSTICAS ADMINISTRATIVAS ---
  const adminStats = useMemo(() => {
    const groups = {};
    filteredData.forEach(t => {
      const state = t['ESTADO FINAL'] || 'SIN ESTADO';
      if (!groups[state]) groups[state] = { count: 0, total: 0 };
      groups[state].count += 1;
      // Aseguramos que t.PRECIO sea número (ya formateado en useTickets)
      groups[state].total += Number(t.PRECIO || 0);
    });
    return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [filteredData]);

  const adminTimelineData = useMemo(() => {
    const timeline = {};

    // Recolectar todas las fechas únicas para el eje X
    filteredData.forEach(t => {
      // Campos CT, OC y EM
      ['FECHA CT', 'FECHA OC', 'FECHA EM'].forEach(field => {
        if (t[field]) {
          const dateStr = String(t[field]);
          const date = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
          if (!timeline[date]) {
            timeline[date] = { 'FECHA CT': 0, 'Aprobado': 0, 'FECHA OC': 0, 'FECHA EM': 0 };
          }
          timeline[date][field] = (timeline[date][field] || 0) + 1;
        }
      });

      // Nueva lógica para Aprobados: requiere FECHA SOLUCIONADO, 1° REMITO y ESTADO FINAL === APROBADO
      const fechaSolucionado = t['FECHA SOLUCIONADO'] || t['FECHA solucionado'];
      if (fechaSolucionado && t['1° REMITO'] && t['ESTADO FINAL'] === 'APROBADO') {
        const dateStr = String(fechaSolucionado);
        const date = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (!timeline[date]) {
          timeline[date] = { 'FECHA CT': 0, 'Aprobados': 0, 'FECHA OC': 0, 'FECHA EM': 0 };
        }
        timeline[date]['Aprobados'] = (timeline[date]['Aprobados'] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(timeline).sort();

    return {
      series: [
        { name: 'Fecha CT', data: sortedDates.map(d => timeline[d]['FECHA CT'] || 0) },
        { name: 'Aprobados', data: sortedDates.map(d => timeline[d]['Aprobados'] || 0) },
        { name: 'O.C.', data: sortedDates.map(d => timeline[d]['FECHA OC'] || 0) },
        { name: 'E.M.', data: sortedDates.map(d => timeline[d]['FECHA EM'] || 0) }
      ],
      options: {
        chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false }, foreColor: '#94a3b8' },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: sortedDates },
        grid: { borderColor: 'rgba(255,255,255,0.05)' },
        tooltip: { theme: 'dark' },
        markers: { size: 4 },
        legend: { position: 'top' }
      }
    };
  }, [filteredData]);

  if (error) return <div className="error-screen">{error}</div>;

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-card glass-panel">
          <div className="logo-icon mb-4"><TrendingUp size={32} /></div>
          <h2>Bienvenido a {BRAND_NAME}</h2>
          <p>Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Nombre de usuario"
                onChange={e => setUserCredentials({ ...userCredentials, user: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Código de Acceso</label>
              <input
                type="password"
                placeholder="••••••••"
                onChange={e => setUserCredentials({ ...userCredentials, pass: e.target.value })}
              />
            </div>
            {loginError && <p className="error-text">{loginError}</p>}
            <button className="btn-primary w-full" type="submit">Acceder al Panel</button>
          </form>

          <div className="login-footer">
            <p>© 2026 APPTICKET - Sistema de Gestión Premium</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-logo">
          <div className="logo-icon"><TrendingUp size={24} /></div>
          <span>{BRAND_NAME}</span>
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </div>
          <div
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <AlertCircle size={20} /> Estado Administrativo
          </div>
          <div
            className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <ClipboardList size={20} /> Tickets
          </div>
          <div
            className={`nav-item ${activeTab === 'obras' ? 'active' : ''}`}
            onClick={() => setActiveTab('obras')}
          >
            <Briefcase size={20} /> Obras
          </div>
          <div
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={20} /> Configuración
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{isAuthenticated.user.substring(0, 2).toUpperCase()}</div>
            <div>
              <p className="user-name">{isAuthenticated.name}</p>
              <p className="user-role">Super Admin</p>
            </div>
          </div>
          <button className="logout-btn" onClick={() => setIsAuthenticated(false)}>Cerrar Sesión</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' ? 'Panel de Control' :
                activeTab === 'admin' ? 'Estado Administrativo' :
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p>Monitoreo en tiempo real de obras y servicios</p>
          </div>
          <div className="header-actions">
            <div className="search-bar glass-panel">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar ticket o tienda..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => window.location.reload()}>Actualizar</button>
          </div>
        </header>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando datos espectaculares...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                {/* STATS GRID */}
                <div className="stats-grid">
                  <div className="stat-card glass-panel highlight-stat">
                    <div className="stat-icon blue"><ClipboardList size={24} /></div>
                    <div className="stat-info">
                      <h3>{stats.totalSheet}</h3>
                      <p>Total en Sheet</p>
                      <span className="stat-subtext">{stats.total} filtrados</span>
                    </div>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon purple"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                      <h3>{stats.nuevas}</h3>
                      <p>Nuevas</p>
                    </div>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon gold"><Clock size={24} /></div>
                    <div className="stat-info">
                      <h3>{stats.enProceso}</h3>
                      <p>En Proceso</p>
                    </div>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon emerald"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                      <h3>{stats.finalizadas}</h3>
                      <p>Terminadas</p>
                    </div>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon blue"><DollarSign size={24} /></div>
                    <div className="stat-info">
                      <h3>${stats.precioTotal.toLocaleString()}</h3>
                      <p>Facturación</p>
                    </div>
                  </div>
                </div>

                {/* CHARTS SECTION */}
                <div className="charts-grid">
                  <div className="chart-container glass-panel">
                    <div className="chart-header">
                      <h4>Vuelco de Tickets Semanales</h4>
                      <Clock size={16} />
                    </div>
                    <ReactApexChart
                      options={chartTimelineData.options}
                      series={chartTimelineData.series}
                      type="area"
                      height={300}
                    />
                  </div>
                  <div className="chart-container glass-panel">
                    <div className="chart-header">
                      <h4>Distribución por Grupo</h4>
                      <LayoutDashboard size={16} />
                    </div>
                    <ReactApexChart
                      options={chartGroupData.options}
                      series={chartGroupData.series}
                      type="donut"
                      height={300}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'admin' && (
              <div className="admin-view-content">
                <div className="stats-grid admin-grid mb-6">
                  {adminStats.map((item, idx) => (
                    <div key={idx} className="stat-card glass-panel admin-card">
                      <div className="stat-icon blue"><AlertCircle size={20} /></div>
                      <div className="stat-info">
                        <h3>{item.count}</h3>
                        <p>{item.name}</p>
                        <span className="admin-price">${item.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="chart-container glass-panel mb-6">
                  <div className="chart-header">
                    <h4>Comparativa de Tiempos Administrativos</h4>
                    <Clock size={16} />
                  </div>
                  <ReactApexChart
                    options={adminTimelineData.options}
                    series={adminTimelineData.series}
                    type="line"
                    height={350}
                  />
                  <p className="chart-subtitle">Volumen de eventos por día: CT, Aprobaciones (con 1° Remito), Orden de Compra y Entrega de Material</p>
                </div>
              </div>
            )}

            {(activeTab === 'dashboard' || activeTab === 'tickets' || activeTab === 'admin') && (
              /* FILTERS & TABLE */
              <div className="data-section glass-panel">
                <div className="section-header">
                  <h4>{activeTab === 'dashboard' ? 'Últimos Tickets' : 'Listado Completo'}</h4>
                  <div className="table-filters">
                    <div className="filter-select">
                      <Filter size={14} />
                      <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
                        <option value="TODOS">{activeTab === 'admin' ? 'Estado Administrativo' : 'Estado Operativo'}</option>
                        {(activeTab === 'admin' ? options.adminEstados : options.estados).map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="filter-select">
                      <Briefcase size={14} />
                      <select value={filters.obra} onChange={(e) => setFilters({ ...filters, obra: e.target.value })}>
                        <option value="TODOS">Tipo de Obra</option>
                        {options.obras.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="filter-select">
                      <Store size={14} />
                      <select value={filters.localidad} onChange={(e) => setFilters({ ...filters, localidad: e.target.value })}>
                        <option value="TODOS">Localidad</option>
                        {options.localidades.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="filter-select">
                      <TrendingUp size={14} />
                      <select value={filters.provincia} onChange={(e) => setFilters({ ...filters, provincia: e.target.value })}>
                        <option value="TODOS">Provincia</option>
                        {options.provincias.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="filter-select">
                      <Calendar size={14} />
                      <select value={filters.mes} onChange={(e) => setFilters({ ...filters, mes: e.target.value })}>
                        <option value="TODOS">Mes (Todos)</option>
                        {options.meses.map(m => (
                          <option key={m} value={m}>
                            {format(parseISO(`${m}-01`), 'MMMM yyyy', { locale: es })}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Tienda</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Grupo</th>
                        <th>Precio</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeTab === 'dashboard' ? filteredData.slice(0, 10) : filteredData).map((ticket, idx) => (
                        <tr key={ticket['ID TICKET'] || idx} onClick={() => setSelectedTicket(ticket)}>
                          <td>
                            <span className="ticket-id">#{ticket['NUMERO TICKET']}</span>
                          </td>
                          <td>
                            <div className="tienda-cell">
                              <strong>Tda {ticket['ID TIENDA']}</strong>
                              <span>{ticket['LOCALIDAD']}</span>
                            </div>
                          </td>
                          <td>
                            <p className="motivo-text">{ticket['MOTIVO']}</p>
                          </td>
                          <td>
                            <span className={`badge-status ${(ticket.ESTADO || ticket.ESTADO_OPERATIVO || '').toLowerCase().replace(' ', '-')}`}>
                              {ticket.ESTADO || ticket.ESTADO_OPERATIVO}
                            </span>
                          </td>
                          <td>{ticket['GRUPO']}</td>
                          <td>
                            <span className="price-tag">${(ticket['PRECIO'] || 0).toLocaleString()}</span>
                          </td>
                          <td>
                            <button className="btn-icon">
                              <Maximize2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'obras' && (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Briefcase size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                <h3>Gestión de Obras</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Esta sección está siendo optimizada para mostrar el avance detallado de cada obra operativa.</p>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="config-view">
                <div className="glass-panel p-6 mb-6">
                  <h3 className="mb-4">Usuarios con Acceso</h3>
                  <div className="users-list">
                    {allowedUsers.map(u => (
                      <div key={u.user} className="user-config-card">
                        <div className="user-avatar">{u.user.substring(0, 2)}</div>
                        <div className="u-info">
                          <strong>{u.name}</strong>
                          <span>Usuario: {u.user}</span>
                        </div>
                        <div className="u-key">
                          <code>Pass: {u.pass}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-panel p-6">
                  <h3>Preferencias del Sistema</h3>
                  <p className="text-secondary mt-2">Personaliza la experiencia de APPTICKET.</p>
                  <div className="mt-4">
                    <label className="switch-label">
                      <span>Modo Oscuro Siempre</span>
                      <input type="checkbox" checked readOnly />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Ticket #{selectedTicket['NUMERO TICKET']}</h2>
                <p>Tienda {selectedTicket['ID TIENDA']} - {selectedTicket['PENDIENTES']}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}><X size={24} /></button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-info">
                  <div className="detail-item">
                    <label>Motivo</label>
                    <p className="highlight-text">{selectedTicket['MOTIVO']}</p>
                  </div>

                  <div className="detail-item">
                    <label>Comentarios / Observaciones</label>
                    <p className="comment-text">{selectedTicket['COMENTARIO'] || 'Sin comentarios registrados.'}</p>
                  </div>

                  <div className="dates-list">
                    <label>Cronología de Fechas</label>
                    <div className="date-entry">
                      <span>Fecha CT:</span>
                      <strong>{safeFormatDate(selectedTicket['FECHA CT'])}</strong>
                    </div>
                    <div className="date-entry">
                      <span>Fecha Asignación:</span>
                      <strong>{safeFormatDate(selectedTicket['FECHA ASIGNACION'])}</strong>
                    </div>
                    <div className="date-entry">
                      <span>Fecha 1er Remito:</span>
                      <strong>{safeFormatDate(selectedTicket['FECHA PRIMER REMITO'])}</strong>
                    </div>
                    <div className="date-entry">
                      <span>Fecha 2do Remito:</span>
                      <strong>{safeFormatDate(selectedTicket['FECHA SEGUNDO REMITO'])}</strong>
                    </div>
                    <div className="date-entry">
                      <span>Fecha Solucionado:</span>
                      <strong>{safeFormatDate(selectedTicket['FECHA SOLUCIONADO'])}</strong>
                    </div>
                  </div>

                  <div className="status-section">
                    <div className="detail-item">
                      <label>Estado Administrativo</label>
                      <p className="admin-status-text">{selectedTicket['ESTADO FINAL'] || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                      <label>Estado Operativo</label>
                      <span className={`badge-status ${(selectedTicket.ESTADO || '').toLowerCase().replace(' ', '-')}`}>
                        {selectedTicket.ESTADO}
                      </span>
                    </div>
                  </div>

                  <div className="admin-fields">
                    <div className="detail-item">
                      <label>O.C. (Orden de Compra)</label>
                      <p>{selectedTicket['OC'] || '-'}</p>
                    </div>
                    <div className="detail-item">
                      <label>E.M. (Entrega Material)</label>
                      <p>{selectedTicket['EM'] || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-photos">
                  <label>Evidencias Fotográficas</label>
                  <div className="photos-grid">
                    <PhotoCard label="Ingreso" url={selectedTicket['FOTO INGRESO']} />
                    <PhotoCard label="Egreso" url={selectedTicket['FOTO EGRESO']} />
                    <PhotoCard label="Remito" url={selectedTicket['FOTO REMITO'] || selectedTicket['FOTO PRIMER REMITO']} />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer action-buttons">
              <div className="main-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
                <button className="btn-secondary" onClick={() => window.print()}>
                  <FileText size={16} /> Descargar PDF
                </button>
                <button className="btn-primary" onClick={() => setSelectedTicket(null)}>Cerrar Detalle</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
