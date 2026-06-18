// ModalPago.jsx - Versión actualizada con consumo de API de Facturas
import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getToken as getStoredToken } from '../../utils/tokenStore';
import './ModalPago.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Iconos (mantener los mismos)
const IconClose  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IconCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const IconAlert  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IconLock   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

// Metadatos visuales por ID de curso
const VISUAL_MAP = {
  1: { icono: '💻' }, 2: { icono: '📐' }, 3: { icono: '📊' },
  4: { icono: '🌎' }, 5: { icono: '🎨' }, 6: { icono: '📈' },
};

const ModalPago = ({ cursos, total: totalProp, onClose, onPagoExitoso }) => {
  const [clientId, setClientId] = useState(null);
  const [montoUSD, setMontoUSD] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  // Estados para los datos de facturación
  const [facturaData, setFacturaData] = useState({
    nombre: '',
    email: '',
    nit: '',
  });

  const cursosArray = Array.isArray(cursos) ? cursos : [cursos];
  const cursoPrincipal = cursosArray[0];

  const totalBs = totalProp || cursosArray.reduce((sum, c) => sum + Number(c.costo), 0);
  const totalUSD = (totalBs / 7).toFixed(2);
  const cursoIds = cursosArray.map(c => c.id);

  const visual = VISUAL_MAP[cursoPrincipal?.id] || { icono: '📚' };

  const getToken = () => {
    const token = getStoredToken();
    if (!token) throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
    return token;
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/pagos/config`)
      .then(r => r.json())
      .then(d => setClientId(d.clientId))
      .catch(() => setError('No se pudo conectar con el servidor de pagos'))
      .finally(() => setCargando(false));
  }, []);

  const handleCrearOrden = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/pagos/crear-orden`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ curso_ids: cursoIds, total_bs: totalBs }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear la orden');
    setMontoUSD(data.monto);
    return data.orderID;
  };

  const handleAprobar = async (data) => {
    setError('');
    setCargando(true);

    if (!facturaData.nombre.trim() || !facturaData.email.trim()) {
      setError('Por favor, ingresa tu nombre y correo electrónico para la factura.');
      setCargando(false);
      return;
    }

    try {
      const token = getToken();
      
      // 1. Capturar el pago y hacer la inscripción
      const res = await fetch(`${API_BASE}/api/pagos/capturar-orden`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderID: data.orderID,
          curso_ids: cursoIds,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      // 2. Si el pago fue exitoso, solicitar la factura en segundo plano
      try {
        fetch(`${API_BASE}/api/facturas/enviar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // Enviamos el token por la seguridad que agregamos
          },
          body: JSON.stringify({
            nombre: facturaData.nombre,
            email: facturaData.email,
            nit: facturaData.nit,
            curso_ids: cursoIds,
            transaccionId: result.transaccion
          }),
        });
        // Usamos fetch sin "await" deliberadamente para no hacer esperar al usuario 
        // mientras el PDF se genera y el correo se envía.
      } catch (facturaError) {
        console.error('La API de facturas falló, pero el pago se realizó:', facturaError);
      }

      // 3. Mostrar pantalla de éxito inmediatamente
      setExito({ transaccion: result.transaccion });
      onPagoExitoso(cursoIds);

    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
    } finally {
      setCargando(false);
    }
  };

  const handleError = (err) => {
    console.error('PayPal error:', err);
    setError('Ocurrió un error con PayPal. Intenta de nuevo.');
  };

  const tituloCursos = cursosArray.length === 1 ? cursoPrincipal?.nombre : `${cursosArray.length} cursos`;

  return (
    <div className="pago-contenido-carrito">
      {exito ? (
        <div className="pago-exito">
          <div className="pago-exito-icono"><IconCheck /></div>
          <h3>¡Pago completado!</h3>
          <p>Ya estás inscrito en {cursosArray.length === 1 ? 'el curso' : 'los cursos'}. ¡Bienvenido!</p>
          <div className="pago-exito-cursos">
            <p>Curso{cursosArray.length > 1 ? 's' : ''} inscrito{cursosArray.length > 1 ? 's' : ''}:</p>
            <ul>
              {cursosArray.map(curso => (
                <li key={curso.id}>
                  <span className="curso-icono">{VISUAL_MAP[curso.id]?.icono || '📚'}</span>
                  <span className="curso-nombre">{curso.nombre}</span>
                </li>
              ))}
            </ul>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '-10px', marginBottom: '15px' }}>
            Hemos enviado la factura a <strong>{facturaData.email}</strong>
          </p>
          <div className="pago-exito-id">ID Transacción: {exito.transaccion}</div>
          <button className="btn-pago-continuar" onClick={() => { window.location.href = '/perfil'; }}>
            Ver mis cursos inscritos
          </button>
        </div>
      ) : (
        <>
          <div className="pago-header-compacto">
            <span className="pago-curso-icono">{visual.icono}</span>
            <div>
              <div className="pago-curso-nombre">{tituloCursos}</div>
              <div className="pago-curso-cantidad">
                {cursosArray.length} curso{cursosArray.length > 1 ? 's' : ''} en el carrito
              </div>
            </div>
          </div>

          {cursosArray.length > 1 && (
            <div className="pago-lista-cursos">
              {cursosArray.map((curso, index) => (
                <div key={curso.id} className="pago-curso-item">
                  <span className="item-num">{index + 1}</span>
                  <span className="item-icono">{VISUAL_MAP[curso.id]?.icono || '📚'}</span>
                  <span className="item-nombre">{curso.nombre}</span>
                  <span className="item-precio">Bs. {curso.costo}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pago-factura-form">
            <h4>Datos para la factura</h4>
            <div className="factura-field">
              <label>Nombre completo *</label>
              <input
                type="text"
                value={facturaData.nombre}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                  setFacturaData({ ...facturaData, nombre: val });
                }}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="factura-field">
              <label>Correo electrónico *</label>
              <input
                type="email"
                value={facturaData.email}
                onChange={(e) => setFacturaData({ ...facturaData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                required
              />
              <small>Se enviará la factura a este correo</small>
            </div>
            <div className="factura-field">
              <label>NIT / CI</label>
              <input
                type="text"
                value={facturaData.nit}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9A-Za-z\-]/g, '');
                  setFacturaData({ ...facturaData, nit: val });
                }}
                placeholder="1234567"
              />
            </div>
          </div>

          <div className="pago-resumen">
            <div className="pago-resumen-row">
              <span>Subtotal ({cursosArray.length} curso{cursosArray.length > 1 ? 's' : ''})</span>
              <span>Bs. {totalBs}</span>
            </div>
            {montoUSD && (
              <div className="pago-resumen-row">
                <span>Equivalente USD</span>
                <span>${montoUSD}</span>
              </div>
            )}
            <div className="pago-resumen-row total">
              <span>Total a pagar</span>
              <span>${montoUSD || totalUSD}</span>
            </div>
          </div>

          {error && (
            <div className="pago-error">
              <IconAlert />
              <span>{error}</span>
            </div>
          )}

          <div className="pago-divider"><span>Pagar con PayPal</span></div>

          {cargando ? (
            <div className="pago-cargando">
              <div className="pago-spinner" />
              <p>Cargando opciones de pago...</p>
            </div>
          ) : clientId ? (
            <div className="paypal-btn-wrapper">
              <PayPalScriptProvider options={{
                'client-id': clientId,
                currency: 'USD',
                intent: 'capture',
              }}>
                <PayPalButtons
                  style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 50 }}
                  onClick={(data, actions) => {
                    setError('');
                    if (!facturaData.nombre.trim() || !facturaData.email.trim()) {
                      setError('Por favor, ingresa tu nombre y correo para la factura antes de pagar.');
                      return actions.reject();
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facturaData.email)) {
                      setError('Por favor, ingresa un correo electrónico válido.');
                      return actions.reject();
                    }
                    return actions.resolve();
                  }}
                  createOrder={handleCrearOrden}
                  onApprove={handleAprobar}
                  onError={handleError}
                  onCancel={() => setError('Pago cancelado. Puedes intentarlo de nuevo.')}
                />
              </PayPalScriptProvider>
            </div>
          ) : (
            <div className="pago-error">
              <IconAlert />
              <span>No se pudo cargar el sistema de pagos. Verifica que el backend esté corriendo.</span>
            </div>
          )}

          <div className="pago-seguridad">
            <IconLock />
            <span>Pago 100% seguro · Procesado por PayPal Sandbox</span>
          </div>
        </>
      )}
    </div>
  );
};

export default ModalPago;