// src/hooks/useAlerts.js
import { useState, useCallback, useMemo } from "react";
// import { CustomSnackbar } from "../components/CustomSnackbar"; // Asegúrate de esta ruta
// import { CustomDialog } from "../components/CustomDialog"; // Asegúrate de esta ruta

export const useAlerts = () => {
  // Estado para el Snackbar
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: 6000,
  });

  // Estado para el Diálogo de confirmación
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Aceptar",
    cancelText: "Cancelar",
  });

  // Función para mostrar el Snackbar
  const showSnackbar = useCallback(
    (message, severity = "info", autoHideDuration = 6000) => {
      setSnackbarState({
        open: true,
        message,
        severity,
        autoHideDuration,
      });
    },
    []
  );

  // Función para cerrar el Snackbar
  const hideSnackbar = useCallback((event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarState((prev) => ({ ...prev, open: false }));
  }, []);

  // Función para mostrar el Diálogo
  const showDialog = useCallback((config) => {
    setDialogState((prev) => ({
      ...prev,
      ...config, // Permite sobrescribir cualquier propiedad
      open: true,
    }));
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  // === CAMBIO CLAVE AQUÍ ===
  // Memoizamos el objeto snackbar para que contenga la función onClose
  const snackbar = useMemo(
    () => ({
      open: snackbarState.open,
      message: snackbarState.message,
      severity: snackbarState.severity,
      autoHideDuration: snackbarState.autoHideDuration,
      onClose: hideSnackbar, // <-- ¡Aquí añadimos la función de cierre!
    }),
    [snackbarState, hideSnackbar]
  ); // Depende de snackbarState y hideSnackbar

  // Memoizamos el objeto dialog para que contenga las funciones
  const dialog = useMemo(
    () => ({
      open: dialogState.open,
      title: dialogState.title,
      message: dialogState.message,
      onConfirm: dialogState.onConfirm,
      onCancel: dialogState.onCancel,
      confirmText: dialogState.confirmText,
      cancelText: dialogState.cancelText,
      children: dialogState.children, // Asegúrate de pasar children si CustomDialog lo acepta
    }),
    [dialogState]
  );

  return {
    snackbar, // Ahora este objeto 'snackbar' tiene la prop 'onClose'
    showSnackbar,
    dialog, // Este objeto 'dialog' ya tiene onConfirm/onCancel
    showDialog,
    hideDialog,
  };
};
