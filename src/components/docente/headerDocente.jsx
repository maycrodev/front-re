// headerDocente.jsx — Header personalizado para el rol DOCENTE
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNombreCompleto, ROLES } from '../../utils/roleUtils';
import CambiarPasswordPanel from '../auth/CambiarPasswordPanel';
import '../layout/headerPrincipal.css';

const HeaderDocente = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout, toggleModoAdmin } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => setShowUserMenu(false);
    if (showUserMenu) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  const docenteLinks = [
    { path: '/docente', label: 'Mi Panel', exact: true },
  ];

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.path;
    return location.pathname.startsWith(link.path);
  };

  const iniciales = usuario
    ? usuario.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : 'DC';

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">

        {/* Logo */}
        <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/docente')}>
          <div className="logo-icon">X</div>
          <span className="logo-text">College <span className="highlight">Nexus</span></span>
        </div>

        {/* Toggle móvil */}
        <button
          className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menú de navegación"
        >
          <span /><span /><span />
        </button>

        {/* Links de navegación del docente */}
        <ul className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
          {docenteLinks.map((link) => (
            <li key={link.path}>
              <a
                href={link.path}
                className={`nav-link ${isActive(link) ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(link.path);
                }}
              >
                {link.label}
              </a>
            </li>
          ))}

                  {/* Modo admin — móvil */}
          {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
            <li className="mobile-only">
              <button
                className="btn-login"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: 'white' }}
                onClick={() => { toggleModoAdmin(); handleNavigate('/admin'); }}
              >
                🔑 Modo Administrador
              </button>
            </li>
          )}

          {/* Cerrar sesión en móvil */}
          <li className="mobile-only">
            <button className="btn-login" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </li>
        </ul>

        {/* Acciones del lado derecho */}
        <div className="navbar-actions">

          {/* Toggle modo admin — desktop */}
          {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
            <button
              className="desktop-only"
              onClick={() => { toggleModoAdmin(); handleNavigate('/admin'); }}
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#1e40af)',
                color: 'white', border: 'none', borderRadius: 20,
                padding: '0.35rem 0.85rem', fontSize: '0.78rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(29,78,216,0.35)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              🔑 Modo Admin
            </button>
          )}

          {/* Badge de rol */}
          <div className="secure-badge">
            <div className="lock-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div className="badge-text">
              <span className="badge-label">Portal</span>
              <span className="badge-status">Docente</span>
            </div>
          </div>

          {/* Avatar con menú desplegable */}
          <div style={{ position: 'relative' }} className="desktop-only">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'linear-gradient(135deg, #8cc63f, #7ab332)',
                border: '2px solid rgba(140,198,63,0.5)',
                color: '#003366', fontWeight: 800, fontSize: '0.95rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease',
              }}
            >
              {iniciales}
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 0.75rem)', right: 0,
                background: 'white', border: '1px solid #e8edf3',
                borderRadius: 14, padding: '0.5rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                minWidth: 220, zIndex: 2000,
                animation: 'fadeDown 0.2s ease',
              }}>
                {/* Info del usuario */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2f5', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#003366', fontSize: '0.95rem' }}>
                    {getNombreCompleto(usuario) || usuario?.nombre || 'Docente'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{usuario?.email || ''}</div>
                  {usuario?.id != null && (
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.15rem' }}>ID #{usuario.id}</div>
                  )}
                  <div style={{
                    marginTop: '0.4rem', display: 'inline-block',
                    background: 'rgba(140,198,63,0.12)', color: '#5a8a1a',
                    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
                    borderRadius: '50px', letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    📚 Docente
                  </div>
                </div>

                {/* Mi Panel */}
                <button
                  onClick={() => handleNavigate('/docente')}
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                    textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                    color: '#333', fontFamily: 'inherit', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f7fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  🏠 Mi Panel Docente
                </button>

                {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
                  <button
                    onClick={() => { toggleModoAdmin(); handleNavigate('/admin'); }}
                    style={{
                      width: '100%', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: 'none', padding: '0.6rem 1rem',
                      textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                      color: '#1d4ed8', fontFamily: 'inherit', fontWeight: 600, transition: 'background 0.2s',
                    }}
                  >
                    🔑 Activar modo administrador
                  </button>
                )}
                <button
                  onClick={() => { setShowPasswordModal(true); setShowUserMenu(false); }}
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                    textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                    color: '#333', fontFamily: 'inherit', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f7fa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  🔐 Cambiar contrasena
                </button>

                {/* Cerrar sesión */}
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                    textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                    color: '#dc2626', fontFamily: 'inherit', transition: 'background 0.2s',
                    marginTop: '0.25rem', borderTop: '1px solid #f0f2f5',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .nav-link.active {
          color: #8cc63f;
        }
        .nav-link.active::after {
          width: 100%;
        }
      `}</style>

      <CambiarPasswordPanel
        titulo="Cambiar contrasena (Docente)"
        renderTrigger={false}
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
    </nav>
  );
};

export default HeaderDocente;