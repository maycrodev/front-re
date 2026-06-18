// administrarCursos.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { validateForm } from '../../utils/formValidators';
import { getToken } from '../../utils/tokenStore';
import { useAuth } from '../../context/AuthContext';
import { PERMISSIONS } from '../../utils/roleUtils';
import './administrarCursos.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const authHeaders = () => {
  const token = getToken();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
};

const FORM_VACIO = { nombre: '', descripcion: '', costo: '', cupo_maximo: '', minimo_estudiantes: '', prerrequisitos: [] };

const AdministrarCursos = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const misPermisos  = usuario?.permisos || [];
  const esGestor     = misPermisos.includes(PERMISSIONS.CURSOS_GESTIONAR);
  const canRegistrar = esGestor || misPermisos.includes(PERMISSIONS.CURSOS_REGISTRAR);
  const canModificar = esGestor || misPermisos.includes(PERMISSIONS.CURSOS_MODIFICAR);
  const canEliminar  = esGestor || misPermisos.includes(PERMISSIONS.CURSOS_ELIMINAR);
  const tieneAcciones = canRegistrar || canModificar || canEliminar;

  const [cursos, setCursos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(null); // curso
  const [cursoEditando, setCursoEditando] = useState(null);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [submitting, setSubmitting] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/cursos/admin`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Error al cargar cursos');
      setCursos(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Limpia el mensaje de éxito tras unos segundos para que la pantalla no
  // quede con el aviso de la operación anterior una vez concluida.
  useEffect(() => {
    if (!exito) return;
    const t = setTimeout(() => setExito(''), 4000);
    return () => clearTimeout(t);
  }, [exito]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePrerrequisito = (id) => {
    setFormData(prev => ({
      ...prev,
      prerrequisitos: prev.prerrequisitos.includes(id)
        ? prev.prerrequisitos.filter(p => p !== id)
        : [...prev.prerrequisitos, id],
    }));
  };

  const abrirCrear = () => {
    setError(''); setExito('');
    setFormData(FORM_VACIO);
    setModalCrear(true);
  };

  const abrirEditar = (curso) => {
    setError(''); setExito('');
    setCursoEditando(curso);
    setFormData({
      nombre: curso.nombre || '',
      descripcion: curso.descripcion || '',
      costo: curso.costo || '',
      cupo_maximo: curso.cupo_maximo || '',
      minimo_estudiantes: curso.minimo_estudiantes || '',
      prerrequisitos: Array.isArray(curso.prerrequisitos) ? curso.prerrequisitos : [],
    });
    setModalEditar(true);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    const v = validateForm('crearCurso', formData);
    if (!v.isValid) { setError(v.firstError); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/cursos/crear`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ...formData, costo: Number(formData.costo), cupo_maximo: Number(formData.cupo_maximo), minimo_estudiantes: formData.minimo_estudiantes ? Number(formData.minimo_estudiantes) : 1 }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al crear'); }
      setExito('Curso creado correctamente.');
      setModalCrear(false);
      cargar();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const payload = { nombre: formData.nombre, descripcion: formData.descripcion, costo: Number(formData.costo), cupo_maximo: Number(formData.cupo_maximo), minimo_estudiantes: formData.minimo_estudiantes ? Number(formData.minimo_estudiantes) : 1 };
      const r1 = await fetch(`${API_BASE}/api/cursos/${cursoEditando.id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
      if (!r1.ok) { const d = await r1.json(); throw new Error(d.error || 'Error al actualizar'); }
      const r2 = await fetch(`${API_BASE}/api/cursos/${cursoEditando.id}/prerrequisitos`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ prerrequisitos: formData.prerrequisitos }) });
      if (!r2.ok) { const d = await r2.json(); throw new Error(d.error || 'Error al actualizar prerrequisitos'); }
      setExito('Curso actualizado correctamente.');
      setModalEditar(false);
      cargar();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleEliminar = async () => {
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/api/cursos/${modalEliminar.id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al eliminar'); }
      setExito('Curso eliminado correctamente.');
      setModalEliminar(null);
      cargar();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const filtrados = cursos.filter(c => {
    const t = busqueda.toLowerCase();
    return !t || c.nombre?.toLowerCase().includes(t) || c.descripcion?.toLowerCase().includes(t);
  });

  // Todos los cursos disponibles como prerrequisito (excluye el que se está editando)
  const opcionesPrerreq = cursos.filter(c => c.id !== cursoEditando?.id);

  

  return (
    <div className="admin-cursos-page">
      <UserHeaderDynamic />

      <main className="admin-cursos-main">
        <div className="admin-cursos-header">
          <div className="header-title-section">
            <button className="btn-back-circle" onClick={() => navigate('/admin')} title="Volver">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <div>
              <h1 className="admin-cursos-title">Gestión de Cursos</h1>
              <p className="admin-cursos-subtitle">Administra el catálogo de cursos extraacadémicos · {filtrados.length} curso{filtrados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="header-actions">
            <input className="ac-search" type="text" placeholder="Buscar curso..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            {canRegistrar && <button className="btn-add-curso" onClick={abrirCrear}>+ Nuevo Curso</button>}
          </div>
        </div>

        {error && !modalCrear && !modalEditar && <div className="admin-error-box">{error}</div>}
        {exito && <div className="admin-success-box">{exito}</div>}

        <div className="cursos-table-container">
          <table className="cursos-table">
            <thead>
              <tr>
                <th>Curso</th>
                <th>Costo</th>
                <th>Cupo</th>
                <th>Docente</th>
                <th>Prerrequisitos</th>
                {tieneAcciones && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={tieneAcciones ? 6 : 5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Cargando cursos...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No se encontraron cursos.</td></tr>
              ) : filtrados.map(curso => {
                const tieneDocente = !!curso.docente_nombre;
                const numPrereq = Array.isArray(curso.prerrequisitos) ? curso.prerrequisitos.length : 0;
                return (
                  <tr key={curso.id}>
                    <td>
                      <div className="font-bold">{curso.nombre}</div>
                      <div className="curso-table-desc">{curso.descripcion}</div>
                    </td>
                    <td>Bs. {Number(curso.costo).toFixed(2)}</td>
                    <td>{curso.cupo_maximo}</td>
                    <td>
                      {tieneDocente ? (
                        <span className="ac-badge ac-badge-docente">{curso.docente_nombre} {curso.docente_apellido}</span>
                      ) : (
                        <span className="ac-badge ac-badge-sin">Sin docente</span>
                      )}
                    </td>
                    <td>
                      {numPrereq > 0
                        ? <span className="ac-badge ac-badge-prereq">{numPrereq} prereq.</span>
                        : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                      }
                    </td>
                    {tieneAcciones && (
                      <td>
                        <div className="table-actions-cell">
                          {canModificar && <button className="btn-edit" onClick={() => abrirEditar(curso)}>Editar</button>}
                          {canModificar && <button className="btn-assign-teacher" onClick={() => navigate(`/admin/asignar-docente/${curso.id}`)}>Docente</button>}
                          {canEliminar  && <button className="btn-delete-curso" onClick={() => { setError(''); setExito(''); setModalEliminar(curso); }}>Eliminar</button>}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {modalCrear && (
        <FormCurso
          visible={modalCrear}
          titulo="Crear Nuevo Curso"
          onSubmit={handleCrear}
          onClose={() => { setModalCrear(false); setError(''); }}
          formData={formData}
          handleChange={handleChange}
          togglePrerrequisito={togglePrerrequisito}
          opcionesPrerreq={opcionesPrerreq}
          submitting={submitting}
          error={error}
        />
      )}
      {modalEditar && (
        <FormCurso
          visible={modalEditar}
          titulo={`Editar: ${cursoEditando?.nombre}`}
          onSubmit={handleEditar}
          onClose={() => { setModalEditar(false); setError(''); }}
          formData={formData}
          handleChange={handleChange}
          togglePrerrequisito={togglePrerrequisito}
          opcionesPrerreq={opcionesPrerreq}
          submitting={submitting}
          error={error}
        />
      )}

      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Curso</h2>
                <button type="button" className="close-modal" onClick={() => setModalEliminar(null)}>&times;</button>
            </div>
            <div style={{ padding: '1.75rem 2rem' }}>
              {error && <div className="admin-error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
              <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
                ¿Seguro que deseas eliminar <strong>{modalEliminar.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="form-actions" style={{ marginTop: 0 }}>
                <button className="btn-cancel" onClick={() => setModalEliminar(null)}>Cancelar</button>
                <button className="btn-submit" style={{ background: '#dc2626' }} disabled={submitting} onClick={handleEliminar}>
                  {submitting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdministrarCursos;

// Hoisted form component to avoid remounts on parent re-render
function FormCurso({ visible, onSubmit, titulo, onClose, formData, handleChange, togglePrerrequisito, opcionesPrerreq, submitting, error }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button type="button" className="close-modal" onClick={onClose}>&times;</button>
        </div>
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }}
          className="curso-form"
        >
          {error && <div className="admin-error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre del Curso</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Arquitectura de Software" />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Costo (Bs.)</label>
                <input type="number" step="0.01" name="costo" value={formData.costo} onChange={handleChange} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Cupo Máximo</label>
                <input type="number" name="cupo_maximo" value={formData.cupo_maximo} onChange={handleChange} required placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label>Mínimo de Estudiantes</label>
              <input type="number" min="1" name="minimo_estudiantes" value={formData.minimo_estudiantes} onChange={handleChange}
                placeholder={formData.cupo_maximo ? `Ej: ${Math.ceil(Number(formData.cupo_maximo) * 0.3)}` : '1'} />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required rows="6" placeholder="Describe brevemente el curso..." />
            </div>
            {opcionesPrerreq.length > 0 && (
              <div className="form-group">
                <label>Prerrequisitos</label>
                <div className="prerrequisitos-list">
                  {opcionesPrerreq.map(c => (
                    <label key={c.id} className={`prerrequisito-item ${formData.prerrequisitos.includes(c.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={formData.prerrequisitos.includes(c.id)} onChange={() => togglePrerrequisito(c.id)} />
                      <span>{c.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
