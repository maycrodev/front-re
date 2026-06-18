// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import PermisoProtectedRoute from './components/auth/PermisoProtectedRoute';
import CambioContraseña from './components/auth/CambioContraseña';

import Header from './components/layout/headerPrincipal';
import Footer from './components/layout/footerPrincipal';
import UserHeaderDynamic from './components/layout/UserHeaderDynamic';
import Home from './features/home/homePrincipal';
import Catalogo from './features/catalogo/catalogoCursos';
import Perfil from './features/perfil/perfilEstudiante';
import VerificarEmail from './features/verificarEmail/VerificarEmail';
import ResetPassword from './features/resetPassword/ResetPassword';

import AdminMenu from './components/admin/adminMenu';
import AdministrarCursos from './components/admin/administrarCursos';
import AdminAsignarCursosDocente from './components/admin/adminAsignarCursosDocente';
import AdminPagos from './components/admin/adminPagos';
import AdminPerfil from './components/admin/AdminPerfil';
import AdminUsuarios from './components/admin/adminUsuarios';
import AdminGestionUsuarios from './components/admin/AdminGestionUsuarios';
import GestionInscripciones from './components/admin/gestionInscripciones';
import AdminReportes from './components/admin/adminReportes';
import AdminLogsAplicacion from './components/admin/adminLogsAplicacion';
import AdminLogsSeguridad from './components/admin/adminLogsSeguridad';
import AdminAuditoria from './components/admin/adminAuditoria';
import GestionRoles from './components/admin/seguridad/GestionRoles';
import CrearCuentas from './components/admin/cuentas/CrearCuentas';
import RiesgosDashboard from './components/admin/riesgos/RiesgosDashboard';
import RiesgoDetalle from './components/admin/riesgos/RiesgoDetalle';
import MatrizRiesgosPage from './components/admin/riesgos/MatrizRiesgosPage';

import EstudiantePagos from './components/estudiante/estudiantePagos';
import HeaderEstudiante from './components/estudiante/headerEstudiante';

import HeaderDocente from './components/docente/headerDocente';
import DocenteMenu from './components/docente/docenteMenu';

import { ROLES, ADMIN_ROLES, PERMISSIONS } from './utils/roleUtils';
import './App.css';

