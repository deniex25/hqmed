import React from 'react';
import { Snackbar, Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close'; // Icono para cerrar la notificación

/**
 * Componente de Snackbar personalizado para mostrar notificaciones.
 * Permite definir el mensaje, la severidad (éxito, error, etc.) y la duración.
 *
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.open - Controla si el Snackbar está abierto o cerrado.
 * @param {string} props.message - El mensaje a mostrar en el Snackbar.
 * @param {'error' | 'warning' | 'info' | 'success'} props.severity - Tipo de notificación, que afecta el color y el icono.
 * @param {function} props.onClose - Función de callback que se ejecuta al cerrar el Snackbar.
 * @param {number} [props.autoHideDuration=6000] - Duración en milisegundos antes de que el Snackbar se cierre automáticamente.
 */
export const CustomSnackbar = ({ open, message, severity, onClose, autoHideDuration = 6000 }) => {
  const handleClose = (event, reason) => {
    // Evita cerrar el snackbar si el clickaway es el motivo (e.g., clic fuera)
    // a menos que sea el comportamiento deseado. Aquí lo permitimos.
    if (reason === 'clickaway') {
      // Si quieres que el snackbar SOLO se cierre con el botón o auto-hide,
      // puedes añadir: return; si deseas que se cierre al hacer clic en cualquier parte
    }
    onClose(); // Llama a la función onClose pasada por las props para actualizar el estado padre.
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Posición de la notificación en la parte superior central
      sx={{ zIndex: (theme) => theme.zIndex.snackbar + 100 }} // Asegura que esté por encima de otros elementos
    >
      {/* Alert proporciona el estilo predefinido de Material-UI para notificaciones */}
      <Alert
        onClose={handleClose} // Función para cerrar al hacer clic en el icono de cerrar
        severity={severity}   // Define el color de fondo y el icono (success, error, info, warning)
        variant="filled"      // Estilo de alerta con fondo sólido
        sx={{
          width: '100%',
          minWidth: { xs: '90%', sm: '400px' }, // Ancho responsivo
          boxShadow: 3, // Ligera sombra para destacarse
          borderRadius: 1, // Bordes ligeramente redondeados
          // Puedes personalizar más estilos aquí basados en la severidad si lo deseas
          // Por ejemplo:
          // ...(severity === 'success' && { backgroundColor: '#4CAF50' }),
          // ...(severity === 'error' && { backgroundColor: '#F44336' }),
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