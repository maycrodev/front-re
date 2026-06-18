import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeaderDynamic from '../../layout/UserHeaderDynamic';
import Footer from '../../layout/footerPrincipal';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../utils/roleUtils';
import {
    getRegistroDetalle,
    cambiarEstadoRegistro,
    crearPlanAccion,
    actualizarPlanAccion,
} from '../../../services/riesgosApi';
import './RiesgosDashboard.css';

const formatFecha = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('es-BO', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
};

const formatFechaCorta = (v) => {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-BO');
};

const COLOR_CATEGORIA = {
    CRITICO: '#b91c1c', ALTO: '#ea580c', MEDIO: '#ca8a04', BAJO: '#16a34a',
};
const COLOR_ESTADO = {
    DETECTADO: '#dc2626', EN_REVISION: '#d97706',
    MITIGADO: '#059669', CERRADO: '#475569', FALSO_POSITIVO: '#64748b',
};
const COLOR_PLAN = {
    PENDIENTE: '#d97706', EN_PROGRESO: '#2563eb',
    COMPLETADO: '#059669', CANCELADO: '#64748b',
};

const ESTADOS_REGISTRO = ['DETECTADO', 'EN_REVISION', 'MITIGADO', 'CERRADO', 'FALSO_POSITIVO'];
const ESTADOS_PLAN = ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADO', 'CANCELADO'];

