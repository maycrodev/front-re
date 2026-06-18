// docenteMenu.jsx
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { getNombreCompleto } from '../../utils/roleUtils';
import { obtenerMisCursos, obtenerEstudiantesCurso, guardarNotasEstudiantes, obtenerMetricasCurso, cambiarEstadoCurso } from '../../services/docenteApi';
import { validateNotas } from '../../utils/formValidators';
import './docenteMenu.css';

// --- Iconos en línea ---
const IconUsers = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconSettings = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const IconChart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IconStar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconInfo = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconBook = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconClipboard = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPlay = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IconFileText = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
const IconSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconFilter = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IconDownload = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IconWarning = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

const VISUAL = [
  { icono: '👨‍💻', color: 'linear-gradient(135deg,#003366,#0055aa)', categoria: 'Desarrollo' },
  { icono: '🗄️', color: 'linear-gradient(135deg,#5a8a1a,#8cc63f)', categoria: 'Base de Datos' },
  { icono: '📡', color: 'linear-gradient(135deg,#1e3a5f,#2e6da4)', categoria: 'Redes' },
];

const HomeDocente = () => {
  const { usuario } = useAuth();
  
  const [misCursos, setMisCursos] = useState([]);
  const [metricas, setMetricas] = useState({ totalAlumnos: 0, cursosActivos: 0, calificacionPromedio: 0 });
  const [metricasCurso, setMetricasCurso] = useState({ promedio_curso: 0, tasa_aprobacion: 0, asistencia_promedio: 0 });
  const [cargando, setCargando] = useState(true);

  // Estados de Búsqueda y Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Estados del modal y edición de notas
  const [modalActivo, setModalActivo] = useState(null); 
  const [cursoActual, setCursoActual] = useState(null);
  const [alumnosCurso, setAlumnosCurso] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Estado para Toasts
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const estadoParaUI = (estado) => {
    if (!estado) return 'NO ACTIVO';
    const e = estado.toUpperCase().trim();
    if (e === 'NO_ACTIVO' || e === 'NO ACTIVO') return 'NO ACTIVO';
    return e;
  };
 
  const estadoParaAPI = (estado) => {
    if (!estado) return 'NO_ACTIVO';
    const e = estado.toUpperCase().trim();
    if (e === 'NO ACTIVO' || e === 'NO_ACTIVO') return 'NO_ACTIVO';
    return e;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const cursos = await obtenerMisCursos();
        const cursosNormalizados = (cursos || []).map((curso) => ({
          ...curso,
          estado_curso: estadoParaUI(curso.estado_curso),
          minimo_estudiantes: Number(curso.minimo_estudiantes || 1),
          alumnos: Number(curso.alumnos || 0),
          calificacion: Number(curso.calificacion || 0)
        }));

        setMisCursos(cursosNormalizados);

        const totalAlumnos = cursosNormalizados.reduce((sum, curso) => sum + curso.alumnos, 0);
        const cursosActivos = cursosNormalizados.filter((c) => c.estado_curso === 'ACTIVO').length;
        const calificacionPromedio = cursosNormalizados.length > 0
          ? Number((cursosNormalizados.reduce((sum, curso) => sum + curso.calificacion, 0) / cursosNormalizados.length).toFixed(2))
          : 0;

        setMetricas({ totalAlumnos, cursosActivos, calificacionPromedio });
      } catch (error) {
        mostrarToast('Error al cargar los cursos: ' + error.message, 'error');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const mostrarToast = (mensaje, tipo = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ mensaje, tipo });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  };

  const abrirModal = async (tipo, curso) => {
    setCursoActual(curso);
    setModalActivo(tipo);
    setMostrarConfirmacion(false);
    
    try {
      if (tipo === 'alumnos' || tipo === 'notas' || tipo === 'administrar') {
        const estudiantes = await obtenerEstudiantesCurso(curso.id);
        setAlumnosCurso(
          (estudiantes || []).map(al => ({
            ...al,
            notaFinal: al.nota_final ?? null,
            error: false
          }))
        );
      }

      if (tipo === 'metricas') {
        const dataMetricas = await obtenerMetricasCurso(curso.id);
        setMetricasCurso({
          promedio_curso: Number(dataMetricas?.promedio_curso || 0),
          tasa_aprobacion: Number(dataMetricas?.tasa_aprobacion || 0),
          asistencia_promedio: Number(dataMetricas?.asistencia_promedio || 0)
        });
      }
    } catch (error) {
      mostrarToast('Error al cargar datos: ' + error.message, 'error');
      setModalActivo(null);
    }
  };

  const cerrarModal = () => {
    setModalActivo(null);
    setCursoActual(null);
    setMostrarConfirmacion(false);
    // Limpia los datos de la opción anterior para que la pantalla no quede
    // con el listado/notas del curso previo al abrir otro modal.
    setAlumnosCurso([]);
  };

  const cambiarEstadoCursoHandler = async (nuevoEstado) => {
    try {
      const estadoApi = estadoParaAPI(nuevoEstado);

      if (estadoApi === 'ACTIVO') {
        const inscritos = Number(cursoActual?.alumnos || 0);
        const minimoEstudiantes = Number(cursoActual?.minimo_estudiantes || 1);

        if (inscritos < minimoEstudiantes) {
          mostrarToast(`No se puede iniciar. Inscritos: ${inscritos}. Mínimo requerido: ${minimoEstudiantes}.`, 'error');
          return;
        }
      }

      if (estadoApi === 'FINALIZADO') {
        const pendientes = (alumnosCurso || []).filter(al => al.notaFinal === null || al.notaFinal === undefined);
        if (pendientes.length > 0) {
          mostrarToast('No se puede finalizar el curso. Todos los estudiantes deben tener una nota asignada.', 'error');
          return;
        }
      }

      await cambiarEstadoCurso(cursoActual.id, estadoApi);

      setMisCursos(misCursos.map(c => c.id === cursoActual.id ? { ...c, estado_curso: estadoParaUI(estadoApi) } : c));
      mostrarToast(`El curso ha cambiado a: ${nuevoEstado}`, 'exito');
      cerrarModal();
    } catch (error) {
      mostrarToast('Error: ' + error.message, 'error');
    }
  };

  const handleNotaChange = (id, valor) => {
    const numValor = valor === '' ? null : Number(valor);
    const tieneError = numValor !== null && (numValor < 0 || numValor > 100);
    
    setAlumnosCurso(alumnosCurso.map(al => 
      al.id === id ? { ...al, notaFinal: numValor, error: tieneError } : al
    ));
  };

  const hayErroresEnNotas = alumnosCurso.some(al => al.error);

  const guardarNotas = async (e) => {
    e.preventDefault();

    const validacionNotas = validateNotas(alumnosCurso);
    if (!validacionNotas.isValid) {
      mostrarToast(validacionNotas.error, 'error');
      return;
    }

    if (hayErroresEnNotas) return;

    try {
      const notas = alumnosCurso.map(al => ({
        estudiante_curso_id: al.id,
        nota_final: al.notaFinal
      }));

      await guardarNotasEstudiantes(cursoActual.id, notas);
      mostrarToast('Calificaciones guardadas exitosamente en la base de datos.', 'exito');
      cerrarModal();
    } catch (error) {
      mostrarToast('Error: ' + error.message, 'error');
    }
  };

  // Función para dibujar rectángulo con color de fondo (simulando fill de pdfkit)
  const dibujarFondoTabla = (doc, x, y, width, height, color) => {
    doc.setFillColor(color);
    doc.rect(x, y, width, height, 'F');
  };

  // Función para dibujar línea horizontal
  const dibujarLinea = (doc, x1, y1, x2, y2, color = '#cbd5e1', width = 1) => {
    doc.setDrawColor(color);
    doc.setLineWidth(width / 2.83465); // Convertir pt a mm aproximado para jsPDF
    doc.line(x1, y1, x2, y2);
  };

  const exportarPDF = async () => {
    if (!cursoActual) {
      mostrarToast('No hay curso seleccionado para generar el PDF.', 'error');
      return;
    }

    // Crear documento A4 con márgenes (jsPDF usa mm por defecto)
    const margen = 17.6;
    const anchoPagina = 210;
    const anchoUsable = anchoPagina - (margen * 2);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Colores
    const colorPrimario = '#003366';
    const colorGrisClaro = '#f1f5f9';
    const colorGrisMedio = '#cbd5e1';
    const colorGrisOscuro = '#666666';
    const colorTexto = '#333333';
    const colorNegro = '#000000';
    const colorVerde = '#10b981';
    const colorRojo = '#ef4444';
    const colorNaranja = '#f59e0b';

    let y = margen + 10;

    // --- Logo en PDF ---
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      const logoData = await new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(new Error('No se pudo cargar el logo para PDF')); 
        img.src = logo;
      });

      const logoWidth = 45;
      const logoHeight = 25;
      doc.addImage(logoData, 'PNG', margen, margen, logoWidth, logoHeight);
    } catch (err) {
      console.warn('No se pudo insertar el logo en el PDF:', err);
      // sigue sin el logo y sin bloquear la generación
    }

    // --- Título del documento ---
    doc.setTextColor(colorPrimario);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE NOTAS', anchoPagina / 2, y + 5, { align: 'center' });
    
    y += 15;

    // --- Información del curso (emisor) ---
    doc.setTextColor(colorNegro);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Curso: ${cursoActual.nombre || 'N/A'}`, margen, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`ID de curso: ${cursoActual.id || 'N/A'}`, margen, y);
    y += 5;
    doc.text(`Estado: ${cursoActual.estado_curso || 'N/A'}`, margen, y);
    y += 5;
    doc.text(`Total estudiantes: ${alumnosCurso.length}`, margen, y);
    y += 5;
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-BO')}`, margen, y);
    y += 10;

    // --- Métricas del curso (resumen) ---
    const aprobados = alumnosCurso.filter(al => al.notaFinal !== null && al.notaFinal >= 51).length;
    const reprobados = alumnosCurso.filter(al => al.notaFinal !== null && al.notaFinal < 51).length;
    const pendientes = alumnosCurso.filter(al => al.notaFinal === null || al.notaFinal === undefined).length;
    
    const promedioNotas = alumnosCurso.filter(al => al.notaFinal !== null).length > 0
      ? (alumnosCurso.filter(al => al.notaFinal !== null).reduce((sum, al) => sum + al.notaFinal, 0) / 
         alumnosCurso.filter(al => al.notaFinal !== null).length).toFixed(1)
      : 'N/A';

    // Caja de métricas con fondo gris claro
    dibujarFondoTabla(doc, margen, y, anchoUsable, 25, colorGrisClaro);
    
    doc.setTextColor(colorPrimario);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DEL CURSO', margen + 5, y + 6);
    
    doc.setTextColor(colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const col1 = margen + 5;
    const col2 = margen + 60;
    const col3 = margen + 115;
    const col4 = margen + 170;
    
    doc.text(`Promedio: ${promedioNotas}`, col1, y + 14);
    doc.text(`Aprobados: ${aprobados}`, col2, y + 14);
    doc.text(`Reprobados: ${reprobados}`, col3, y + 14);
    doc.text(`Pendientes: ${pendientes}`, col4, y + 14);
    
    y += 30;

    // --- Tabla de estudiantes ---
    // Encabezado con fondo gris
    const altoFila = 8;
    const altoEncabezado = 10;
    
    dibujarFondoTabla(doc, margen, y, anchoUsable, altoEncabezado, colorGrisClaro);
    
    // Línea superior del encabezado
    dibujarLinea(doc, margen, y, anchoPagina - margen, y, colorGrisMedio, 1);
    
    // Textos del encabezado
    doc.setTextColor(colorPrimario);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    const colNro = margen + 3;
    const colNombre = margen + 12;
    const colCI = margen + 85;
    const colAsistencia = margen + 120;
    const colNota = margen + 145;
    const colEstado = margen + 165;
    
    doc.text('N°', colNro, y + 6);
    doc.text('Nombre del Estudiante', colNombre, y + 6);
    doc.text('CI/NIT', colCI, y + 6);
    doc.text('Asist.', colAsistencia, y + 6);
    doc.text('Nota', colNota, y + 6);
    doc.text('Estado', colEstado, y + 6);
    
    // Línea inferior del encabezado
    dibujarLinea(doc, margen, y + altoEncabezado, anchoPagina - margen, y + altoEncabezado, colorGrisMedio, 1);
    
    y += altoEncabezado;

    // Filas de la tabla
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colorTexto);
    doc.setFontSize(9);

    alumnosCurso.forEach((al, index) => {
      // Verificar si necesitamos nueva página
      if (y > 270) {
        doc.addPage();
        y = margen;
        
        // Repetir encabezado en nueva página
        dibujarFondoTabla(doc, margen, y, anchoUsable, altoEncabezado, colorGrisClaro);
        dibujarLinea(doc, margen, y, anchoPagina - margen, y, colorGrisMedio, 1);
        
        doc.setTextColor(colorPrimario);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('N°', colNro, y + 6);
        doc.text('Nombre del Estudiante', colNombre, y + 6);
        doc.text('CI/NIT', colCI, y + 6);
        doc.text('Asist.', colAsistencia, y + 6);
        doc.text('Nota', colNota, y + 6);
        doc.text('Estado', colEstado, y + 6);
        
        dibujarLinea(doc, margen, y + altoEncabezado, anchoPagina - margen, y + altoEncabezado, colorGrisMedio, 1);
        y += altoEncabezado;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorTexto);
      }

      const estadoStr = al.notaFinal === null || al.notaFinal === undefined ? 'Pendiente' : (al.notaFinal >= 51 ? 'Aprobado' : 'Reprobado');
      const notaStr = al.notaFinal === null || al.notaFinal === undefined ? '-' : String(al.notaFinal);
      
      // Color del estado
      let colorEstado = colorGrisOscuro;
      if (estadoStr === 'Aprobado') colorEstado = colorVerde;
      if (estadoStr === 'Reprobado') colorEstado = colorRojo;
      if (estadoStr === 'Pendiente') colorEstado = colorNaranja;

      doc.text(String(index + 1), colNro, y + 5);
      doc.text(al.nombre || '', colNombre, y + 5);
      doc.text(al.ci || '', colCI, y + 5);
      doc.text(`${al.asistencia ?? '0'}%`, colAsistencia, y + 5);
      doc.text(notaStr, colNota, y + 5);
      
      // Estado con color
      doc.setTextColor(colorEstado);
      doc.setFont('helvetica', 'bold');
      doc.text(estadoStr, colEstado, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorTexto);
      
      // Línea separadora sutil
      dibujarLinea(doc, margen, y + altoFila, anchoPagina - margen, y + altoFila, '#e2e8f0', 0.5);
      
      y += altoFila;
    });

    // Línea final de la tabla
    dibujarLinea(doc, margen, y, anchoPagina - margen, y, colorGrisMedio, 1);

    y += 10;

    // --- Total de estudiantes ---
    doc.setTextColor(colorNegro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`TOTAL ESTUDIANTES: ${alumnosCurso.length}`, anchoPagina - margen, y, { align: 'right' });
    
    y += 15;

    // --- Leyendas obligatorias (estilo factura) ---
    doc.setTextColor(colorGrisOscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const textoLeyenda1 = 'ESTE DOCUMENTO ES UN REPORTE OFICIAL DE CALIFICACIONES GENERADO POR EL SISTEMA ACADÉMICO.';
    doc.text(textoLeyenda1, anchoPagina / 2, y, { align: 'center', maxWidth: anchoUsable });
    y += 4;
    
    const textoLeyenda2 = 'X College Nexus - Sistema de Gestión Educativa. Todos los derechos reservados.';
    doc.text(textoLeyenda2, anchoPagina / 2, y, { align: 'center', maxWidth: anchoUsable });
    y += 4;
    
    const textoLeyenda3 = `Documento generado el ${new Date().toLocaleDateString('es-BO')} a las ${new Date().toLocaleTimeString('es-BO')}`;
    doc.text(textoLeyenda3, anchoPagina / 2, y, { align: 'center', maxWidth: anchoUsable });
    
    y += 8;
    doc.setFontSize(6);
    doc.text(`Docente: ${usuario?.nombre || 'No especificado'} | ID Curso: ${cursoActual.id}`, anchoPagina / 2, y, { align: 'center' });

    // Guardar PDF
    doc.save(`Reporte_Notas_${(cursoActual.nombre || 'curso').replace(/\s+/g, '_')}.pdf`);
    mostrarToast('PDF generado y descargado correctamente.', 'exito');
  };

  const getBadgeClass = (estado) => {
    if(!estado) return 'badge-neutro';
    const estadoLimpio = estado.toLowerCase().replace(/ó/g, 'o').replace(/ /g, '-');
    return `badge-${estadoLimpio}`;
  };

  const cursosFiltrados = misCursos.filter(curso => {
    const coincideTexto = curso.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'TODOS' || curso.estado_curso === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  const renderModalContent = () => {
    if (!cursoActual) return null;

    switch (modalActivo) {
      case 'administrar':
        return (
          <div className="modal-content-admin">
            <h3>Administrar: {cursoActual.nombre}</h3>
            <div className="status-indicator">
              Estado actual: <span className={`card-chip-estado en-texto ${getBadgeClass(cursoActual.estado_curso)}`}>{cursoActual.estado_curso}</span>
            </div>
            
            {mostrarConfirmacion ? (
              <div className="confirmacion-box">
                <div className="conf-icono"><IconWarning /></div>
                <h4>¿Estás seguro de finalizar este curso?</h4>
                <p>Esta acción es irreversible. Ya no podrás modificar notas ni interactuar con el curso.</p>
                <div className="confirmacion-acciones">
                  <button onClick={() => setMostrarConfirmacion(false)} className="btn-outline">Cancelar</button>
                  <button onClick={() => cambiarEstadoCursoHandler('FINALIZADO')} className="btn-modal-action danger">
                    Sí, Finalizar Curso
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-actions-box">
                {cursoActual.estado_curso === 'NO ACTIVO' && (
                  <>
                    <p>
                      Este curso aún no ha comenzado. Inscritos actuales: <strong>{cursoActual.alumnos}</strong>.
                      Mínimo requerido: <strong>{cursoActual.minimo_estudiantes}</strong>.
                    </p>
                    <button
                      className="btn-modal-action success"
                      onClick={() => cambiarEstadoCursoHandler('ACTIVO')}
                      disabled={Number(cursoActual.alumnos) < Number(cursoActual.minimo_estudiantes)}
                    >
                      <IconPlay /> Iniciar Curso Ahora
                    </button>
                    {Number(cursoActual.alumnos) < Number(cursoActual.minimo_estudiantes) && (
                      <p>No puedes iniciar el curso hasta cumplir el mínimo de inscritos.</p>
                    )}
                  </>
                )}
                {cursoActual.estado_curso === 'ACTIVO' && (
                  <>
                    <p>El curso está en proceso. Una vez concluido el temario y subidas las notas, puedes finalizarlo.</p>
                    <button className="btn-modal-action warning" onClick={() => setMostrarConfirmacion(true)}>
                      <IconCheck /> Finalizar Curso
                    </button>
                  </>
                )}
                {cursoActual.estado_curso === 'FINALIZADO' && (
                  <>
                    <p>Este curso ya ha concluido. Descarga el reporte en PDF con toda la información de notas.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button className="btn-modal-action primary" onClick={exportarPDF}>
                        <IconFileText /> Descargar PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );

      case 'alumnos':
        return (
          <div className="modal-content-table">
            <div className="modal-header-flexible">
              <h3>Listado de Alumnos - {cursoActual.nombre}</h3>
              <button className="btn-export-small" onClick={exportarPDF} title="Descargar PDF">
                <IconDownload /> PDF
              </button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>CI / NIT</th>
                    <th>Asistencia</th>
                    <th>Nota Final</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosCurso.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No hay estudiantes inscritos</td></tr>
                  ) : (
                    alumnosCurso.map(al => (
                      <tr key={al.id}>
                        <td><div className="alumno-nombre-td">{al.nombre}</div></td>
                        <td>{al.ci}</td>
                        <td>{al.asistencia}%</td>
                        <td><strong>{al.notaFinal !== null ? al.notaFinal : '-'}</strong></td>
                        <td>
                          {al.notaFinal === null ? <span className="estado-badge neutro">Pendiente</span> :
                           al.notaFinal >= 51 ? <span className="estado-badge exito">Aprobado</span> : 
                           <span className="estado-badge error">Reprobado</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'notas':
        return (
          <div className="modal-content-table modal-notas">
            <h3>Registro Académico</h3>
            <p className="modal-subtitle">Asignar Calificaciones – {cursoActual.nombre}</p>
            <form onSubmit={guardarNotas}>
              <div className="table-responsive">
                <table className="modern-table align-middle">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>CI / NIT</th>
                      <th>Estado Actual</th>
                      <th style={{ textAlign: 'center' }}>Calificación (0-100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosCurso.map(al => (
                      <tr key={al.id}>
                        <td><div className="alumno-nombre-td">{al.nombre}</div></td>
                        <td className="text-gray">{al.ci}</td>
                        <td>
                          {al.notaFinal === null ? <span className="text-gray">Sin nota</span> :
                           al.notaFinal >= 51 ? <span className="text-green">Aprobando</span> : 
                           <span className="text-red">Reprobando</span>}
                        </td>
                        <td style={{ textAlign: 'center', position: 'relative' }}>
                          <input 
                            type="number" 
                            className={`input-nota ${al.error ? 'error' : ''}`} 
                            value={al.notaFinal !== null ? al.notaFinal : ''} 
                            onChange={(e) => handleNotaChange(al.id, e.target.value)}
                            placeholder="-"
                          />
                          {al.error && <div className="error-tooltip">Nota inválida (0-100)</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>Cancelar</button>
                <button type="submit" className="btn-guardar" disabled={hayErroresEnNotas || alumnosCurso.length === 0}>
                  <IconClipboard /> Guardar Calificaciones
                </button>
              </div>
            </form>
          </div>
        );

      case 'metricas':
        return (
          <div className="modal-content-metrics">
            <h3>Métricas del Curso - {cursoActual.nombre}</h3>
            <div className="metrics-grid">
              <div className="metric-box">
                <h4>Promedio del Curso</h4>
                <div className="metric-value text-blue">{metricasCurso.promedio_curso.toFixed(1)} <small>/100</small></div>
              </div>
              <div className="metric-box">
                <h4>Tasa de Aprobación</h4>
                <div className="metric-value text-green">{metricasCurso.tasa_aprobacion.toFixed(1)}%</div>
                <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.max(0, Math.min(100, metricasCurso.tasa_aprobacion))}%`, background: 'var(--verde)'}}></div></div>
              </div>
              <div className="metric-box">
                <h4>Asistencia Promedio</h4>
                <div className="metric-value text-orange">{metricasCurso.asistencia_promedio.toFixed(1)}%</div>
                <div className="progress-bar"><div className="progress-fill" style={{width: `${Math.max(0, Math.min(100, metricasCurso.asistencia_promedio))}%`, background: 'var(--naranja)'}}></div></div>
              </div>
            </div>
          </div>
        );
      
      default: return null;
    }
  };

  return (
    <div className="docente-page">
      {/* ── Header ── */}
      <div className="docente-header">
        <div className="docente-header-bg"><span /><span /></div>
        <div className="docente-header-inner">
          <div className="doc-breadcrumb">
            <a href="/">Inicio</a><span className="sep">›</span><span>Panel Docente</span>
          </div>
          <h1>Mi Espacio <span>Docente</span></h1>
          <p>Gestiona tus cursos, monitorea a tus estudiantes y analiza tu rendimiento.</p>
        </div>
      </div>

      <div className="docente-body">
        {usuario && (
          <div className="info-sesion-docente">
            <IconInfo />
            <p>Hola, <strong>Profesor {getNombreCompleto(usuario) || usuario.nombre || 'Docente'}</strong>. Aquí tienes el resumen de tu actividad reciente.</p>
          </div>
        )}

        {/* ── Dashboard de Métricas Globales ── */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-icon azul"><IconBook /></div>
            <div className="stat-info">
              <h3>{metricas.cursosActivos}</h3>
              <p>Cursos Activos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon verde"><IconUsers /></div>
            <div className="stat-info">
              <h3>{metricas.totalAlumnos}</h3>
              <p>Total Estudiantes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon naranja"><IconStar /></div>
            <div className="stat-info">
              <h3>{metricas.calificacionPromedio} <span className="stat-max">/ 100.0</span></h3>
              <p>Calificación Promedio</p>
            </div>
          </div>
        </div>

        {/* ── Acciones y Filtros ── */}
        <div className="docente-acciones-bar">
          <h2>Mis Cursos Asignados ({cursosFiltrados.length})</h2>
          
          <div className="filtros-container">
            <div className="input-with-icon">
              <IconSearch />
              <input 
                type="text" 
                placeholder="Buscar curso por nombre..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>
            <div className="input-with-icon select-wrapper">
              <IconFilter />
              <select 
                value={filtroEstado} 
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="select-filtro"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="NO ACTIVO">No Activos</option>
                <option value="ACTIVO">Activos</option>
                <option value="FINALIZADO">Finalizados</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Grid de Cursos del Docente ── */}
        {cargando ? (
          <div className="cargando-estado">Cargando tu panel de gestión desde la Base de Datos...</div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="vacio-estado">No se encontraron cursos con los filtros actuales.</div>
        ) : (
          <div className="cursos-docente-grid">
            {cursosFiltrados.map((curso, i) => {
              const visual = VISUAL[i % VISUAL.length];
              return (
                <div key={curso.id} className="curso-docente-card">
                  <div className="card-banner" style={{ background: visual.color }}>
                    <span style={{ position: 'relative', zIndex: 2 }}>{visual.icono}</span>
                    <span className="card-chip">{visual.categoria}</span>
                    <span className={`card-chip-estado ${getBadgeClass(curso.estado_curso)}`}>
                      {curso.estado_curso}
                    </span>
                  </div>
                  
                  <div className="card-body">
                    <div className="card-titulo">{curso.nombre}</div>
                    <div className="card-codigo">ID-{String(curso.id).padStart(3, '0')}</div>
                    <p className="card-desc">{curso.descripcion}</p>
                    
                    <div className="docente-stats-curso">
                      <div className="d-stat">
                        <IconUsers /> <span><strong>{curso.alumnos}</strong> Alumnos</span>
                      </div>
                      <div className="d-stat">
                        <IconStar /> <span><strong>{curso.calificacion > 0 ? curso.calificacion : 'N/A'}</strong> Rating</span>
                      </div>
                    </div>

                    <div className="card-acciones-docente">
                      <button className="btn-accion secundario" onClick={() => abrirModal('alumnos', curso)}>
                        <IconUsers /> Alumnos
                      </button>
                      <button className="btn-accion secundario" onClick={() => abrirModal('metricas', curso)}>
                        <IconChart /> Métricas
                      </button>
                      <button 
                        className="btn-accion terciario" 
                        onClick={() => abrirModal('notas', curso)}
                        disabled={curso.estado_curso === 'FINALIZADO'}
                        title={curso.estado_curso === 'FINALIZADO' ? 'El curso finalizó, no puedes modificar notas' : 'Asignar Notas'}
                        style={curso.estado_curso === 'FINALIZADO' ? {opacity: 0.5, cursor: 'not-allowed'} : {}}
                      >
                        <IconClipboard /> Asignar Notas
                      </button>
                      <button className="btn-accion primario" onClick={() => abrirModal('administrar', curso)}>
                        <IconSettings /> Administrar Curso
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* ── Overlay Modal ── */}
      {modalActivo && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalActivo === 'administrar' ? 'Gestión de Curso' : 
                   modalActivo === 'alumnos' ? 'Control de Estudiantes' : 
                   modalActivo === 'notas' ? 'Registro Académico' : 'Análisis de Datos'}</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModal}><IconClose /></button>
            </div>
            <div className="modal-body">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}

      {/* ── Notificaciones Flotantes (Toasts) ── */}
      {toast && (
        <div className={`toast-flotante ${toast.tipo}`}>
          <div className="toast-icon">
            {toast.tipo === 'exito' ? <IconCheck /> : toast.tipo === 'error' ? <IconWarning /> : <IconInfo />}
          </div>
          <div className="toast-content">
            <span className="toast-title">{toast.tipo === 'exito' ? '¡Éxito!' : toast.tipo === 'error' ? 'Error' : 'Información'}</span>
            <span className="toast-message">{toast.mensaje}</span>
          </div>
          <button className="toast-close-btn" onClick={() => setToast(null)}>
            <IconClose />
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeDocente;