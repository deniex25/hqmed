import React from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close"; // Icono para cerrar la notificación
export const CustomSnackbar = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 8000,
}) => {
  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    onClose();
  };
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }} // Posición de la notificación en la parte superior central
      sx={{ zIndex: (theme) => theme.zIndex.snackbar + 100 }} // Asegura que esté por encima de otros elementos
    >
      {/* Alert proporciona el estilo predefinido de Material-UI para notificaciones */}
      <Alert
        onClose={handleClose} // Función para cerrar al hacer clic en el icono de cerrar
        severity={severity} // Define el color de fondo y el icono (success, error, info, warning)
        variant="filled" // Estilo de alerta con fondo sólido
        sx={{
          width: "100%",
          minWidth: { xs: "90%", sm: "400px" }, // Ancho responsivo
          boxShadow: 3, // Ligera sombra para destacarse
          borderRadius: 1,
          fontSize: "1.15rem", // ← Tamaño del texto aumentado
          fontWeight: 500, // ← Peso para resaltar
          paddingY: 2, // ← Más espacio vertical
        }}
        action={
          <IconButton
            aria-label="close"
            color="inherit" // Hereda el color del Alert
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" /> {/* Icono de 'x' para cerrar */}
          </IconButton>
        }
      >
        {message} {/* El mensaje de la notificación */}
      </Alert>
    </Snackbar>
  );
};
