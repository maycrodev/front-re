import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../layout/UserHeaderDynamic';
import Footer from '../layout/footerPrincipal';
import { getRegistrosAuditoria } from '../../services/auditoriaApi';
import './adminAuditoria.css';

const formatDate = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    
    let date;
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
        const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
        date = new Date(normalized);
    } else {
        return '-';
    }
    
    if (isNaN(date.getTime())) return '-';

    try {
        return date.toLocaleString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch {
        return date.toISOString().replace('T', ' ').slice(0, 16);
    }
};

const stringifyDetalle = (detalle) => {
    if (!detalle) return '-';
    if (typeof detalle === 'string') return detalle;

    try {
        return JSON.stringify(detalle);
    } catch {
        return '-';
    }
};

const explicarDetalle = (item) => {
    const accion = (item?.accion || '').toUpperCase();
    const tabla = item?.tabla_afectada || 'registro';
    const detalle = item?.detalle;
    const data = typeof detalle === 'object' && detalle !== null ? detalle : null;

    if (data?.evento === 'CAMBIO_ESTADO_CURSO_DOCENTE') {
        const anterior = data.estado_anterior || 'SIN_ESTADO';
        const nuevo = data.estado_nuevo || 'SIN_ESTADO';
        const cursoId = data.curso_id || item?.registro_id || '-';
        return `Se cambio el estado del curso ${cursoId}: ${anterior} -> ${nuevo}.`;
    }

    if (accion === 'CREATE') {
        if (data && Object.keys(data).length) {
            return `Se creo un registro en ${tabla} con datos: ${stringifyDetalle(data)}.`;
        }
        return `Se creo un registro en ${tabla}.`;
    }

    if (accion === 'UPDATE') {
        if (data?.cambios && Array.isArray(data.cambios)) {
            const listado = data.cambios.map(c => `[${c.campo}]: "${c.anterior !== null && c.anterior !== undefined ? c.anterior : ''}" -> "${c.nuevo !== null && c.nuevo !== undefined ? c.nuevo : ''}"`).join(', ');
            return `Se actualizaron campos en ${tabla}: ${listado || 'Ninguno'}.`;
        }
        if (data && Object.keys(data).length) {
            const campos = Object.keys(data).join(', ');
            return `Se actualizaron los campos [${campos}] en ${tabla}.`;
        }
        return `Se actualizo un registro en ${tabla}.`;
    }

    if (accion === 'DELETE') {
        if (data && Object.keys(data).length) {
            return `Se elimino un registro en ${tabla}. Datos de referencia: ${stringifyDetalle(data)}.`;
        }
        return `Se elimino un registro en ${tabla}.`;
    }

    if (accion === 'READ') {
        return `Se leyo informacion de ${tabla}.`;
    }

    if (data && Object.keys(data).length) {
        return `Accion ${accion || 'N/A'} en ${tabla}. Detalle: ${stringifyDetalle(data)}.`;
    }

    return `Accion ${accion || 'N/A'} en ${tabla}.`;
};

const AdminAuditoria = () => {
    const navigate = useNavigate();

    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [filtroAccion, setFiltroAccion] = useState('');

    const fetchAuditoria = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await getRegistrosAuditoria({
                usuario: filtroUsuario.trim() || undefined,
                accion: filtroAccion.trim() || undefined,
                limite: 150,
            });

            setRegistros(response?.datos || []);
        } catch (err) {
            setError(err.message || 'No se pudo cargar la auditoria.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditoria();
    }, []);

    const onSubmitFiltros = (e) => {
        e.preventDefault();
        fetchAuditoria();
    };

    return (
        <div className="admin-page">
            <UserHeaderDynamic />

            <main className="admin-main">
                <div className="admin-auditoria-container">
                    <header className="admin-auditoria-header">
                        <button className="auditoria-back-button" onClick={() => navigate('/admin')}>
                            {'<'}
                        </button>

                        <div>
                            <h1 className="admin-auditoria-title">Auditoria del Sistema</h1>
                            <p className="admin-auditoria-subtitle">
                                Consulta de actividad relevante: usuario, accion y fecha.
                            </p>
                        </div>
                    </header>

                    <form className="auditoria-filtros" onSubmit={onSubmitFiltros}>
                        <input
                            type="text"
                            value={filtroUsuario}
                            onChange={(e) => setFiltroUsuario(e.target.value)}
                            placeholder="Filtrar por usuario"
                        />
                        <input
                            type="text"
                            value={filtroAccion}
                            onChange={(e) => setFiltroAccion(e.target.value)}
                            placeholder="Filtrar por accion (CREATE, UPDATE...)"
                        />
                        <button type="submit">Buscar</button>
                        <button type="button" onClick={fetchAuditoria}>Refrescar</button>
                    </form>

                    {error && <div className="auditoria-error">{error}</div>}

                    {loading ? (
                        <div className="spinner-container">
                            <div className="spinner" />
                        </div>
                    ) : (
                        <section className="admin-table-wrapper">
                            <table className="admin-pagos-table">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Accion</th>
                                        <th>Fecha</th>
                                        <th>Tabla</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registros.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                                No se encontraron registros de auditoria.
                                            </td>
                                        </tr>
                                    ) : (
                                        registros.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="auditoria-usuario">{item.usuario || 'Sistema'}</div>
                                                    <div className="auditoria-email">{item.usuario_email || '-'}</div>
                                                </td>
                                                <td>
                                                    <span className="auditoria-badge">{item.accion || '-'}</span>
                                                </td>
                                                <td>{formatDate(item.fecha)}</td>
                                                <td>{item.tabla_afectada || '-'}</td>
                                                <td className="auditoria-detalle-cell" title={explicarDetalle(item)}>
                                                    {explicarDetalle(item)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AdminAuditoria;
