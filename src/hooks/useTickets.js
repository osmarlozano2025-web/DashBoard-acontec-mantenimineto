import { useState, useEffect } from 'react';

// URL Real del script de Google Apps Script proporcionada por el usuario (Nueva Implementación)
export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxW8DKgdVYwUnw2eddA132u-WBt6_GwxZCJFAwA8LoLF4jmo20CUTLdeTqv7e8MIpC5/exec';

const mockTickets = [
  {
    'ID TICKET': 'MOCK-1',
    'NUMERO TICKET': 'M-001',
    'ID TIENDA': 'M-TDA',
    'MOTIVO': 'Sin datos reales cargados todavía.',
    'ESTADO': 'NUEVA',
    'ESTADO FINAL': 'NUEVA',
    'ESTADO_OPERATIVO': 'NUEVA',
    'GRUPO': 'N/A',
    'PRECIO': 0,
    'LOCALIDAD': 'N/A',
    'PROVINCIA': 'N/A',
    'PENDIENTES': 'N/A',
    'TIPO DE OBRA': 'N/A',
    'FECHA CT': new Date().toISOString(),
    'FECHA ASIGNACION': new Date().toISOString(),
    'COMENTARIO': 'Si ves esto, abre la consola (F12) para ver el error de conexión.'
  }
];

export const useTickets = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Iniciando carga de datos desde Google Script...');
        const response = await fetch(SCRIPT_URL);

        if (!response.ok) {
          throw new Error(`Respuesta de red incorrecta (${response.status})`);
        }

        const result = await response.json();
        console.log('Datos recibidos de Google:', result);

        const tickets = Array.isArray(result) ? result : (result.data || []);
        console.log('Tickets detectados:', tickets.length);

        if (tickets.length === 0) {
          console.warn('Google Script devolvió una lista vacía.');
          setData(mockTickets);
        } else {
          setData(tickets);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error cargando tickets:', err);
        setData(mockTickets);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
