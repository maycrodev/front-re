// navConfig.js — Single source of truth for admin navigation.
import { PERMISSIONS } from './roleUtils';

export const NAV_LINKS = [
  { id: 'inicio',           path: '/admin',                     label: 'Inicio',               exact: true, permiso: null },
  { id: 'cuentas',          path: '/admin/cuentas',             label: 'Crear Cuenta',                      permiso: [PERMISSIONS.USUARIOS_CREAR, PERMISSIONS.USUARIOS_GESTIONAR] },
  { id: 'gestion-usuarios', path: '/admin/gestion-usuarios',    label: 'Gestión Usuarios',                  permiso: [PERMISSIONS.USUARIOS_VER, PERMISSIONS.USUARIOS_EDITAR, PERMISSIONS.USUARIOS_ELIMINAR, PERMISSIONS.USUARIOS_GESTIONAR] },
  { id: 'roles',            path: '/admin/seguridad/roles',     label: 'Roles y Permisos',                  permiso: [PERMISSIONS.ROLES_GESTIONAR, PERMISSIONS.ROLES_VER, PERMISSIONS.ROLES_CREAR, PERMISSIONS.ROLES_MODIFICAR, PERMISSIONS.ROLES_ELIMINAR] },
  { id: 'cursos',           path: '/admin/cursos',              label: 'Cursos',                            permiso: [PERMISSIONS.CURSOS_VER, PERMISSIONS.CURSOS_REGISTRAR, PERMISSIONS.CURSOS_MODIFICAR, PERMISSIONS.CURSOS_ELIMINAR, PERMISSIONS.CURSOS_GESTIONAR] },
  { id: 'inscripciones',    path: '/admin/inscripciones',       label: 'Inscripciones',                     permiso: [PERMISSIONS.INSCRIPCIONES_VER, PERMISSIONS.INSCRIPCIONES_GESTIONAR] },
  { id: 'pagos',            path: '/admin/pagos',               label: 'Pagos',                             permiso: PERMISSIONS.PAGOS_VER },
  { id: 'reportes',         path: '/admin/reportes',            label: 'Reportes',                          permiso: PERMISSIONS.REPORTES_VER },
  { id: 'logs-aplicacion',  path: '/admin/logs-aplicacion',     label: 'Logs Aplicación',                   permiso: PERMISSIONS.LOGS_APLICACION_VER },
  { id: 'logs-seguridad',   path: '/admin/logs-seguridad',      label: 'Logs Seguridad',                    permiso: PERMISSIONS.LOGS_SEGURIDAD_VER },
  { id: 'riesgos',          path: '/admin/riesgos',             label: 'Riesgos',                           permiso: PERMISSIONS.RIESGOS_VER },
  { id: 'matriz-riesgos',   path: '/admin/matriz-riesgos',      label: 'Matriz de Riesgos',                 permiso: [PERMISSIONS.RIESGOS_VER, PERMISSIONS.RIESGOS_GESTIONAR, PERMISSIONS.MATRIZ_VER, PERMISSIONS.MATRIZ_AGREGAR, PERMISSIONS.MATRIZ_EDITAR, PERMISSIONS.MATRIZ_ELIMINAR] },
];

