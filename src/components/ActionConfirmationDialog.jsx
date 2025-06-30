import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export function ActionConfirmationDialog({
  open,
  onClose,
  title,
  message,
  actionType, // 'reprogramar', 'suspender', 'anular'
  onSubmit, // Función que se ejecuta al confirmar
  initialData, // Datos iniciales si los hay (ej: fecha programada para minDate)
}) {
  const [motivo, setMotivo] = useState("");
  const [fechaReprogramacion, setFechaReprogramacion] = useState(null);
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnosError, setTurnosError] = useState(null);

  // Resetear estados internos cuando el diálogo se abre/cierra
  useEffect(() => {
    if (open) {
      setMotivo("");
      setFechaReprogramacion(
        initialData?.fechaProgramada ? dayjs(initialData.fechaProgramada) : null
      );
      setTurnosDisponibles([]);
      setTurnoSeleccionado("");
      setLoadingTurnos(false);
      setTurnosError(null);
    }
  }, [open, initialData]);

  // Efecto para cargar turnos cuando cambia la fecha de reprogramación
  useEffect(() => {
    const fetchTurnos = async () => {
      if (actionType === "reprogramar" && fechaReprogramacion) {
        setLoadingTurnos(true);
        setTurnosError(null);
        setTurnoSeleccionado(""); // Limpiar selección de turno anterior
        try {
          // Asume que listarTurnosDispo es una función de API disponible globalmente o pasada por props
          // Si no está disponible globalmente, deberá pasarse como prop al Dialog.
          // Por ahora, asumiremos que se importa o se pasa.
          const { listarTurnosDispo } = await import("../services/api"); // Carga dinámica para evitar circular deps
          const turnos = await listarTurnosDispo(
            fechaReprogramacion.format("YYYY-MM-DD")
          );
          setTurnosDisponibles(turnos || []);
          if (turnos && turnos.length === 0) {
            setTurnosError("No hay turnos disponibles para esta fecha.");
          }
        } catch (err) {
          console.error("Error al cargar turnos disponibles:", err);
          setTurnosError("Error al cargar turnos disponibles.");
        } finally {
          setLoadingTurnos(false);
        }
      } else if (actionType === "reprogramar" && !fechaReprogramacion) {
        setTurnosDisponibles([]);
        setTurnoSeleccionado("");
      }
    };
    fetchTurnos();
  }, [fechaReprogramacion, actionType]);

  const handleSubmit = () => {
    let payload = {};
    let isValid = true;

    if (actionType === "suspender" || actionType === "anular") {
      if (!motivo.trim()) {
        alert("El motivo es obligatorio."); // Considera reemplazar con showSnackbar o un estado de error en TextField
        isValid = false;
      }
      payload = { motivo };
    } else if (actionType === "reprogramar") {
      if (!fechaReprogramacion) {
        alert("La fecha de reprogramación es obligatoria.");
        isValid = false;
      } else if (!turnoSeleccionado) {
        alert("Debe seleccionar un turno.");
        isValid = false;
      }
      payload = {
        fechaReprogramacion: fechaReprogramacion?.format("YYYY-MM-DD"),
        idOrdenTurno: turnoSeleccionado,
      };
    }

    if (isValid) {
      onSubmit(payload);
      onClose(); // Cerrar el diálogo después de enviar
    }
  };

  const getMinDateForReprogram = () => {
    if (initialData?.fechaProgramada) {
      // Si la fecha programada es hoy o en el futuro, el mínimo es hoy.
      // Si la fecha programada es pasada, el mínimo para reprogramar es hoy.
      const programada = dayjs(initialData.fechaProgramada);
      return programada.isBefore(dayjs(), "day") ? dayjs() : programada;
    }
    return dayjs(); // Por defecto, mínimo es hoy
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {message}
          </Typography>

          {(actionType === "suspender" || actionType === "anular") && (
            <TextField
              autoFocus
              margin="dense"
              id="motivo"
              label="Motivo"
              type="text"
              fullWidth
              variant="outlined"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              multiline
              rows={3}
            />
          )}

          {actionType === "reprogramar" && (
            <Box sx={{ mt: 2 }}>
              <DatePicker
                label="Nueva Fecha de Programación"
                value={fechaReprogramacion}
                onChange={(newValue) => setFechaReprogramacion(newValue)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth size="small" required />
                )}
                minDate={getMinDateForReprogram()}
              />
              <FormControl fullWidth margin="dense" sx={{ mt: 2 }} required>
                <InputLabel id="turno-label">Turno Disponible</InputLabel>
                <Select
                  labelId="turno-label"
                  id="turno"
                  value={turnoSeleccionado}
                  label="Turno Disponible"
                  onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  disabled={loadingTurnos || turnosDisponibles.length === 0}
                >
                  <MenuItem value="">
                    <em>Seleccione un turno</em>
                  </MenuItem>
                  {turnosDisponibles.map((turno) => (
                    <MenuItem key={turno.id} value={turno.id}>
                      {`Turno ${turno.id}`}{" "}
                      {/* Asegúrate de que turno.id sea el valor correcto */}
                    </MenuItem>
                  ))}
                </Select>
                {loadingTurnos && (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" sx={{ ml: 1 }}>
                      Cargando turnos...
                    </Typography>
                  </Box>
                )}
                {turnosError && !loadingTurnos && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {turnosError}
                  </Typography>
                )}
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="error" variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
