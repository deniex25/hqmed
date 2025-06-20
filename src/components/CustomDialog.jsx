import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Slide,
} from '@mui/material';

// Para una transición suave al abrir/cerrar el diálogo
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Componente de Diálogo personalizado para mostrar mensajes modales.
 * Permite definir el título, mensaje y acciones de confirmación/cancelación.
 *
 * @param {object} props - Propiedades del componente.
 * @param {boolean} props.open - Controla si el Diálogo está abierto o cerrado.
 * @param {string} props.title - El título del Diálogo.
 * @param {string} props.message - El mensaje principal del Diálogo.
 * @param {function} props.onConfirm - Función de callback que se ejecuta al confirmar.
 * @param {function} [props.onCancel] - Función de callback que se ejecuta al cancelar. Si no se provee, el botón de cancelar no se muestra.
 * @param {string} [props.confirmText='Aceptar'] - Texto para el botón de confirmar.
 * @param {string} [props.cancelText='Cancelar'] - Texto para el botón de cancelar.
 */
export const CustomDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Aceptar', cancelText = 'Cancelar' }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition} // Usa la transición definida
      keepMounted // Mantiene el componente montado para un mejor rendimiento de la transición
      onClose={onCancel || (() => {})} // Cierra el diálogo al hacer clic fuera o presionar Esc, si onCancel existe.
                                      // Si no hay onCancel, se provee una función vacía para evitar errores.
      aria-labelledby="custom-dialog-title"
      aria-describedby="custom-dialog-description"
      sx={{ zIndex: (theme) => theme.zIndex.modal + 100 }} // Asegura que esté por encima de otros elementos
    >
      <DialogTitle id="custom-dialog-title" sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <DialogContentText id="custom-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ pt: 2, pb: 2, px: 3, justifyContent: onCancel ? 'space-between' : 'center' }}>
        {onCancel && ( // Renderiza el botón de cancelar solo si se provee una función onCancel
          <Button onClick={onCancel} color="secondary" variant="outlined">
            {cancelText}
          </Button>
        )}
        {onConfirm && ( // Renderiza el botón de confirmar solo si se provee una función onConfirm
          <Button onClick={onConfirm} color="primary" variant="contained" autoFocus>
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};