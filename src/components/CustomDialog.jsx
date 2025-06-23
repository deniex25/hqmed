import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Slide,
  TextField,
  Box,
} from "@mui/material";

// Para una transición suave al abrir/cerrar el diálogo
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const CustomDialog = ({
  open,
  title,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  children,
  showTextField = false,
  textFieldLabel = "",
  textFieldValue = "",
  onTextFieldChange = () => {},
}) => {
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
      <DialogTitle
        id="custom-dialog-title"
        sx={{
          pb: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          fontWeight: "bold",
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
        {children}
        {showTextField && (
          <Box mt={2}>
            <TextField
              fullWidth
              label={textFieldLabel}
              value={textFieldValue}
              onChange={onTextFieldChange}
              required
              multiline
              minRows={2}
              autoFocus
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          pt: 2,
          pb: 2,
          px: 3,
          justifyContent: onCancel ? "space-between" : "center",
        }}
      >
        {onCancel && ( // Renderiza el botón de cancelar solo si se provee una función onCancel
          <Button onClick={onCancel} color="secondary" variant="outlined">
            {cancelText}
          </Button>
        )}
        {onConfirm && ( // Renderiza el botón de confirmar solo si se provee una función onConfirm
          <Button
            onClick={onConfirm}
            color="primary"
            variant="contained"
            autoFocus
          >
            {confirmText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
