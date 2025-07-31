import React, { useState } from "react";
import { Grid, TextField, Button, CircularProgress, Box } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

import { changePassword } from "../../services/api";
import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export const CambiarContra = () => {
  const [formData, setFormData] = useState({
    userName: "",
    fechaNacimiento: null,
    contraseniaActual: "",
    nuevaPassword: "",
    confirmarPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dialogState, setDialogState] = useState({ open: false });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: 6000,
    onClose: () => setSnackbar((prev) => ({ ...prev, open: false })),
  });
  const [mostrarContrasenia, setMostrarContrasenia] = useState({
    actual: false,
    nueva: false,
    confirmar: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, fechaNacimiento: date }));
    if (errors.fechaNacimiento) {
      setErrors((prev) => ({ ...prev, fechaNacimiento: "" }));
    }
  };

  const toggleMostrar = (campo) => {
    setMostrarContrasenia((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  const validarFormulario = () => {
    const errs = {};
    if (!formData.userName) errs.userName = "El usuario es requerido.";
    if (!formData.fechaNacimiento)
      errs.fechaNacimiento = "La fecha de nacimiento es requerida.";
    if (!formData.contraseniaActual)
      errs.contraseniaActual = "Ingrese su contraseña actual.";
    if (!formData.nuevaPassword || formData.nuevaPassword.length < 6)
      errs.nuevaPassword = "Debe tener al menos 6 caracteres.";
    else {
      if (!/[A-Z]/.test(formData.nuevaPassword))
        errs.nuevaPassword = "Debe contener al menos una mayúscula.";
      else if (!/[a-z]/.test(formData.nuevaPassword))
        errs.nuevaPassword = "Debe contener al menos una minúscula.";
      else if (!/[0-9]/.test(formData.nuevaPassword))
        errs.nuevaPassword = "Debe contener al menos un número.";
      else if (!/[^A-Za-z0-9]/.test(formData.nuevaPassword))
        errs.nuevaPassword = "Debe contener al menos un carácter especial.";
    }
    if (formData.nuevaPassword !== formData.confirmarPassword)
      errs.confirmarPassword = "Las contraseñas no coinciden.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = () => {
    if (!validarFormulario()) return;

    setDialogState({
      open: true,
      title: "Confirmar cambio",
      message: "¿Estás seguro de que deseas cambiar tu contraseña?",
      onConfirm: handleSubmit,
      onCancel: () => setDialogState({ open: false }),
      confirmText: "Sí, cambiar",
      cancelText: "Cancelar",
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setDialogState({ open: false });

    try {
      const res = await changePassword({
        userName: formData.userName,
        fechaNacimiento: formData.fechaNacimiento?.format("YYYY-MM-DD"),
        contraseniaActual: formData.contraseniaActual,
        nuevaPassword: formData.nuevaPassword,
      });

      if (res.success) {
        setSnackbar({
          open: true,
          message: res.message || "Contraseña cambiada con éxito.",
          severity: "success",
          onClose: () => setSnackbar((prev) => ({ ...prev, open: false })),
        });
        limpiarCampos();
      } else {
        setSnackbar({
          open: true,
          message: res.message || "Error al cambiar contraseña.",
          severity: "error",
          onClose: () => setSnackbar((prev) => ({ ...prev, open: false })),
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.message || "Error de red.",
        severity: "error",
        onClose: () => setSnackbar((prev) => ({ ...prev, open: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarCampos = () => {
    setFormData({
      userName: "",
      fechaNacimiento: null,
      contraseniaActual: "",
      nuevaPassword: "",
      confirmarPassword: "",
    });
    setErrors({});
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <BaseFormLayout
        title="Cambio de Contraseña"
        snackbar={snackbar}
        dialog={dialogState}
        loading={loading}
      >
        <FormSection title="Datos de Verificación">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Usuario"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                error={!!errors.userName}
                helperText={errors.userName}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Fecha de Nacimiento"
                value={formData.fechaNacimiento}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.fechaNacimiento,
                    helperText: errors.fechaNacimiento,
                    size: "small",
                  },
                }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Nueva Contraseña">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contraseña Actual"
                name="contraseniaActual"
                type={mostrarContrasenia.actual ? "text" : "password"}
                value={formData.contraseniaActual}
                onChange={handleChange}
                error={!!errors.contraseniaActual}
                helperText={errors.contraseniaActual}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleMostrar("actual")}
                        edge="end"
                      >
                        {mostrarContrasenia.actual ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nueva Contraseña"
                name="nuevaPassword"
                type={mostrarContrasenia.nueva ? "text" : "password"}
                value={formData.nuevaPassword}
                onChange={handleChange}
                error={!!errors.nuevaPassword}
                helperText={errors.nuevaPassword}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleMostrar("nueva")}
                        edge="end"
                      >
                        {mostrarContrasenia.nueva ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                name="confirmarPassword"
                type={mostrarContrasenia.confirmar ? "text" : "password"}
                value={formData.confirmarPassword}
                onChange={handleChange}
                error={!!errors.confirmarPassword}
                helperText={errors.confirmarPassword}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleMostrar("confirmar")}
                        edge="end"
                      >
                        {mostrarContrasenia.confirmar ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGuardar}
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            {loading ? <CircularProgress size={24} /> : "Cambiar Contraseña"}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={limpiarCampos}
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            Limpiar
          </Button>
        </Box>
      </BaseFormLayout>
    </LocalizationProvider>
  );
};
