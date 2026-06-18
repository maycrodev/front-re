import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UserHeaderDynamic from '../../layout/UserHeaderDynamic';
import Footer from '../../layout/footerPrincipal';
import rbacApi from '../../../services/rbacApi';
import { useAuth } from '../../../context/AuthContext';
import './GestionRoles.css';

const TAB = { ROLES: 0, MATRIZ: 1, USUARIOS: 2 };

import { PERMISSIONS } from '../../../utils/roleUtils';

// ── Permission groups ─────────────────────────────────────────────────────
const GRUPOS = [
  {
    key: 'usuarios',
    icon: '👥',
    label: 'Gestión de Usuarios',
    desc: 'Permisos granulares: ver, crear, editar y eliminar usuarios',
    permisos: [
      PERMISSIONS.USUARIOS_VER,
      PERMISSIONS.USUARIOS_CREAR,
      PERMISSIONS.USUARIOS_EDITAR,
      PERMISSIONS.USUARIOS_ELIMINAR,
    ],
  },
  {
    key: 'roles',
    icon: '🔐',
    label: 'Roles y Permisos',
    desc: 'Ver, crear, modificar y eliminar roles; asignar o revocar permisos',
    permisos: [
      PERMISSIONS.ROLES_VER,
      PERMISSIONS.ROLES_CREAR,
      PERMISSIONS.ROLES_MODIFICAR,
      PERMISSIONS.ROLES_ELIMINAR,
    ],
  },
  {
    key: 'cursos',
    icon: '📚',
    label: 'Cursos',
    desc: 'Permisos granulares: ver, registrar, modificar y eliminar cursos',
    permisos: [
      PERMISSIONS.CURSOS_VER,
      PERMISSIONS.CURSOS_REGISTRAR,
      PERMISSIONS.CURSOS_MODIFICAR,
      PERMISSIONS.CURSOS_ELIMINAR,
    ],
  },
  {
    key: 'inscripciones',
    icon: '📋',
    label: 'Inscripciones',
    desc: 'Solo lectura (ver resumen) o gestión completa de inscripciones',
    permisos: [PERMISSIONS.INSCRIPCIONES_VER, PERMISSIONS.INSCRIPCIONES_GESTIONAR],
  },
  {
    key: 'pagos',
    icon: '💳',
    label: 'Pagos',
    desc: 'Consulta de pagos y comprobantes (solo lectura)',
    permisos: [PERMISSIONS.PAGOS_VER],
  },
  {
    key: 'reportes',
    icon: '📊',
    label: 'Reportes',
    desc: 'Generar y descargar reportes del sistema',
    permisos: [PERMISSIONS.REPORTES_VER],
  },
  {
    key: 'logs_aplicacion',
    icon: '📊',
    label: 'Logs de Aplicación',
    desc: 'Consultar eventos de funcionalidades críticas (solo lectura)',
    permisos: [PERMISSIONS.LOGS_APLICACION_VER],
  },
  {
    key: 'logs_seguridad',
    icon: '🛡️',
    label: 'Logs de Seguridad',
    desc: 'Consultar inicios de sesión, intentos fallidos y bloqueos (solo lectura)',
    permisos: [PERMISSIONS.LOGS_SEGURIDAD_VER],
  },
  {
    key: 'riesgos',
    icon: '☣️',
    label: 'Gestión de Riesgos',
    desc: 'Ver catálogo de riesgos y registros detectados; gestionar planes de acción',
    permisos: [PERMISSIONS.RIESGOS_VER, PERMISSIONS.RIESGOS_GESTIONAR],
  },
  {
    key: 'matriz',
    icon: '📊',
    label: 'Matriz de Riesgos',
    desc: 'Ver, agregar, editar y eliminar entradas de la matriz de riesgos',
    permisos: [
      PERMISSIONS.MATRIZ_VER,
      PERMISSIONS.MATRIZ_AGREGAR,
      PERMISSIONS.MATRIZ_EDITAR,
      PERMISSIONS.MATRIZ_ELIMINAR,
    ],
  },
  {
    key: 'estudiante',
    icon: '🎓',
    label: 'Acceso Estudiante',
    desc: 'Ver catálogo, inscribirse, ver y realizar pagos, ver calificaciones',
    permisos: [PERMISSIONS.USUARIO_ESTUDIANTE],
  },
  {
    key: 'docente',
    icon: '🏫',
    label: 'Acceso Docente',
    desc: 'Gestionar cursos asignados, registrar y ver calificaciones',
    permisos: [PERMISSIONS.USUARIO_DOCENTE],
  },
];

