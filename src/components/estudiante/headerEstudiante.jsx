// headerEstudiante.jsx — Versión del header para el rol ESTUDIANTE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNombreCompleto, ROLES } from '../../utils/roleUtils';
import '../layout/headerPrincipal.css';
import Login from '../login/login';
import CambiarPasswordPanel from '../auth/CambiarPasswordPanel';

const HeaderEstudiante = () => {
    const navigate = useNavigate();
    const { usuario, logout, modoAdmin, toggleModoAdmin } = useAuth();

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
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

    const iniciales = usuario
        ? usuario.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
        : '';

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div className="logo-icon">X</div>
                        <span className="logo-text">College <span className="highlight">Nexus</span></span>
                    </div>

                    {/* Toggle móvil */}
                    <button
                        className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span /><span /><span />
                    </button>

                    {/* Links de navegación */}
                    <ul className={`navbar-links ${mobileMenuOpen ? 'active' : ''}`}>
                        <li><a href="/" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/'); setMobileMenuOpen(false); }}>Inicio</a></li>
                        <li>
                            <a
                                href="/cursos"
                                className="nav-link"
                                onClick={(e) => { e.preventDefault(); navigate('/cursos'); setMobileMenuOpen(false); }}
                            >
                                Cursos
                            </a>
                        </li>
                        {usuario && (
                            <li>
                                <a
                                    href="/perfil"
                                    className="nav-link"
                                    onClick={(e) => { e.preventDefault(); navigate('/perfil'); setMobileMenuOpen(false); }}
                                >
                                    Mi Perfil
                                </a>
                            </li>
                        )}
                        {/* Cambio solicitado: De Facultad a Pagos */}
                        <li>
                            <a
                                href="/estudiante/pagos"
                                className="nav-link"
                                onClick={(e) => { e.preventDefault(); navigate('/estudiante/pagos'); setMobileMenuOpen(false); }}
                            >
                                Pagos
                            </a>
                        </li>

                        {/* Modo admin — móvil */}
                        {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
                            <li className="mobile-only">
                                <button
                                    className="btn-login"
                                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', color: 'white' }}
                                    onClick={() => { toggleModoAdmin(); navigate('/admin'); setMobileMenuOpen(false); }}
                                >
                                    🔑 Modo Administrador
                                </button>
                            </li>
                        )}

                        {/* Botón móvil */}
                        <li className="mobile-only">
                            {usuario ? (
                                <button className="btn-login" onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}>
                                    Cerrar Sesión
                                </button>
                            ) : (
                                <button className="btn-login" onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}>
                                    Iniciar Sesión
                                </button>
                            )}
                        </li>
                    </ul>

                    {/* Acciones del lado derecho */}
                    <div className="navbar-actions">
                        {/* Toggle modo admin — desktop */}
                        {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
                            <button
                                className="desktop-only"
                                onClick={() => { toggleModoAdmin(); navigate('/admin'); }}
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
                        <div className="secure-badge">
                            <div className="lock-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div className="badge-text">
                                <span className="badge-label">Conexión</span>
                                <span className="badge-status">Segura HTTPS</span>
                            </div>
                        </div>

                        {usuario ? (
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
                                        minWidth: 200, zIndex: 2000,
                                        animation: 'fadeDown 0.2s ease',
                                    }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2f5', marginBottom: '0.25rem' }}>
                                            <div style={{ fontWeight: 700, color: '#003366', fontSize: '0.95rem' }}>{getNombreCompleto(usuario) || usuario.nombre}</div>
                                            <div style={{ fontSize: '0.78rem', color: '#aaa' }}>{usuario.email}</div>
                                            {usuario?.id != null && (
                                                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.15rem' }}>ID #{usuario.id}</div>
                                            )}
                                        </div>
                                        <button onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                                            style={{
                                                width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                                                textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                                                color: '#333', fontFamily: 'inherit', transition: 'background 0.2s',
                                            }}
                                        >
                                            🎓 Mi Perfil
                                        </button>
                                        <button onClick={() => { navigate('/estudiante/pagos'); setShowUserMenu(false); }}
                                            style={{
                                                width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                                                textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                                                color: '#333', fontFamily: 'inherit', transition: 'background 0.2s',
                                            }}
                                        >
                                            💳 Mis Pagos
                                        </button>
                                        {usuario && usuario.rol !== ROLES.ESTUDIANTE && usuario.rol !== ROLES.DOCENTE && (
                                            <button onClick={() => { toggleModoAdmin(); navigate('/admin'); setShowUserMenu(false); }}
                                                style={{
                                                    width: '100%', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: 'none', padding: '0.6rem 1rem',
                                                    textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                                                    color: '#1d4ed8', fontFamily: 'inherit', fontWeight: 600, transition: 'background 0.2s',
                                                }}
                                            >
                                                🔑 Activar modo administrador
                                            </button>
                                        )}
                                        <button onClick={() => { setShowPasswordModal(true); setShowUserMenu(false); }}
                                            style={{
                                                width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                                                textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                                                color: '#333', fontFamily: 'inherit', transition: 'background 0.2s',
                                            }}
                                        >
                                            🔐 Cambiar contrasena
                                        </button>
                                        <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }}
                                            style={{
                                                width: '100%', background: 'none', border: 'none', padding: '0.6rem 1rem',
                                                textAlign: 'left', cursor: 'pointer', borderRadius: 8, fontSize: '0.9rem',
                                                color: '#dc2626', fontFamily: 'inherit', transition: 'background 0.2s',
                                                marginTop: '0.25rem', borderTop: '1px solid #f0f2f5',
                                            }}
                                        >
                                            🚪 Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button className="btn-login desktop-only" onClick={() => setShowLogin(true)}>
                                <span>Iniciar Sesión</span>
                                <svg className="login-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {showLogin && (
                <Login
                    onClose={() => setShowLogin(false)}
                    onLoginSuccess={() => setShowLogin(false)}
                />
            )}

            <CambiarPasswordPanel
                titulo="Cambiar contrasena"
                renderTrigger={false}
                open={showPasswordModal}
                onOpenChange={setShowPasswordModal}
            />

            <style>{`
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
        </>
    );
};

export default HeaderEstudiante;
