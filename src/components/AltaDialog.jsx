// src/features/hospi/components/AltaDialog.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Autocomplete,
} from "@mui/material";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Importar el hook useCIEAutocomplete
// ¡¡¡MUY IMPORTANTE: VERIFICA ESTA RUTA!!!
// Si AltaDialog.jsx está en src/components/, la ruta sería '../../hooks/useCIEAutocomplete'
// Si está en src/features/hospi/components/, entonces '../../../hooks/useCIEAutocomplete' es correcto.
import { useCIEAutocomplete } from "../hooks/useCIEAutocomplete";

export const AltaDialog = ({
  initialData = {},
  open,
  onClose,
  onSave,
  showSnackbar,
  isReadOnly = false, // Prop para deshabilitar edición
}) => {
  const isDarAltaMode = !initialData.tipoAlta;

  // Estados internos del diálogo de Alta
  const [tipoAlta, setTipoAlta] = useState("");
  const [fechaAlta, setFechaAlta] = useState(null);
  const [horaAlta, setHoraAlta] = useState(null);

  // Estado local para manejar los datos del formulario, incluyendo el CIE
  // Este objeto será pasado al hook useCIEAutocomplete
  const [formData, setFormData] = useState({
    cie_alta: "", // Para codigoCIEAlta
    descripcion_cie_alta: "", // Para descripcionCIEAlta
  });

  // Función para actualizar el formData (pasada al hook)
  const updateFormData = (updater) => {
    setFormData((prev) => {
      if (typeof updater === "function") {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  };

  // === USO DEL HOOK useCIEAutocomplete REVISADO ===
  // PASA AHORA AMBOS NOMBRES DE CAMPO EXPLÍCITAMENTE
  const cieProps = useCIEAutocomplete(
    "cie_alta", // Nombre del campo para el código CIE
    "descripcion_cie_alta", // Nombre del campo para la descripción CIE
    formData,
    updateFormData
  );
  // =============================================================

  // Estado para el guardado
  const [isSaving, setIsSaving] = useState(false);

  // Ref para controlar la reinicialización del diálogo
  const processedIdRef = useRef(null);

  useEffect(() => {
    // Cuando el diálogo se cierra, limpiamos los estados
    if (!open && processedIdRef.current !== null) {
      processedIdRef.current = null;
      setTipoAlta("");
      setFechaAlta(null);
      setHoraAlta(null);
      // Limpiar el formData que usa el hook CIE
      setFormData({
        cie_alta: "",
        descripcion_cie_alta: "",
      });
      setIsSaving(false);
    }

    const currentId = initialData.id || "NEW_ENTRY";

    // Si el diálogo está abierto y los datos iniciales son diferentes a los procesados
    if (open && currentId !== processedIdRef.current) {
      console.log(
        `[AltaDialog useEffect] Re-inicializando para ID: ${currentId}`
      );

      setTipoAlta(initialData.tipoAlta || "alta medica");
      setFechaAlta(
        initialData.fechaAlta ? dayjs(initialData.fechaAlta) : dayjs()
      );
      setHoraAlta(
        initialData.horaAlta
          ? dayjs(`2000-01-01T${initialData.horaAlta}`)
          : dayjs()
      );

      // Pre-llenar el formData para el hook CIE
      setFormData({
        cie_alta: initialData.codigoCIEAlta || "",
        descripcion_cie_alta: initialData.descripcionCIEAlta || "",
      });

      processedIdRef.current = currentId;
    }
  }, [open, initialData]); // Dependencias del useEffect

  const handleSave = async () => {
    if (!fechaAlta || !horaAlta) {
      showSnackbar &&
        showSnackbar("Por favor, ingrese la fecha y hora de alta.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        ...initialData,
        tipoAlta,
        fechaAlta: fechaAlta.format("YYYY-MM-DD"),
        horaAlta: horaAlta.format("HH:mm:ss"),
        codigoCIEAlta: formData.cie_alta, // Usamos el valor del formData gestionado por el hook
        descripcionCIEAlta: formData.descripcion_cie_alta, // Usamos el valor del formData gestionado por el hook
      };

      await onSave(dataToSave);
    } catch (error) {
      console.error("Error en AltaDialog al intentar guardar:", error);
      showSnackbar &&
        showSnackbar(
          "Error al guardar el alta: " +
            (error.message || "Error desconocido."),
          "error"
        );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Alta Hospitalización
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="tipo-alta-label">Tipo de Alta</InputLabel>
                <Select
                  labelId="tipo-alta-label"
                  value={tipoAlta}
                  label="Tipo de Alta"
                  onChange={(e) => setTipoAlta(e.target.value)}
                  disabled={isReadOnly}
                >
                  <MenuItem value="alta medica">Alta Médica</MenuItem>
                  <MenuItem value="retiro voluntario">
                    Retiro Voluntario
                  </MenuItem>
                  <MenuItem value="referido">Referido</MenuItem>
                  <MenuItem value="defuncion">Defunción</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Fecha de Alta"
                value={fechaAlta}
                onChange={(date) => setFechaAlta(date)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: true,
                    readOnly: isReadOnly,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TimePicker
                label="Hora de Alta"
                value={horaAlta}
                onChange={(time) => setHoraAlta(time)}
                format="HH:mm"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: true,
                    readOnly: isReadOnly,
                  },
                }}
              />
            </Grid>
            {/* =================================================== */}
            {/* INICIO: Bloque Autocomplete CIE copiado y adaptado */}
            {/* =================================================== */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                id="cie_alta_autocomplete"
                options={cieProps.sugerencias}
                getOptionLabel={(option) =>
                  `${option.codigoCie} - ${option.nombreCie}`
                }
                isOptionEqualToValue={(option, value) =>
                  option.codigoCie === value.codigoCie
                }
                onChange={cieProps.handleCIEChange}
                onInputChange={cieProps.handleCIEInputChange}
                onFocus={cieProps.handleFocusCIE}
                onBlur={cieProps.handleBlurCIE}
                onKeyDown={cieProps.handleKeyDownCIE}
                value={
                  formData.cie_alta && formData.descripcion_cie_alta
                    ? {
                        codigoCie: formData.cie_alta,
                        nombreCie: formData.descripcion_cie_alta,
                      }
                    : null
                }
                inputValue={cieProps.inputValue}
                open={cieProps.mostrarOpciones}
                loading={cieProps.loading}
                disabled={isReadOnly}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Diagnóstico CIE-10 (Opcional)"
                    placeholder="Buscar por código o descripción"
                    name="cie_alta"
                    InputProps={{
                      ...params.InputProps,
                      readOnly: isReadOnly,
                      endAdornment: (
                        <>
                          {cieProps.loading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            {/* =================================================== */}
            {/* FIN: Bloque Autocomplete CIE copiado y adaptado */}
            {/* =================================================== */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary" disabled={isSaving}>
            {isReadOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              color="primary"
              variant="contained"
              disabled={isSaving}
            >
              {isSaving ? <CircularProgress size={24} /> : "Confirmar Alta"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};
