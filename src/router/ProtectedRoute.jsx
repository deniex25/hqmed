import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const isAuthenticated = !!sessionStorage.getItem("token"); // Verifica si el token existe

  if (!isAuthenticated) {
    // IMPORTANTE: Asegúrate de que esta ruta '/auth/login' sea la ruta exacta de tu página de login
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
