// src/features/routes/hqmedRoutes.jsx
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../layout/DashboardLayout";

import { DashboardPage } from "../pages/Dashboard";
import { CirugiaCalendario } from "../cirugias/cCalendario";
import { RegistroProgramacion } from "../cirugias/cRegProg";
import { ReporteProgramacion } from "../cirugias/cReporteProg";
import { ReporteOperatorio } from "../cirugias/reporteOperatorio";
import { CambiarContra } from "../config/cambiarPwd";
import { ConfCamas } from "../config/confCamas";
import { ConfPacientes } from "../config/confPacientes";
import { ConfPersonal } from "../config/confPersonal";
import { RegistroUsuario } from "../config/registroUsuario";
import { CensosCamas } from "../hospi/censosCamas";
import { RegistroHospi } from "../hospi/hospRegistro";
import { ReporteHospi } from "../hospi/hospReporte";

const hqmedRoutes = [
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "calendario", element: <CirugiaCalendario /> },
      { path: "registroprog", element: <RegistroProgramacion /> },
      { path: "reporteprog", element: <ReporteProgramacion /> },
      { path: "reporteOperatorio", element: <ReporteOperatorio /> },

      { path: "cambiarcontra", element: <CambiarContra /> },
      { path: "confCamas", element: <ConfCamas /> },
      { path: "confPacientes", element: <ConfPacientes /> },
      { path: "confPersonal", element: <ConfPersonal /> },
      { path: "registroUsuario", element: <RegistroUsuario /> },

      { path: "censosCamas", element: <CensosCamas /> },
      { path: "registroHospi", element: <RegistroHospi /> },
      { path: "reporteHospi", element: <ReporteHospi /> },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
];

export default hqmedRoutes;
