import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { getLogsSeguridad } from '../../services/auditoriaApi';
import './adminLogsAplicacion.css';
import './adminLogsSeguridad.css';

// ---------------------------------------------------------------------------
// Formato de fecha robusto para PostgreSQL TIMESTAMPTZ
// El driver pg envía: "2026-05-27 09:31:52.578332+00"
//   → espacio en vez de T, offset "+00" sin ":"
// ---------------------------------------------------------------------------
const formatDate = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    try {
        let isoStr;
        if (value instanceof Date) {
            isoStr = value.toISOString();
        } else if (typeof value === 'string') {
            isoStr = value
                .replace(' ', 'T')
                .replace(/([+-]\d{2})$/, '$1:00');
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

// Detecta el SO/navegador desde el User-Agent
const parseUserAgent = (ua) => {
    if (!ua) return null;
    const os = ua.includes('Windows') ? 'Windows'
        : ua.includes('Android') ? 'Android'
        : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS'
        : ua.includes('Macintosh') ? 'macOS'
        : ua.includes('Linux') ? 'Linux'
        : null;
    const browser = ua.includes('Firefox') ? 'Firefox'
        : ua.includes('Edg/') ? 'Edge'
        : ua.includes('Chrome') ? 'Chrome'
        : ua.includes('Safari') ? 'Safari'
        : null;
    if (!os && !browser) return ua.split(' ')[0];
    return [os, browser].filter(Boolean).join(' · ');
};

const stringifyDetail = (detail) => {
    if (!detail) return '';
    try { return JSON.stringify(detail, null, 2); }
    catch { return String(detail); }
};

// Eventos relevantes de seguridad (los demás son ruido de bots o inútiles)
const EVENTOS_RELEVANTES = new Set([
    'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'CUENTA_BLOQUEADA', 'CUENTA_DESBLOQUEADA',
    'LOGOUT', 'TOKEN_EXPIRADO', 'TOKEN_INVALIDO',
    'CAMBIO_PASSWORD', 'RESET_PASSWORD_SOLICITADO', 'RESET_PASSWORD_COMPLETADO',
    'USUARIO_REGISTRADO', 'REGISTRO_FALLIDO',
    'PERMISO_DENEGADO_FRONTEND', 'ACCESO_DENEGADO',
]);

const AdminLogsSeguridad = () => {
    const navigate = useNavigate();

    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [total, setTotal]     = useState(0);

    // Filtros simplificados: solo los más útiles
    const [evento, setEvento]   = useState('');
    const [exito,  setExito]    = useState('');
    const [desde,  setDesde]    = useState('');
    const [hasta,  setHasta]    = useState('');

    const fetchLogs = useCallback(async (params = {}) => {
        try {
            setLoading(true);
            setError('');
            const response = await getLogsSeguridad({
                evento: params.evento ?? (evento.trim() || undefined),
                exito:  params.exito  ?? (exito  !== '' ? exito : undefined),
                desde:  params.desde  ?? (desde  || undefined),
                hasta:  params.hasta  ?? (hasta  || undefined),
                limite: 200,
            });
            const datosBrutos = response?.datos ?? [];

            // Validar que se muestren únicamente logs asociados a un usuario
            const datosFiltrados = datosBrutos.filter(log => log.usuario || (log.email && log.email !== '-'));

            setLogs(datosFiltrados);
            setTotal(datosFiltrados.length);
        } catch (err) {
            setError(err.message || 'No se pudieron cargar los logs de seguridad.');
        } finally {
            setLoading(false);
        }
    }, [evento, exito, desde, hasta]);

    useEffect(() => { fetchLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onSubmit = (e) => { e.preventDefault(); fetchLogs(); };

    const onLimpiar = () => {
        setEvento(''); setExito(''); setDesde(''); setHasta('');
        fetchLogs({ evento: undefined, exito: undefined, desde: undefined, hasta: undefined });
    };

    return (
        <div className="admin-page">
            <UserHeaderDynamic />
            <main className="admin-main">
                <div className="admin-logs-container security-theme">

                    {/* Cabecera */}
                    <header className="admin-logs-header">
                        <button className="logs-back-button" onClick={() => navigate('/admin')} title="Volver al panel">
                            {'<'}
                        </button>
                        <div>
                            <h1 className="admin-logs-title">🛡️ Logs de Seguridad</h1>
                            <p className="admin-logs-subtitle">
                                Inicios de sesión, bloqueos, desbloqueos y eventos de acceso crítico.
                                {total > 0 && <span className="logs-count-badge security">{total} registros</span>}
                            </p>
                        </div>
                    </header>

                    {/* Filtros simplificados — solo 4 */}
                    <div className="logs-filtros-card">
                        <form className="logs-filtros-form logs-filtros-simple" onSubmit={onSubmit}>
                            <div className="filter-group">
                                <label>Evento</label>
                                <select value={evento} onChange={(e) => setEvento(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="LOGIN_EXITOSO">LOGIN_EXITOSO</option>
                                    <option value="LOGIN_FALLIDO">LOGIN_FALLIDO</option>
                                    <option value="CUENTA_BLOQUEADA">CUENTA_BLOQUEADA</option>
                                    <option value="CUENTA_DESBLOQUEADA">CUENTA_DESBLOQUEADA</option>
                                    <option value="CAMBIO_PASSWORD">CAMBIO_PASSWORD</option>
                                    <option value="RESET_PASSWORD_SOLICITADO">RESET_PASSWORD</option>
                                    <option value="TOKEN_EXPIRADO">TOKEN_EXPIRADO</option>
                                    <option value="TOKEN_INVALIDO">TOKEN_INVALIDO</option>
                                    <option value="PERMISO_DENEGADO_FRONTEND">ACCESO_DENEGADO</option>
                                    <option value="USUARIO_REGISTRADO">REGISTRO</option>
                                </select>
                            </div>

                            <div className="filter-group">
                                <label>Resultado</label>
                                <select value={exito} onChange={(e) => setExito(e.target.value)}>
                                    <option value="">Todos</option>
                                    <option value="true">✓ Exitoso</option>
                                    <option value="false">✗ Fallido</option>
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
                                <button type="submit" className="logs-btn-primary security-theme">Filtrar</button>
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
                                        <th style={{ width: '210px' }}>Evento</th>
                                        <th style={{ width: '100px' }}>Resultado</th>
                                        <th style={{ width: '210px' }}>Usuario</th>
                                        <th style={{ width: '170px' }}>IP / Cliente</th>
                                        <th style={{ width: '220px' }}>Ruta</th>
                                        <th>Detalles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="logs-empty">
                                                <div className="logs-empty-icon">🛡️</div>
                                                No se encontraron registros de seguridad.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((item) => {
                                            const esRelevante = EVENTOS_RELEVANTES.has(item.evento);
                                            return (
                                                <tr key={item.id} className={esRelevante ? '' : 'logs-row-muted'}>
                                                    <td>
                                                        <span className="logs-fecha">{formatDate(item.fecha)}</span>
                                                    </td>
                                                    <td>
                                                        <span className="logs-evento" style={{ fontSize: '0.83rem', fontWeight: 700 }}>
                                                            {item.evento || 'ACCESO'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`logs-success-badge ${item.exito ? 'success' : 'failure'}`}>
                                                            {item.exito ? '✓ ÉXITO' : '✗ FALLA'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {item.usuario ? (
                                                            <div className="logs-usuario-name">{item.usuario}</div>
                                                        ) : null}
                                                        <div className="logs-usuario-email" style={{ fontStyle: item.email ? 'normal' : 'italic', color: item.email ? undefined : '#94a3b8' }}>
                                                            {item.email || '—'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="logs-ip-badge">{item.ip || '—'}</span>
                                                        {item.user_agent && (
                                                            <div className="logs-ua-info" title={item.user_agent}>
                                                                {parseUserAgent(item.user_agent)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.metodo && (
                                                            <span className={`logs-http-badge ${item.metodo}`}>{item.metodo}</span>
                                                        )}
                                                        <div className="logs-http-route" title={item.ruta}>
                                                            {item.ruta || '—'}
                                                        </div>
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

export default AdminLogsSeguridad;