const RiesgoDetalle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { usuario } = useAuth();
    const puedeGestionar = (usuario?.permisos || []).includes(PERMISSIONS.RIESGOS_GESTIONAR);

    const [registro, setRegistro] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const [nuevoEstado, setNuevoEstado] = useState('');
    const [formPlan, setFormPlan] = useState({
        descripcion: '',
        consecuencias: '',
        fecha_limite: '',
    });
    const [enviandoPlan, setEnviandoPlan] = useState(false);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        try {
            const r = await getRegistroDetalle(id);
            setRegistro(r);
            setNuevoEstado(r.estado);
        } catch (err) {
            setError(err.message || 'Error al cargar el registro');
        } finally {
            setCargando(false);
        }
    }, [id]);

    useEffect(() => { cargar(); }, [cargar]);

    // Limpia los mensajes de éxito/error al concluir una opción para que la
    // pantalla no quede con texto residual de la acción anterior.
    useEffect(() => {
        if (!mensaje && !error) return;
        const t = setTimeout(() => { setMensaje(''); setError(''); }, 4000);
        return () => clearTimeout(t);
    }, [mensaje, error]);

    const handleCambiarEstado = async () => {
        if (!nuevoEstado || nuevoEstado === registro.estado) return;
        try {
            await cambiarEstadoRegistro(id, nuevoEstado);
            setMensaje(`Estado actualizado a ${nuevoEstado}`);
            await cargar();
        } catch (err) {
            setError(err.message || 'Error al actualizar estado');
        }
    };

    const handleCrearPlan = async (e) => {
        e.preventDefault();
        if (formPlan.descripcion.trim().length < 5) {
            setError('La descripción del plan debe tener al menos 5 caracteres');
            return;
        }
        setEnviandoPlan(true);
        setError('');
        try {
            await crearPlanAccion(id, {
                descripcion: formPlan.descripcion.trim(),
                consecuencias: formPlan.consecuencias || null,
                fecha_limite: formPlan.fecha_limite || null,
            });
            setFormPlan({ descripcion: '', consecuencias: '', fecha_limite: '' });
            setMensaje('Plan de acción creado');
            await cargar();
        } catch (err) {
            setError(err.message || 'Error al crear plan');
        } finally {
            setEnviandoPlan(false);
        }
    };

    const handleActualizarPlan = async (planId, estado) => {
        try {
            await actualizarPlanAccion(planId, { estado });
            setMensaje(`Plan actualizado a ${estado}`);
            await cargar();
        } catch (err) {
            setError(err.message || 'Error al actualizar plan');
        }
    };

    if (cargando) {
        return (
            <div className="riesgos-page">
                <UserHeaderDynamic />
                <main className="riesgos-main">
                    <div className="riesgos-empty">Cargando detalle...</div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!registro) {
        return (
            <div className="riesgos-page">
                <UserHeaderDynamic />
                <main className="riesgos-main">
                    <div className="riesgos-empty">
                        <div style={{ fontSize: '3rem' }}>❌</div>
                        <p>Registro no encontrado</p>
                        <button className="btn-secundario" onClick={() => navigate('/admin/riesgos')}>
                            Volver al dashboard
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="riesgos-page">
            <UserHeaderDynamic />

            <main className="riesgos-main">
                <div className="riesgos-header">
                    <button
                        className="riesgos-back-button"
                        onClick={() => navigate('/admin/riesgos')}
                        aria-label="Volver"
                    >
                        ←
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 className="riesgos-title">
                            Incidente #{registro.id}
                        </h1>
                        <p className="riesgos-subtitle">
                            {registro.catalogo_codigo} — {registro.catalogo_nombre}
                        </p>
                    </div>
                    <span
                        className="badge badge-grande"
                        style={{
                            background: `${COLOR_CATEGORIA[registro.nivel_categoria]}22`,
                            color: COLOR_CATEGORIA[registro.nivel_categoria],
                            border: `1px solid ${COLOR_CATEGORIA[registro.nivel_categoria]}55`,
                        }}
                    >
                        {registro.nivel_categoria} ({registro.nivel_riesgo})
                    </span>
                </div>

                {error && <div className="riesgos-alert riesgos-alert-error">{error}</div>}
                {mensaje && <div className="riesgos-alert riesgos-alert-ok">{mensaje}</div>}

                {/* Info del incidente */}
                <section className="detalle-card">
                    <h2 className="detalle-section-title">📋 Información del Incidente</h2>
                    <div className="detalle-grid">
                        <div><span className="detalle-label">Detectado:</span><span>{formatFecha(registro.fecha_deteccion)}</span></div>
                        <div><span className="detalle-label">Origen:</span><span>{registro.origen === 'AUTOMATICO' ? '🤖 Automático' : '✍️ Manual'}</span></div>
                        <div><span className="detalle-label">Email afectado:</span><span>{registro.email_afectado || registro.usuario_afectado_email || '-'}</span></div>
                        <div><span className="detalle-label">IP origen:</span><span className="ip-cell">{registro.ip || '-'}</span></div>
                        <div>
                            <span className="detalle-label">Estado actual:</span>
                            <span
                                className="badge"
                                style={{
                                    background: `${COLOR_ESTADO[registro.estado]}22`,
                                    color: COLOR_ESTADO[registro.estado],
                                    border: `1px solid ${COLOR_ESTADO[registro.estado]}55`,
                                }}
                            >
                                {registro.estado}
                            </span>
                        </div>
                        {registro.detectado_por_email && (
                            <div><span className="detalle-label">Detectado por:</span><span>{registro.detectado_por_email}</span></div>
                        )}
                        {registro.fecha_cierre && (
                            <div><span className="detalle-label">Cerrado:</span><span>{formatFecha(registro.fecha_cierre)} {registro.cerrado_por_email ? `por ${registro.cerrado_por_email}` : ''}</span></div>
                        )}
                    </div>

                    <div className="detalle-descripcion">
                        <h3>¿Por qué es sospechoso?</h3>
                        <p>{registro.por_que_sospechoso}</p>

                        <h3>¿Quién detecta este tipo de evento?</h3>
                        <p>{registro.quien_detecta}</p>

                        <h3>Control sugerido</h3>
                        <p>{registro.control_implementar}</p>

                        {registro.detalle && Object.keys(registro.detalle).length > 0 && (
                            <>
                                <h3>Detalle técnico</h3>
                                <pre className="detalle-json">{JSON.stringify(registro.detalle, null, 2)}</pre>
                            </>
                        )}
                    </div>
                </section>

                {/* Cambio de estado */}
                {puedeGestionar && (
                    <section className="detalle-card">
                        <h2 className="detalle-section-title">🔄 Cambiar Estado</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <select
                                value={nuevoEstado}
                                onChange={(e) => setNuevoEstado(e.target.value)}
                            >
                                {ESTADOS_REGISTRO.map((e) => (
                                    <option key={e} value={e}>{e}</option>
                                ))}
                            </select>
                            <button
                                className="btn-primario"
                                onClick={handleCambiarEstado}
                                disabled={nuevoEstado === registro.estado}
                            >
                                Aplicar cambio
                            </button>
                        </div>
                    </section>
                )}

                {/* Planes de acción */}
                <section className="detalle-card">
                    <h2 className="detalle-section-title">
                        📌 Planes de Acción
                        <span className="contador">({registro.planes?.length || 0})</span>
                    </h2>

                    {(!registro.planes || registro.planes.length === 0) ? (
                        <p style={{ color: '#94a3b8' }}>No hay planes de acción creados.</p>
                    ) : (
                        <div className="planes-lista">
                            {registro.planes.map((p) => (
                                <div key={p.id} className="plan-item">
                                    <div className="plan-header">
                                        <strong>{p.descripcion}</strong>
                                        <span
                                            className="badge"
                                            style={{
                                                background: `${COLOR_PLAN[p.estado]}22`,
                                                color: COLOR_PLAN[p.estado],
                                                border: `1px solid ${COLOR_PLAN[p.estado]}55`,
                                            }}
                                        >
                                            {p.estado}
                                        </span>
                                    </div>
                                    {p.consecuencias && (
                                        <p className="plan-consecuencias">
                                            <strong>Consecuencias:</strong> {p.consecuencias}
                                        </p>
                                    )}
                                    <div className="plan-meta">
                                        {p.fecha_limite && <span>📅 Límite: {formatFechaCorta(p.fecha_limite)}</span>}
                                        {p.responsable_email && <span>👤 {p.responsable_email}</span>}
                                        {p.fecha_completado && (
                                            <span>✅ Completado: {formatFecha(p.fecha_completado)}</span>
                                        )}
                                    </div>
                                    {puedeGestionar && p.estado !== 'COMPLETADO' && p.estado !== 'CANCELADO' && (
                                        <div className="plan-acciones">
                                            {ESTADOS_PLAN
                                                .filter((e) => e !== p.estado)
                                                .map((e) => (
                                                    <button
                                                        key={e}
                                                        className="btn-mini"
                                                        onClick={() => handleActualizarPlan(p.id, e)}
                                                    >
                                                        → {e}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Nuevo plan */}
                    {puedeGestionar && (
                        <form className="plan-form" onSubmit={handleCrearPlan}>
                            <h3>Crear nuevo plan de acción</h3>
                            <label>
                                Descripción *
                                <textarea
                                    rows="2"
                                    value={formPlan.descripcion}
                                    onChange={(e) => setFormPlan({ ...formPlan, descripcion: e.target.value })}
                                    placeholder="¿Qué se va a hacer para mitigar este riesgo?"
                                    required
                                />
                            </label>
                            <label>
                                Consecuencias si no se actúa
                                <textarea
                                    rows="2"
                                    value={formPlan.consecuencias}
                                    onChange={(e) => setFormPlan({ ...formPlan, consecuencias: e.target.value })}
                                    placeholder="¿Qué pasa si no se mitiga este riesgo?"
                                />
                            </label>
                            <label>
                                Fecha límite
                                <input
                                    type="date"
                                    value={formPlan.fecha_limite}
                                    onChange={(e) => setFormPlan({ ...formPlan, fecha_limite: e.target.value })}
                                />
                            </label>
                            <button type="submit" className="btn-primario" disabled={enviandoPlan}>
                                {enviandoPlan ? 'Creando...' : '+ Crear Plan'}
                            </button>
                        </form>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default RiesgoDetalle;
