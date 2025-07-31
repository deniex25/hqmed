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
import ClearAllIcon from "@mui/icons-material/ClearAll"; // Icono para limpiar
import SaveTwoToneIcon from "@mui/icons-material/SaveTwoTone";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/es"; // Importar el locale si lo necesitas para la fecha

import {
  buscarPersonalPorDocumento,
  guardarPersonal,
  listarEstablecimientos,
  listarProfMedico,
} from "../../services/api";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";

export const ConfPersonal = () => {
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
  const [profesion, setProfesion] = useState([]);

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;
  // Estados del formulario del paciente
  const [datosPersonal, setDatosPersonal] = useState({
    id: null, // Para manejar si el paciente ya existe o es nuevo
    id_tipo_doc: "",
    nro_doc_per: "",
    nombres_personal: "",
    fecha_nac_per: null,
    sexo: "",
    id_profesion: "",
    num_especialidad: "",
    id_establecimiento: esAdmin
      ? ""
      : sessionStorage.getItem("id_establecimiento") || "1",
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
        const [profesion] = await Promise.all([listarProfMedico()]);
        setProfesion(profesion || []);
        if (esAdmin) {
          const datosEstab = await listarEstablecimientos();
          setEstablecimientos(datosEstab.establecimientos || []);
        } else {
          // Para usuarios no administradores, el establecimiento es fijo
          const userEstablecimientoId =
            sessionStorage.getItem("id_establecimiento");
          if (userEstablecimientoId) {
            setDatosPersonal((prev) => ({
              ...prev,
              id_establecimiento: userEstablecimientoId,
            }));
          }
        }
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
      setDatosPersonal((prevDatos) => ({
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
    setDatosPersonal((prevDatos) => ({
      ...prevDatos,
      fecha_nac_per: date,
    }));
  }, []);

  const handleBuscarPersonal = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPersonal.id_tipo_doc || !datosPersonal.nro_doc_per) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPersonalPorDocumento(
          datosPersonal.id_tipo_doc,
          datosPersonal.nro_doc_per
        );

        if (resultado && resultado.mensaje) {
          // Paciente no registrado, usar diálogo de CONFIRMACIÓN (2 botones)
          showCustomDialog({
            title: "Personal no registrado",
            message: "No se encontró personal. Registrelo",
            onConfirm: () => {
              setDatosPersonal((prev) => ({
                ...prev,
                id: null,
                id_tipo_doc: "",
                nro_doc_per: "",
                nombres_personal: "",
                fecha_nac_per: null,
                sexo: "",
                id_profesion: "",
                num_especialidad: "",
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
          console.log(resultado);
          setDatosPersonal((prevDatos) => ({
            ...prevDatos,
            id: resultado.id || null,
            id_tipo_doc: resultado.id_tipo_doc || "",
            nro_doc_per: resultado.nro_doc_pac || "",
            nombres_personal: resultado.nombres_personal || "",
            fecha_nac_per: resultado.fecha_nac_per
              ? dayjs(resultado.fecha_nac_per)
              : null,
            sexo: resultado.sexo || "",
            id_profesion: resultado.id_profesion || "",
            num_especialidad: resultado.num_especialidad || "",
          }));
          showSnackbar("Personal encontrado exitosamente.", "success");
        } else {
          // En caso de resultado nulo o inesperado sin mensaje
          // Usar diálogo INFORMATIVO (1 botón)
          showCustomDialog({
            title: "Información",
            message:
              "No se encontró personal con los datos proporcionados. Puede proceder a registrar uno nuevo.",
            onConfirm: () => {
              setDatosPersonal((prev) => ({
                ...prev,
                id: null,
                id_tipo_doc: "",
                nro_doc_per: "",
                nombres_personal: "",
                fecha_nac_per: null,
                sexo: "",
                id_profesion: "",
                num_especialidad: "",
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

  const handleEstablecimientoChange = async (e) => {
    const establecimientoSeleccionado = e.target.value;
    setDatosPersonal((prev) => ({
      ...prev,
      id_establecimiento: establecimientoSeleccionado,
    }));
  };

  const handleGuardar = async () => {
    const newErrors = {};
    if (!datosPersonal.id_tipo_doc)
      newErrors.id_tipo_doc = "Tipo de documento es obligatorio.";
    if (!datosPersonal.nro_doc_per)
      newErrors.nro_doc_per = "Número de documento es obligatorio.";
    if (!datosPersonal.nombres_personal)
      newErrors.nombres_personal = "Apellidos y nombres son obligatorios.";
    if (!datosPersonal.sexo) newErrors.sexo = "Sexo es obligatorio.";
    if (!datosPersonal.fecha_nac_per)
      newErrors.fecha_nac_per = "Fecha de Nacimiento es obligatoria.";

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
        ...datosPersonal,
        fecha_nac_per: datosPersonal.fecha_nac_per
          ? datosPersonal.fecha_nac_per.format("YYYY-MM-DD")
          : null,
      };

      const respuesta = await guardarPersonal(dataToSave);

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
    setDatosPersonal({
      id: null,
      id_tipo_doc: "",
      nro_doc_per: "",
      nombres_personal: "",
      fecha_nac_per: null,
      sexo: "",
      id_profesion: "",
      num_especialidad: "",
      id_establecimiento: esAdmin
        ? ""
        : sessionStorage.getItem("id_establecimiento") || "1",
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
        title="Registro / Actualizacion de datos del Personal"
        snackbar={snackbar}
        dialog={dialogState}
        onSave={handleGuardar}
        onClear={limpiarCampos}
        loading={formLoading}
      >
        {esAdmin && (
          <FormSection title="Datos del Establecimiento">
            <Grid container spacing={3}>
              {!datosPersonal.id_establecimiento && (
                <em>Antes de continuar debe seleccionar un Establecimiento</em>
              )}
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="establecimiento-label">
                  Seleccione un Establecimiento
                </InputLabel>
                <Select
                  labelId="establecimiento-label"
                  value={datosPersonal.id_establecimiento}
                  label="Seleccione un Establecimiento"
                  onChange={handleEstablecimientoChange}
                  disabled={!esAdmin || formLoading}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {establecimientos.map((estab) => (
                    <MenuItem key={estab.id} value={estab.id}>
                      {estab.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </FormSection>
        )}
        <FormSection title="Información del Personal">
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
                  value={datosPersonal.id_tipo_doc}
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
                name="nro_doc_per"
                value={datosPersonal.nro_doc_per}
                onChange={handleChange}
                onKeyDown={handleBuscarPersonal}
                size="small"
                helperText="Presione Enter para buscar paciente."
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Apellidos y Nombres"
                name="nombres_personal"
                value={datosPersonal.nombres_personal}
                onChange={handleChange}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Fecha de Nacimiento"
                size="small"
                name="fecha_nac_per"
                value={datosPersonal.fecha_nac_per}
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
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="tipo-doc-label">Sexo</InputLabel>
                <Select
                  labelId="tipo-doc-label"
                  id="id_tipo_doc"
                  name="id_tipo_doc"
                  value={datosPersonal.sexo}
                  label="Tipo Documento *"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="M">Masculino</MenuItem>
                  <MenuItem value="F">Femenino</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="id-profesion-label">Profesion</InputLabel>
                <Select
                  labelId="id-profesion-label"
                  id="id_profesion"
                  name="id_profesion"
                  value={datosPersonal.id_profesion}
                  label="Profesion"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(profesion) &&
                    profesion.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Numero de especialidad"
                name="num_especialidad"
                value={datosPersonal.num_especialidad}
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
