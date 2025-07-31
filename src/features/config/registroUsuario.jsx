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
  buscarPacientePorDocumento,
  registrarUsuario,
  listarEstablecimientos,
  listarProfesiones,
} from "../../services/api";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";

export const RegistroUsuario = () => {
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
  const [profesiones, setProfesiones] = useState([]);
  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;
  // Estados del formulario del paciente
  const [datosUsuario, setDatosUsuario] = useState({
    id: null, // Para manejar si el paciente ya existe o es nuevo
    id_tipo_doc: "",
    usu_nro_doc: "",
    usu_ape_pat: "",
    usu_ape_mat: "",
    usu_nombres: "",
    usu_fec_nac: null,
    usu_sexo: "",
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

  function desglosarNombreEstandar(nombreCompleto) {
    if (!nombreCompleto) {
      return { apellidoPaterno: "", apellidoMaterno: "", nombres: "" };
    }
    const partes = nombreCompleto
      .trim()
      .split(" ")
      .filter((p) => p !== ""); // Dividir y eliminar espacios vacíos

    let apellidoPaterno = "";
    let apellidoMaterno = "";
    let nombres = "";

    if (partes.length > 0) {
      apellidoPaterno = partes[0];
      if (partes.length > 1) {
        apellidoMaterno = partes[1];
        if (partes.length > 2) {
          nombres = partes.slice(2).join(" ");
        }
      }
    }
    return { apellidoPaterno, apellidoMaterno, nombres };
  }

  // Cargar los tipos de documento desde la API al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [profesion] = await Promise.all([listarProfesiones()]);
        setProfesiones(profesion);
        if (esAdmin) {
          const datosEstab = await listarEstablecimientos();
          setEstablecimientos(datosEstab.establecimientos || []);
        } else {
          // Para usuarios no administradores, el establecimiento es fijo
          const userEstablecimientoId =
            sessionStorage.getItem("id_establecimiento");
          if (userEstablecimientoId) {
            setDatosUsuario((prev) => ({
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
      setDatosUsuario((prevDatos) => ({
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
    setDatosUsuario((prevDatos) => ({
      ...prevDatos,
      usu_fec_nac: date,
    }));
  }, []);

  const handleBuscarUsuario = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosUsuario.id_tipo_doc || !datosUsuario.usu_nro_doc) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacientePorDocumento(
          datosUsuario.id_tipo_doc,
          datosUsuario.usu_nro_doc
        );

        if (resultado && resultado.mensaje) {
          // Paciente no registrado, usar diálogo de CONFIRMACIÓN (2 botones)
          showCustomDialog({
            title: "No se encontraron Datos",
            message: "Debe registrar los datos",
            onConfirm: () => {
              setDatosUsuario((prev) => ({
                ...prev,
                id: null,
                usu_ape_pat: "",
                usu_ape_mat: "",
                usu_nombres: "",
                usu_fec_nac: null,
                usu_sexo: "",
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
          const { apellidoPaterno, apellidoMaterno, nombres } =
            desglosarNombreEstandar(resultado.nombres_paciente);
          // Paciente encontrado
          setDatosUsuario((prevDatos) => ({
            ...prevDatos,
            id: resultado.id || null,
            usu_ape_pat: apellidoPaterno || "",
            usu_ape_mat: apellidoMaterno || "",
            usu_nombres: nombres || "",
            usu_fec_nac: resultado.fecha_nac_pac
              ? dayjs(resultado.fecha_nac_pac)
              : null,
            usu_sexo: resultado.sexo_pac || "",
            id_profesion: resultado.id_profesion || "",
            num_especialidad: resultado.num_especialidad || "",
          }));
          showSnackbar("Datos encontrados exitosamente.", "success");
        } else {
          // En caso de resultado nulo o inesperado sin mensaje
          // Usar diálogo INFORMATIVO (1 botón)
          showCustomDialog({
            title: "Información",
            message:
              "No se encontro con los datos proporcionados. Puede proceder a registrar uno nuevo.",
            onConfirm: () => {
              setDatosUsuario((prev) => ({
                ...prev,
                id: null,
                id_tipo_doc: "",
                usu_nro_doc: "",
                usu_ape_pat: "",
                usu_ape_mat: "",
                usu_nombres: "",
                usu_fec_nac: null,
                usu_sexo: "",
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
    setDatosUsuario((prev) => ({
      ...prev,
      id_establecimiento: establecimientoSeleccionado,
    }));
  };

  const handleGuardar = async () => {
    const newErrors = {};
    if (!datosUsuario.id_tipo_doc)
      newErrors.id_tipo_doc = "Tipo de documento es obligatorio.";
    if (!datosUsuario.usu_nro_doc)
      newErrors.usu_nro_doc = "Número de documento es obligatorio.";
    if (!datosUsuario.usu_ape_pat)
      newErrors.usu_ape_pat = "Apellido Paterno es obligatorio.";
    if (!datosUsuario.usu_ape_mat)
      newErrors.usu_ape_mat = "Apellido Materno es obligatorio.";
    if (!datosUsuario.usu_nombres)
      newErrors.usu_nombres = "Nombres son obligatorios.";
    if (!datosUsuario.usu_sexo) newErrors.usu_sexo = "Sexo es obligatorio.";
    if (!datosUsuario.usu_fec_nac)
      newErrors.usu_fec_nac = "Fecha de Nacimiento es obligatoria.";
    if (!datosUsuario.id_profesion)
      newErrors.id_profesion = "Profesion es obligatoria.";

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
        ...datosUsuario,
        usu_fec_nac: datosUsuario.usu_fec_nac
          ? datosUsuario.usu_fec_nac.format("DD-MM-YYYY")
          : null,
      };

      const respuesta = await registrarUsuario(dataToSave);
      console.log(respuesta);
      if (respuesta && respuesta.mensaje) {
        showSnackbar(respuesta.mensaje, "success");
        limpiarCampos();
      } else {
        showCustomDialog({
          // Usar CustomDialog para errores de guardado simples
          title: "Error al guardar",
          message: respuesta,
          onConfirm: closeCustomDialog, // Solo botón de Aceptar
          onCancel: null,
          confirmText: "Aceptar",
        });
      }
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      showCustomDialog({
        title: "Error",
        message:
          err.message ||
          "Error al registrar usuario. Contacte al administrador.",
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
    setDatosUsuario({
      id: null,
      id_tipo_doc: "",
      usu_nro_doc: "",
      usu_ape_pat: "",
      usu_ape_mat: "",
      usu_nombres: "",
      usu_fec_nac: null,
      usu_sexo: "",
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
        title="Registro de nuevo Usuario"
        snackbar={snackbar}
        dialog={dialogState}
        onSave={handleGuardar}
        onClear={limpiarCampos}
        loading={formLoading}
      >
        {esAdmin && (
          <FormSection title="Datos del Establecimiento">
            <Grid container spacing={3}>
              {!datosUsuario.id_establecimiento && (
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
                  value={datosUsuario.id_establecimiento}
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
        <FormSection title="Información del Usuario">
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
                  value={datosUsuario.id_tipo_doc}
                  label="Tipo Documento"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="1">DNI</MenuItem>
                  <MenuItem value="2">Carnet de Extranjeria</MenuItem>
                  <MenuItem value="3">Pasaporte</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="usu_nro_doc"
                value={datosUsuario.usu_nro_doc}
                onChange={handleChange}
                onKeyDown={handleBuscarUsuario}
                size="small"
                helperText="Presione Enter para buscar datos."
                disabled={formLoading}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Apellido Paterno"
                name="usu_ape_pat"
                value={datosUsuario.usu_ape_pat}
                onChange={handleChange}
                size="small"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Apellido Materno"
                name="usu_ape_pat"
                value={datosUsuario.usu_ape_mat}
                onChange={handleChange}
                size="small"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Nombres"
                name="usu_nombres"
                value={datosUsuario.usu_nombres}
                onChange={handleChange}
                size="small"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha de Nacimiento"
                size="small"
                name="usu_fec_nac"
                value={datosUsuario.usu_fec_nac}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: "yes",
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
                <InputLabel id="usu-sexo-label">Sexo</InputLabel>
                <Select
                  labelId="usu-sexo-label"
                  id="usu_sexo"
                  name="usu_sexo"
                  value={datosUsuario.usu_sexo}
                  label="Sexo"
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
            <Grid size={{ xs: 12, sm: 4 }}>
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
                  value={datosUsuario.id_profesion}
                  label="Profesion"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(profesiones) &&
                    profesiones.map((prof) => (
                      <MenuItem key={prof.id} value={prof.id}>
                        {prof.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Numero de especialidad"
                name="num_especialidad"
                value={datosUsuario.num_especialidad}
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