const PERMISO_LABEL = {
  [PERMISSIONS.USUARIOS_GESTIONAR]:      'Gestión completa de usuarios',
  [PERMISSIONS.USUARIOS_VER]:            'Ver usuarios (listado y detalle)',
  [PERMISSIONS.USUARIOS_CREAR]:          'Registrar (crear) cuentas de usuario',
  [PERMISSIONS.USUARIOS_EDITAR]:         'Modificar usuarios (cambiar rol, desbloquear)',
  [PERMISSIONS.USUARIOS_ELIMINAR]:       'Eliminar (desactivar) usuarios',
  [PERMISSIONS.ROLES_GESTIONAR]:         'Gestión completa de roles y permisos',
  [PERMISSIONS.ROLES_VER]:               'Ver roles y permisos (solo lectura)',
  [PERMISSIONS.ROLES_CREAR]:             'Crear nuevos roles',
  [PERMISSIONS.ROLES_MODIFICAR]:         'Modificar roles y asignar permisos',
  [PERMISSIONS.ROLES_ELIMINAR]:          'Eliminar roles',
  [PERMISSIONS.CURSOS_GESTIONAR]:        'Gestión completa de cursos (CRUD)',
  [PERMISSIONS.CURSOS_VER]:              'Solo visualizar cursos',
  [PERMISSIONS.CURSOS_REGISTRAR]:        'Registrar (crear) cursos',
  [PERMISSIONS.CURSOS_MODIFICAR]:        'Modificar cursos (datos, prerreq., docente)',
  [PERMISSIONS.CURSOS_ELIMINAR]:         'Eliminar cursos',
  [PERMISSIONS.INSCRIPCIONES_VER]:       'Ver inscripciones (solo lectura)',
  [PERMISSIONS.INSCRIPCIONES_GESTIONAR]: 'Gestión completa de inscripciones',
  [PERMISSIONS.PAGOS_VER]:               'Ver pagos (solo lectura)',
  [PERMISSIONS.REPORTES_VER]:            'Ver y descargar reportes',
  [PERMISSIONS.LOGS_APLICACION_VER]:     'Ver logs de aplicación',
  [PERMISSIONS.LOGS_SEGURIDAD_VER]:      'Ver logs de seguridad',
  [PERMISSIONS.RIESGOS_VER]:             'Ver catálogo y registros de riesgos',
  [PERMISSIONS.RIESGOS_GESTIONAR]:       'Gestión completa de riesgos y planes de acción',
  [PERMISSIONS.MATRIZ_VER]:              'Ver matriz de riesgos (solo lectura)',
  [PERMISSIONS.MATRIZ_AGREGAR]:          'Agregar activos y amenazas a la matriz',
  [PERMISSIONS.MATRIZ_EDITAR]:           'Editar entradas de la matriz de riesgos',
  [PERMISSIONS.MATRIZ_ELIMINAR]:         'Eliminar activos de la matriz de riesgos',
  [PERMISSIONS.USUARIO_ESTUDIANTE]:      'Acceso completo de estudiante',
  [PERMISSIONS.USUARIO_DOCENTE]:         'Acceso completo de docente',
};

const rolEstadoBadgeStyle = (activo) => activo
  ? { background: '#dcfce7', color: '#166534' }
  : { background: '#e2e8f0', color: '#475569' };

