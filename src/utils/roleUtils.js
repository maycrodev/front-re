export const PERMISSIONS = {
  // Usuarios — granulares + legacy "gestionar" (respaldo)
  USUARIOS_GESTIONAR:      'usuarios:gestionar',
  USUARIOS_VER:            'usuarios:ver',
  USUARIOS_CREAR:          'usuarios:crear',
  USUARIOS_EDITAR:         'usuarios:editar',
  USUARIOS_ELIMINAR:       'usuarios:eliminar',
  ROLES_GESTIONAR:         'roles:gestionar',
  // Cursos — granulares + legacy "gestionar" (respaldo)
  CURSOS_GESTIONAR:        'cursos:gestionar',
  CURSOS_VER:              'cursos:ver',
  CURSOS_REGISTRAR:        'cursos:registrar',
  CURSOS_MODIFICAR:        'cursos:modificar',
  CURSOS_ELIMINAR:         'cursos:eliminar',
  INSCRIPCIONES_GESTIONAR: 'inscripciones:gestionar',
  INSCRIPCIONES_VER:       'inscripciones:ver',
  PAGOS_VER:               'pagos:ver',
  REPORTES_VER:            'reportes:ver',
  LOGS_APLICACION_VER:     'logs_aplicacion:ver',
  LOGS_SEGURIDAD_VER:      'logs_seguridad:ver',
  RIESGOS_VER:             'riesgos:ver',
  RIESGOS_GESTIONAR:       'riesgos:gestionar',
  // Roles — CRUD granular
  ROLES_VER:               'roles:ver',
  ROLES_CREAR:             'roles:crear',
  ROLES_MODIFICAR:         'roles:modificar',
  ROLES_ELIMINAR:          'roles:eliminar',
  // Matriz de Riesgos — CRUD granular
  MATRIZ_VER:              'matriz:ver',
  MATRIZ_AGREGAR:          'matriz:agregar',
  MATRIZ_EDITAR:           'matriz:editar',
  MATRIZ_ELIMINAR:         'matriz:eliminar',
  USUARIO_ESTUDIANTE:      'usuario:estudiante',
  USUARIO_DOCENTE:         'usuario:docente',
};

export const ROLES = {
  ESTUDIANTE:      'ESTUDIANTE',
  DOCENTE:         'DOCENTE',
  ADMIN_CUENTAS:   'ADMIN_CUENTAS',
  ADMIN_SEGURIDAD: 'ADMIN_SEGURIDAD',
  ADMIN_CURSOS:    'ADMIN_CURSOS',
  ADMIN_PAGOS:     'ADMIN_PAGOS',
  ADMIN_REPORTES:  'ADMIN_REPORTES',
  // Legacy — kept for backward compatibility
  ADMINISTRADOR:   'ADMINISTRADOR',
};

export const ADMIN_ROLES = [
  ROLES.ADMIN_CUENTAS,
  ROLES.ADMIN_SEGURIDAD,
  ROLES.ADMIN_CURSOS,
  ROLES.ADMIN_PAGOS,
  ROLES.ADMIN_REPORTES,
  ROLES.ADMINISTRADOR,
];

export const getRolPath = (rol) => {
  if (rol === ROLES.DOCENTE) return '/docente';
  if (rol === ROLES.ESTUDIANTE) return '/cursos';
  if (rol === ROLES.ADMIN_CUENTAS) return '/admin/cuentas';
  return '/admin';
};

// Backward-compatible alias
export const getRolePath = getRolPath;

// Construye el nombre completo del usuario (nombre + apellidos) para mostrar
// su identidad real en pantalla, en vez de solo el primer nombre.
export const getNombreCompleto = (usuario) => {
  if (!usuario) return '';
  return [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim();
};
