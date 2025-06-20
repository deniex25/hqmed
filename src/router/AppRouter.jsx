// src/router/AppRouter.jsx
import { useRoutes } from "react-router-dom";
import hqmedRoutes from "../features/routes/hqmedRoutes";
import { AuthRoutes } from "../auth/routes/AuthRoutes";
import ProtectedRoute from "./ProtectedRoute";

export const AppRouter = () => {
  const element = useRoutes([
    {
      path: "/auth/*",
      element: <AuthRoutes />,
    },
    {
      path: "/*",
      element: <ProtectedRoute>{useRoutes(hqmedRoutes)}</ProtectedRoute>,
    },
  ]);

  return element;
};