const accionLabel = (permiso) => PERMISO_LABEL[permiso] || permiso;

// How many permissions a role has in a given group
const countInGroup = (rolPermisos, grupo) =>
  grupo.permisos.filter((p) => rolPermisos.includes(p)).length;

// Total permissions available across all groups
const TOTAL_PERMISOS = GRUPOS.reduce((s, g) => s + g.permisos.length, 0);

// ─────────────────────────────────────────────────────────────────────────────

const GestionRoles = () => {
  const { usuario } = useAuth();
  const misPermisos = usuario?.permisos || [];

  // Backward-compat: roles:gestionar implica todos los sub-permisos
  const esGestorTotal = misPermisos.includes(PERMISSIONS.ROLES_GESTIONAR);
  const canCreate   = esGestorTotal || misPermisos.includes(PERMISSIONS.ROLES_CREAR);
  const canModify   = esGestorTotal || misPermisos.includes(PERMISSIONS.ROLES_MODIFICAR);
  const canDelete   = esGestorTotal || misPermisos.includes(PERMISSIONS.ROLES_ELIMINAR);

  const [tab, setTab] = useState(TAB.ROLES);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);   // all permission objects {id, nombre}
  const [matriz, setMatriz] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [msgExito, setMsgExito] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // New-role form
  const [showNuevoRol, setShowNuevoRol] = useState(false);
  const [nuevoRol, setNuevoRol] = useState({ nombre: '', descripcion: '' });

  // Role editor (right panel)
  const [selectedRol, setSelectedRol] = useState(null);     // role object being edited
  const [localPermisos, setLocalPermisos] = useState([]);    // current toggle state
  const [originalPermisos, setOriginalPermisos] = useState([]); // baseline for cancel
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Load ────────────────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [r, p, m, u] = await Promise.all([
        rbacApi.getRoles({ includeInactive: mostrarInactivos }),
        rbacApi.getPermisos({ includeInactive: mostrarInactivos }),
        rbacApi.getMatriz(),
        rbacApi.getUsuarios({ includeInactive: true }),
      ]);
      setRoles(r);
      setPermisos(p);
      setMatriz(m);
      setUsuarios(u);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [mostrarInactivos]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Editor helpers ───────────────────────────────────────────────────────────
  const openEditor = (rol) => {
    const perms = Array.isArray(rol.permisos) ? [...rol.permisos] : [];
    setSelectedRol(rol);
    setLocalPermisos(perms);
    setOriginalPermisos(perms);
    setSaveError('');
  };

  const closeEditor = () => {
    setSelectedRol(null);
    setLocalPermisos([]);
    setOriginalPermisos([]);
    setSaveError('');
  };

  const togglePerm = (nombre) => {
    setLocalPermisos((prev) =>
      prev.includes(nombre) ? prev.filter((p) => p !== nombre) : [...prev, nombre]
    );
  };

  const toggleGroup = (grupo) => {
    const all = grupo.permisos;
    const hasAll = all.every((p) => localPermisos.includes(p));
    if (hasAll) {
      setLocalPermisos((prev) => prev.filter((p) => !all.includes(p)));
    } else {
      setLocalPermisos((prev) => [...new Set([...prev, ...all])]);
    }
  };

  const isDirty = useMemo(() => {
    if (!selectedRol) return false;
    const added   = localPermisos.filter((p) => !originalPermisos.includes(p));
    const removed = originalPermisos.filter((p) => !localPermisos.includes(p));
    return added.length > 0 || removed.length > 0;
  }, [localPermisos, originalPermisos, selectedRol]);

  const handleSave = async () => {
    if (!window.confirm(`¿Estás seguro de que deseas guardar los cambios de permisos para el rol "${selectedRol.nombre}"?`)) {
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const findId = (name) => permisos.find((p) => p.nombre === name)?.id;

      const toAdd    = localPermisos.filter((p) => !originalPermisos.includes(p));
      const toRemove = originalPermisos.filter((p) => !localPermisos.includes(p));

      await Promise.all([
        ...toAdd.map((name) => {
          const id = findId(name);
          return id ? rbacApi.assignPermiso(selectedRol.id, id) : Promise.resolve();
        }),
        ...toRemove.map((name) => {
          const id = findId(name);
          return id ? rbacApi.removePermiso(selectedRol.id, id) : Promise.resolve();
        }),
      ]);

      setOriginalPermisos([...localPermisos]);
      setMsgExito(`Permisos de "${selectedRol.nombre}" guardados correctamente.`);
      setTimeout(() => setMsgExito(''), 4000);
      // Refresh roles list silently (no spinner)
      rbacApi.getRoles().then(setRoles).catch(() => {});
      closeEditor();
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditor = () => {
    setLocalPermisos([...originalPermisos]);
    closeEditor();
  };

  // ── Role CRUD ────────────────────────────────────────────────────────────────
  const handleCrearRol = async (e) => {
    e.preventDefault();
    try {
      await rbacApi.createRole(nuevoRol);
      setNuevoRol({ nombre: '', descripcion: '' });
      setShowNuevoRol(false);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEliminarRol = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el rol "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      if (selectedRol?.id === id) closeEditor();
      await rbacApi.deleteRole(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  // ── Users ────────────────────────────────────────────────────────────────────
  const handleCambiarRol = async (userId, rolId) => {
    try {
      await rbacApi.updateUserRole(userId, rolId);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDesbloquear = async (userId) => {
    try {
      await rbacApi.desbloquearUsuario(userId);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.apellido_paterno} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="gr-page">
      <UserHeaderDynamic />

      <main className="gr-main">
        {/* Banner */}
        <div className="gr-banner">
          <div className="gr-breadcrumb">
            <a href="/admin">Panel Admin</a>
            <span className="sep">›</span>
            <span>Seguridad</span>
            <span className="sep">›</span>
            <span>Roles y Permisos</span>
          </div>
          <h1>Gestión de <span>Roles y Permisos</span></h1>
          <p>Configura roles, agrupa funciones del sistema y controla el acceso de cada usuario.</p>
        </div>

        <div className="gr-body">
          {error    && <div className="gr-error">{error}</div>}
          {msgExito && <div className="gr-success">✓ {msgExito}</div>}

          {/* Tabs */}
          <div className="gr-tabs">
            <button className={`gr-tab${tab === TAB.ROLES ? ' active' : ''}`} onClick={() => setTab(TAB.ROLES)}>
              Roles y Permisos
            </button>
            <button className={`gr-tab${tab === TAB.MATRIZ ? ' active' : ''}`} onClick={() => setTab(TAB.MATRIZ)}>
              Matriz de Accesos
            </button>
            <button className={`gr-tab${tab === TAB.USUARIOS ? ' active' : ''}`} onClick={() => setTab(TAB.USUARIOS)}>
              Usuarios y Roles
            </button>
          </div>

          {cargando && <div className="gr-loading">Cargando...</div>}

          {/* ── TAB 1: Roles ─────────────────────────────────────────────────── */}
          {tab === TAB.ROLES && !cargando && (
            <div>
              {/* Header + New Role button */}
              <div className="gr-section-header">
                <h2>Roles ({roles.length})</h2>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={mostrarInactivos}
                      onChange={(e) => setMostrarInactivos(e.target.checked)}
                    />
                    Mostrar inactivos
                  </label>
                  {canCreate && (
                    <button className="gr-btn-primary" onClick={() => setShowNuevoRol(!showNuevoRol)}>
                      {showNuevoRol ? '✕ Cancelar' : '+ Nuevo Rol'}
                    </button>
                  )}
                </div>
              </div>

              {showNuevoRol && (
                <form onSubmit={handleCrearRol} className="gr-new-role-form">
                  <input
                    className="gr-input"
                    placeholder="Nombre del rol (ej: ADMIN_VENTAS)"
                    value={nuevoRol.nombre}
                    onChange={(e) => setNuevoRol({ ...nuevoRol, nombre: e.target.value.toUpperCase() })}
                    required
                  />
                  <input
                    className="gr-input"
                    style={{ flex: 2 }}
                    placeholder="Descripción del rol (opcional)"
                    value={nuevoRol.descripcion}
                    onChange={(e) => setNuevoRol({ ...nuevoRol, descripcion: e.target.value })}
                  />
                  <button type="submit" className="gr-btn-save">Crear rol</button>
                </form>
              )}

              {/* Split: role list + editor */}
              <div className={`gr-split ${selectedRol ? 'with-editor' : 'no-editor'}`}>

                {/* Left — role cards */}
                <div>
                  {roles.map((rol) => {
                    const rolPerms = Array.isArray(rol.permisos) ? rol.permisos : [];
                    const pct = Math.round((rolPerms.length / TOTAL_PERMISOS) * 100);
                    const isSelected = selectedRol?.id === rol.id;

                    // Which groups this role has at least one perm in
                    const activeGroups = GRUPOS.filter((g) => countInGroup(rolPerms, g) > 0);

                    return (
                      <div key={rol.id} className={`gr-role-card ${isSelected ? 'selected' : ''}`}>
                        <div className="gr-role-top">
                          <div className="gr-role-title">
                            <div>
                              <div className="gr-role-name-row">
                                <div className="gr-role-name">{rol.nombre}</div>
                                <span className="gr-role-state" style={rolEstadoBadgeStyle(rol.activo !== false)}>
                                  {rol.activo === false ? 'Inactivo' : 'Activo'}
                                </span>
                              </div>
                              {rol.descripcion && (
                                <div className="gr-role-desc">{rol.descripcion}</div>
                              )}
                            </div>
                          </div>
                          <div className="gr-role-actions">
                            {canModify && (
                              <button
                                className={`gr-btn-detail ${isSelected ? 'active' : ''}`}
                                onClick={() => isSelected ? closeEditor() : openEditor(rol)}
                              >
                                {isSelected ? '✕ Cerrar' : 'Editar permisos →'}
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="gr-btn-danger"
                                onClick={() => handleEliminarRol(rol.id, rol.nombre)}
                                disabled={rol.activo === false}
                              >
                                {rol.activo === false ? 'Inactivo' : 'Eliminar'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Permission fill bar */}
                        <div className="gr-perm-bar-wrap">
                          <div className="gr-perm-bar-info">
                            <span>{rolPerms.length} de {TOTAL_PERMISOS} funciones activas</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="gr-perm-bar-track">
                            <div className="gr-perm-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Group tags */}
                        <div className="gr-group-tags">
                          {GRUPOS.map((g) => {
                            const n = countInGroup(rolPerms, g);
                            return (
                              <span key={g.key} className={`gr-group-tag ${n > 0 ? 'has-perms' : ''}`}>
                                {g.icon} {g.label.split(' ').slice(-1)[0]}
                                {n > 0 && ` (${n}/${g.permisos.length})`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right — editor panel */}
                {selectedRol && (
                  <div className="gr-editor">
                    <div className="gr-editor-header">
                      <div>
                        <div className="gr-editor-title">{selectedRol.nombre}</div>
                        <div className="gr-editor-subtitle">
                          {localPermisos.length} funciones activas · haz clic en los grupos para activarlos
                        </div>
                      </div>
                      <button className="gr-editor-close" onClick={handleCancelEditor} title="Cerrar sin guardar">✕</button>
                    </div>

                    {isDirty && (
                      <div className="gr-dirty-banner">
                        ⚠ Cambios sin guardar
                      </div>
                    )}

                    {saveError && (
                      <div className="gr-error" style={{ margin: '0.75rem 1.4rem 0' }}>
                        {saveError}
                      </div>
                    )}

                    <div className="gr-editor-body">
                      {GRUPOS.map((grupo) => {
                        const active = grupo.permisos.filter((p) => localPermisos.includes(p)).length;
                        const total  = grupo.permisos.length;
                        const allOn  = active === total;

                        return (
                          <div key={grupo.key} className="gr-group">
                            <div className="gr-group-header" onClick={() => toggleGroup(grupo)}>
                              <div className="gr-group-header-left">
                                <span className="gr-group-icon">{grupo.icon}</span>
                                <span className="gr-group-label">{grupo.label}</span>
                                <span className={`gr-group-count ${active === 0 ? 'none' : allOn ? 'full' : ''}`}>
                                  {active}/{total}
                                </span>
                              </div>
                              <button
                                className="gr-group-toggle-all"
                                onClick={(e) => { e.stopPropagation(); toggleGroup(grupo); }}
                              >
                                {allOn ? 'Quitar todo' : 'Activar todo'}
                              </button>
                            </div>

                            <div className="gr-perms-grid">
                              {grupo.permisos.map((nombre) => {
                                const checked  = localPermisos.includes(nombre);
                                const changed  = checked !== originalPermisos.includes(nombre);
                                return (
                                  <label
                                    key={nombre}
                                    className={`gr-perm-row ${changed ? 'changed' : ''}`}
                                    onClick={(e) => { e.preventDefault(); togglePerm(nombre); }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => togglePerm(nombre)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="gr-perm-row-label">
                                      {accionLabel(nombre)}
                                      {changed && <span style={{ marginLeft: 4, fontSize: '0.65rem' }}>●</span>}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="gr-editor-footer">
                      <button className="gr-btn-cancel" onClick={handleCancelEditor} disabled={saving}>
                        Cancelar
                      </button>
                      <button
                        className="gr-btn-save"
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                      >
                        {saving ? 'Guardando...' : '💾 Guardar cambios'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: Matriz ────────────────────────────────────────────────── */}
          {tab === TAB.MATRIZ && !cargando && matriz && (
            <div>
              <div className="gr-section-header">
                <h2>Matriz de Accesos</h2>
              </div>
              <div className="gr-matrix-wrap">
                <table className="gr-matrix">
                  <thead>
                    <tr>
                      <th>Rol \ Permiso</th>
                      {matriz.permisos.map((p) => <th key={p}>{p}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {matriz.roles.map((rol) => (
                      <tr key={rol}>
                        <td>{rol}</td>
                        {matriz.permisos.map((p) => (
                          <td key={p}>
                            {matriz.matriz[rol]?.[p]
                              ? <span className="gr-cell-on">✓</span>
                              : <span className="gr-cell-off">✗</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 3: Usuarios ──────────────────────────────────────────────── */}
          {tab === TAB.USUARIOS && !cargando && (
            <div>
              <div className="gr-section-header">
                <h2>Usuarios ({usuariosFiltrados.length})</h2>
                <input
                  className="gr-search"
                  placeholder="Buscar por nombre o correo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div className="gr-table-wrap">
                <table className="gr-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo</th>
                      <th>Rol actual</th>
                      <th>Cambiar rol</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u) => {
                      const bloqueado = u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date();
                      return (
                        <tr key={u.id}>
                          <td>{u.nombre} {u.apellido_paterno}</td>
                          <td>{u.email}</td>
                          <td><span className="gr-badge-rol">{u.rol_nombre || '—'}</span></td>
                          <td>
                            <select
                              className="gr-select-rol"
                              value={u.rol_id || ''}
                              onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.nombre}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {!u.activo ? (
                              <span className="gr-inactive-label">⏸ Inactivo</span>
                            ) : bloqueado ? (
                              <button
                                className="gr-btn-unlock"
                                onClick={() => handleDesbloquear(u.id)}
                                title={`Bloqueado hasta ${new Date(u.bloqueado_hasta).toLocaleString()}`}
                              >
                                🔒 Desbloquear
                              </button>
                            ) : (
                              <span className="gr-active-label">✓ Activo</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GestionRoles;