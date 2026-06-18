import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { getUsuarios, getUsuarioDetalle, desbloquearUsuario, deleteUser } from '../../services/rbacApi';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roleUtils';
import './AdminGestionUsuarios.css';

// ── Role badge styles ─────────────────────────────────────────────────────────
const ROL_BADGE = {
  [ROLES.ADMINISTRADOR]:   { bg: '#fef3c7', color: '#92400e' },
  [ROLES.ADMIN_CUENTAS]:   { bg: '#e0e7ff', color: '#3730a3' },
  [ROLES.ADMIN_SEGURIDAD]: { bg: '#fee2e2', color: '#991b1b' },
  [ROLES.ADMIN_CURSOS]:    { bg: '#d1fae5', color: '#065f46' },
  [ROLES.ADMIN_PAGOS]:     { bg: '#ede9fe', color: '#5b21b6' },
  [ROLES.ADMIN_REPORTES]:  { bg: '#fce7f3', color: '#9d174d' },
  [ROLES.DOCENTE]:         { bg: '#dbeafe', color: '#1e40af' },
  [ROLES.ESTUDIANTE]:      { bg: '#f0fdf4', color: '#166534' },
};

const rolBadgeStyle = (nombre) => {
  const s = ROL_BADGE[nombre] || { bg: '#f1f5f9', color: '#475569' };
  return { background: s.bg, color: s.color, padding: '0.25rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' };
};

const isBloqueado = (hasta) => hasta && new Date(hasta) > new Date();

