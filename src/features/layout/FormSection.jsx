import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

export const FormSection = ({ title, children, sx = {} }) => {
  return (
    <Paper
      elevation={3} // Sombra para resaltar la sección
      sx={{
        p: { xs: 2, sm: 3 }, // Padding responsivo dentro de la sección
        borderRadius: 2, // Bordes ligeramente redondeados
        borderLeft: '5px solid', // Una barra de color a la izquierda para diferenciar
        borderColor: 'primary.light', // Color de la barra
        ...sx // Permite sobreescribir estilos desde el padre
      }}
    >
      {title && (
        <Typography
          variant="h5" // Título más grande para la sección
          component="h2"
          gutterBottom
          sx={{ mb: 3, color: 'primary.dark', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ pt: title ? 1 : 0 }}> {/* Pequeño padding si hay título */}
        {children}
      </Box>
    </Paper>
  );
};