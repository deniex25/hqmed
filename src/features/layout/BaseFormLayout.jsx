import React from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import SaveTwoToneIcon from "@mui/icons-material/SaveTwoTone"; // Asegúrate de importar los iconos aquí
import ClearAllIcon from "@mui/icons-material/ClearAll"; // Asegúrate de importar los iconos aquí
import { CustomSnackbar } from "../../components/CustomSnackbar"; // Asume que CustomSnackbar está aquí
import { CustomDialog } from "../../components/CustomDialog"; // Asume que CustomDialog está aquí

export const BaseFormLayout = ({
  title,
  children,
  onSave,
  onClear,
  saveText = "Registrar",
  clearText = "Limpiar Campos",
  showActions = true,
  snackbar,
  dialog, // Esta prop ahora manejará ambos tipos de diálogos (confirmación e informativo)
  loading = false,
  sx, // Permite pasar estilos adicionales al contenedor principal
}) => {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 }, // Padding responsivo
        maxWidth: 1400, // Ancho máximo para formularios grandes
        margin: "auto", // Centra el formulario
        display: "flex",
        flexDirection: "column",
        gap: 3, // Espaciado entre secciones y el Box de botones
        ...sx,
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        align="center"
        sx={{ color: "primary.main", fontWeight: "bold" }}
      >
        {title}
      </Typography>

      {/* Aquí se renderizará el contenido específico de cada formulario (FormSection, etc.) */}
      {children}

      {showActions && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            mt: 3,
            pb: 2, // Padding inferior para evitar que los botones queden pegados al final
          }}
        ></Box>
      )}
      {/* Componentes de alerta/notificación personalizados */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={snackbar.onClose}
      />
      {/* CustomDialog ahora manejará tanto los diálogos de confirmación como los informativos */}
      {dialog && ( // Asegurarse de que el objeto dialog no sea null/undefined
        <CustomDialog
          open={dialog.open}
          title={dialog.title}
          // El contenido del diálogo será children.
          // Si necesitas un mensaje simple, envuélvelo en <DialogContentText>
          // Por ejemplo: <DialogContentText>{dialog.message}</DialogContentText>
          // Para que esto funcione, la prop 'message' debe pasarse como 'children'.
          // Alternativa: Si 'CustomDialog' ya tiene una prop 'message', usa esa.
          // Dada tu implementación actual de CustomDialog, pasaremos el mensaje como children.
          children={dialog.message && <Typography>{dialog.message}</Typography>}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
          confirmText={dialog.confirmText} // Puede ser 'Aceptar' o 'Sí'
          cancelText={dialog.cancelText} // Puede ser 'Cancelar' o 'No'
          // Las props de TextField también irían aquí si fueran necesarias
          showTextField={dialog.showTextField}
          textFieldLabel={dialog.textFieldLabel}
          textFieldValue={dialog.textFieldValue}
          onTextFieldChange={dialog.onTextFieldChange}
          // El onClose de CustomDialog ya está gestionado internamente con onCancel.
          // Si necesitas un onClose explícito para el escape/clic fuera, asegúrate que se maneje en CustomDialog.
          // Actualmente tu CustomDialog lo maneja con onClose={onCancel || (() => {})}, lo cual es bueno.
        />
      )}
    </Box>
  );
};
