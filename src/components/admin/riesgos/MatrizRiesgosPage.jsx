import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeaderDynamic from '../../layout/UserHeaderDynamic';
import Footer from '../../layout/footerPrincipal';
import MatrizRiesgos from './MatrizRiesgos';
import './RiesgosDashboard.css';

const MatrizRiesgosPage = () => {
    const navigate = useNavigate();

    return (
        <div className="riesgos-page">
            <UserHeaderDynamic />

            <main className="riesgos-main">
                <div className="riesgos-header">
                    <button
                        className="riesgos-back-button"
                        onClick={() => navigate('/admin')}
                        aria-label="Volver al panel"
                    >
                        ←
                    </button>
                    <div style={{ flex: 1 }}>
                        <h1 className="riesgos-title">Matriz de Análisis de Riesgos</h1>
                        <p className="riesgos-subtitle">
                            Análisis de activos de información, valoración de amenazas y mitigación residual
                        </p>
                    </div>
                </div>

                <MatrizRiesgos />
            </main>

            <Footer />
        </div>
    );
};

export default MatrizRiesgosPage;
