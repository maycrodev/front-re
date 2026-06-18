// adminMenu.jsx — Permission-driven dashboard
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { MENU_CARDS, tieneAcceso } from '../../utils/navConfig';
import { ROLES, getNombreCompleto } from '../../utils/roleUtils';
import './adminMenu.css';

const ROL_LABELS = {
  [ROLES.ADMIN_CUENTAS]:   'Administrador de Cuentas',
  [ROLES.ADMIN_SEGURIDAD]: 'Administrador de Seguridad',
  [ROLES.ADMIN_CURSOS]:    'Administrador de Cursos',
  [ROLES.ADMIN_PAGOS]:     'Administrador de Pagos',
  [ROLES.ADMIN_REPORTES]:  'Administrador de Reportes',
  [ROLES.ADMINISTRADOR]:   'Administrador del Sistema',
  [ROLES.DOCENTE]:         'Docente',
  [ROLES.ESTUDIANTE]:      'Estudiante',
};

const AdminMenu = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const permisos = usuario?.permisos || [];
  const nombreAdmin = getNombreCompleto(usuario) || usuario?.nombre || 'Administrador';
  const rol = usuario?.rol || '';

  // Show only cards the user is actually allowed to access
  const cards = MENU_CARDS.filter((card) => tieneAcceso(permisos, card.permiso));

  const fecha = new Date().toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="admin-page">
      <UserHeaderDynamic />

      <main className="admin-main">
        {/* Hero */}
        <section className="admin-hero">
          <div className="admin-hero-content">
            <div className="admin-avatar">
              {nombreAdmin.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="admin-date">{fecha}</p>
              <h1 className="admin-title">
                Bienvenido, <span className="admin-name">{nombreAdmin}</span>
              </h1>
              <p className="admin-identidad" style={{
                margin: '0.15rem 0 0.4rem', fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.85)',
              }}>
                User ID: {usuario?.email}
              </p>
              <span className="admin-badge">
                {ROL_LABELS[rol] || rol || 'Administrador'}
              </span>
            </div>
          </div>


          <div className="admin-hero-glow" />
        </section>

        {/* Cards */}
        <section className="admin-grid-section">
          <h2 className="admin-section-title">
            Panel de Control
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>
              ({cards.length} {cards.length === 1 ? 'módulo disponible' : 'módulos disponibles'})
            </span>
          </h2>

          {cards.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 16, padding: '3rem',
              textAlign: 'center', color: '#6b7280',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
              <p style={{ fontWeight: 600, color: '#374151' }}>Sin módulos asignados</p>
              <p style={{ fontSize: '0.875rem' }}>
                Tu rol no tiene permisos asignados aún. Contacta al administrador de seguridad.
              </p>
            </div>
          ) : (
            <div className="admin-card-grid">
              {cards.map((card) => (
                <button
                  key={card.id}
                  className="admin-card"
                  onClick={() => navigate(card.path)}
                  style={{ '--card-color': card.color }}
                >
                  <div className="admin-card-icon">{card.icon}</div>
                  <h3 className="admin-card-title">{card.title}</h3>
                  <p className="admin-card-desc">{card.desc}</p>
                  <div className="admin-card-arrow">→</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminMenu;
