// catalogoCursos.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getNombreCompleto } from '../../utils/roleUtils';
import ModalPago from '../../components/pago/ModalPago';
import CursoDetalle from '../../components/cursoDetalle/CursoDetalle';
import { getToken } from '../../utils/tokenStore';
import './catalogoCursos.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const VISUAL = [
  { icono: '💻', color: 'linear-gradient(135deg,#003366,#0055aa)', categoria: 'Tecnología', tags: ['Python','Java','UML'] },
  { icono: '📐', color: 'linear-gradient(135deg,#1e3a5f,#2e6da4)', categoria: 'Ciencias',   tags: ['Álgebra','Física','Ingeniería'] },
  { icono: '📊', color: 'linear-gradient(135deg,#5a8a1a,#8cc63f)', categoria: 'Negocios',   tags: ['Management','Liderazgo','Estrategia'] },
  { icono: '🌎', color: 'linear-gradient(135deg,#4338ca,#6366f1)', categoria: 'Idiomas',    tags: ['B2-C1','Business','Speaking'] },
  { icono: '🎨', color: 'linear-gradient(135deg,#b45309,#f59e0b)', categoria: 'Diseño',     tags: ['Figma','Prototipado','Usabilidad'] },
  { icono: '📈', color: 'linear-gradient(135deg,#065f46,#10b981)', categoria: 'Datos',      tags: ['Python','ML','Visualización'] },
];

