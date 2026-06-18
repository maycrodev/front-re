import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../../layout/UserHeaderDynamic';
import Footer from '../../layout/footerPrincipal';
import { getRoles, createUser } from '../../../services/rbacApi';
import { validateNombre } from '../../../utils/formValidators';

const camposVacios = {
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  email: '',
  rol_id: '',
};

const CrearCuentas = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(camposVacios);
  const [nameErrors, setNameErrors] = useState({ nombre: '', apellido_paterno: '', apellido_materno: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const NAME_LABELS = { nombre: 'El nombre', apellido_paterno: 'El apellido paterno', apellido_materno: 'El apellido materno' };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    if (!(name in nameErrors)) return;
    const isOptional = name === 'apellido_materno';
    if (isOptional && !value.trim()) return;
    const err = validateNombre(value, NAME_LABELS[name]);
    setNameErrors((prev) => ({ ...prev, [name]: err || '' }));
  };

  useEffect(() => {
    getRoles()
      .then((r) => {
        setRoles(r);
        if (r.length > 0) setForm((prev) => ({ ...prev, rol_id: String(r[0].id) }));
      })
      .catch(() => {});
  }, []);

  // Auto-limpia el aviso de éxito para no dejar la pantalla con el mensaje
  // de la cuenta anterior una vez concluido el registro.
  useEffect(() => {
    if (!exito) return;
    const t = setTimeout(() => setExito(''), 5000);
    return () => clearTimeout(t);
  }, [exito]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError('');
    setExito('');
    if (name in nameErrors) setNameErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {
      nombre:           validateNombre(form.nombre,           NAME_LABELS.nombre) || '',
      apellido_paterno: validateNombre(form.apellido_paterno, NAME_LABELS.apellido_paterno) || '',
      apellido_materno: form.apellido_materno.trim()
        ? validateNombre(form.apellido_materno, NAME_LABELS.apellido_materno) || ''
        : '',
    };
    setNameErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setCargando(true);
    setError('');
    setExito('');

    try {
      await createUser(form);
      const nombreCompleto = `${form.nombre} ${form.apellido_paterno}`;
      setExito(`Cuenta para "${nombreCompleto}" registrada. La contraseña se envió a su correo.`);
      setForm((prev) => ({ ...camposVacios, rol_id: prev.rol_id }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const rolSeleccionado = roles.find((r) => String(r.id) === String(form.rol_id));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fa' }}>
      <UserHeaderDynamic />

      <main style={{ flex: 1, padding: '2rem', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#6b7280', fontWeight: 600, marginBottom: '1.5rem', fontSize: '0.9rem',
          }}
        >
          ← Volver
        </button>

        <h1 style={{ color: '#003366', marginBottom: '0.25rem' }}>Registrar Nueva Cuenta</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Crea cuentas para cualquier rol del sistema. Los datos quedan registrados de inmediato.
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626',
            padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        {exito && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', color: '#166534',
            padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '0.9rem',
          }}>
            ✓ {exito}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: 'white', borderRadius: 14, padding: '1.5rem 2rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            <Campo label="Nombre(s)" name="nombre" value={form.nombre}
              onChange={handleChange} onBlur={handleNameBlur} required placeholder="Ej: María"
              error={nameErrors.nombre} />

            <Campo label="Apellido Paterno" name="apellido_paterno" value={form.apellido_paterno}
              onChange={handleChange} onBlur={handleNameBlur} required placeholder="Ej: López"
              error={nameErrors.apellido_paterno} />

            <Campo label="Apellido Materno" name="apellido_materno" value={form.apellido_materno}
              onChange={handleChange} onBlur={handleNameBlur} placeholder="Ej: Quispe"
              error={nameErrors.apellido_materno} />

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
                Rol <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                name="rol_id"
                value={form.rol_id}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '0.55rem 0.75rem', borderRadius: 7,
                  border: '1px solid #d1d5db', fontSize: '0.9rem',
                  boxSizing: 'border-box', outline: 'none', background: 'white',
                }}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              {rolSeleccionado?.descripcion && (
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                  {rolSeleccionado.descripcion}
                </p>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Campo label="Correo Electrónico" name="email" type="email"
                value={form.email} onChange={handleChange} required
                placeholder="usuario@ucb.edu.bo" />
            </div>

          </div>

          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 8, fontSize: '0.82rem', color: '#1e40af',
          }}>
            La contraseña se generará aleatoriamente (12 caracteres con mayúsculas, números y símbolos) y se enviará automáticamente al correo del usuario.
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setForm((prev) => ({ ...camposVacios, rol_id: prev.rol_id })); setError(''); setExito(''); }}
              style={{
                padding: '0.7rem 1.5rem', borderRadius: 8,
                border: '1px solid #d1d5db', background: 'white',
                color: '#374151', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={cargando}
              style={{
                padding: '0.7rem 1.8rem', borderRadius: 8, border: 'none',
                background: cargando ? '#93c5fd' : '#003366',
                color: 'white', cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.95rem',
              }}
            >
              {cargando ? 'Registrando...' : 'Registrar usuario'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

const Campo = ({ label, name, value, onChange, onBlur, required, placeholder, type = 'text', error }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }}>
      {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      required={required}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '0.55rem 0.75rem', borderRadius: 7,
        border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`, fontSize: '0.9rem',
        boxSizing: 'border-box', outline: 'none',
      }}
    />
    {error && <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#dc2626' }}>{error}</p>}
  </div>
);

export default CrearCuentas;
