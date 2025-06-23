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
import Autocomplete from "@mui/material/Autocomplete";
// Componentes de @mui/x-date-pickers
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // Importar dayjs para manejar los estados de fecha/hora

import { useNavigate } from "react-router-dom";
// import { CustomSnackbar } from "../../components/CustomSnackbar";
// import { CustomDialog } from "../../components/CustomDialog";
import {
  // Mantener las APIs comunes para todos los usuarios
  buscarPacientePorDocumento,
  listarTipoDocumento,
  listarTipoServicio,
  listarCamasPorServicio,
  listarEstablecimientos,
  guardarPacienteHospi,
} from "../../services/api";

// Importa los componentes de layout y el hook de alertas
import { BaseFormLayout } from "../layout/BaseFormLayout";
import { useCIEAutocomplete } from "../../hooks/useCIEAutocomplete";
import { FormSection } from "../layout/FormSection";
// import { useAlerts } from "../../hooks/useAlerts";

// Componente para el campo de Establecimiento (solo para administradores)
// Este componente DEBE ser definido fuera de RegistrarHospi
// O idealmente en su propio archivo, por ejemplo: src/components/AdminEstablishmentSelect.jsx
const obtenerFecha = () => {
  const fecha = dayjs();
  return fecha.format("YYYY-MM-DD"); // Formato YYYY-MM-DD
};

