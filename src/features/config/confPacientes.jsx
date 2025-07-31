import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SaveTwoToneIcon from "@mui/icons-material/SaveTwoTone";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es"; // Importar el locale si lo necesitas para la fecha

import {
  buscarPacientePorDocumento,
  guardarPaciente,
  listarEstablecimientos,
} from "../../services/api";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";

export const ConfPacientes = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  // Estado UNIFICADO para el DIALOG (CustomDialog)
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    message: null, // Usaremos 'message' para el contenido simple
    onConfirm: () => {},
    onCancel: null, // Si es null, CustomDialog no mostrará el botón cancelar
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    showTextField: false,
    textFieldLabel: "",
    textFieldValue: "",
    onTextFieldChange: () => {},
  });

  const [formLoading, setFormLoading] = useState(false);

  const [establecimientos, setEstablecimientos] = useState([]);

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;
  // Estados del formulario del paciente
  const [datosPacientes, setDatosPacientes] = useState({
    id: null, // Para manejar si el paciente ya existe o es nuevo
    id_tipo_doc: "",
    nro_doc_pac: "",
    num_historia_clinica: "",
    nombres_paciente: "",
    fecha_nac_pac: null, // Usar null para DatePicker
    sexo_pac: "",
    celular_pac: "",
    celular_pac_fam: "",
    correo_pac: "",
    domicilio_declarado: "",
  });

  const [errors, setErrors] = useState({});

  // --- Funciones de utilidad para notificaciones y diálogos ---

  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const closeSnackbar = useCallback((event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  }, []);

  // Función para mostrar el diálogo (ahora es genérica para CustomDialog)
  // Permite configurar si es de 1 o 2 botones pasando onCancel
  const showCustomDialog = useCallback(
    ({
      title,
      message,
      onConfirm,
      onCancel = null, // Por defecto, es un diálogo informativo de 1 botón
      confirmText = "Aceptar",
      cancelText = "Cancelar",
      showTextField = false,
      textFieldLabel = "",
      textFieldValue = "",
      onTextFieldChange = () => {},
    }) => {
      setDialogState({
        open: true,
        title,
        message,
        onConfirm: () => {
          onConfirm();
          setDialogState((prev) => ({ ...prev, open: false })); // Cerrar después de confirmar
        },
        onCancel: onCancel
          ? () => {
              onCancel();
              setDialogState((prev) => ({ ...prev, open: false })); // Cerrar después de cancelar
            }
          : null, // Si onCancel es null, CustomDialog no mostrará el botón "Cancelar"
        confirmText,
        cancelText,
        showTextField,
        textFieldLabel,
        textFieldValue,
        onTextFieldChange,
      });
    },
    []
  );

  const closeCustomDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  // Cargar los tipos de documento desde la API al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [stabData] = await Promise.all([
          esAdmin
            ? listarEstablecimientos()
            : Promise.resolve({ establecimientos: [] }),
        ]);
        setEstablecimientos(stabData.establecimientos || []);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        showSnackbar(
          "Error al cargar datos iniciales. Por favor, intente de nuevo.",
          "error"
        );
      } finally {
        setFormLoading(false);
      }
    };
    cargarDatosIniciales();
  }, [esAdmin, showSnackbar]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setDatosPacientes((prevDatos) => ({
        ...prevDatos,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
      }
    },
    [errors]
  );

  const handleDateChange = useCallback((date) => {
    setDatosPacientes((prevDatos) => ({
      ...prevDatos,
      fecha_nac_pac: date,
    }));
  }, []);

  const handleBuscarPaciente = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPacientes.id_tipo_doc || !datosPacientes.nro_doc_pac) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacientePorDocumento(
          datosPacientes.id_tipo_doc,
          datosPacientes.nro_doc_pac
        );

        if (resultado && resultado.mensaje) {
          // Paciente no registrado, usar diálogo de CONFIRMACIÓN (2 botones)
          showCustomDialog({
            title: "Paciente no registrado",
            message:
              "El paciente no se encontró. Registrelo",
            onConfirm: () => {
              setDatosPacientes((prev) => ({
                ...prev,
                id: null,
                num_historia_clinica: "",
                nombres_paciente: "",
                fecha_nac_pac: null,
                sexo_pac: "",
                celular_pac: "",
                celular_pac_fam: "",
                correo_pac: "",
                domicilio_declarado: "",
                id_tipo_doc: datosPacientes.id_tipo_doc,
                nro_doc_pac: datosPacientes.nro_doc_pac,
              }));
              // closeCustomDialog ya se llama dentro de onConfirm en showCustomDialog
            },
            onCancel: () => {
              limpiarCampos();
              // closeCustomDialog ya se llama dentro de onCancel en showCustomDialog
            },
            confirmText: "Sí, Registrar",
            cancelText: "No, Cancelar",
          });
        } else if (resultado) {
          // Paciente encontrado
          setDatosPacientes((prevDatos) => ({
            ...prevDatos,
            id: resultado.id || null,
            num_historia_clinica: resultado.num_historia_clinica || "",
            nombres_paciente: resultado.nombres_paciente || "",
            fecha_nac_pac: resultado.fecha_nac_pac
              ? dayjs(resultado.fecha_nac_pac)
              : null,
            sexo_pac: resultado.sexo_pac || "",
            celular_pac: resultado.celular_pac || "",
            celular_pac_fam: resultado.celular_pac_fam || "",
            correo_pac: resultado.correo_pac || "",
            domicilio_declarado: resultado.domicilio_declarado || "",
          }));
          showSnackbar("Paciente encontrado exitosamente.", "success");
        } else {
          // En caso de resultado nulo o inesperado sin mensaje
          // Usar diálogo INFORMATIVO (1 botón)
          showCustomDialog({
            title: "Información",
            message:
              "No se encontró paciente con los datos proporcionados. Puede proceder a registrar uno nuevo.",
            onConfirm: () => {
              setDatosPacientes((prev) => ({
                ...prev,
                id: null,
                num_historia_clinica: "",
                nombres_paciente: "",
                fecha_nac_pac: null,
                sexo_pac: "",
                celular_pac: "",
                celular_pac_fam: "",
                correo_pac: "",
                domicilio_declarado: "",
              }));
            },
            onCancel: null, // Para que solo muestre el botón "Aceptar"
            confirmText: "Aceptar",
          });
        }
      } catch (error) {
        console.error("Error al buscar el paciente:", error);
        showSnackbar("Error al buscar el paciente. Intente de nuevo.", "error");
      } finally {
        setFormLoading(false);
      }
    }
  };

  const handleGuardar = async () => {
    const newErrors = {};
    if (!datosPacientes.id_tipo_doc)
      newErrors.id_tipo_doc = "Tipo de documento es obligatorio.";
    if (!datosPacientes.nro_doc_pac)
      newErrors.nro_doc_pac = "Número de documento es obligatorio.";
    if (!datosPacientes.nombres_paciente)
      newErrors.nombres_paciente = "Apellidos y nombres son obligatorios.";
    if (!datosPacientes.num_historia_clinica)
      newErrors.num_historia_clinica =
        "Número de Historia Clínica es obligatorio.";
    if (!datosPacientes.sexo_pac) newErrors.sexo_pac = "Sexo es obligatorio.";
    if (!datosPacientes.fecha_nac_pac)
      newErrors.fecha_nac_pac = "Fecha de Nacimiento es obligatoria.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showSnackbar(
        "Por favor, complete todos los campos obligatorios.",
        "error"
      );
      return;
    }

    setFormLoading(true);
    try {
      const dataToSave = {
        ...datosPacientes,
        fecha_nac_pac: datosPacientes.fecha_nac_pac
          ? datosPacientes.fecha_nac_pac.format("YYYY-MM-DD")
          : null,
      };

      const respuesta = await guardarPaciente(dataToSave);

      if (respuesta && respuesta.mensaje) {
        showSnackbar(respuesta.mensaje, "success");
        limpiarCampos();
      } else {
        showCustomDialog({
          // Usar CustomDialog para errores de guardado simples
          title: "Error al guardar",
          message:
            respuesta?.message ||
            "Ocurrió un error al guardar el paciente. Por favor, intente de nuevo.",
          onConfirm: closeCustomDialog, // Solo botón de Aceptar
          onCancel: null,
          confirmText: "Aceptar",
        });
      }
    } catch (err) {
      console.error("Error al registrar paciente:", err);
      showCustomDialog({
        title: "Error",
        message:
          err.message ||
          "Error al registrar paciente. Consulte al administrador.",
        onConfirm: closeCustomDialog, // Solo botón de Aceptar
        onCancel: null,
        confirmText: "Aceptar",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Función para limpiar campos
  const limpiarCampos = useCallback(() => {
    setDatosPacientes({
      id: null,
      id_tipo_doc: "",
      nro_doc_pac: "",
      num_historia_clinica: "",
      nombres_paciente: "",
      fecha_nac_pac: null,
      sexo_pac: "",
      celular_pac: "",
      celular_pac_fam: "",
      correo_pac: "",
      domicilio_declarado: "",
    });
  }, []);

  // Asegúrate de que estas props se pasen a BaseFormLayout
  const snackbar = {
    open: snackbarOpen,
    message: snackbarMessage,
    severity: snackbarSeverity,
    onClose: closeSnackbar, // <--- Agregado onClose aquí
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <BaseFormLayout
        title="Registro / Actualizacion de datos del Paciente"
        snackbar={snackbar}
        dialog={dialogState}
        onSave={handleGuardar}
        onClear={limpiarCampos}
        loading={formLoading}
      >
        <FormSection title="Información del Paciente">
          <Grid container spacing={3}>
            {" "}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="tipo-doc-label">Tipo Documento</InputLabel>
                <Select
                  labelId="tipo-doc-label"
                  id="id_tipo_doc"
                  name="id_tipo_doc"
                  value={datosPacientes.id_tipo_doc}
                  label="Tipo Documento *"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="1">DNI</MenuItem>
                  <MenuItem value="2">Carnet de Extranjeria</MenuItem>
                  <MenuItem value="3">Pasaporte</MenuItem>
                  <MenuItem value="4">DIE</MenuItem>
                  <MenuItem value="6">CNV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de Documento *"
                name="nro_doc_pac"
                value={datosPacientes.nro_doc_pac}
                onChange={handleChange}
                onKeyDown={handleBuscarPaciente}
                size="small"
                helperText="Presione Enter para buscar paciente."
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de HC"
                name="num_historia_clinica"
                value={datosPacientes.num_historia_clinica}
                onChange={handleChange}
                onKeyDown={handleBuscarPaciente}
                size="small"
                helperText="Presione Enter para buscar paciente."
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Apellidos y Nombres"
                name="nombres_paciente"
                value={datosPacientes.nombres_paciente}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha de Nacimiento"
                name="fecha_nac_pac"
                value={datosPacientes.fecha_nac_pac}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="sexo-pac-label">Sexo</InputLabel>
                <Select
                  labelId="sexo-pac-label"
                  id="sexo_pac"
                  name="sexo_pac"
                  value={datosPacientes.sexo_pac}
                  label="Sexo"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Numero de Celular 1"
                name="celular_pac"
                value={datosPacientes.celular_pac}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Correo Electronico"
                name="correo_pac"
                value={datosPacientes.correo_pac}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Domicilio declarado"
                name="domicilio_declarado"
                value={datosPacientes.domicilio_declarado}
                onChange={handleChange}
                size="small"
              />
            </Grid>
          </Grid>
        </FormSection>
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, // Columna en xs (móvil), Fila en sm (escritorio)
              justifyContent: "center",
              mt: 1,
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleGuardar}
              startIcon={<SaveTwoToneIcon />}
              disabled={formLoading}
              sx={{
                width: { xs: "100%", sm: "auto" }, // 100% de ancho en móvil, ancho automático en escritorio
                minWidth: { sm: 150 }, // Ancho mínimo en escritorio (ajusta este valor si quieres más ancho)
                // Puedes agregar un maxWidth si no quieres que se estiren demasiado en pantallas muy grandes
                // maxWidth: { sm: 200 }
              }}
            >
              {formLoading ? <CircularProgress size={24} /> : "Guardar"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={limpiarCampos}
              startIcon={<ClearAllIcon />}
              disabled={formLoading}
              sx={{
                width: { xs: "100%", sm: "auto" }, // 100% de ancho en móvil, ancho automático en escritorio
                minWidth: { sm: 150 }, // Ancho mínimo en escritorio (el mismo que el de guardar para que sean simétricos)
              }}
            >
              Limpiar
            </Button>
          </Box>
        </Grid>
      </BaseFormLayout>
    </LocalizationProvider>
  );
};
