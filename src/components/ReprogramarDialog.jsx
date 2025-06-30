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

// Asume que listarTurnosDispo está en '../services/api'
import { listarTurnosDispo } from "../services/api";

export function ReprogramarDialog({
  open,
  onClose,
  onSave, // Función que se ejecuta al confirmar, recibe el payload
  showSnackbar, // Para mostrar mensajes
  initialData, // { idCirugiaProgramada, fechaProgramadaOriginal }
}) {
  const [fechaReprogramacion, setFechaReprogramacion] = useState(null);
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("");
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnosError, setTurnosError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Inicializar fecha de reprogramación si hay datos iniciales
      setFechaReprogramacion(
        initialData?.fechaProgramadaOriginal
          ? dayjs(initialData.fechaProgramadaOriginal)
          : dayjs()
      );
      setTurnoSeleccionado("");
      setTurnosDisponibles([]);
      setLoadingTurnos(false);
      setTurnosError(null);
    }
  }, [open, initialData]);

  // Efecto para cargar turnos cuando cambia la fecha de reprogramación
  useEffect(() => {
    const fetchTurnos = async () => {
      if (fechaReprogramacion && dayjs(fechaReprogramacion).isValid()) {
        setLoadingTurnos(true);
        setTurnosError(null);
        setTurnoSeleccionado(""); // Limpiar selección de turno anterior
        try {
          const formattedDate = fechaReprogramacion.format("YYYY-MM-DD");
          const turnos = await listarTurnosDispo(formattedDate);
          setTurnosDisponibles(turnos || []);
          if (turnos && turnos.length === 0) {
            setTurnosError("No hay turnos disponibles para esta fecha.");
          }
        } catch (err) {
          console.error("Error al cargar turnos disponibles:", err);
          showSnackbar("Error al cargar turnos disponibles.", "error");
          setTurnosError("Error al cargar turnos disponibles.");
        } finally {
          setLoadingTurnos(false);
        }
      } else {
        setTurnosDisponibles([]);
        setTurnoSeleccionado("");
      }
    };
    fetchTurnos();
  }, [fechaReprogramacion, showSnackbar]);

  const handleSubmit = async () => {
    if (!fechaReprogramacion || !dayjs(fechaReprogramacion).isValid()) {
      showSnackbar(
        "La fecha de reprogramación es obligatoria y válida.",
        "error"
      );
      return;
    }
    if (!turnoSeleccionado) {
      showSnackbar("Debe seleccionar un turno.", "error");
      return;
    }

    const payload = {
      fechaReprogramacion: fechaReprogramacion.format("YYYY-MM-DD"),
      idOrdenTurno: turnoSeleccionado,
    };

    setIsSaving(true);
    try {
      await onSave(payload);
    } catch (error) {
      // onSave ya mostrará el snackbar de error, aquí solo manejamos el estado de carga
      console.error("Error al guardar la reprogramación:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getMinDateForReprogram = () => {
    // Si la fecha programada es hoy o en el futuro, el mínimo es hoy.
    // Si la fecha programada es pasada, el mínimo para reprogramar es hoy.
    const programada = initialData?.fechaProgramadaOriginal
      ? dayjs(initialData.fechaProgramadaOriginal)
      : null;
    return programada && programada.isBefore(dayjs(), "day")
      ? dayjs()
      : programada || dayjs();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Reprogramar Cirugía</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Seleccione la nueva fecha y turno para la reprogramación.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <DatePicker
              label="Nueva Fecha de Programación"
              value={fechaReprogramacion}
              onChange={(newValue) => setFechaReprogramacion(newValue)}
              slotProps={{
                textField: { fullWidth: true, size: "small", required: true },
              }}
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
                    {/* Ajusta esto según la estructura real de 'turno' */}
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
        </DialogContent>
        <DialogActions>
          <Button
            onClick={onClose}
            color="error"
            variant="outlined"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={24} /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
