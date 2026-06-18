import React, { createContext, useContext, useState, useEffect } from 'react';
import { setToken, getToken, clearToken, decodePayload } from '../utils/tokenStore';
import { ADMIN_ROLES } from '../utils/roleUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

// Restore user from cookie on page load — synchronous so no flash of "logged out"
const initUsuario = () => {
  const payload = decodePayload();
  if (!payload) return null;
  return {
    id: payload.id,
    nombre: payload.nombre,
    apellido_paterno: payload.apellido_paterno || '',
    apellido_materno: payload.apellido_materno || '',
    email: payload.email,
    rol: payload.rol,
    rol_id: payload.rol_id,
    permisos: payload.permisos || [],
    debe_cambiar_password: !!payload.debe_cambiar_password,
  };
};

const initModoAdmin = () => {
  const payload = decodePayload();
  if (!payload) return false;
  if (ADMIN_ROLES.includes(payload.rol)) return true;
  return sessionStorage.getItem('modo_admin') === 'true';
};

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(initUsuario);
  const [modoAdmin, setModoAdmin] = useState(initModoAdmin);
  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [inscripcionesDetalle, setInscripcionesDetalle] = useState({});
  const [cargando, setCargando] = useState(false);

  const fetchInscripciones = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/inscripciones/mis-inscripciones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setCursosInscritos(data.map((i) => i.curso_id));
      const detalle = {};
      data.forEach((i) => {
        detalle[i.curso_id] = {
          estado_academico: i.estado_academico,
          nota_final: i.nota_final,
        };
      });
      setInscripcionesDetalle(detalle);
    } catch {
      // non-blocking
    }
  };

  // Fetch fresh permissions from DB on startup so header/menu reflect real-time RBAC
  const refreshPermisos = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/autenticacion/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsuario((prev) => prev ? { ...prev, permisos: data.permisos || [] } : prev);
    } catch {
      // non-blocking
    }
  };

  // On page load: restore inscripciones and refresh permisos from DB
  useEffect(() => {
    if (usuario) {
      fetchInscripciones();
      refreshPermisos();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleModoAdmin = () => {
    setModoAdmin((prev) => {
      const next = !prev;
      sessionStorage.setItem('modo_admin', String(next));
      return next;
    });
  };

  const login = (datosUsuario, tokenJwt) => {
    setToken(tokenJwt);
    const payload = decodePayload();
    const nuevoUsuario = {
      ...datosUsuario,
      permisos: payload?.permisos || [],
      debe_cambiar_password: !!payload?.debe_cambiar_password,
    };
    setUsuario(nuevoUsuario);
    // Admins always start in admin mode; students/teachers start in their own mode
    const esAdmin = ADMIN_ROLES.includes(nuevoUsuario.rol);
    setModoAdmin(esAdmin);
    sessionStorage.setItem('modo_admin', String(esAdmin));
    fetchInscripciones();
  };

  const logout = () => {
    clearToken(); // wipes cookie + localStorage + sessionStorage
    setUsuario(null);
    setModoAdmin(false);
    sessionStorage.removeItem('modo_admin');
    setCursosInscritos([]);
    setInscripcionesDetalle({});
  };

  const getRol = () => usuario?.rol ?? null;

  const inscribirCurso = async (cursoId) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    const res = await fetch(`${API_BASE}/api/inscripciones/inscribir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ curso_id: cursoId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al inscribirse');
    }
    setCursosInscritos((prev) => (prev.includes(cursoId) ? prev : [...prev, cursoId]));
  };

  const desinscribirCurso = async (cursoId) => {
    const token = getToken();
    if (!token) throw new Error('No autenticado');
    const res = await fetch(`${API_BASE}/api/inscripciones/desinscribir/${cursoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al desinscribirse');
    }
    setCursosInscritos((prev) => prev.filter((id) => id !== cursoId));
  };

  const estaInscrito = (cursoId) => cursosInscritos.includes(cursoId);

  const marcarInscrito = (cursoId) => {
    setCursosInscritos((prev) => (prev.includes(cursoId) ? prev : [...prev, cursoId]));
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      modoAdmin,
      toggleModoAdmin,
      cursosInscritos,
      inscripcionesDetalle,
      cargando,
      login,
      logout,
      getRol,
      getToken,
      inscribirCurso,
      desinscribirCurso,
      estaInscrito,
      marcarInscrito,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