// Redirige a /cambiar-password si el JWT contiene debe_cambiar_password=true
function PasswordChangeGuard({ children }) {
  const { usuario } = useAuth();
  const location = useLocation();
  const exempt = ['/cambiar-password', '/verificar-email', '/reset-password', '/'];
  if (usuario?.debe_cambiar_password && !exempt.includes(location.pathname)) {
    return <Navigate to="/cambiar-password" state={{ forzado: true }} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { usuario, modoAdmin } = useAuth();
  const rol = usuario?.rol;

  // Header selection: modoAdmin overrides role-based selection for students/teachers
  let SelectedHeader = Header;
  if (!usuario) {
    SelectedHeader = Header;
  } else if (modoAdmin) {
    SelectedHeader = UserHeaderDynamic;
  } else if (rol === ROLES.ESTUDIANTE) {
    SelectedHeader = HeaderEstudiante;
  } else if (rol === ROLES.DOCENTE) {
    SelectedHeader = HeaderDocente;
  } else {
    SelectedHeader = UserHeaderDynamic;
  }

  return (
    <Router>
      <PasswordChangeGuard>
      <Routes>

        {/* Rutas públicas */}
        <Route
          path="/"
          element={
            <div className="app-wrapper">
              <Header />
              <main style={{ minHeight: '80vh' }}><Home /></main>
              <Footer />
            </div>
          }
        />

        <Route path="/verificar-email" element={<VerificarEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Rutas protegidas estudiante */}
        <Route
          path="/cursos"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ESTUDIANTE, ROLES.DOCENTE, ...ADMIN_ROLES]}>
              <div className="app-wrapper">
                <SelectedHeader />
                <main style={{ minHeight: '80vh' }}><Catalogo /></main>
                <Footer />
              </div>
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <div className="app-wrapper">
                <SelectedHeader />
                <main style={{ minHeight: '80vh' }}><Perfil /></main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/estudiante/pagos"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.ESTUDIANTE, ROLES.DOCENTE, ...ADMIN_ROLES]}>
              <EstudiantePagos />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/cambiar-password"
          element={
            <ProtectedRoute>
              <CambioContraseña />
            </ProtectedRoute>
          }
        />

        {/* ── ADMIN — permission-based guards ── */}
        {/* Dashboard: any authenticated user with ≥1 permission */}
        <Route
          path="/admin"
          element={
            <PermisoProtectedRoute permiso={null}>
              <AdminMenu />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/perfil"
          element={
            <PermisoProtectedRoute permiso={null}>
              <AdminPerfil />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/cuentas"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.USUARIOS_CREAR, PERMISSIONS.USUARIOS_GESTIONAR]}>
              <CrearCuentas />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/gestion-usuarios"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.USUARIOS_VER, PERMISSIONS.USUARIOS_EDITAR, PERMISSIONS.USUARIOS_ELIMINAR, PERMISSIONS.USUARIOS_GESTIONAR]}>
              <AdminGestionUsuarios />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.CURSOS_VER, PERMISSIONS.CURSOS_REGISTRAR, PERMISSIONS.CURSOS_MODIFICAR, PERMISSIONS.CURSOS_ELIMINAR, PERMISSIONS.CURSOS_GESTIONAR]}>
              <AdminUsuarios />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/cursos"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.CURSOS_VER, PERMISSIONS.CURSOS_REGISTRAR, PERMISSIONS.CURSOS_MODIFICAR, PERMISSIONS.CURSOS_ELIMINAR, PERMISSIONS.CURSOS_GESTIONAR]}>
              <AdministrarCursos />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/asignar-docente/:cursoId"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.CURSOS_MODIFICAR, PERMISSIONS.CURSOS_GESTIONAR]}>
              <AdminAsignarCursosDocente />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/pagos"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.PAGOS_VER}>
              <AdminPagos />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/inscripciones"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.INSCRIPCIONES_VER, PERMISSIONS.INSCRIPCIONES_GESTIONAR]}>
              <GestionInscripciones />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/reportes"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.REPORTES_VER}>
              <AdminReportes />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/logs-aplicacion"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.LOGS_APLICACION_VER}>
              <AdminLogsAplicacion />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/logs-seguridad"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.LOGS_SEGURIDAD_VER}>
              <AdminLogsSeguridad />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/auditoria"
          element={
            <PermisoProtectedRoute permiso={null}>
              <AdminAuditoria />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/seguridad/roles"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.ROLES_GESTIONAR, PERMISSIONS.ROLES_VER, PERMISSIONS.ROLES_CREAR, PERMISSIONS.ROLES_MODIFICAR, PERMISSIONS.ROLES_ELIMINAR]}>
              <GestionRoles />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/riesgos"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.RIESGOS_VER}>
              <RiesgosDashboard />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/matriz-riesgos"
          element={
            <PermisoProtectedRoute permiso={[PERMISSIONS.RIESGOS_VER, PERMISSIONS.RIESGOS_GESTIONAR, PERMISSIONS.MATRIZ_VER, PERMISSIONS.MATRIZ_AGREGAR, PERMISSIONS.MATRIZ_EDITAR, PERMISSIONS.MATRIZ_ELIMINAR]}>
              <MatrizRiesgosPage />
            </PermisoProtectedRoute>
          }
        />

        <Route
          path="/admin/riesgos/:id"
          element={
            <PermisoProtectedRoute permiso={PERMISSIONS.RIESGOS_VER}>
              <RiesgoDetalle />
            </PermisoProtectedRoute>
          }
        />

        {/* ── DOCENTE ── */}
        <Route
          path="/docente/*"
          element={
            <RoleProtectedRoute allowedRoles={[ROLES.DOCENTE]}>
              <div className="app-wrapper">
                <HeaderDocente />
                <main style={{ minHeight: '80vh' }}><DocenteMenu /></main>
                <Footer />
              </div>
            </RoleProtectedRoute>
          }
        />

      </Routes>
      </PasswordChangeGuard>
    </Router>
  );
}

export default App;