export const RegistroHospi = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogOnConfirm, setDialogOnConfirm] = useState(() => () => {});
  const [dialogOnCancel, setDialogOnCancel] = useState(() => () => {});

  const [formLoading, setFormLoading] = useState(false);

  const [tipoDocumento, setTipoDocumento] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const [tipoServicio, setTipoServicio] = useState([]);
  const [camasDisponibles, setCamasDisponibles] = useState([]);
  const navigate = useNavigate();

  const [datosPHosp, setDatos] = useState({
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
    codigo_cie_hosp1: "",
    descripcion_cie_hosp1: "",
    codigo_cie_hosp2: "",
    descripcion_cie_hosp2: "",
    codigo_cie_hosp3: "",
    descripcion_cie_hosp3: "",
    observacion: "",
    id_establecimiento: esAdmin ? "" : "1",
  });

  const [isVisible, setIsVisible] = useState(false);

  const handleToggleCIE = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

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
    setDatos((prev) => callback(prev));
  }, []);

  const cie1Props = useCIEAutocomplete(
    "codigo_cie_hosp1",
    "descripcion_cie_hosp1",
    datosPHosp,
    updateFormData,
    "ambos"
  );

  const cie2Props = useCIEAutocomplete(
    "codigo_cie_hosp2",
    "descripcion_cie_hosp2",
    datosPHosp,
    updateFormData,
    "ambos"
  );

  const cie3Props = useCIEAutocomplete(
    "codigo_cie_hosp3",
    "descripcion_cie_hosp3",
    datosPHosp,
    updateFormData,
    "ambos"
  );

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [documentos, servicios] = await Promise.all([
          listarTipoDocumento(),
          listarTipoServicio(),
        ]);
        setTipoDocumento(documentos);
        setTipoServicio(servicios);

        if (esAdmin) {
          const datosEstab = await listarEstablecimientos();
          setEstablecimientos(datosEstab.establecimientos || []);
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
  }, [esAdmin, showSnackbar, datosPHosp.id_establecimiento]);

  const handleBuscarPaciente = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPHosp.id_tipo_doc || !datosPHosp.nro_doc_pac) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacientePorDocumento(
          datosPHosp.id_tipo_doc,
          datosPHosp.nro_doc_pac
        );

        if (resultado.mensaje) {
          showDialog(
            "Paciente no registrado",
            "¿Desea registrar al paciente?",
            () => {
              closeDialog();
              navigate("/dashboard/datosPaciente");
            },
            () => {
              closeDialog();
              setDatos((prev) => ({
                ...prev,
                nombres_paciente: "",
                fecha_nac_pac: "",
                sexo_pac: "",
                edad: "",
              }));
            }
          );
        } else {
          setDatos((prevDatos) => ({
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

  useEffect(() => {
    const fetchCamas = async () => {
      if (datosPHosp.id_tipo_servicio && datosPHosp.fecha_ingreso) {
        setFormLoading(true);
        try {
          const camas = await listarCamasPorServicio(
            datosPHosp.id_tipo_servicio,
            datosPHosp.fecha_ingreso
          );
          setCamasDisponibles(camas);
          if (camas.length > 0) {
            if (
              !datosPHosp.id_cama ||
              !camas.some((c) => c.id === datosPHosp.id_cama)
            ) {
              setDatos((prev) => ({
                ...prev,
                id_cama: camas[0].id,
              }));
            }
          } else {
            setDatos((prev) => ({
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
        setDatos((prev) => ({
          ...prev,
          id_cama: "",
        }));
      }
    };
    fetchCamas();
  }, [
    datosPHosp.id_tipo_servicio,
    datosPHosp.fecha_ingreso,
    datosPHosp.id_cama,
    showSnackbar,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatos((prevDatos) => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    if (
      !datosPHosp.nro_doc_pac ||
      !datosPHosp.nombres_paciente ||
      !datosPHosp.id_cama ||
      !datosPHosp.fecha_ingreso ||
      !datosPHosp.hora_ingreso ||
      !datosPHosp.id_tipo_doc ||
      !datosPHosp.id_tipo_servicio ||
      !datosPHosp.id_establecimiento
    ) {
      showSnackbar(
        "Por favor, complete todos los campos obligatorios.",
        "error"
      );
      return;
    }

    // ** 2. Preparar los datos para el envío (cadenas vacías a null para campos específicos) **
    const datosParaEnviar = { ...datosPHosp }; // Crea una copia

    // === Lógica específica para Observación ===
    if (datosParaEnviar.observacion === "") {
      datosParaEnviar.observacion = null;
    }

    // === Lógica específica para CIE-10 (cada grupo) ===

    // CIE 1 (Este sí podría ser obligatorio o al menos muy importante)
    // Se mantiene la validación estricta para CIE 1, asumiendo que debe ser consistente si se usa.
    if (
      datosParaEnviar.codigo_cie_hosp1 === "" &&
      datosParaEnviar.descripcion_cie_hosp1 === ""
    ) {
      datosParaEnviar.codigo_cie_hosp1 = null;
      datosParaEnviar.descripcion_cie_hosp1 = null;
    } else if (
      datosParaEnviar.codigo_cie_hosp1 === "" ||
      datosParaEnviar.descripcion_cie_hosp1 === ""
    ) {
      // Si uno de los dos está vacío, pero el otro no, se asume inconsistencia
      showSnackbar(
        "El código y la descripción del CIE-10 Principal deben estar completos o vacíos.",
        "warning"
      );
      return; // Detiene el guardado si hay inconsistencia
    }

    // CIE 2 (AHORA OPCIONAL: Ambos vacíos = null, inconsistente = advertencia)
    if (
      datosParaEnviar.codigo_cie_hosp2 === "" &&
      datosParaEnviar.descripcion_cie_hosp2 === ""
    ) {
      datosParaEnviar.codigo_cie_hosp2 = null;
      datosParaEnviar.descripcion_cie_hosp2 = null;
    } else if (
      datosParaEnviar.codigo_cie_hosp2 !== "" &&
      datosParaEnviar.descripcion_cie_hosp2 === ""
    ) {
      // Si hay código pero no descripción para CIE 2, es inconsistente.
      showSnackbar(
        "La descripción del CIE-10 (2) no puede estar vacía si hay un código.",
        "warning"
      );
      return;
    } else if (
      datosParaEnviar.codigo_cie_hosp2 === "" &&
      datosParaEnviar.descripcion_cie_hosp2 !== ""
    ) {
      // Si hay descripción pero no código para CIE 2, es inconsistente.
      showSnackbar(
        "El código del CIE-10 (2) no puede estar vacío si hay una descripción.",
        "warning"
      );
      return;
    }

    // CIE 3 (AHORA OPCIONAL: Ambos vacíos = null, inconsistente = advertencia)
    if (
      datosParaEnviar.codigo_cie_hosp3 === "" &&
      datosParaEnviar.descripcion_cie_hosp3 === ""
    ) {
      datosParaEnviar.codigo_cie_hosp3 = null;
      datosParaEnviar.descripcion_cie_hosp3 = null;
    } else if (
      datosParaEnviar.codigo_cie_hosp3 !== "" &&
      datosParaEnviar.descripcion_cie_hosp3 === ""
    ) {
      // Si hay código pero no descripción para CIE 3, es inconsistente.
      showSnackbar(
        "La descripción del CIE-10 (3) no puede estar vacía si hay un código.",
        "warning"
      );
      return;
    } else if (
      datosParaEnviar.codigo_cie_hosp3 === "" &&
      datosParaEnviar.descripcion_cie_hosp3 !== ""
    ) {
      // Si hay descripción pero no código para CIE 3, es inconsistente.
      showSnackbar(
        "El código del CIE-10 (3) no puede estar vacío si hay una descripción.",
        "warning"
      );
      return;
    }

    setFormLoading(true);
    try {
      const respuesta = await guardarPacienteHospi(datosParaEnviar);

      if (respuesta && respuesta.mensaje) {
        showSnackbar(respuesta.mensaje, "success");
        limpiarCampos();
      } else {
        showSnackbar(
          respuesta.message ||
            "El paciente ya está hospitalizado o hubo un error.",
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

  const handleEstablecimientoChange = async (e) => {
    const establecimientoSeleccionado = e.target.value;
    setDatos({
      ...datosPHosp,
      id_establecimiento: establecimientoSeleccionado,
    });
  };

  const limpiarCampos = useCallback(() => {
    setDatos({
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
      codigo_cie_hosp1: "",
      descripcion_cie_hosp1: "",
      codigo_cie_hosp2: "",
      descripcion_cie_hosp2: "",
      codigo_cie_hosp3: "",
      descripcion_cie_hosp3: "",
      observacion: "",
      id_establecimiento: esAdmin ? "" : "1",
    });
    setIsVisible(false); // Ocultar CIE adicionales al limpiar
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
        title="Registro de Ingreso Hospitalario"
        snackbar={snackbar}
        dialog={dialog}
      >
        {esAdmin && (
          <FormSection title="Datos del Establecimiento">
            <Grid container spacing={3}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="establecimiento-label">
                  Establecimiento
                </InputLabel>
                <Select
                  labelId="establecimiento-label"
                  value={datosPHosp.id_establecimiento}
                  label="Establecimiento"
                  onChange={handleEstablecimientoChange}
                  disabled={!esAdmin}
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
            {" "}
            {/* Aumentado el spacing para más aire */}
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
                  value={datosPHosp.id_tipo_doc}
                  label="Tipo Documento *"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(tipoDocumento) &&
                    tipoDocumento.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de Documento *"
                name="nro_doc_pac"
                value={datosPHosp.nro_doc_pac}
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
                value={datosPHosp.nombres_paciente}
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
                value={dayjs(datosPHosp.fecha_nac_pac)}
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
                  datosPHosp.sexo_pac === "M"
                    ? "Masculino"
                    : datosPHosp.sexo_pac === "F"
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
                value={datosPHosp.edad}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                readOnly
                disabled
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Detalles del Ingreso Hospitalario">
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
                  value={datosPHosp.id_tipo_servicio}
                  label="Tipo de Servicio *"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione un servicio</em>
                  </MenuItem>
                  {Array.isArray(tipoServicio) &&
                    tipoServicio.map((servicio) => (
                      <MenuItem key={servicio.id} value={servicio.id}>
                        {servicio.descripcion}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Fecha de Ingreso *"
                name="fecha_ingreso"
                value={
                  datosPHosp.fecha_ingreso
                    ? dayjs(datosPHosp.fecha_ingreso)
                    : null
                }
                onChange={(newValue) => {
                  const formattedDate = newValue
                    ? newValue.format("YYYY-MM-DD")
                    : null;
                  setDatos({ ...datosPHosp, fecha_ingreso: formattedDate });
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
                  value={datosPHosp.id_cama}
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
                value={dayjs(datosPHosp.hora_ingreso, "HH:mm")}
                onChange={(newValue) =>
                  setDatos({
                    ...datosPHosp,
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
                id="cie_hosp1_autocomplete"
                options={cie1Props.sugerencias}
                getOptionLabel={(option) =>
                  `${option.codigoCie} - ${option.nombreCie}`
                }
                isOptionEqualToValue={(option, value) =>
                  option.codigoCie === value.codigoCie
                }
                onChange={cie1Props.handleCIEChange}
                onInputChange={cie1Props.handleCIEInputChange}
                onFocus={cie1Props.handleFocusCIE}
                onBlur={cie1Props.handleBlurCIE}
                onKeyDown={cie1Props.handleKeyDownCIE}
                value={
                  datosPHosp.codigo_cie_hosp1 &&
                  datosPHosp.descripcion_cie_hosp1
                    ? {
                        codigoCie: datosPHosp.codigo_cie_hosp1,
                        nombreCie: datosPHosp.descripcion_cie_hosp1,
                      }
                    : null
                }
                inputValue={cie1Props.inputValue} // Usa el inputValue del hook
                open={cie1Props.mostrarOpciones}
                loading={cie1Props.loading}
                disabled={formLoading}
                size="small"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Código/Descripcion CIE-10"
                    placeholder="Buscar por código o descripcion"
                    name="codigo_cie_hosp1"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {cie1Props.loading ? (
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

            {/* Botón para mostrar/ocultar CIE adicionales */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isVisible}
                    onChange={handleToggleCIE}
                    disabled={formLoading}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body1">
                    {isVisible
                      ? "Ocultar Diagnósticos Adicionales"
                      : "Agregar Diagnósticos Adicionales (Opcional)"}
                  </Typography>
                }
                sx={{ mt: 1, mb: 1 }}
              />
            </Grid>

            {isVisible && (
              <>
                {/* Segundo Diagnóstico */}
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    id="cie_hosp2_autocomplete"
                    options={cie2Props.sugerencias}
                    getOptionLabel={(option) =>
                      `${option.codigoCie} - ${option.nombreCie}`
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.codigoCie === value.codigoCie
                    }
                    onChange={cie2Props.handleCIEChange}
                    onInputChange={cie2Props.handleCIEInputChange}
                    onFocus={cie2Props.handleFocusCIE}
                    onBlur={cie2Props.handleBlurCIE}
                    onKeyDown={cie2Props.handleKeyDownCIE}
                    value={
                      datosPHosp.codigo_cie_hosp2 &&
                      datosPHosp.descripcion_cie_hosp2
                        ? {
                            codigoCie: datosPHosp.codigo_cie_hosp2,
                            nombreCie: datosPHosp.descripcion_cie_hosp2,
                          }
                        : null
                    }
                    inputValue={cie2Props.inputValue}
                    open={cie2Props.mostrarOpciones}
                    loading={cie2Props.loading}
                    disabled={formLoading}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Código/Descripcion CIE-10 (2)"
                        placeholder="Buscar por código o descripción"
                        name="codigo_cie_hosp2"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {cie2Props.loading ? (
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
                {/* Tercer Diagnóstico */}
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    id="cie_hosp3_autocomplete"
                    options={cie3Props.sugerencias}
                    getOptionLabel={(option) =>
                      `${option.codigoCie} - ${option.nombreCie}`
                    }
                    isOptionEqualToValue={(option, value) =>
                      option.codigoCie === value.codigoCie
                    }
                    onChange={cie3Props.handleCIEChange}
                    onInputChange={cie3Props.handleCIEInputChange}
                    onFocus={cie3Props.handleFocusCIE}
                    onBlur={cie3Props.handleBlurCIE}
                    onKeyDown={cie3Props.handleKeyDownCIE}
                    value={
                      datosPHosp.codigo_cie_hosp3 &&
                      datosPHosp.descripcion_cie_hosp3
                        ? {
                            codigoCie: datosPHosp.codigo_cie_hosp3,
                            nombreCie: datosPHosp.descripcion_cie_hosp3,
                          }
                        : null
                    }
                    inputValue={cie3Props.inputValue}
                    open={cie3Props.mostrarOpciones}
                    loading={cie3Props.loading}
                    disabled={formLoading}
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Código/Descripcion CIE-10 (3)"
                        placeholder="Buscar por código o descripción"
                        name="codigo_cie_hosp3"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {cie3Props.loading ? (
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
              </>
            )}
          </Grid>
        </FormSection>

        <FormSection title="Observaciones Adicionales">
          <TextField
            fullWidth
            label="Observaciones (Opcional)"
            name="observacion"
            value={datosPHosp.observacion}
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
