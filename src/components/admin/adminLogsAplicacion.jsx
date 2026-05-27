import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { getLogsAplicacion } from '../../services/auditoriaApi';
import './adminLogsAplicacion.css';

// ---------------------------------------------------------------------------
// Formato de fecha robusto para PostgreSQL TIMESTAMPTZ
// El driver pg envía: "2026-05-27 09:31:52.578332+00"
//   → espacio en vez de T, offset "+00" sin ":"
// Normalizamos a ISO 8601 completo antes de pasarlo a new Date()
// ---------------------------------------------------------------------------
const formatDate = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    try {
        let isoStr;
        if (value instanceof Date) {
            isoStr = value.toISOString();
        } else if (typeof value === 'string') {
            // "2026-05-27 09:31:52.578332+00" → "2026-05-27T09:31:52.578332+00:00"
            isoStr = value
                .replace(' ', 'T')                          // espacio → T
                .replace(/([+-]\d{2})$/, '$1:00');          // +00 → +00:00
        } else {
            return '-';
        }
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return value.toString().slice(0, 19).replace('T', ' ');
        return d.toLocaleString('es-BO', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        });
    } catch {
        return '-';
    }
};

const stringifyDetail = (detail) => {
    if (!detail) return '';
    try { return JSON.stringify(detail, null, 2); }
    catch { return String(detail); }
};

const NIVEL_META = {
    INFO:  { cls: 'info',  icon: 'ℹ️' },
    WARN:  { cls: 'warn',  icon: '⚠️' },
    ERROR: { cls: 'error', icon: '🔴' },
};

const AdminLogsAplicacion = () => {
    const navigate = useNavigate();

    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [total, setTotal]     = useState(0);

    // Filtros simplificados: solo los más útiles
    const [nivel,  setNivel]  = useState('');
    const [desde,  setDesde]  = useState('');
    const [hasta,  setHasta]  = useState('');

    const fetchLogs = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError('');
            const response = await getLogsAplicacion({
                nivel:  params.nivel  ?? (nivel  || undefined),
                desde:  params.desde  ?? (desde  || undefined),
                hasta:  params.hasta  ?? (hasta  || undefined),
                limite: 200,
            });
            const datos = response?.datos ?? [];
            setLogs(datos);
            setTotal(datos.length);
        } catch (err) {
            setError(err.message || 'No se pudieron cargar los logs de aplicación.');
        } finally {
            setLoading(false);
        }
    }, [nivel, desde, hasta]);

    useEffect(() => { fetchLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (e) => { e.preventDefault(); fetchLogs(); };

    const onLimpiar = () => {
        setNivel(''); setDesde(''); setHasta('');
        fetchLogs({ nivel: undefined, desde: undefined, hasta: undefined });
    };

    return (
        <div className="admin-page">
            <UserHeaderDynamic />
            <main className="admin-main">
                <div className="admin-logs-container">

                    {/* Cabecera */}
                    <header className="admin-logs-header">
                        <button className="logs-back-button" onClick={() => navigate('/admin')} title="Volver al panel">
                            {'<'}
                        </button>
                        <div>
                            <h1 className="admin-logs-title">📈 Logs de Aplicación</h1>
                            <p className="admin-logs-subtitle">
                                Eventos críticos del sistema: cursos, inscripciones y pagos.
                                {total > 0 && <span className="logs-count-badge">{total} registros</span>}
                            </p>
                        </div>
                    </header>

                    {/* Filtros simplificados */}
                    <div className="logs-filtros-card">
                        <form className="logs-filtros-form logs-filtros-simple" onSubmit={onSubmit}>
                            <div className="filter-group">
                                <label>Nivel</label>
                                <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="INFO">INFO</option>
                                    <option value="WARN">WARN</option>
                                    <option value="ERROR">ERROR</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Desde</label>
                                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
                            </div>

                            <div className="filter-group">
                                <label>Hasta</label>
                                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                            </div>

                            <div className="logs-buttons-group">
                                <button type="submit" className="logs-btn-primary">Filtrar</button>
                                <button type="button" className="logs-btn-secondary" onClick={onLimpiar}>Limpiar</button>
                            </div>
                        </form>
                    </div>

                    {error && <div className="logs-error">⚠️ {error}</div>}

                    {loading ? (
                        <div className="logs-spinner-container"><div className="logs-spinner" /></div>
                    ) : (
                        <div className="logs-table-wrapper">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '170px' }}>Fecha</th>
                                        <th style={{ width: '90px'  }}>Nivel</th>
                                        <th style={{ width: '200px' }}>Módulo / Evento</th>
                                        <th>Mensaje</th>
                                        <th style={{ width: '190px' }}>Usuario</th>
                                        <th style={{ width: '260px' }}>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="logs-empty">
                                                <div className="logs-empty-icon">📊</div>
                                                No se encontraron registros de funcionalidades críticas.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((item) => {
                                            const meta = NIVEL_META[item.nivel] ?? NIVEL_META.INFO;
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <span className="logs-fecha">{formatDate(item.fecha)}</span>
                                                    </td>
                                                    <td>
                                                        <span className={`logs-level-badge ${meta.cls}`}>
                                                            {meta.icon} {item.nivel || 'INFO'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="logs-modulo">{item.modulo || '-'}</span>
                                                        <div className="logs-evento">{item.evento || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <p className="logs-mensaje">{item.mensaje || '-'}</p>
                                                    </td>
                                                    <td>
                                                        {item.usuario ? (
                                                            <>
                                                                <div className="logs-usuario-name">{item.usuario}</div>
                                                                <div className="logs-usuario-email">{item.usuario_email || '-'}</div>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.82rem' }}>Sistema</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.detalle && Object.keys(item.detalle).length > 0 ? (
                                                            <pre className="logs-json-details">{stringifyDetail(item.detalle)}</pre>
                                                        ) : (
                                                            <span style={{ color: '#cbd5e1' }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminLogsAplicacion;
