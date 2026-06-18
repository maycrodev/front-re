import React, { useState, useEffect, useRef } from 'react';
import { getMatrizRiesgos, crearItemMatriz, actualizarItemMatriz, eliminarItemMatriz } from '../../../services/riesgosApi';
import { getUsuarios } from '../../../services/rbacApi';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../utils/roleUtils';
import * as XLSX from 'xlsx';
import './MatrizRiesgos.css';

const CALCULAR_NIVEL = (valor) => {
    if (valor >= 20) return 'Extremo';
    if (valor >= 10) return 'Alto';
    if (valor >= 5) return 'Moderado';
    return 'Bajo';
};

const TRATAMIENTOS_POR_NIVEL = {
    'Bajo':     ['Aceptar'],
    'Moderado': ['Reducir'],
    'Alto':     ['Reducir', 'Evitar', 'Compartir'],
    'Extremo':  ['Reducir', 'Evitar', 'Compartir'],
};
const TRATAMIENTO_DEFAULT = { Bajo: 'Aceptar', Moderado: 'Reducir', Alto: 'Evitar', Extremo: 'Evitar' };

const COLOR_NIVEL = {
    Extremo: '#dc2626', // Red
    Alto: '#f97316',    // Orange
    Moderado: '#eab308', // Yellow
    Bajo: '#22c55e',    // Green
};

const defaultThreat = () => ({
    id: 't_' + Math.random().toString(36).substring(2, 9),
    amenaza_vulnerabilidad: '',
    consecuencia_riesgo: '',
    probabilidad_inherente: 3,
    impacto_inherente: 3,
    riesgo_inherente: 9,
    nivel_riesgo_inherente: 'Moderado',
    tratamiento_riesgo: 'Reducir',
    controles_implementar: [
        { descripcion: '', control_tipo: 'P', control_nivel: 'M', control_frecuencia: 'PT' }
    ],
    probabilidad_residual: 1,
    impacto_residual: 1,
    riesgo_residual: 1,
    nivel_riesgo_residual: 'Bajo',
    plan_accion: [''],
    fecha_limite: '',
    responsable_id: null,
    responsable_nombre: '',
});

