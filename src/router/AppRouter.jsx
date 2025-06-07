import { Route, Routes, Navigate } from "react-router-dom";

import { AuthRoutes } from "../auth/routes/AuthRoutes";
import ProtectedRoute from "./ProtectedRoute";
import { HqmedRoutes } from "../features/routes/hqmedRoutes"

export const AppRouter = () => {
    return (
        <Routes>
            {/* Rutas de autenticación (públicas) */}
            <Route path="/auth/*" element={ <AuthRoutes /> } />

            {/* Rutas protegidas para la parte de Hqmed */}
            {/* Todas las rutas que no comiencen con /auth serán protegidas por ProtectedRoute */}
            <Route
                path="/*" // Esta ruta atrapa cualquier cosa que no sea /auth
                element={
                    <ProtectedRoute>
                        <HqmedRoutes />
                    </ProtectedRoute>
                }
            />

            {/*
            // Opcional: Si quieres una redirección a /auth/login para cualquier ruta no definida y no protegida.
            // Si la ruta `path="/*"` de arriba ya protege todo, esta línea podría no ser necesaria.
            // Podría ser útil si ProtectedRoute no captura todo, o si quieres un fallback final.
            <Route path="/*" element={ <Navigate to="/auth/login" /> } />
            */}
            
        </Routes>
    )
}