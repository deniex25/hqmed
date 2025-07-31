import { useState, useEffect, useCallback } from "react";
import {
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Switch,
  FormControlLabel,
  Box,
  Typography,
} from "@mui/material";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SaveTwoToneIcon from "@mui/icons-material/SaveTwoTone";
import Autocomplete from "@mui/material/Autocomplete";

import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // Importar dayjs para manejar los estados de fecha/hora

import { useNavigate } from "react-router-dom";

import {
  // Mantener las APIs comunes para todos los usuarios
  buscarPacientePorDocumento,
  listarTipoServicio,
  listarCamasPorServicio,
  listarEstablecimientos,
  guardarPacienteObserv,
} from "../../services/api";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { useCIEAutocomplete } from "../../hooks/useCIEAutocomplete";
import { FormSection } from "../layout/FormSection";

const obtenerFecha = () => {
  const fecha = dayjs();
  return fecha.format("YYYY-MM-DD"); // Formato YYYY-MM-DD
};

export const RegistroObserv = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogOnConfirm, setDialogOnConfirm] = useState(() => () => {});
  const [dialogOnCancel, setDialogOnCancel] = useState(() => () => {});

  const [formLoading, setFormLoading] = useState(false);
  const [establecimientos, setEstablecimientos] = useState([]);

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const [tipoServicio, setTipoServicio] = useState([]);
  const [camasDisponibles, setCamasDisponibles] = useState([]);
  const navigate = useNavigate();

  const [datosPObserv, setDatosPObserv] = useState({
    id_tipo_doc: "",
    nro_doc_pac: "",
    nombres_paciente: "",
    fecha_nac_pac: "",
    sexo_pac: "",
    edad: "",
    id_tipo_servicio: "",
    id_cama: "",
    fecha_ingreso: obtenerFecha(),
    hora_ingreso: "",
    codigo_cie_observ: "",
    descripcion_cie_observ: "",
    observacion: "",
    id_establecimiento: esAdmin
      ? ""
      : sessionStorage.getItem("id_establecimiento") || "1",
  });

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

  const showDialog = useCallback((title, message, onConfirm, onCancel) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogOnConfirm(() => onConfirm);
    setDialogOnCancel(() => onCancel || (() => setDialogOpen(false)));
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setDialogOnConfirm(() => () => {});
    setDialogOnCancel(() => () => {});
  }, []);

  const updateFormData = useCallback((callback) => {
    setDatosPObserv((prev) => callback(prev));
  }, []);

  const cieProps = useCIEAutocomplete(
    "codigo_cie_observ",
    "descripcion_cie_observ",
    datosPObserv,
    updateFormData,
    "ambos"
  );

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [servicios] = await Promise.all([listarTipoServicio()]);
        setTipoServicio(servicios);

        if (esAdmin) {
          const datosEstab = await listarEstablecimientos();
          setEstablecimientos(datosEstab.establecimientos || []);
        } else {
          // Para usuarios no administradores, el establecimiento es fijo
          const userEstablecimientoId =
            sessionStorage.getItem("id_establecimiento");
          if (userEstablecimientoId) {
            setDatosPObserv((prev) => ({
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

  const handleBuscarPaciente = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPObserv.id_tipo_doc || !datosPObserv.nro_doc_pac) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacientePorDocumento(
          datosPObserv.id_tipo_doc,
          datosPObserv.nro_doc_pac
        );

        if (resultado.mensaje) {
          showDialog(
            "Paciente no registrado",
            "¿Desea registrar al paciente?",
            () => {
              closeDialog();
              navigate("/confPacientes");
            },
            () => {
              closeDialog();
              setDatosPObserv((prev) => ({
                ...prev,
                nombres_paciente: "",
                fecha_nac_pac: "",
                sexo_pac: "",
                edad: "",
              }));
            }
          );
        } else {
          setDatosPObserv((prevDatos) => ({
            ...prevDatos,
            nombres_paciente: resultado.nombres_paciente || "",
            fecha_nac_pac: resultado.fecha_nac_pac || "",
            sexo_pac: resultado.sexo_pac || "",
            edad: resultado.edad || "",
          }));
          showSnackbar("Paciente encontrado exitosamente.", "success");
        }
      } catch (error) {
        console.error("Error al buscar el paciente:", error);
        showSnackbar("Error al buscar el paciente. Intente de nuevo.", "error");
      } finally {
        setFormLoading(false);
      }
    }
  };

  const fetchCamas = async () => {
    if (datosPObserv.id_tipo_servicio && datosPObserv.fecha_ingreso) {
      setFormLoading(true);
      try {
        const camas = await listarCamasPorServicio(
          datosPObserv.id_establecimiento,
          datosPObserv.id_tipo_servicio,
          datosPObserv.fecha_ingreso
        );
        setCamasDisponibles(camas);
        if (camas.length > 0) {
          if (
            !datosPObserv.id_cama ||
            !camas.some((c) => c.id === datosPObserv.id_cama)
          ) {
            setDatosPObserv((prev) => ({
              ...prev,
              id_cama: camas[0].id,
            }));
          }
        } else {
          setDatosPObserv((prev) => ({
            ...prev,
            id_cama: "",
          }));
          showSnackbar(
            "No hay camas disponibles para este servicio en la fecha seleccionada.",
            "info"
          );
        }
      } catch (error) {
        console.error("Error al obtener camas:", error);
        showSnackbar("Error al obtener camas disponibles.", "error");
      } finally {
        setFormLoading(false);
      }
    } else {
      setCamasDisponibles([]);
      setDatosPObserv((prev) => ({
        ...prev,
        id_cama: "",
      }));
    }
  };

  useEffect(() => {
    const establecimientoListo = esAdmin
      ? !!datosPObserv.id_establecimiento
      : true;

    if (
      establecimientoListo &&
      datosPObserv.id_tipo_servicio &&
      datosPObserv.fecha_ingreso
    ) {
      fetchCamas();
    } else {
      // Si las condiciones no se cumplen, asegurar que las camas estén vacías
      setCamasDisponibles([]);
      setDatosPObserv((prev) => ({
        ...prev,
        id_cama: "",
      }));
    }
  }, [
    datosPObserv.id_tipo_servicio,
    datosPObserv.fecha_ingreso,
    datosPObserv.id_cama,
    showSnackbar,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPObserv((prevDatos) => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  const handleEstablecimientoChange = async (e) => {
    const establecimientoSeleccionado = e.target.value;
    setDatosPObserv((prev) => ({
      ...prev,
      id_establecimiento: establecimientoSeleccionado,
      id_tipo_servicio: "", // Limpiar servicio y cama al cambiar establecimiento
      id_cama: "",
    }));
    setCamasDisponibles([]);
  };

  const handleGuardar = async () => {
    if (
      !datosPObserv.nro_doc_pac ||
      !datosPObserv.nombres_paciente ||
      !datosPObserv.id_cama ||
      !datosPObserv.fecha_ingreso ||
      !datosPObserv.hora_ingreso ||
      !datosPObserv.id_tipo_doc ||
      !datosPObserv.id_tipo_servicio ||
      !datosPObserv.id_establecimiento
    ) {
      showSnackbar(
        "Por favor, complete todos los campos obligatorios.",
        "error"
      );
      return;
    }

    setFormLoading(true);
    try {
      const respuesta = await guardarPacienteObserv(datosPObserv);

      if (respuesta && respuesta.mensaje) {
        showSnackbar(respuesta.mensaje, "success");
        limpiarCampos();
      } else {
        showSnackbar(
          respuesta.message ||
            "El paciente ya está en observacion o hubo un error.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error al guardar paciente:", err);
      showSnackbar(err.message || "Error al guardar paciente.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  const limpiarCampos = useCallback(() => {
    setDatosPObserv({
      id_tipo_doc: "",
      nro_doc_pac: "",
      nombres_paciente: "",
      fecha_nac_pac: "",
      sexo_pac: "",
      edad: "",
      id_tipo_servicio: "",
      id_cama: "",
      fecha_ingreso: obtenerFecha(),
      hora_ingreso: "",
      codigo_cie_observ: "",
      descripcion_cie_observ: "",
      observacion: "",
      id_establecimiento: esAdmin
        ? ""
        : sessionStorage.getItem("id_establecimiento") || "1",
    });
  }, [esAdmin, obtenerFecha]);

  // Asegúrate de que estas props se pasen a BaseFormLayout
  const snackbar = {
    open: snackbarOpen,
    message: snackbarMessage,
    severity: snackbarSeverity,
    onClose: closeSnackbar, // <--- Agregado onClose aquí
  };

  const dialog = {
    open: dialogOpen,
    title: dialogTitle,
    message: dialogMessage,
    onConfirm: dialogOnConfirm,
    onCancel: dialogOnCancel,
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BaseFormLayout
        title="Registro de Ingreso a Observacion"
        snackbar={snackbar}
        dialog={dialog}
      >
        {esAdmin && (
          <FormSection title="Datos del Establecimiento">
            <Grid container spacing={3}>
              {!datosPObserv.id_establecimiento && (
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
                  value={datosPObserv.id_establecimiento}
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

        <FormSection title="Información del Paciente">
          <Grid container spacing={3}>
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
                  value={datosPObserv.id_tipo_doc}
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
                value={datosPObserv.nro_doc_pac}
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
                value={datosPObserv.nombres_paciente}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                readOnly
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha de Nacimiento"
                size="small"
                name="fecha_nac_pac"
                value={dayjs(datosPObserv.fecha_nac_pac)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
                readOnly
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Sexo"
                name="sexo_pac"
                value={
                  datosPObserv.sexo_pac === "M"
                    ? "Masculino"
                    : datosPObserv.sexo_pac === "F"
                    ? "Femenino"
                    : ""
                }
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                readOnly
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Edad"
                name="edad"
                value={datosPObserv.edad}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                readOnly
                disabled
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Detalles del Ingreso a Observacion">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="tipo-servicio-label">
                  Tipo de Servicio
                </InputLabel>
                <Select
                  labelId="tipo-servicio-label"
                  id="id_tipo_servicio"
                  name="id_tipo_servicio"
                  value={datosPObserv.id_tipo_servicio}
                  label="Tipo de Servicio *"
                  onChange={handleChange}
                  disabled={
                    formLoading || (esAdmin && !datosPObserv.id_establecimiento)
                  }
                >
                  <MenuItem value="">
                    <em>Seleccione un servicio</em>
                  </MenuItem>
                  <MenuItem value="1">Medicina</MenuItem>
                  <MenuItem value="2">Cirugia</MenuItem>
                  <MenuItem value="3">Ginecologia</MenuItem>
                  <MenuItem value="8">Pediatria</MenuItem>
                  <MenuItem value="5">ARNP</MenuItem>
                  <MenuItem value="9">Puerperio Mediato</MenuItem>
                  {/* {Array.isArray(tipoServicio) &&
                    tipoServicio.map((servicio) => (
                      <MenuItem key={servicio.id} value={servicio.id}>
                        {servicio.descripcion}
                      </MenuItem>
                    ))} */}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Fecha de Ingreso *"
                name="fecha_ingreso"
                value={
                  datosPObserv.fecha_ingreso
                    ? dayjs(datosPObserv.fecha_ingreso)
                    : null
                }
                onChange={(newValue) => {
                  const formattedDate = newValue
                    ? newValue.format("YYYY-MM-DD")
                    : null;
                  setDatosPObserv({
                    ...datosPObserv,
                    fecha_ingreso: formattedDate,
                  });
                }}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
                required
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="cama-label">Cama Asignada</InputLabel>
                <Select
                  labelId="cama-label"
                  id="id_cama"
                  name="id_cama"
                  value={datosPObserv.id_cama}
                  label="Cama Asignada"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(camasDisponibles) &&
                    camasDisponibles.map((cama) => (
                      <MenuItem key={cama.id} value={cama.id}>
                        {cama.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TimePicker
                label="Hora de Ingreso *"
                name="hora_ingreso"
                value={dayjs(datosPObserv.hora_ingreso, "HH:mm")}
                onChange={(newValue) =>
                  setDatosPObserv({
                    ...datosPObserv,
                    hora_ingreso: newValue ? newValue.format("HH:mm") : "",
                  })
                }
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    helperText: "Formato de 24 horas",
                  },
                }}
                required
                disabled={formLoading}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Diagnósticos CIE-10">
          <Grid container spacing={3}>
            {/* Primer Diagnóstico */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                id="cie_observ_autocomplete"
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
                  datosPObserv.codigo_cie_observ &&
                  datosPObserv.descripcion_cie_observ
                    ? {
                        codigoCie: datosPObserv.codigo_cie_observ,
                        nombreCie: datosPObserv.descripcion_cie_observ,
                      }
                    : null
                }
                inputValue={cieProps.inputValue} // Usa el inputValue del hook
                open={cieProps.mostrarOpciones}
                loading={cieProps.loading}
                disabled={formLoading}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Código/Descripcion CIE-10"
                    placeholder="Buscar por código o descripcion"
                    name="codigo_cie_observ"
                    InputProps={{
                      ...params.InputProps,
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
          </Grid>
        </FormSection>

        <FormSection title="Observaciones Adicionales">
          <TextField
            fullWidth
            label="Observaciones (Opcional)"
            name="observacion"
            value={datosPObserv.observacion}
            onChange={handleChange}
            multiline
            rows={4}
            placeholder="Ingrese cualquier información adicional relevante..."
            size="small"
            disabled={formLoading}
          />
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