export default function AdminGestionUsuarios() {
  const navigate = useNavigate();
  const { usuario: self } = useAuth();

  const misPermisos   = self?.permisos || [];
  const esGestor      = misPermisos.includes('usuarios:gestionar');
  const canEditar     = esGestor || misPermisos.includes('usuarios:editar');
  const canEliminar   = esGestor || misPermisos.includes('usuarios:eliminar');

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activos');

  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [submittingDel, setSubmittingDel] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const u = await getUsuarios({ includeInactive: true });
      setUsuarios(u);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesbloquear = async (u) => {
    setError(''); setSuccess('');
    try {
      await desbloquearUsuario(u.id);
      setSuccess(`${u.nombre} desbloqueado correctamente.`);
      cargar();
    } catch (err) {
      setError(err.message || 'Error al desbloquear');
    }
  };

  const handleEliminar = async () => {
    setSubmittingDel(true);
    setError('');
    try {
      await deleteUser(modalEliminar.id);
      setSuccess(`Usuario ${modalEliminar.nombre} eliminado.`);
      setModalEliminar(null);
      cargar();
    } catch (err) {
      setError(err.message || 'Error al eliminar usuario');
    } finally {
      setSubmittingDel(false);
    }
  };

  const handleVerDetalle = async (u) => {
    setError(''); setSuccess('');
    setLoadingDetalle(true);
    try {
      const detalle = await getUsuarioDetalle(u.id);
      setModalDetalle(detalle);
    } catch (err) {
      setError(err.message || 'Error al cargar el detalle del usuario');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const filtrados = usuarios.filter(u => {
    const texto = busqueda.toLowerCase();
    const coincideTexto = !texto ||
      u.nombre?.toLowerCase().includes(texto) ||
      u.apellido_paterno?.toLowerCase().includes(texto) ||
      u.email?.toLowerCase().includes(texto);
    const coincideRol = !filtroRol || u.rol_nombre === filtroRol;

    const bloqueado = isBloqueado(u.bloqueado_hasta);
    const inactivo = u.activo === false;
    let coincideEstado = true;

    if (filtroEstado === 'activos')    coincideEstado = !inactivo && !bloqueado;
    else if (filtroEstado === 'inactivos') coincideEstado = inactivo;
    else if (filtroEstado === 'bloqueados') coincideEstado = bloqueado && !inactivo;

    return coincideTexto && coincideRol && coincideEstado;
  });

  const rolesUnicos = [...new Set(usuarios.map(u => u.rol_nombre).filter(Boolean))].sort();

  return (
    <div className="admin-page">
      <UserHeaderDynamic />

      <main className="admin-main logs-main-wide">
        <div className="gu-container">

          {/* Header */}
          <div className="admin-usuarios-header">
            <div className="header-title-section">
              <button className="btn-back-circle" onClick={() => navigate('/admin')} title="Volver">
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <div>
                <h1 className="admin-usuarios-title">Gestión de Usuarios</h1>
                <p className="admin-usuarios-subtitle">Administra cuentas y accesos del sistema</p>
              </div>
            </div>
            <div className="gu-badge-count">{filtrados.length} usuario{filtrados.length !== 1 ? 's' : ''}</div>
          </div>

          {error   && <div className="admin-error-box"   style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div className="admin-success-box" style={{ marginBottom: '1rem' }}>{success}</div>}

          {/* Filtros */}
          <div className="gu-filtros">
            <input
              className="gu-search"
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <select className="gu-select" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
              <option value="">Todos los roles</option>
              {rolesUnicos.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="gu-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
              <option value="bloqueados">Solo bloqueados</option>
            </select>
          </div>

          {/* Tabla */}
          <div className="gu-table-wrapper">
            <table className="gu-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="gu-table-empty">Cargando usuarios...</td></tr>
                ) : filtrados.length === 0 ? (
                  <tr><td colSpan="6" className="gu-table-empty">No se encontraron usuarios.</td></tr>
                ) : filtrados.map(u => {
                  const bloqueado = isBloqueado(u.bloqueado_hasta);
                  const inactivo  = u.activo === false;
                  const esSelf    = self && String(u.id) === String(self.id);
                  return (
                    <tr key={u.id}>
                      {/* Nombre */}
                      <td>
                        <div className="docente-avatar-cell">
                          <button
                            type="button"
                            className="mini-avatar mini-avatar-button"
                            style={{ background: esSelf ? '#fef3c7' : '#eef2ff', color: esSelf ? '#92400e' : '#4f46e5' }}
                            onClick={() => handleVerDetalle(u)}
                            title="Ver detalle"
                            disabled={loadingDetalle}
                          >
                            {u.nombre?.charAt(0)?.toUpperCase()}
                          </button>
                          <div>
                            <button
                              type="button"
                              className="gu-user-name-link"
                              onClick={() => handleVerDetalle(u)}
                              disabled={loadingDetalle}
                            >
                              {u.nombre} {u.apellido_paterno}
                            </button>
                            {esSelf && <div className="gu-self-label">(tú)</div>}
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="gu-email-cell">{u.email}</td>

                      {/* Email verificado */}
                      <td>
                        {u.email_verificado
                          ? <span className="gu-badge-verified"><i className="fa-solid fa-check"></i>Verificado</span>
                          : <span className="gu-badge-unverified"><i className="fa-solid fa-xmark"></i>Pendiente</span>
                        }
                      </td>

                      {/* Rol */}
                      <td><span style={rolBadgeStyle(u.rol_nombre)}>{u.rol_nombre || '—'}</span></td>

                      {/* Estado */}
                      <td>
                        {inactivo
                          ? <span className="gu-badge-inactive">Inactivo</span>
                          : bloqueado
                            ? <span className="gu-badge-blocked">Bloqueado</span>
                            : <span className="gu-badge-active">Activo</span>
                        }
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="gu-actions">
                          <button
                            className="gu-icon-btn gu-icon-btn--view"
                            onClick={() => handleVerDetalle(u)}
                            title="Ver detalle"
                            disabled={loadingDetalle}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>

                          {bloqueado && !inactivo && canEditar && (
                            <button
                              className="gu-icon-btn gu-icon-btn--unlock"
                              onClick={() => handleDesbloquear(u)}
                              title="Desbloquear cuenta"
                            >
                              <i className="fa-solid fa-lock-open"></i>
                            </button>
                          )}

                          {!esSelf && !inactivo && canEliminar && (
                            <button
                              className="gu-icon-btn gu-icon-btn--delete"
                              onClick={() => setModalEliminar(u)}
                              title="Eliminar usuario"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Confirmar Eliminación */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => setModalEliminar(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eliminar Usuario</h2>
              <button className="close-modal" onClick={() => setModalEliminar(null)}>&times;</button>
            </div>
            <div style={{ padding: '1.75rem 2rem' }}>
              <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
                ¿Seguro que deseas eliminar a <strong>{modalEliminar.nombre} {modalEliminar.apellido_paterno}</strong>?
                Esta acción no se puede deshacer.
              </p>
              <div className="form-actions" style={{ marginTop: 0 }}>
                <button type="button" className="btn-cancel" onClick={() => setModalEliminar(null)}>Cancelar</button>
                <button
                  type="button"
                  className="btn-submit"
                  style={{ background: '#dc2626' }}
                  disabled={submittingDel}
                  onClick={handleEliminar}
                >
                  {submittingDel ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {modalDetalle && (
        <div className="modal-overlay" onClick={() => setModalDetalle(null)}>
          <div className="modal-content user-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Perfil detallado de usuario</h2>
              <button type="button" className="close-modal" onClick={() => setModalDetalle(null)}>&times;</button>
            </div>
            <div className="user-detail-body">
              <div className="user-detail-hero">
                <div className="user-detail-avatar">
                  {modalDetalle.nombre?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="user-detail-name">{modalDetalle.nombre} {modalDetalle.apellido_paterno}</div>
                  <div className="user-detail-email">{modalDetalle.email}</div>
                </div>
              </div>

              <div className="user-detail-grid">
                <div className="user-detail-item">
                  <span>Rol</span>
                  <strong>{modalDetalle.rol_nombre || '—'}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Estado</span>
                  <strong>{modalDetalle.activo === false ? 'Inactivo' : 'Activo'}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Email verificado</span>
                  <strong>{modalDetalle.email_verificado ? 'Sí' : 'No'}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Fecha de creación</span>
                  <strong>{modalDetalle.fecha_creacion ? new Date(modalDetalle.fecha_creacion).toLocaleString() : '—'}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Intentos fallidos</span>
                  <strong>{modalDetalle.intentos_fallidos ?? 0}</strong>
                </div>
                <div className="user-detail-item">
                  <span>Bloqueado hasta</span>
                  <strong>{modalDetalle.bloqueado_hasta ? new Date(modalDetalle.bloqueado_hasta).toLocaleString() : '—'}</strong>
                </div>
              </div>

              <div className="form-actions user-detail-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
