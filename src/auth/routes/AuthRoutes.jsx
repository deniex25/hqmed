
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { useEffect, useState } from "react"; // Importar useEffect y useState
import { isTokenValid } from "../../services/api"; // Asumiendo que tienes una función para validar el token

export const AuthRoutes = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem("token");
            if (token) {
                // Aquí podrías hacer una llamada a tu API para validar si el token es realmente válido
                // en lugar de solo chequear su existencia.
                // Por simplicidad, por ahora solo verificamos si existe.
                const valid = await isTokenValid(token); // Implementa esta función si no existe.
                                                         // Podría ser una llamada a una ruta /validate-token en tu API.
                setIsAuthenticated(valid);
            } else {
                setIsAuthenticated(false);
            }
            setLoadingAuth(false);
        };
        checkAuth();
    }, []);

    if (loadingAuth) {
        return <div>Cargando autenticación...</div>; // O un spinner
    }

    if (isAuthenticated) {
        // Si el usuario ya está autenticado, redirigir a la página principal del dashboard
        return <Navigate to="/" replace />;
    }

    return (
        <Routes>
            <Route path="login" element={<LoginPage />} />
            {/* Si tienes otras rutas públicas como 'register', agrégalas aquí */}
            {/* <Route path="register" element={<RegisterPage />} /> */}

            {/* Redirección por defecto para cualquier otra ruta dentro de /auth/* */}
            <Route path="/*" element={<Navigate to="login" />} />
        </Routes>
    );
};