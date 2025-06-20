import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { CustomSnackbar } from '../../components/CustomSnackbar'; // Asume que CustomSnackbar está aquí
import { CustomDialog } from '../../components/CustomDialog';     // Asume que CustomDialog está aquí

export const BaseFormLayout = ({
  title,
  children, // Aquí irán los FormSection y otros elementos del formulario
  onSave,
  onClear,
  saveText = 'Registrar', // Cambiado a 'Registrar' para este contexto
  clearText = 'Limpiar Campos',
  showActions = true,
  snackbar,
  dialog,
  loading = false, // Para indicar si el formulario está en proceso
  sx // Permite pasar estilos adicionales al contenedor principal
}) => {
  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 }, // Padding responsivo
        maxWidth: 1000, // Ancho máximo para formularios grandes
        margin: 'auto', // Centra el formulario
        display: 'flex',
        flexDirection: 'column',
        gap: 3, // Espaciado entre secciones y el Box de botones
        ...sx
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        {title}
      </Typography>

      {/* Aquí se renderizará el contenido específico de cada formulario (FormSection, etc.) */}
      {children}

      {showActions && (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            mt: 3,
            pb: 2 // Padding inferior para evitar que los botones queden pegados al final
          }}
        >
        </Box>
      )}

      {/* Componentes de alerta/notificación personalizados */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={snackbar.onClose}
      />
      {dialog && ( // Verifica que dialog no sea null/undefined
        <CustomDialog
          open={dialog.open}
          title={dialog.title}
          message={dialog.message}
          onConfirm={dialog.onConfirm}
          onCancel={dialog.onCancel}
        />
      )}
    </Box>
  );
};