const MatrizRiesgos = () => {
    const { usuario } = useAuth();
    const misPermisos   = usuario?.permisos || [];
    const puedeAgregar  = misPermisos.includes(PERMISSIONS.MATRIZ_AGREGAR);
    const puedeEditar   = misPermisos.includes(PERMISSIONS.MATRIZ_EDITAR);
    const puedeEliminar = misPermisos.includes(PERMISSIONS.MATRIZ_ELIMINAR);

    const [matriz, setMatriz] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [exitoMsg, setExitoMsg] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalExplicativoAbierto, setModalExplicativoAbierto] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [usuariosAdmins, setUsuariosAdmins] = useState([]);
    const fileInputRef = useRef(null);
    const activoInputRef = useRef(null);

    const [form, setForm] = useState({
        activo_informacion: '',
        amenazas: [defaultThreat()],
    });

    const cargarDatos = async () => {
        setCargando(true);
        setError('');
        try {
            const [data, users] = await Promise.all([
                getMatrizRiesgos(),
                getUsuarios().catch(() => []),
            ]);
            setMatriz(data.datos || []);
            setUsuariosAdmins((users || []).filter(u => u.activo !== false && (u.rol_nombre === 'Oficial de Seguridad' || u.rol_id === 8)));
        } catch (err) {
            setError(err.message || 'Error al cargar la matriz de riesgos');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const showSuccess = (msg) => {
        setExitoMsg(msg);
        setTimeout(() => setExitoMsg(''), 5000);
    };

    const resetForm = () => {
        setForm({
            activo_informacion: '',
            amenazas: [defaultThreat()],
        });
        setEditandoId(null);
    };

    const abrirCrear = () => {
        resetForm();
        setModalAbierto(true);
    };

    const abrirEditar = (item) => {
        setForm({
            activo_informacion: item.activo_informacion,
            amenazas: Array.isArray(item.amenazas) && item.amenazas.length > 0 
                ? item.amenazas.map(t => ({
                    ...t,
                    controles_implementar: Array.isArray(t.controles_implementar) 
                        ? t.controles_implementar.map(c => typeof c === 'string' ? { descripcion: c, control_tipo: 'P', control_nivel: 'S', control_frecuencia: 'PT' } : c)
                        : [{ descripcion: t.controles_implementar || '', control_tipo: t.control_tipo || 'P', control_nivel: t.control_nivel || 'S', control_frecuencia: t.control_frecuencia || 'PT' }],
                    plan_accion: Array.isArray(t.plan_accion) ? t.plan_accion : [t.plan_accion || ''],
                  }))
                : [defaultThreat()],
        });
        setEditandoId(item.id);
        setModalAbierto(true);
    };

    const handleAddThreat = () => {
        setForm({
            ...form,
            amenazas: [...form.amenazas, defaultThreat()],
        });
    };

    const handleRemoveThreat = (index) => {
        if (form.amenazas.length === 1) return;
        const copy = [...form.amenazas];
        copy.splice(index, 1);
        setForm({ ...form, amenazas: copy });
    };

    const handleThreatChange = (index, field, value) => {
        const copy = [...form.amenazas];
        const threat = { ...copy[index], [field]: value };

        if (field === 'probabilidad_inherente' || field === 'impacto_inherente') {
            const p = Number(field === 'probabilidad_inherente' ? value : threat.probabilidad_inherente);
            const i = Number(field === 'impacto_inherente' ? value : threat.impacto_inherente);
            threat.riesgo_inherente = p * i;
            threat.nivel_riesgo_inherente = CALCULAR_NIVEL(threat.riesgo_inherente);
        }

        if (field === 'probabilidad_residual' || field === 'impacto_residual') {
            const p = Number(field === 'probabilidad_residual' ? value : threat.probabilidad_residual);
            const i = Number(field === 'impacto_residual' ? value : threat.impacto_residual);
            threat.riesgo_residual = p * i;
            threat.nivel_riesgo_residual = CALCULAR_NIVEL(threat.riesgo_residual);
        }

        copy[index] = threat;
        setForm({ ...form, amenazas: copy });
    };

    const handleThreatFieldsChange = (index, fields) => {
        const copy = [...form.amenazas];
        const threat = { ...copy[index], ...fields };

        if ('probabilidad_inherente' in fields || 'impacto_inherente' in fields) {
            const p = Number(threat.probabilidad_inherente);
            const i = Number(threat.impacto_inherente);
            threat.riesgo_inherente = p * i;
            threat.nivel_riesgo_inherente = CALCULAR_NIVEL(threat.riesgo_inherente);
            const permitidos = TRATAMIENTOS_POR_NIVEL[threat.nivel_riesgo_inherente] || [];
            if (!permitidos.includes(threat.tratamiento_riesgo)) {
                threat.tratamiento_riesgo = TRATAMIENTO_DEFAULT[threat.nivel_riesgo_inherente] || permitidos[0];
            }
        }

        if ('probabilidad_residual' in fields || 'impacto_residual' in fields) {
            const p = Number(threat.probabilidad_residual);
            const i = Number(threat.impacto_residual);
            threat.riesgo_residual = p * i;
            threat.nivel_riesgo_residual = CALCULAR_NIVEL(threat.riesgo_residual);
        }

        copy[index] = threat;
        setForm({ ...form, amenazas: copy });
    };

    const handleAddControl = (threatIndex) => {
        const copy = [...form.amenazas];
        const controls = [...(copy[threatIndex].controles_implementar || [])];
        controls.push({ descripcion: '', control_tipo: 'P', control_nivel: 'M', control_frecuencia: 'PT' });
        copy[threatIndex] = { ...copy[threatIndex], controles_implementar: controls };
        setForm({ ...form, amenazas: copy });
    };

    const handleRemoveControl = (threatIndex, controlIndex) => {
        const copy = [...form.amenazas];
        const controls = [...(copy[threatIndex].controles_implementar || [])];
        if (controls.length === 1) {
            controls[0] = { descripcion: '', control_tipo: 'P', control_nivel: 'M', control_frecuencia: 'PT' };
        } else {
            controls.splice(controlIndex, 1);
        }
        copy[threatIndex] = { ...copy[threatIndex], controles_implementar: controls };
        setForm({ ...form, amenazas: copy });
    };

    const handleControlChange = (threatIndex, controlIndex, field, value) => {
        const copy = [...form.amenazas];
        const controls = [...(copy[threatIndex].controles_implementar || [])];
        controls[controlIndex] = { ...controls[controlIndex], [field]: value };
        copy[threatIndex] = { ...copy[threatIndex], controles_implementar: controls };
        setForm({ ...form, amenazas: copy });
    };

    const handleAddStep = (threatIndex) => {
        const copy = [...form.amenazas];
        const steps = [...(copy[threatIndex].plan_accion || [])];
        steps.push('');
        copy[threatIndex] = { ...copy[threatIndex], plan_accion: steps };
        setForm({ ...form, amenazas: copy });
    };

    const handleRemoveStep = (threatIndex, stepIndex) => {
        const copy = [...form.amenazas];
        const steps = [...(copy[threatIndex].plan_accion || [])];
        if (steps.length === 1) {
            steps[0] = '';
        } else {
            steps.splice(stepIndex, 1);
        }
        copy[threatIndex] = { ...copy[threatIndex], plan_accion: steps };
        setForm({ ...form, amenazas: copy });
    };

    const handleStepChange = (threatIndex, stepIndex, value) => {
        const copy = [...form.amenazas];
        const steps = [...(copy[threatIndex].plan_accion || [])];
        steps[stepIndex] = value;
        copy[threatIndex] = { ...copy[threatIndex], plan_accion: steps };
        setForm({ ...form, amenazas: copy });
    };

    const descargarExcelModelo = () => {
        const instHeaders = [
            ["GUÍA DE LLENADO Y REGLAS DE IMPORTACIÓN DE LA MATRIZ DE RIESGOS"],
            ["1. La hoja 'Matriz (Llenar aquí)' contiene la estructura oficial para cargar los riesgos."],
            ["2. La columna 'Responsable Email' debe coincidir EXACTAMENTE con el correo de un administrador registrado."],
            ["3. IMPORTANTE: Si el correo del responsable no coincide, el riesgo se importará pero se quedará como 'Sin responsable asignado'."],
            ["   Se recomienda encarecipamente verificar los correos válidos a continuación o asignar el responsable directamente en la aplicación."],
            ["4. En la columna 'Controles a Implementar', cada control debe escribirse con sus atributos entre corchetes: Descripcion [Tipo, Nivel, Frecuencia], separados por punto y coma (;)."],
            ["   Ejemplo: Validación JWT [P, A, PT]; Configurar WAF [P, S, D]; Monitoreo logs [D, M, M]"],
            ["   Abreviaciones válidas: Tipo (P=Preventivo, C=Correctivo, D=Detectivo, Ds=Disuasivo); Nivel (A=Automático, SA=Semiautomático, M=Manual); Frecuencia (PT=Por Transacción, s=Por Segundo, m=Por Minuto, D=Diario, S=Semanal, M=Mensual, A=Anual)"],
            ["5. Los campos P (Probabilidad) e I (Impacto) deben ser números enteros entre 1 y 5."],
            [""],
            ["LISTA DE OFICIALES DE SEGURIDAD REGISTRADOS EN EL SISTEMA:"],
            ["ID", "Nombre Completo", "Correo Electrónico (Usar en la hoja Matriz)"]
        ];

        usuariosAdmins.forEach(u => {
            const fullName = `${u.nombre} ${u.apellido_paterno || ''}`.trim();
            instHeaders.push([u.id, fullName, u.correo || u.email || 'sin-correo@college.edu']);
        });

        const wsInstructions = XLSX.utils.aoa_to_sheet(instHeaders);

        const wsData = [
            {
                "Activo de Informacion": "[EJEMPLO - BORRAR] Base de Datos de Inscripciones y Calificaciones",
                "Amenaza / Vulnerabilidad": "[EJEMPLO] Explotación de fallos de autorización",
                "Consecuencias / Riesgo": "[EJEMPLO] Alteración de registros académicos",
                "P Inherente (1-5)": 3,
                "I Inherente (1-5)": 5,
                "Tratamiento (Reducir/Aceptar/Evitar/Transferir)": "Reducir",
                "Controles a Implementar (Formato: Descripcion [Tipo, Nivel, Frecuencia]; separados por ';')": "Validación estricta de tokens JWT [P, A, PT]; Sanitización de entradas [P, A, PT]; Monitoreo de logs [D, S, D]",
                "P Residual (1-5)": 1,
                "I Residual (1-5)": 5,
                "Pasos Plan de Accion (Separados por punto y coma ';')": "Auditar código de endpoints; Configurar reglas de WAF; Implementar firmas",
                "Fecha Limite (AAAA-MM-DD)": "2026-06-15",
                "Responsable Email (Debe ser un Responsable de Seguridad registrado)": usuariosAdmins[0]?.correo || usuariosAdmins[0]?.email || "admin_seguridad@college.edu"
            },
            {
                "Activo de Informacion": "",
                "Amenaza / Vulnerabilidad": "",
                "Consecuencias / Riesgo": "",
                "P Inherente (1-5)": "",
                "I Inherente (1-5)": "",
                "Tratamiento (Reducir/Aceptar/Evitar/Transferir)": "",
                "Controles a Implementar (Formato: Descripcion [Tipo, Nivel, Frecuencia]; separados por ';')": "",
                "P Residual (1-5)": "",
                "I Residual (1-5)": "",
                "Pasos Plan de Accion (Separados por punto y coma ';')": "",
                "Fecha Limite (AAAA-MM-DD)": "",
                "Responsable Email (Debe ser un Responsable de Seguridad registrado)": ""
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(wsData);

        worksheet['!cols'] = [
            { wch: 30 }, // Activo
            { wch: 30 }, // Amenaza
            { wch: 30 }, // Consecuencia
            { wch: 15 }, // P Inherente
            { wch: 15 }, // I Inherente
            { wch: 15 }, // Tratamiento
            { wch: 60 }, // Controles (formato granular)
            { wch: 12 }, // P Residual
            { wch: 12 }, // I Residual
            { wch: 35 }, // Plan
            { wch: 15 }, // Fecha
            { wch: 30 }  // Responsable
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, wsInstructions, "Instrucciones y Responsables");
        XLSX.utils.book_append_sheet(workbook, worksheet, "Matriz (Llenar aqui)");

        XLSX.writeFile(workbook, "modelo_matriz_riesgos_seguridad.xlsx");
        showSuccess("Modelo de Excel con lista de responsables y guía de llenado descargado con éxito.");
    };

    const handleImportarExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rawRows = XLSX.utils.sheet_to_json(sheet);

                if (rawRows.length === 0) {
                    throw new Error("El archivo Excel está vacío o no tiene el formato correcto.");
                }

                const agrupados = {};
                for (const row of rawRows) {
                    const activo = row["Activo de Informacion"];
                    if (!activo) continue;

                    if (!agrupados[activo]) {
                        agrupados[activo] = [];
                    }

                    const emailResp = row["Responsable Email (Debe ser un Responsable de Seguridad registrado)"] || '';
                    const user = usuariosAdmins.find(u => String(u.correo || u.email || '').trim().toLowerCase() === String(emailResp).trim().toLowerCase());
                    
                    const pInherente = Number(row["P Inherente (1-5)"]) || 3;
                    const iInherente = Number(row["I Inherente (1-5)"]) || 3;
                    const pResidual = Number(row["P Residual (1-5)"]) || 1;
                    const iResidual = Number(row["I Residual (1-5)"]) || 1;

                    const controlesRaw = row["Controles a Implementar (Formato: Descripcion [Tipo, Nivel, Frecuencia]; separados por ';')"] ||
                                         row["Controles a Implementar (Formato: Descripcion [Tipo, Nivel, Frecuencia]; ...)"] ||
                                         row["Controles a Implementar (Separados por ';')"] || '';
                    const parsedControles = String(controlesRaw).split(';').map(cStr => {
                        const trimmed = cStr.trim();
                        if (!trimmed) return null;
                        const match = trimmed.match(/(.*)\[\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\]]+)\s*\]/);
                        if (match) {
                            return {
                                descripcion: match[1].trim(),
                                control_tipo: match[2].trim(),
                                control_nivel: match[3].trim(),
                                control_frecuencia: match[4].trim()
                            };
                        }
                        return {
                            descripcion: trimmed,
                            control_tipo: 'P',
                            control_nivel: 'S',
                            control_frecuencia: 'PT'
                        };
                    }).filter(Boolean);

                    const pasosRaw = row["Pasos Plan de Accion (Separados por punto y coma ';')"] || '';
                    const plan_accion = String(pasosRaw).split(';').map(p => p.trim()).filter(Boolean);

                    agrupados[activo].push({
                        id: 't_' + Math.random().toString(36).substring(2, 9),
                        amenaza_vulnerabilidad: row["Amenaza / Vulnerabilidad"] || 'Amenaza genérica',
                        consecuencia_riesgo: row["Consecuencias / Riesgo"] || 'Consecuencia genérica',
                        probabilidad_inherente: pInherente,
                        impacto_inherente: iInherente,
                        riesgo_inherente: pInherente * iInherente,
                        nivel_riesgo_inherente: CALCULAR_NIVEL(pInherente * iInherente),
                        tratamiento_riesgo: row["Tratamiento (Reducir/Aceptar/Evitar/Transferir)"] || 'Reducir',
                        controles_implementar: parsedControles.length > 0 ? parsedControles : [{ descripcion: 'Controles estándar', control_tipo: 'P', control_nivel: 'S', control_frecuencia: 'PT' }],
                        probabilidad_residual: pResidual,
                        impacto_residual: iResidual,
                        riesgo_residual: pResidual * iResidual,
                        nivel_riesgo_residual: CALCULAR_NIVEL(pResidual * iResidual),
                        plan_accion: plan_accion.length > 0 ? plan_accion : ['Monitoreo continuo'],
                        fecha_limite: row["Fecha Limite (AAAA-MM-DD)"] || new Date().toISOString().split('T')[0],
                        responsable_id: user ? user.id : null,
                        responsable_nombre: user ? `${user.nombre} ${user.apellido_paterno || ''}`.trim() : 'Sin responsable asignado',
                    });
                }

                let creados = 0;
                for (const [activo, amenazas] of Object.entries(agrupados)) {
                    await crearItemMatriz({
                        activo_informacion: activo,
                        amenazas
                    });
                    creados++;
                }

                showSuccess(`¡Éxito! Se importaron ${creados} activos de información correctamente.`);
                await cargarDatos();
            } catch (err) {
                setError(err.message || 'Error al procesar el archivo Excel. Asegúrate de usar el formato del modelo.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsBinaryString(file);
    };

    const guardar = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.activo_informacion.trim()) {
            setError("Debe proporcionar un nombre para el Activo de Información.");
            return;
        }

        for (let i = 0; i < form.amenazas.length; i++) {
            const t = form.amenazas[i];
            if (!t.amenaza_vulnerabilidad.trim()) {
                setError(`La Amenaza #${i + 1} no puede estar vacía.`);
                return;
            }
            if (!t.consecuencia_riesgo.trim()) {
                setError(`Las consecuencias de la Amenaza #${i + 1} no pueden estar vacías.`);
                return;
            }
            const controlesValidos = (t.controles_implementar || []).filter(c => c.descripcion.trim() !== '');
            if (controlesValidos.length === 0) {
                setError(`Debe especificar al menos un control de mitigación para la Amenaza #${i + 1}.`);
                return;
            }
            if (!t.fecha_limite) {
                setError(`Debe especificar una Fecha Límite de mitigación para la Amenaza #${i + 1}.`);
                return;
            }
            if (!t.responsable_id) {
                setError(`Debe seleccionar un responsable (Responsable de Seguridad) para la mitigación de la Amenaza #${i + 1}.`);
                return;
            }
        }

        const amenazasValidadas = form.amenazas.map(t => {
            const pInherente = Number(t.probabilidad_inherente);
            const iInherente = Number(t.impacto_inherente);
            const riesgoInherente = pInherente * iInherente;
            const pResidual = Number(t.probabilidad_residual);
            const iResidual = Number(t.impacto_residual);
            const riesgoResidual = pResidual * iResidual;

            return {
                ...t,
                probabilidad_inherente: pInherente,
                impacto_inherente: iInherente,
                riesgo_inherente: riesgoInherente,
                nivel_riesgo_inherente: CALCULAR_NIVEL(riesgoInherente),
                probabilidad_residual: pResidual,
                impacto_residual: iResidual,
                riesgo_residual: riesgoResidual,
                nivel_riesgo_residual: CALCULAR_NIVEL(riesgoResidual),
                controles_implementar: (t.controles_implementar || []).filter(c => c.descripcion.trim() !== ''),
                plan_accion: (t.plan_accion || []).filter(step => step.trim() !== ''),
            };
        });

        const payload = {
            activo_informacion: form.activo_informacion,
            amenazas: amenazasValidadas,
        };

        try {
            if (editandoId) {
                await actualizarItemMatriz(editandoId, payload);
                showSuccess("Análisis de riesgos actualizado con éxito.");
            } else {
                await crearItemMatriz(payload);
                showSuccess("Análisis de riesgos registrado con éxito.");
            }
            setModalAbierto(false);
            resetForm();
            await cargarDatos();
        } catch (err) {
            setError(err.message || 'Error al guardar el registro');
        }
    };

    const borrar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este activo y todas sus amenazas asociadas de la matriz?')) return;
        setError('');
        try {
            await eliminarItemMatriz(id);
            showSuccess("Activo eliminado de la matriz.");
            await cargarDatos();
        } catch (err) {
            setError(err.message || 'Error al eliminar el registro');
        }
    };

    const rows = [];
    let threatCounter = 1;
    matriz.forEach((item) => {
        const amenazas = Array.isArray(item.amenazas) && item.amenazas.length > 0 ? item.amenazas : [{}];
        
        let totalAssetControls = 0;
        amenazas.forEach(t => {
            const ctrls = Array.isArray(t.controles_implementar) && t.controles_implementar.length > 0 
                ? t.controles_implementar 
                : [{}];
            totalAssetControls += ctrls.length;
        });

        let cumulativeControlIdx = 0;
        amenazas.forEach((threat, tIdx) => {
            const controls = Array.isArray(threat.controles_implementar) && threat.controles_implementar.length > 0
                ? threat.controles_implementar
                : [{}];
            
            controls.forEach((control, cIdx) => {
                rows.push({
                    assetId: item.id,
                    activo_informacion: item.activo_informacion,
                    isFirstControlOfAsset: cumulativeControlIdx === 0,
                    assetRowSpan: totalAssetControls,
                    
                    threatIndex: threatCounter,
                    threat,
                    isFirstControlOfThreat: cIdx === 0,
                    threatRowSpan: controls.length,
                    isLastControlOfThreat: cIdx === controls.length - 1,
                    isLastThreatOfAsset: tIdx === amenazas.length - 1 && cIdx === controls.length - 1,

                    control,
                    controlIndex: cIdx,
                    fullItem: item
                });
                cumulativeControlIdx++;
            });
            threatCounter++;
        });
    });

    const renderCeldaExplicativa = (p, i) => {
        const valor = p * i;
        const nivel = CALCULAR_NIVEL(valor);
        return (
            <td 
                key={i} 
                className="explicativo-celda"
                style={{ backgroundColor: `${COLOR_NIVEL[nivel]}ee` }}
            >
                <div className="celda-valor">{valor}</div>
                <div className="celda-nivel">{nivel}</div>
            </td>
        );
    };

    return (
        <div className="matriz-container">
            <div className="matriz-controls-row">
                <h2 className="matriz-subtitle">Matriz de Análisis de Riesgos de Seguridad de la Información</h2>
                <div className="matriz-header-buttons">
                    <button className="btn-secundario add-matrix-btn" onClick={() => setModalExplicativoAbierto(true)}>
                        <i className="fa-solid fa-circle-question"></i> Criterios
                    </button>
                    {puedeAgregar && (
                        <>
                            <button className="btn-secundario add-matrix-btn" onClick={descargarExcelModelo}>
                                <i className="fa-solid fa-download"></i> Descargar Plantilla
                            </button>
                            <label className="btn-secundario add-matrix-btn upload-excel-btn">
                                <i className="fa-solid fa-upload"></i> Importar Excel
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={fileInputRef}
                                    onChange={handleImportarExcel}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <button className="btn-primario add-matrix-btn" onClick={abrirCrear}>
                                + Nuevo Análisis de Riesgo
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="riesgos-alert riesgos-alert-error">{error}</div>}
            {exitoMsg && <div className="riesgos-alert riesgos-alert-success">{exitoMsg}</div>}

            {cargando ? (
                <div className="matriz-loading">Cargando matriz de análisis...</div>
            ) : (
                <div className="matriz-table-scroll-container">
                    <table className="matriz-table">
                        <thead>
                            <tr className="matriz-header-groups">
                                <th colSpan="2" className="group-activos">ACTIVOS</th>
                                <th colSpan="2" className="group-identificacion">IDENTIFICACIÓN / VALORACIÓN</th>
                                <th colSpan="4" className="group-eval-inherente">EVALUACIÓN DEL RIESGO INHERENTE</th>
                                <th className="group-medicion">MEDICIÓN</th>
                                <th colSpan="4" className="group-mitigacion">MITIGACIÓN Y CONTROLES</th>
                                <th colSpan="4" className="group-residual">RIESGO RESIDUAL</th>
                                <th colSpan="3" className="group-eficiencia">PLAN DE ACCIÓN Y SEGUIMIENTO</th>
                                {(puedeEditar || puedeEliminar) && <th className="group-acciones">ACCIONES</th>}
                            </tr>
                            <tr className="matriz-header-fields">
                                <th style={{ width: '40px' }}>No.</th>
                                <th style={{ minWidth: '150px' }} className="border-thick-right">Activo de Información</th>
                                <th style={{ minWidth: '200px' }}>Amenaza / Vulnerabilidad</th>
                                <th style={{ minWidth: '200px' }} className="border-thick-right">Consecuencia / Riesgo</th>
                                <th style={{ width: '40px' }} title="Probabilidad">P</th>
                                <th style={{ width: '40px' }} title="Impacto">I</th>
                                <th style={{ width: '60px' }}>Valor</th>
                                <th style={{ minWidth: '100px' }} className="border-thick-right">Nivel Riesgo</th>
                                <th style={{ minWidth: '100px' }} className="border-thick-right">Tratamiento</th>
                                <th style={{ minWidth: '200px' }}>Controles a Implementar</th>
                                <th style={{ width: '60px' }} title="Tipo (P, D, C, Di)">Tipo</th>
                                <th style={{ width: '60px' }} title="Nivel (A, S, M)">Nivel</th>
                                <th style={{ width: '80px' }} title="Frecuencia" className="border-thick-right">Frecuencia</th>
                                <th style={{ width: '40px' }} title="Probabilidad Residual">P</th>
                                <th style={{ width: '40px' }} title="Impacto Residual">I</th>
                                <th style={{ width: '60px' }}>Valor</th>
                                <th style={{ minWidth: '100px' }} className="border-thick-right">Nivel Residual</th>
                                <th style={{ minWidth: '220px' }}>Pasos Plan de Acción</th>
                                <th style={{ minWidth: '90px' }}>Fecha Límite</th>
                                <th style={{ minWidth: '130px' }}>Responsable</th>
                                {(puedeEditar || puedeEliminar) && <th style={{ width: '100px' }}>Acción Activo</th>}
                            </tr>
                        </thead>
                        <tbody>
                             {rows.map((row, idx) => {
                                 const t = row.threat;
                                 const ctrl = row.control;
                                 return (
                                     <tr key={`${row.assetId}-${t.id || ''}-${row.controlIndex}-${idx}`} className={`matriz-row ${row.isLastThreatOfAsset ? 'is-last-threat-row' : ''}`}>
                                         {row.isFirstControlOfThreat && (
                                             <td rowSpan={row.threatRowSpan} className="text-center font-bold">{row.threatIndex}</td>
                                         )}
                                         
                                         {row.isFirstControlOfAsset && (
                                             <td rowSpan={row.assetRowSpan} className="font-semibold text-white asset-cell-highlight border-thick-right">
                                                 {row.activo_informacion}
                                             </td>
                                         )}

                                         {row.isFirstControlOfThreat && (
                                             <>
                                                 <td rowSpan={row.threatRowSpan}>{t.amenaza_vulnerabilidad || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="border-thick-right">{t.consecuencia_riesgo || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-semibold">{t.probabilidad_inherente || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-semibold">{t.impacto_inherente || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-bold text-white">{t.riesgo_inherente || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-bold border-thick-right">
                                                     {t.nivel_riesgo_inherente ? (
                                                         <span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL[t.nivel_riesgo_inherente]}22`, color: COLOR_NIVEL[t.nivel_riesgo_inherente], border: `1px solid ${COLOR_NIVEL[t.nivel_riesgo_inherente]}55` }}>
                                                             {t.nivel_riesgo_inherente}
                                                         </span>
                                                     ) : '—'}
                                                 </td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center text-sky-600 font-semibold border-thick-right">{t.tratamiento_riesgo || '—'}</td>
                                             </>
                                         )}
                                         
                                         {/* Control Columns: Rendered for every control row */}
                                         <td>{ctrl.descripcion || ctrl || '—'}</td>
                                         <td className="text-center font-medium text-emerald-600">{ctrl.control_tipo || 'P'}</td>
                                         <td className="text-center font-medium text-violet-600">{ctrl.control_nivel || 'S'}</td>
                                         <td className="text-center font-medium text-teal-600 border-thick-right">{ctrl.control_frecuencia || 'PT'}</td>
                                         
                                         {row.isFirstControlOfThreat && (
                                             <>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-semibold">{t.probabilidad_residual || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-semibold">{t.impacto_residual || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-bold text-white">{t.riesgo_residual || '—'}</td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-bold border-thick-right">
                                                     {t.nivel_riesgo_residual ? (
                                                         <span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL[t.nivel_riesgo_residual]}22`, color: COLOR_NIVEL[t.nivel_riesgo_residual], border: `1px solid ${COLOR_NIVEL[t.nivel_riesgo_residual]}55` }}>
                                                             {t.nivel_riesgo_residual}
                                                         </span>
                                                     ) : '—'}
                                                 </td>
                                                 <td rowSpan={row.threatRowSpan}>
                                                     {Array.isArray(t.plan_accion) && t.plan_accion.length > 0 ? (
                                                         <ol className="matrix-plan-list">
                                                             {t.plan_accion.map((step, sidx) => (
                                                                 <li key={sidx} className="matrix-plan-item">{step}</li>
                                                             ))}
                                                         </ol>
                                                     ) : '—'}
                                                 </td>
                                                 <td rowSpan={row.threatRowSpan} className="text-center font-medium text-slate-500">
                                                     {t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString('es-BO') : '—'}
                                                 </td>
                                                 <td rowSpan={row.threatRowSpan} className="font-semibold text-slate-700">{t.responsable_nombre || '—'}</td>
                                             </>
                                         )}

                                         {row.isFirstControlOfAsset && (puedeEditar || puedeEliminar) && (
                                             <td rowSpan={row.assetRowSpan} className="text-center">
                                                 <div className="matrix-actions-cell">
                                                     {puedeEditar && (
                                                         <button className="matrix-btn-edit" onClick={() => abrirEditar(row.fullItem)} title="Editar Activo Completo"><i className="fa-solid fa-pen"></i></button>
                                                     )}
                                                     {puedeEliminar && (
                                                         <button className="matrix-btn-delete" onClick={() => borrar(row.assetId)} title="Eliminar Activo"><i className="fa-solid fa-trash"></i></button>
                                                     )}
                                                 </div>
                                             </td>
                                         )}
                                     </tr>
                                 );
                             })}
                             {matriz.length === 0 && (
                                 <tr>
                                     <td colSpan={(puedeEditar || puedeEliminar) ? 21 : 20} className="text-center py-8 text-slate-400">
                                         No hay análisis de riesgos registrados en la matriz.
                                     </td>
                                 </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            )}

            {modalExplicativoAbierto && (
                <div className="riesgos-modal-overlay" onClick={() => setModalExplicativoAbierto(false)}>
                    <div className="riesgos-modal explicativo-modal-width anim-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="explicativo-modal-header">
                            <h2>Matriz de Criterios de Evaluación de Riesgos</h2>
                            <button className="close-modal" onClick={() => setModalExplicativoAbierto(false)}>&times;</button>
                        </div>
                        
                        <div className="explicativo-modal-content">
                            <p className="modal-desc">
                                El Nivel de Riesgo se calcula multiplicando la <strong>Probabilidad</strong> por el <strong>Impacto</strong> (Valores de 1 a 5).
                            </p>

                            <div className="matrix-visual-container">
                                <div className="matrix-y-label">PROBABILIDAD</div>
                                <div className="matrix-grid-wrapper">
                                    <table className="matrix-visual-table">
                                        <tbody>
                                            {[5, 4, 3, 2, 1].map((pVal) => (
                                                <tr key={pVal}>
                                                    <td className="matrix-axis-num font-bold">{pVal}</td>
                                                    {[1, 2, 3, 4, 5].map((iVal) => renderCeldaExplicativa(pVal, iVal))}
                                                </tr>
                                            ))}
                                            <tr>
                                                <td></td>
                                                {[1, 2, 3, 4, 5].map((iVal) => (
                                                    <td key={iVal} className="matrix-axis-num font-bold text-center">{iVal}</td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                    <div className="matrix-x-label">IMPACTO</div>
                                </div>
                            </div>

                            <div className="matrix-legend-section">
                                <h3>Criterios de Valoración y Tratamiento</h3>
                                <table className="legend-table">
                                    <thead>
                                        <tr>
                                            <th>Valor</th>
                                            <th>Nivel de Riesgo</th>
                                            <th>Tratamiento del Riesgo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="text-center font-bold">1 - 4</td>
                                            <td><span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL.Bajo}22`, color: COLOR_NIVEL.Bajo, border: `1px solid ${COLOR_NIVEL.Bajo}55` }}>Bajo</span></td>
                                            <td>Aceptar</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center font-bold">5 - 9</td>
                                            <td><span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL.Moderado}22`, color: COLOR_NIVEL.Moderado, border: `1px solid ${COLOR_NIVEL.Moderado}55` }}>Moderado</span></td>
                                            <td>Reducir</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center font-bold">10 - 19</td>
                                            <td><span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL.Alto}22`, color: COLOR_NIVEL.Alto, border: `1px solid ${COLOR_NIVEL.Alto}55` }}>Alto</span></td>
                                            <td>Evitar, Compartir, Reducir</td>
                                        </tr>
                                        <tr>
                                            <td className="text-center font-bold">20 - 25</td>
                                            <td><span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL.Extremo}22`, color: COLOR_NIVEL.Extremo, border: `1px solid ${COLOR_NIVEL.Extremo}55` }}>Extremo</span></td>
                                            <td>Evitar, Compartir, Reducir (Atención Inmediata)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalAbierto && (
                <div className="riesgos-modal-overlay" onClick={() => setModalAbierto(false)}>
                    <div className="riesgos-modal matriz-modal-width anim-scale-up" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editandoId ? 'Editar Activo e Identificación de Riesgos' : 'Nuevo Registro de Riesgo por Activo'}</h2>
                            <button type="button" className="close-modal" onClick={() => setModalAbierto(false)}>&times;</button>
                        </div>
                        <p className="modal-desc">
                            Ingresa el activo afectado e identifica sus amenazas de seguridad correspondientes de forma granular. Todos los campos obligatorios (*) cuentan con validación visual.
                        </p>
                        
                        <form onSubmit={guardar} className="matriz-modal-form">
                            <div className="form-section-title">1. Activo de Información Evaluado</div>
                            {(() => {
                                const activosExistentes = [...new Set(
                                    matriz.map(item => item.activo_informacion).filter(Boolean)
                                )].sort();
                                return activosExistentes.length > 0 && (
                                    <div className="activos-existentes-section">
                                        <span className="activos-existentes-label">Activos registrados — selecciona uno o escribe uno nuevo:</span>
                                        <div className="activos-chips">
                                            {activosExistentes.map(nombre => (
                                                <button
                                                    type="button"
                                                    key={nombre}
                                                    className={`activo-chip${form.activo_informacion === nombre ? ' activo-chip-selected' : ''}`}
                                                    onClick={() => setForm({ ...form, activo_informacion: nombre })}
                                                >
                                                    {nombre}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="activo-chip activo-chip-new"
                                                onClick={() => {
                                                    setForm({ ...form, activo_informacion: '' });
                                                    setTimeout(() => activoInputRef.current?.focus(), 50);
                                                }}
                                            >
                                                + Nuevo
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="form-row">
                                <label className="form-col-12 label-ux-focus">
                                    Nombre o Descripción del Activo de Información *
                                    <input
                                        type="text"
                                        required
                                        ref={activoInputRef}
                                        className="input-ux-premium"
                                        value={form.activo_informacion}
                                        onChange={(e) => setForm({ ...form, activo_informacion: e.target.value })}
                                        placeholder="Ej: Base de Datos de Inscripciones, API de Paypal..."
                                    />
                                </label>
                            </div>

                            <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                                <span>🛡️ 2. Amenazas e Identificación de Controles Granulares</span>
                                <button type="button" className="btn-secundario btn-mini" onClick={handleAddThreat} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
                                    + Añadir Otra Amenaza
                                </button>
                            </div>

                            {form.amenazas.map((t, tIdx) => {
                                const inherenteVal = t.probabilidad_inherente * t.impacto_inherente;
                                const residualVal = t.probabilidad_residual * t.impacto_residual;

                                return (
                                    <div key={t.id || tIdx} className="threat-form-card premium-card-ux">
                                        <div className="threat-card-header">
                                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
                                                <span className="card-number-badge">{tIdx + 1}</span> 
                                                Amenaza / Vulnerabilidad Relacionada
                                            </h4>
                                            {form.amenazas.length > 1 && (
                                                <button type="button" className="threat-remove-btn" onClick={() => handleRemoveThreat(tIdx)}>
                                                    <i className="fa-solid fa-trash"></i> Quitar Amenaza
                                                </button>
                                            )}
                                        </div>

                                        <div className="form-row">
                                            <label className="form-col-6">
                                                Descripción de la Amenaza o Vulnerabilidad *
                                                <textarea
                                                    rows="2"
                                                    required
                                                    className="input-ux-premium"
                                                    value={t.amenaza_vulnerabilidad}
                                                    onChange={(e) => handleThreatChange(tIdx, 'amenaza_vulnerabilidad', e.target.value)}
                                                    placeholder="Ej: Inyección SQL en endpoints de inscripción..."
                                                />
                                            </label>
                                            <label className="form-col-6">
                                                Consecuencias Directas para la Aplicación *
                                                <textarea
                                                    rows="2"
                                                    required
                                                    className="input-ux-premium"
                                                    value={t.consecuencia_riesgo}
                                                    onChange={(e) => handleThreatChange(tIdx, 'consecuencia_riesgo', e.target.value)}
                                                    placeholder="Ej: Modificación no autorizada de pagos, robo de datos..."
                                                />
                                            </label>
                                        </div>

                                        {/* Paso 1: Riesgo Inherente (antes de aplicar controles) */}
                                        <div className="form-row">
                                            <div className="form-col-6 threat-box-group border-highlight-orange">
                                                <h5>💥 1. Evaluación Riesgo Inherente</h5>
                                                <div className="form-row">
                                                    <label className="form-col-6">
                                                        Probabilidad *
                                                        <select className="select-ux-premium" value={t.probabilidad_inherente} onChange={(e) => handleThreatChange(tIdx, 'probabilidad_inherente', Number(e.target.value))}>
                                                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </label>
                                                    <label className="form-col-6">
                                                        Impacto *
                                                        <select className="select-ux-premium" value={t.impacto_inherente} onChange={(e) => handleThreatChange(tIdx, 'impacto_inherente', Number(e.target.value))}>
                                                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </label>
                                                </div>
                                                <div className="val-badge-preview mt-2 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                                                    Riesgo: {inherenteVal} -
                                                    <span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL[CALCULAR_NIVEL(inherenteVal)]}22`, color: COLOR_NIVEL[CALCULAR_NIVEL(inherenteVal)], border: `1px solid ${COLOR_NIVEL[CALCULAR_NIVEL(inherenteVal)]}55` }}>
                                                        {CALCULAR_NIVEL(inherenteVal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Paso 2: Tratamiento y Controles (la metodología define los controles ANTES del residual) */}
                                        <div className="form-row">
                                             <label className="form-col-4">
                                                 Tratamiento
                                                 <select className="select-ux-premium" value={t.tratamiento_riesgo} onChange={(e) => handleThreatChange(tIdx, 'tratamiento_riesgo', e.target.value)}>
                                                     {(TRATAMIENTOS_POR_NIVEL[t.nivel_riesgo_inherente] || ['Reducir', 'Aceptar', 'Evitar', 'Compartir']).map(tr => (
                                                         <option key={tr} value={tr}>{tr}{t.nivel_riesgo_inherente === 'Extremo' && tr === 'Evitar' ? ' (Atención Inmediata)' : ''}</option>
                                                     ))}
                                                 </select>
                                             </label>
                                             <div className="form-col-8 threat-box-group">
                                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                     <h5 style={{ margin: 0 }}>🛡️ 2. Controles de Mitigación Granulares *</h5>
                                                     <button type="button" className="btn-secundario btn-mini" onClick={() => handleAddControl(tIdx)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                                         + Añadir Control
                                                     </button>
                                                 </div>
                                                 {(t.controles_implementar || []).map((ctrl, cIdx) => (
                                                     <div key={cIdx} className="control-granular-item-box" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem', background: '#f8fafc' }}>
                                                         <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                             <span className="step-num-label" style={{ fontWeight: 'bold', color: '#64748b' }}>#{cIdx + 1}</span>
                                                             <input
                                                                 type="text"
                                                                 required
                                                                 className="input-ux-premium"
                                                                 value={ctrl.descripcion || ''}
                                                                 onChange={(e) => handleControlChange(tIdx, cIdx, 'descripcion', e.target.value)}
                                                                 placeholder={`Descripción del control mitigante`}
                                                                 style={{ flex: 1 }}
                                                             />
                                                             <button type="button" className="step-remove-btn" onClick={() => handleRemoveControl(tIdx, cIdx)} style={{ padding: '0.35rem 0.5rem', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
                                                                 ✕
                                                             </button>
                                                         </div>
                                                         <div className="form-row" style={{ gap: '0.5rem', margin: 0 }}>
                                                             <label className="form-col-4" style={{ margin: 0, fontSize: '0.75rem' }}>
                                                                 Por tipo de control
                                                                 <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.3rem', height: '1.75rem' }}>
                                                                     {[
                                                                         { v: 'P', l: 'Preventivo' },
                                                                         { v: 'D', l: 'Detectivo' },
                                                                         { v: 'C', l: 'Correctivo' },
                                                                         { v: 'Di', l: 'Disuasivo' }
                                                                     ].map(opt => {
                                                                         const currentTipos = ctrl.control_tipo ? String(ctrl.control_tipo).split(',').map(s => s.trim()) : [];
                                                                         const isActive = currentTipos.includes(opt.v);
                                                                         return (
                                                                             <button
                                                                                 key={opt.v}
                                                                                 type="button"
                                                                                 onClick={() => {
                                                                                     let newTipos = isActive 
                                                                                         ? currentTipos.filter(t => t !== opt.v) 
                                                                                         : [...currentTipos, opt.v];
                                                                                     handleControlChange(tIdx, cIdx, 'control_tipo', newTipos.join(', '));
                                                                                 }}
                                                                                 style={{
                                                                                     flex: 1,
                                                                                     padding: '0',
                                                                                     fontSize: '0.7rem',
                                                                                     fontWeight: isActive ? 'bold' : 'normal',
                                                                                     border: `1px solid ${isActive ? '#3b82f6' : '#cbd5e1'}`,
                                                                                     backgroundColor: isActive ? '#eff6ff' : '#fff',
                                                                                     color: isActive ? '#1d4ed8' : '#64748b',
                                                                                     borderRadius: '4px',
                                                                                     cursor: 'pointer',
                                                                                     transition: 'all 0.2s'
                                                                                 }}
                                                                                 title={opt.l}
                                                                             >
                                                                                 {opt.v}
                                                                             </button>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             </label>
                                                             <label className="form-col-4" style={{ margin: 0, fontSize: '0.75rem' }}>
                                                                 Por su nivel de implementación
                                                                 <select className="select-ux-premium" style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }} value={ctrl.control_nivel || 'S'} onChange={(e) => handleControlChange(tIdx, cIdx, 'control_nivel', e.target.value)}>
                                                                     <option value="A">Automático (A)</option>
                                                                     <option value="S">Semiautomático (S)</option>
                                                                     <option value="M">Manual (M)</option>
                                                                 </select>
                                                             </label>
                                                             <label className="form-col-4" style={{ margin: 0, fontSize: '0.75rem' }}>
                                                                 Por frecuencia
                                                                 <select className="select-ux-premium" style={{ padding: '0.25rem 0.5rem', height: 'auto', fontSize: '0.75rem' }} value={ctrl.control_frecuencia || 'PT'} onChange={(e) => handleControlChange(tIdx, cIdx, 'control_frecuencia', e.target.value)}>
                                                                     <option value="D">Diaria (D)</option>
                                                                     <option value="S">Semanal (S)</option>
                                                                     <option value="M">Mensual (M)</option>
                                                                     <option value="A">Anual (A)</option>
                                                                     <option value="PT">Por Transacción (PT)</option>
                                                                     <option value="m">Masivo (m)</option>
                                                                     <option value="s">Semestral (s)</option>
                                                                 </select>
                                                             </label>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                        {/* Paso 3: Riesgo Residual (se evalúa DESPUÉS de definir los controles) */}
                                        <div className="form-row">
                                            <div className="form-col-6 threat-box-group border-highlight-green">
                                                <h5>🛡️ 3. Evaluación Riesgo Residual (después de aplicar los controles)</h5>
                                                <div className="form-row">
                                                    <label className="form-col-6">
                                                        P Residual *
                                                        <select className="select-ux-premium" value={t.probabilidad_residual} onChange={(e) => handleThreatChange(tIdx, 'probabilidad_residual', Number(e.target.value))}>
                                                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </label>
                                                    <label className="form-col-6">
                                                        I Residual *
                                                        <select className="select-ux-premium" value={t.impacto_residual} onChange={(e) => handleThreatChange(tIdx, 'impacto_residual', Number(e.target.value))}>
                                                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                                                        </select>
                                                    </label>
                                                </div>
                                                <div className="val-badge-preview mt-2 font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                                                    Residual: {residualVal} -
                                                    <span className="matrix-badge" style={{ backgroundColor: `${COLOR_NIVEL[CALCULAR_NIVEL(residualVal)]}22`, color: COLOR_NIVEL[CALCULAR_NIVEL(residualVal)], border: `1px solid ${COLOR_NIVEL[CALCULAR_NIVEL(residualVal)]}55` }}>
                                                        {CALCULAR_NIVEL(residualVal)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="threat-box-group mt-3">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h5 style={{ margin: 0 }}>📋 4. Plan de Acción (Secuencia de Pasos)</h5>
                                                <button type="button" className="btn-secundario btn-mini" onClick={() => handleAddStep(tIdx)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                                                    + Añadir Paso
                                                </button>
                                            </div>
                                            {(t.plan_accion || []).map((step, sIdx) => (
                                                <div key={sIdx} className="plan-step-input-row">
                                                    <span className="step-num-label">{sIdx + 1}.</span>
                                                    <input
                                                        type="text"
                                                        className="input-ux-premium"
                                                        value={step}
                                                        onChange={(e) => handleStepChange(tIdx, sIdx, e.target.value)}
                                                        placeholder={`Ej: Paso #${sIdx + 1} del plan de acción...`}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button type="button" className="step-remove-btn" onClick={() => handleRemoveStep(tIdx, sIdx)}>
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="form-row mt-3">
                                            <label className="form-col-4">
                                                Fecha Límite *
                                                <input
                                                    type="date"
                                                    required
                                                    className="input-ux-premium"
                                                    value={t.fecha_limite}
                                                    onChange={(e) => handleThreatChange(tIdx, 'fecha_limite', e.target.value)}
                                                />
                                            </label>
                                            <label className="form-col-8">
                                                Responsable (Oficial de Seguridad) *
                                                <select
                                                    required
                                                    className="select-ux-premium border-pulse-glow"
                                                    value={t.responsable_id || ''}
                                                    onChange={(e) => {
                                                         const selectedId = e.target.value;
                                                         const user = usuariosAdmins.find(u => String(u.id) === String(selectedId));
                                                         if (user) {
                                                             const name = `${user.nombre} ${user.apellido_paterno || ''}`.trim();
                                                             handleThreatFieldsChange(tIdx, {
                                                                 responsable_id: user.id,
                                                                 responsable_nombre: name
                                                             });
                                                         } else {
                                                             handleThreatFieldsChange(tIdx, {
                                                                 responsable_id: null,
                                                                 responsable_nombre: ''
                                                             });
                                                         }
                                                    }}
                                                >
                                                    <option value="">-- Seleccionar Responsable Obligatorio --</option>
                                                    {usuariosAdmins.map(u => {
                                                        const name = `${u.nombre} ${u.apellido_paterno || ''} (${u.correo || u.email || 'Admin'})`.trim();
                                                        return <option key={u.id} value={u.id}>{name}</option>;
                                                    })}
                                                </select>
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secundario"
                                    onClick={() => setModalAbierto(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primario">
                                    {editandoId ? 'Guardar Cambios' : 'Registrar Riesgo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatrizRiesgos;