const IconMoney = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPlus  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconArrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IconInfo  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconEye   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconCart  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
const IconTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconClock = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconClose = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// Componente del Carrito Modal
const CarritoModal = ({ carrito, onClose, onEliminar, onPagar, mostrarPago }) => {
  const total = carrito.reduce((sum, curso) => sum + Number(curso.costo), 0);

  if (mostrarPago) {
    return (
      <div className="carrito-overlay" onClick={onClose}>
        <div className="carrito-modal carrito-pago" onClick={e => e.stopPropagation()}>
          <div className="carrito-header">
            <h3><IconMoney /> Pago con PayPal</h3>
            <button className="btn-cerrar" onClick={onClose}><IconClose /></button>
          </div>
          <div className="carrito-body carrito-body-pago">
            <ModalPago
              cursos={carrito}
              total={total}
              onClose={onClose}
              onPagoExitoso={onPagar}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="carrito-overlay" onClick={onClose}>
      <div className="carrito-modal" onClick={e => e.stopPropagation()}>
        <div className="carrito-header">
          <h3><IconCart /> Mi Carrito</h3>
          <button className="btn-cerrar" onClick={onClose}><IconClose /></button>
        </div>
        
        <div className="carrito-body">
          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <IconCart />
              <p>Tu carrito está vacío</p>
              <span>Agrega cursos para comenzar</span>
            </div>
          ) : (
            <>
              <div className="carrito-lista">
                {carrito.map((curso, index) => (
                  <div key={curso.id} className="carrito-item">
                    <div className="carrito-item-info">
                      <span className="carrito-item-num">{index + 1}</span>
                      <div className="carrito-item-detalles">
                        <span className="carrito-item-nombre">{curso.nombre}</span>
                        <span className="carrito-item-codigo">ID-{String(curso.id).padStart(3,'0')}</span>
                      </div>
                    </div>
                    <div className="carrito-item-precio">
                      <span>Bs. {curso.costo}</span>
                      <button 
                        className="btn-eliminar"
                        onClick={() => onEliminar(curso.id)}
                        title="Eliminar del carrito"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="carrito-resumen">
                <div className="carrito-total">
                  <span>Total a pagar:</span>
                  <strong>Bs. {total}</strong>
                </div>
                <button className="btn-pagar" onClick={() => onPagar()}>
                  <IconMoney /> Proceder al pago con PayPal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const CursoCard = ({ curso, visual, inscrito, preinscrito, onPreinscribir, onVerDetalle, onEliminarPreinscripcion }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <div className="curso-catalogo-card">
      <div className="card-banner" style={{ background: visual.color }}>
        <span style={{ position:'relative', zIndex:2 }}>{visual.icono}</span>
        <span className="card-chip">{visual.categoria}</span>
        {preinscrito && (
          <span className="card-chip-preinscrito">
            <IconClock /> Preinscrito
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="card-titulo">{curso.nombre}</div>
        <div className="card-codigo">ID-{String(curso.id).padStart(3,'0')}</div>
        <p className="card-desc">{curso.descripcion}</p>
        <div className="card-detalles">
          <div className="detalle-item"><IconMoney /><span>Bs. {curso.costo}</span></div>
        </div>
        <div className="card-tags">
          {visual.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        <button
          onClick={() => onVerDetalle(curso)}
          style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', background:'none', border:'none', color:'#7a9cc0', fontSize:'0.78rem', fontWeight:600, fontFamily:'inherit', cursor:'pointer', padding:'0.2rem 0', marginBottom:'0.5rem' }}
        >
          <IconEye /><span>Ver detalle</span>
        </button>

        {inscrito ? (
          <button
            className="btn-inscribir inscrito"
            disabled={true}
          >
            <IconCheck /><span>¡Ya estás inscrito!</span>
          </button>
        ) : preinscrito ? (
          <button
            className="btn-inscribir preinscrito"
            onClick={() => onEliminarPreinscripcion(curso.id)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <IconCart />
            <span>{hover ? 'Quitar del carrito' : 'En el carrito'}</span>
          </button>
        ) : (
          <button
            className="btn-inscribir disponible"
            onClick={() => onPreinscribir(curso)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <IconPlus /><span>Preinscribirme</span>
          </button>
        )}
      </div>
    </div>
  );
};

const CatalogoCursos = () => {
  const navigate = useNavigate();
  const { usuario, estaInscrito, cursosInscritos, marcarInscrito } = useAuth();

  const [cursos, setCursos]               = useState([]);
  const [cargandoCursos, setCargandoCursos] = useState(true);
  const [cursoDetalle, setCursoDetalle]   = useState(null);
  
  // Estado para el carrito de preinscripciones
  const [carrito, setCarrito]             = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarPago, setMostrarPago]     = useState(false);
  const [toast, setToast]                 = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/cursos`)
      .then(r => r.json())
      .then(data => setCursos(Array.isArray(data) ? data : []))
      .catch(() => setCursos([]))
      .finally(() => setCargandoCursos(false));
  }, []);

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('carritoPreinscripciones');
    if (carritoGuardado) {
      try {
        setCarrito(JSON.parse(carritoGuardado));
      } catch (e) {
        console.error('Error al cargar carrito:', e);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('carritoPreinscripciones', JSON.stringify(carrito));
  }, [carrito]);

  const mostrarToast = (mensaje, tipo = 'info') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  };

  const agregarAlCarrito = async (curso) => {

  try {

    const token = getToken();

    const res = await fetch(
      `${API_BASE}/api/cursos/validar-inscripcion/${curso.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.mensaje || "No puedes inscribirte a este curso", "error");
      return;
    }

    if (carrito.some(c => c.id === curso.id)) {
      mostrarToast('Este curso ya está en tu carrito', 'info');
      return;
    }

    setCarrito([...carrito, curso]);

    mostrarToast(`"${curso.nombre}" agregado al carrito`, 'exito');

  } catch (error) {

    mostrarToast("Error validando prerrequisitos", "error");

  }
};

  const eliminarDelCarrito = (cursoId) => {
    setCarrito(carrito.filter(c => c.id !== cursoId));
    mostrarToast('Curso eliminado del carrito', 'info');
  };

  const estaPreinscrito = (cursoId) => {
    return carrito.some(c => c.id === cursoId);
  };

  const handlePagoExitoso = (cursoIds) => {
    // Marcar todos los cursos del carrito como inscritos
    cursoIds.forEach(id => marcarInscrito(id));
    
    // Vaciar el carrito
    setCarrito([]);
    setMostrarCarrito(false);
    setMostrarPago(false);
    
    mostrarToast('¡Pago exitoso! Ya estás inscrito en los cursos', 'exito');
  };

  const totalCarrito = carrito.reduce((sum, curso) => sum + Number(curso.costo), 0);

  return (
    <div className="catalogo-page">
      <div className="catalogo-header">
        <div className="catalogo-header-bg"><span /><span /></div>
        <div className="catalogo-header-inner">
          <div className="cat-breadcrumb">
            <a href="/">Inicio</a><span className="sep">›</span><span>Catálogo de Cursos</span>
          </div>
          <h1>Cursos <span>Disponibles</span></h1>
          <p>Explora la oferta académica y arma tu plan de estudios</p>
        </div>
      </div>

      <div className="catalogo-body">
        {usuario && (
          <div className="info-sesion">
            <IconInfo />
            <p>Bienvenido/a <strong>{getNombreCompleto(usuario) || usuario.nombre}</strong>. Selecciona los cursos que quieres tomar.</p>
          </div>
        )}

        <div className="catalogo-contador">
          <p>
            Mostrando <strong>{cursos.filter((curso) => {
              const estadoCurso = (curso.estado || curso.estado_curso || '').toString().toUpperCase();
              return estadoCurso !== 'ACTIVO' && estadoCurso !== 'FINALIZADO';
            }).length} cursos</strong>
            {cursosInscritos.length > 0 && (
              <> · <strong style={{ color:'#8cc63f' }}>{cursosInscritos.length} inscrito{cursosInscritos.length > 1 ? 's' : ''}</strong></>
            )}
            {carrito.length > 0 && (
              <> · <strong style={{ color:'#f59e0b' }}>{carrito.length} preinscrito{carrito.length > 1 ? 's' : ''}</strong></>
            )}
          </p>
          <div className="catalogo-acciones">
            {cursosInscritos.length > 0 && (
              <button className="btn-ver-perfil" onClick={() => navigate('/perfil')}>
                <IconArrow />Ver mi perfil
              </button>
            )}
            <button 
              className={`btn-carrito ${carrito.length > 0 ? 'tiene-items' : ''}`} 
              onClick={() => setMostrarCarrito(true)}
            >
              <IconCart />
              <span>Carrito</span>
              {carrito.length > 0 && (
                <span className="carrito-badge">{carrito.length}</span>
              )}
            </button>
          </div>
        </div>

        {cargandoCursos ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#888', fontSize:'1.1rem' }}>
            Cargando cursos...
          </div>
        ) : (
          <div className="cursos-catalogo-grid">
            {cursos
              .filter((curso) => {
                const estadoCurso = (curso.estado || curso.estado_curso || '').toString().toUpperCase();
                return estadoCurso !== 'ACTIVO' && estadoCurso !== 'FINALIZADO';
              })
              .map((curso, i) => (
                <CursoCard
                  key={curso.id}
                  curso={curso}
                  visual={VISUAL[i % VISUAL.length]}
                  inscrito={estaInscrito(curso.id)}
                  preinscrito={estaPreinscrito(curso.id)}
                  onPreinscribir={agregarAlCarrito}
                  onEliminarPreinscripcion={eliminarDelCarrito}
                  onVerDetalle={(c) => setCursoDetalle(c)}
                />
            ))}
          </div>
        )}
      </div>

      {/* Modal: Carrito de Preinscripciones */}
      {mostrarCarrito && (
        <CarritoModal
          carrito={carrito}
          onClose={() => {
            setMostrarCarrito(false);
            setMostrarPago(false);
          }}
          onEliminar={eliminarDelCarrito}
          onPagar={() => setMostrarPago(true)}
          mostrarPago={mostrarPago}
        />
      )}

      {/* Modal: Vista detalle del curso */}
      {cursoDetalle && (
        <CursoDetalle
          curso={cursoDetalle}
          inscrito={estaInscrito(cursoDetalle.id)}
          preinscrito={estaPreinscrito(cursoDetalle.id)}
          onClose={() => setCursoDetalle(null)}
          onInscribirse={(c) => { 
            agregarAlCarrito(c);
            setCursoDetalle(null); 
          }}
          onEliminarPreinscripcion={(id) => {
            eliminarDelCarrito(id);
            setCursoDetalle(null);
          }}
        />
      )}

      {/* Toast de notificaciones */}
      {toast && (
        <div className={`toast ${toast.tipo}`}>
          {toast.tipo === 'exito' ? <IconCheck /> : <IconInfo />}
          <span>{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
};

export default CatalogoCursos;
