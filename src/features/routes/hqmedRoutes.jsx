// src/features/routes/hqmedRoutes.jsx

import { Route, Routes, Navigate } from "react-router-dom";
import { DashboardLayout } from '../layout/DashboardLayout'; // Importa tu DashboardLayout

// Importa tus componentes de página
import { DashboardPage } from '../pages/dashboard';
import { CirugiaCalendario } from '../cirugias/cCalendario';
import { RegistroProgramacion } from '../cirugias/cRegProg';
import { ReporteProgramacion } from '../cirugias/cReporteProg';
import { ReporteOperatorio } from '../cirugias/reporteOperatorio';
import { CambiarContra } from '../config/cambiarPwd';
import { ConfCamas } from '../config/confCamas';
import { ConfPacientes } from '../config/confPacientes';
import { ConfPersonal } from '../config/confPersonal';
import { RegistroUsuario } from '../config/registroUsuario';
import { CensosCamas } from '../hospi/censosCamas';
import { RegistroHospi } from '../hospi/hospRegistro';
import { ReporteHospi } from '../hospi/hospReporte';

export const HqmedRoutes = () => {
    return (
        <Routes>
            {/* LA RUTA PADRE QUE RENDERIZA EL LAYOUT */}
            <Route path="/" element={<DashboardLayout />}> {/* <--- Abre el Route para anidar */}

                {/* Ruta index: Se muestra en el <Outlet /> cuando la URL es exactamente "/" */}
                <Route index element={<DashboardPage />} />

                {/* Rutas para cirugias (NO USAR "/" INICIAL EN RUTAS ANIDADAS) */}
                {/* Estas rutas se concatenarán con la ruta padre, por ejemplo: "/cirugias/calendario" */}
                <Route path="/calendario" element={<CirugiaCalendario />} />
                <Route path="/registroprog" element={<RegistroProgramacion />} />
                <Route path="/reporteprog" element={<ReporteProgramacion />} />
                <Route path="/reporteOperatorio" element={<ReporteOperatorio />} />

                {/* Rutas para config (NO USAR "/" INICIAL EN RUTAS ANIDADAS) */}
                <Route path="/cambiarcontra" element={<CambiarContra />} />
                <Route path="/confCamas" element={<ConfCamas />} />
                <Route path="/confPacientes" element={<ConfPacientes />} />
                <Route path="/confPersonal" element={<ConfPersonal />} />
                <Route path="/registroUsuario" element={<RegistroUsuario />} />

                {/* Rutas para hospi (NO USAR "/" INICIAL EN RUTAS ANIDADAS) */}
                <Route path="/censosCamas" element={<CensosCamas />} />
                <Route path="/registroHospi" element={<RegistroHospi />} />
                <Route path="/reporteHospi" element={<ReporteHospi />} />

                {/* Ruta comodín para cualquier cosa no definida DENTRO del DashboardLayout */}
                {/* Por ejemplo, si se navega a /algo-que-no-existe, redirige al dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Route> {/* <--- Cierra el Route para anidar */}
        </Routes>
    );
};