export const MENU_CARDS = [
  {
    id: 'cuentas',
    path: '/admin/cuentas',
    icon: '👤',
    title: 'Crear Cuenta',
    desc: 'Registra cuentas para estudiantes y docentes.',
    color: '#0ea5e9',
    permiso: [PERMISSIONS.USUARIOS_CREAR, PERMISSIONS.USUARIOS_GESTIONAR],
  },
  {
    id: 'gestion-usuarios',
    path: '/admin/gestion-usuarios',
    icon: '👥',
    title: 'Gestión de Usuarios',
    desc: 'Lista, edita, desbloquea, cambia roles y elimina usuarios.',
    color: '#4f46e5',
    permiso: [PERMISSIONS.USUARIOS_VER, PERMISSIONS.USUARIOS_EDITAR, PERMISSIONS.USUARIOS_ELIMINAR, PERMISSIONS.USUARIOS_GESTIONAR],
  },
  {
    id: 'roles',
    path: '/admin/seguridad/roles',
    icon: '🔐',
    title: 'Roles y Permisos',
    desc: 'Gestiona roles y controla el acceso por función.',
    color: '#dc2626',
    permiso: [PERMISSIONS.ROLES_GESTIONAR, PERMISSIONS.ROLES_VER, PERMISSIONS.ROLES_CREAR, PERMISSIONS.ROLES_MODIFICAR, PERMISSIONS.ROLES_ELIMINAR],
  },
  {
    id: 'cursos',
    path: '/admin/cursos',
    icon: '📚',
    title: 'Gestión de Cursos',
    desc: 'Crea, edita y asigna docentes a cursos.',
    color: '#0891b2',
    permiso: [PERMISSIONS.CURSOS_VER, PERMISSIONS.CURSOS_REGISTRAR, PERMISSIONS.CURSOS_MODIFICAR, PERMISSIONS.CURSOS_ELIMINAR, PERMISSIONS.CURSOS_GESTIONAR],
  },
  {
    id: 'inscripciones',
    path: '/admin/inscripciones',
    icon: '📋',
    title: 'Inscripciones',
    desc: 'Monitorea inscripciones y estado académico.',
    color: '#f59e0b',
    permiso: [PERMISSIONS.INSCRIPCIONES_VER, PERMISSIONS.INSCRIPCIONES_GESTIONAR],
  },
  {
    id: 'pagos',
    path: '/admin/pagos',
    icon: '💳',
    title: 'Pagos',
    desc: 'Consulta historial de pagos y comprobantes.',
    color: '#8b5cf6',
    permiso: PERMISSIONS.PAGOS_VER,
  },
  {
    id: 'reportes',
    path: '/admin/reportes',
    icon: '📊',
    title: 'Reportes',
    desc: 'Genera y descarga reportes del sistema.',
    color: '#ef4444',
    permiso: PERMISSIONS.REPORTES_VER,
  },
  {
    id: 'logs-aplicacion',
    path: '/admin/logs-aplicacion',
    icon: '📈',
    title: 'Logs Aplicación',
    desc: 'Consulta eventos de funcionalidades críticas.',
    color: '#0ea5e9',
    permiso: PERMISSIONS.LOGS_APLICACION_VER,
  },
  {
    id: 'logs-seguridad',
    path: '/admin/logs-seguridad',
    icon: '🛡️',
    title: 'Logs Seguridad',
    desc: 'Consulta logins, bloqueos y reseteos.',
    color: '#f59e0b',
    permiso: PERMISSIONS.LOGS_SEGURIDAD_VER,
  },
  {
    id: 'riesgos',
    path: '/admin/riesgos',
    icon: '☣️',
    title: 'Gestión de Riesgos',
    desc: 'Detecta incidentes de seguridad, gestiona planes de mitigación.',
    color: '#b91c1c',
    permiso: PERMISSIONS.RIESGOS_VER,
  },
  {
    id: 'matriz-riesgos',
    path: '/admin/matriz-riesgos',
    icon: '📊',
    title: 'Matriz de Riesgos',
    desc: 'Efectúa el análisis, mitigación y control del riesgo residual.',
    color: '#8bc63f',
    permiso: [PERMISSIONS.RIESGOS_VER, PERMISSIONS.RIESGOS_GESTIONAR, PERMISSIONS.MATRIZ_VER, PERMISSIONS.MATRIZ_AGREGAR, PERMISSIONS.MATRIZ_EDITAR, PERMISSIONS.MATRIZ_ELIMINAR],
  },
];

// Returns true if the user's permissions include the required one.
// permiso === null  → siempre visible para cualquier usuario autenticado.
// permiso = string  → debe tener ese permiso.
// permiso = array   → basta con tener AL MENOS UNO (útil para módulos con
//                     permisos granulares, p.ej. cursos:registrar/modificar/...).
export const tieneAcceso = (permisos, permiso) => {
  if (permiso === null || permiso === undefined) return true;
  if (!Array.isArray(permisos)) return false;
  if (Array.isArray(permiso)) return permiso.some((p) => permisos.includes(p));
  return permisos.includes(permiso);
};
