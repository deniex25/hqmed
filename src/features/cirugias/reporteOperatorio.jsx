import { useState, useEffect, useCallback } from "react";
import {
  buscarPacienteProg,
  listarTipoServicio,
  listarEstablecimientos,
  registrarIntervencionQ,
  listarProfCirujano,
  listarProfAnestesiologo,
  listarCausaIncidencia,
  listarTipoCausa,
  generarPDF,
} from "../../services/api";
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { useNavigate } from "react-router-dom";
import { CustomSnackbar } from "../../components/CustomSnackbar";
import { CustomDialog } from "../../components/CustomDialog";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { useCIEAutocomplete } from "../../hooks/useCIEAutocomplete";
import { FormSection } from "../layout/FormSection";
import { CheckBox } from "@mui/icons-material";

export const ReporteOperatorio = () => {
  // --- Estados para UI/Feedback ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogOnConfirm, setDialogOnConfirm] = useState(() => () => {});
  const [dialogOnCancel, setDialogOnCancel] = useState(() => () => {});
  const [formLoading, setFormLoading] = useState(false);
  // --- Estados para Listas Maestras (APIs) ---
  const [establecimientos, setEstablecimientos] = useState([]);
  const [tipoServicio, setTipoServicio] = useState([]);
  const [profCirujano, setProfCirujano] = useState([]);
  const [profAnestesiologo, setProfAnestesiologo] = useState([]);
  const [causaIncidencia, setCausaIncidencia] = useState([]);
  const [tipoCausa, setTipoCausa] = useState([]);

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const [datosPIQ, setDatosPIQ] = useState({
    // Información del Paciente
    id_tipo_doc: "",
    nro_doc_pac: "",
    nombres_paciente: "", // Renombrado de 'Paciente' para coincidir con la API
    sexo_pac: "",
    edad_atencion_pac: "", // Renombrado de 'edad' para ser más descriptivo

    // Detalles de la Intervención Quirúrgica (Fechas y Horas)
    fecha_intervencion: null,
    hora_ingreso_sala: null,
    hora_salida_sala: null,
    hora_inicio_interv: null,
    hora_fin_interv: null,

    // Diagnósticos CIE-10
    codigo_cie_iq: "",
    descripcion_cie_iq: "",

    // Detalle de la Intervención Quirúrgica (Procedimiento y Profesionales)
    tipo_cirugia: "", // mayor/menor
    id_per_cirujano: "",
    procedimiento_quirurgico: "", // Ej: Cesarea, Colelap, etc.
    aplico_lsv: false, // Booleano para el checkbox "¿Aplico LSV?" (Lista de Verificación de Cirugía Segura)
    ups_servicio: "", // UPS / Servicio
    id_per_anestesiologo: "",
    tipo_anestesia_aplicada: "", // local, raquidea, general, epidural
    aplico_lvcs: false, // Booleano para el checkbox "¿Lista de Verificación de Cirugía Segura?"

    // Eventos Adversos
    evento_adverso: false, // Booleano para "¿Incidente o Evento Adverso?"
    severidad: "", // Solo si evento_adverso es true
    causa_incidencia: "", // Solo si evento_adverso es true
    tipo_causa: "", // Solo si evento_adverso es true

    // Observaciones Post-Operatorias
    hallazgo_operatorio: "",
    tecnica_procedimiento: "",
    complicacion_iq: false, // si/no
    detalle_complicacion_iq: "", // Solo si complicacion_iq es 'si'
    estado_pac_egreso: "", // vivo, fallecido
    destino_pac_egreso: "", // cama, uci, etc.
    anatomia_patologica: false, // Booleano para "¿Anatomía Patológica?"
    detalle_anat_pato: "", // Solo si anatomia_patologica es true
    material_gasas: false, // Booleano para "¿Material: Gasas?"
    material_tapon: false, // Booleano para "¿Material: Tapón?"
  });

  // --- Funciones de Utilidad (Snackbar, Dialog, Actualización de Form) ---
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
    setDatosPIQ((prev) => callback(prev));
  }, []);

  // --- Hook para el Autocomplete de CIE-10 ---
  const cieProps = useCIEAutocomplete(
    "codigo_cie_iq",
    "descripcion_cie_iq",
    datosPIQ,
    updateFormData,
    "ambos"
  );

  // --- Carga de Datos Iniciales (Listas Maestras) ---
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [tservicio, medCirujano, medAnestesiologo, causa] =
          await Promise.all([
            listarTipoServicio(),
            listarProfCirujano(),
            listarProfAnestesiologo(),
            listarCausaIncidencia(),
          ]);
        setTipoServicio(tservicio);
        setProfCirujano(medCirujano);
        setProfAnestesiologo(medAnestesiologo);
        setCausaIncidencia(causa);
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
  }, [esAdmin, showSnackbar]);

  useEffect(() => {
    const cargarTiposDeCausaPorId = async () => {
      if (datosPIQ.causa_incidencia) {
        // Importante: usar 'causas_incidencia' aquí
        try {
          // Limpia el tipo_causa si se cambia la causa_incidencia
          setDatosPIQ((prev) => ({ ...prev, tipo_causa: "" }));
          const tcausa = await listarTipoCausa(datosPIQ.causa_incidencia);
          setTipoCausa(tcausa);
          if (tcausa.length > 0) {
            // Opcional: si quieres seleccionar automáticamente la primera opción
            // setDatosPIQ((prev) => ({ ...prev, tipo_causa: tcausa[0].id }));
          }
        } catch (error) {
          console.error("Error al cargar tipos de causa:", error);
          showSnackbar("Error al cargar tipos de causa.", "error");
        }
      } else {
        setTipoCausa([]); // Si no hay causa seleccionada, limpia los tipos de causa
      }
    };

    cargarTiposDeCausaPorId();
  }, [datosPIQ.causa_incidencia, showSnackbar]);

  const handleBuscarPaciente = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPIQ.id_tipo_doc || !datosPIQ.nro_doc_pac) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacienteProg(
          datosPIQ.id_tipo_doc,
          datosPIQ.nro_doc_pac
        );
        if (resultado.mensaje) {
          showDialog(
            "Paciente no programado",
            resultado.mensaje,
            () => closeDialog(),
            null
          );
          setDatosPIQ((prevDatos) => ({
            ...prevDatos,
            nombres_paciente: "",
            sexo_pac: "",
            edad_atencion_pac: "",
            fecha_intervencion: null,
          }));
        } else {
          setDatosPIQ((prevDatos) => ({
            ...prevDatos,
            nombres_paciente: resultado.nombres_paciente || "",
            sexo_pac: resultado.sexo_pac || "",
            edad_atencion_pac: resultado.edad || "", // Usa el nombre de estado unificado
            fecha_intervencion: resultado.fecha_intervencion || null,
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatosPIQ((prevDatos) => {
      let updatedValue = type === "checkbox" ? checked : value;
      let newDatos = {
        ...prevDatos,
        [name]: updatedValue,
      };
      // Lógica condicional basada en el campo que cambia
      if (name === "procedimiento_quirurgico") {
        // Si el procedimiento ya NO es "Cesarea", limpia aplico_lsv
        if (value !== "Cesarea") {
          newDatos.aplico_lsv = false;
        }
      } else if (name === "evento_adverso") {
        // Si el evento adverso ya NO es true, limpia los campos relacionados
        if (!checked) {
          newDatos.severidad = "";
          newDatos.causa_incidencia = "";
          newDatos.tipo_causa = "";
        }
      } else if (name === "anatomia_patologica") {
        // Si anatomia_patologica ya NO es true, limpia el detalle
        if (!checked) {
          newDatos.detalle_anat_pato = "";
        }
      } else if (name === "complicacion_iq") {
        // Si complicacion_iq ya NO es 'si', limpia el detalle
        if (value !== true) {
          newDatos.detalle_complicacion_iq = "";
        }
      }

      return newDatos;
    });
  };

  const handleDateChange = (name) => (newValue) => {
    setDatosPIQ((prevDatos) => ({
      ...prevDatos,
      [name]: newValue ? newValue.format("YYYY-MM-DD") : null,
    }));
  };

  const handleTimeChange = (name) => (newValue) => {
    setDatosPIQ((prevDatos) => ({
      ...prevDatos,
      [name]: newValue ? newValue.format("HH:mm") : null, // Cambiado a null para consistencia
    }));
  };

  const handleGuardar = async () => {
    // Validaciones (ahora más claras con los nombres de estado unificados)
    const camposObligatorios = [
      "id_tipo_doc",
      "nro_doc_pac",
      "nombres_paciente",
      "fecha_intervencion",
      "hora_ingreso_sala",
      "hora_salida_sala",
      "hora_inicio_interv",
      "hora_fin_interv",
      "codigo_cie_iq",
      "tipo_cirugia",
      "id_per_cirujano",
      "procedimiento_quirurgico",
      "ups_servicio",
      "id_per_anestesiologo",
      "tipo_anestesia_aplicada",
      "hallazgo_operatorio",
      "tecnica_procedimiento",
      "complicacion_iq",
      "estado_pac_egreso",
      "destino_pac_egreso",
    ];

    if (esAdmin) {
      camposObligatorios.push("id_establecimiento");
    }

    const camposFaltantes = camposObligatorios.filter(
      (field) => !datosPIQ[field]
    );

    // Validaciones condicionales
    if (
      datosPIQ.procedimiento_quirurgico === "Cesarea" &&
      !datosPIQ.aplico_lsv
    ) {
      camposFaltantes.push("aplico_lsv");
    }
    if (datosPIQ.evento_adverso) {
      if (!datosPIQ.severidad) camposFaltantes.push("severidad");
      if (!datosPIQ.causa_incidencia) camposFaltantes.push("causa_incidencia");
      if (!datosPIQ.tipo_causa) camposFaltantes.push("tipo_causa");
    }
    if (datosPIQ.anatomia_patologica && !datosPIQ.detalle_anat_pato) {
      camposFaltantes.push("detalle_anat_pato");
    }
    if (
      datosPIQ.complicacion_iq === true &&
      !datosPIQ.detalle_complicacion_iq
    ) {
      camposFaltantes.push("detalle_complicacion_iq");
    }

    if (camposFaltantes.length > 0) {
      showSnackbar(
        `Por favor, complete los campos obligatorios: ${camposFaltantes.join(
          ", "
        )}.`,
        "error"
      );
      return;
    }
    console.log(datosPIQ);
    setFormLoading(true);
    try {
      // Prepara los datos para el envío a la API
      const datosParaEnviar = {
        ...datosPIQ,
        // Conversión de booleanos a 'si'/'no' o '1'/'0' si la API lo requiere
        aplico_lsv: datosPIQ.aplico_lsv ? true : false,
        aplico_lvcs: datosPIQ.aplico_lvcs ? true : false,
        evento_adverso: datosPIQ.evento_adverso ? true : false,
        anatomia_patologica: datosPIQ.anatomia_patologica ? true : false,
        material_gasas: datosPIQ.material_gasas ? true : false,
        material_tapon: datosPIQ.material_tapon ? true : false,
        // Asegúrate de que las fechas y horas estén en el formato correcto si no lo hace el formato de Dayjs por defecto
        fecha_intervencion: datosPIQ.fecha_intervencion, // Ya está en YYYY-MM-DD
        hora_ingreso_sala: datosPIQ.hora_ingreso_sala, // Ya está en HH:mm
        hora_salida_sala: datosPIQ.hora_salida_sala,
        hora_inicio_interv: datosPIQ.hora_inicio_interv,
        hora_fin_interv: datosPIQ.hora_fin_interv,
        // Si el paciente no se encontró, estos campos podrían estar vacíos,
        // pero la validación anterior ya debería manejarlo.
        // Asegúrate de que los campos que vienen de la API de búsqueda de paciente estén en el objeto.
      };

      const respuesta = await registrarIntervencionQ(datosParaEnviar);

      if (respuesta && respuesta.mensaje) {
        showSnackbar(respuesta.mensaje, "success");
        limpiarCampos();
      } else {
        showSnackbar(
          respuesta.message ||
            "El paciente ya ha sido intervenido o hubo un error desconocido al registrar.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error al guardar intervencion:", err);
      showSnackbar(
        err.message ||
          "Error de red o del servidor al guardar la intervención.",
        "error"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEstablecimientoChange = (e) => {
    const establecimientoSeleccionado = e.target.value;
    setDatosPIQ((prev) => ({
      ...prev,
      id_establecimiento: establecimientoSeleccionado,
    }));
  };

  const limpiarCampos = useCallback(() => {
    setDatosPIQ({
      id_tipo_doc: "",
      nro_doc_pac: "",
      nombres_paciente: "", // Unificado
      sexo_pac: "",
      edad_atencion_pac: "", // Unificado
      fecha_intervencion: null,
      hora_ingreso_sala: null,
      hora_salida_sala: null,
      hora_inicio_interv: null,
      hora_fin_interv: null,
      codigo_cie_iq: "",
      descripcion_cie_iq: "",
      tipo_cirugia: "",
      id_per_cirujano: "",
      procedimiento_quirurgico: "",
      aplico_lsv: false, // Booleano
      ups_servicio: "",
      id_per_anestesiologo: "",
      tipo_anestesia_aplicada: "",
      aplico_lvcs: false, // Booleano
      evento_adverso: false, // Booleano
      severidad: "",
      causa_incidencia: "",
      tipo_causa: "",
      hallazgo_operatorio: "",
      tecnica_procedimiento: "",
      complicacion_iq: false,
      detalle_complicacion_iq: "",
      estado_pac_egreso: "",
      destino_pac_egreso: "",
      anatomia_patologica: false, // Booleano
      detalle_anat_pato: "",
      material_gasas: false, // Booleano
      material_tapon: false, // Booleano
    });
  }, []);

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
        title="Registro del Reporte Operatorio"
        snackbar={snackbar}
        dialog={dialog}
      >
        {formLoading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            position="fixed"
            top={0}
            left={0}
            width="100%"
            bgcolor="rgba(255, 255, 255, 0.7)"
            zIndex={9999}
          >
            <CircularProgress />
          </Box>
        )}
        {esAdmin && (
          <FormSection title="Datos del Establecimiento">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
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
                    value={datosPIQ.id_establecimiento}
                    label="Establecimiento"
                    onChange={handleEstablecimientoChange}
                    disabled={!esAdmin || formLoading}
                    name="id_establecimiento"
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
                  value={datosPIQ.id_tipo_doc}
                  label="Tipo Documento"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="1">DNI</MenuItem>
                  <MenuItem value="2">Carnet Extranjeria</MenuItem>
                  <MenuItem value="3">Pasaporte</MenuItem>
                  <MenuItem value="4">DIE</MenuItem>
                  <MenuItem value="6">CNV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="nro_doc_pac"
                value={datosPIQ.nro_doc_pac}
                onChange={handleChange}
                onKeyDown={handleBuscarPaciente}
                size="small"
                helperText="Presione Enter para buscar paciente."
                disabled={formLoading}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Apellidos y Nombres"
                name="nombres_paciente"
                value={datosPIQ.nombres_paciente}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Sexo"
                name="sexo_pac"
                value={
                  datosPIQ.sexo_pac === "M"
                    ? "Masculino"
                    : datosPIQ.sexo_pac === "F"
                    ? "Femenino"
                    : ""
                }
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Edad"
                name="edad_atencion_pac"
                value={datosPIQ.edad_atencion_pac}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Fecha y horas de la Intervencion Quirurgica">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Fecha de Intervencion"
                name="fecha_intervencion"
                value={
                  datosPIQ.fecha_intervencion
                    ? dayjs(datosPIQ.fecha_intervencion)
                    : null
                }
                onChange={handleDateChange("fecha_intervencion")}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    required: true,
                  },
                }}
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TimePicker
                label="Hora de Ingreso Sala"
                name="hora_ingreso_sala"
                value={
                  datosPIQ.hora_ingreso_sala
                    ? dayjs(datosPIQ.hora_ingreso_sala, "HH:mm")
                    : null
                }
                onChange={handleTimeChange("hora_ingreso_sala")}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    helperText: "Formato de 24 horas",
                    required: true,
                  },
                }}
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TimePicker
                label="Hora de Salida Sala"
                name="hora_salida_sala"
                value={
                  datosPIQ.hora_salida_sala
                    ? dayjs(datosPIQ.hora_salida_sala, "HH:mm")
                    : null
                }
                onChange={handleTimeChange("hora_salida_sala")}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    helperText: "Formato de 24 horas",
                    required: true,
                  },
                }}
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TimePicker
                label="Hora de Inicio Intervencion"
                name="hora_inicio_interv"
                value={
                  datosPIQ.hora_inicio_interv
                    ? dayjs(datosPIQ.hora_inicio_interv, "HH:mm")
                    : null
                }
                onChange={handleTimeChange("hora_inicio_interv")}
                ampm={false}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    helperText: "Formato de 24 horas",
                    required: true,
                  },
                }}
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TimePicker
                label="Hora Fin Intervencion"
                name="hora_fin_interv"
                value={
                  datosPIQ.hora_fin_interv
                    ? dayjs(datosPIQ.hora_fin_interv, "HH:mm")
                    : null
                }
                onChange={handleTimeChange("hora_fin_interv")}
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
                id="cie_iq_autocomplete"
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
                  datosPIQ.codigo_cie_iq && datosPIQ.descripcion_cie_iq
                    ? {
                        codigoCie: datosPIQ.codigo_cie_iq,
                        nombreCie: datosPIQ.descripcion_cie_iq,
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
                    name="codigo_cie_iq"
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
        <FormSection title="Detalle del Procedimiento Quirurgica">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="tipo-cirugia-label">Tipo de Cirugia</InputLabel>
                <Select
                  labelId="tipo-cirugia-label"
                  id="tipo_cirugia"
                  name="tipo_cirugia"
                  value={datosPIQ.tipo_cirugia}
                  label="Tipo de Cirugia"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="mayor">Mayor</MenuItem>
                  <MenuItem value="menor">Menor</MenuItem>
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
                <InputLabel id="medico-cirujano-label">
                  Medico Cirujano
                </InputLabel>
                <Select
                  labelId="medico-cirujano-label"
                  id="id_per_cirujano"
                  name="id_per_cirujano"
                  value={datosPIQ.id_per_cirujano}
                  label="Medico Cirujano"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(profCirujano) &&
                    profCirujano.map((medCirujano) => (
                      <MenuItem key={medCirujano.id} value={medCirujano.id}>
                        {medCirujano.personal_cirujano}
                      </MenuItem>
                    ))}
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
                <InputLabel id="procedimiento_quirurgico-label">
                  Procedimiento Quirurgico
                </InputLabel>
                <Select
                  labelId="procedimiento_quirurgico-label"
                  id="procedimiento_quirurgico"
                  name="procedimiento_quirurgico"
                  value={datosPIQ.procedimiento_quirurgico}
                  label="Procedimiento Quirurgico"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="Cesarea">Cesárea</MenuItem>
                  <MenuItem value="Colelap">Colelap</MenuItem>
                  <MenuItem value="Hernioplastía">Hernioplastía</MenuItem>
                  <MenuItem value="Hemorroidectomía">Hemorroidectomía</MenuItem>
                  <MenuItem value="Eventroplastia">Eventroplastia</MenuItem>
                  <MenuItem value="Fistulectomía">Fistulectomía</MenuItem>
                  <MenuItem value="Quistectomía">Quistectomía</MenuItem>
                  <MenuItem value="Histerectomía">Histerectomía</MenuItem>
                  <MenuItem value="Colporrafia">Colporrafia</MenuItem>
                  <MenuItem value="Ameu">Ameu</MenuItem>
                  <MenuItem value="Legrado uterino">Legrado uterino</MenuItem>
                  <MenuItem value="Oftalmología">Oftalmología</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Campo condicional para Cesarea */}
            {datosPIQ.procedimiento_quirurgico === "Cesarea" && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={datosPIQ.aplico_lsv}
                      onChange={handleChange}
                      name="aplico_lsv"
                      disabled={formLoading}
                    />
                  }
                  label="¿Aplicó LSV?"
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="ups-servicio-label">UPS / Servicio</InputLabel>
                <Select
                  labelId="ups-servicio-label"
                  id="ups_servicio"
                  name="ups_servicio"
                  value={datosPIQ.ups_servicio}
                  label="UPS / Servicio"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="Cesarea">Cirugia General</MenuItem>
                  <MenuItem value="Colelap">Ginecologia y Obstetricia</MenuItem>
                  <MenuItem value="Hernioplastía">Traumatología</MenuItem>
                  <MenuItem value="Hemorroidectomía">
                    Otorrinolaringologia
                  </MenuItem>
                  <MenuItem value="Eventroplastia">Oftalmología</MenuItem>
                  <MenuItem value="Fistulectomía">Urología</MenuItem>
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
                <InputLabel id="medico-anestesiologo-label">
                  Medico Anestesiologo
                </InputLabel>
                <Select
                  labelId="medico-anestesiologo-label"
                  id="id_per_anestesiologo"
                  name="id_per_anestesiologo"
                  value={datosPIQ.id_per_anestesiologo}
                  label="Medico Anestesiologo"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(profAnestesiologo) &&
                    profAnestesiologo.map((medAnestesiologo) => (
                      <MenuItem
                        key={medAnestesiologo.id}
                        value={medAnestesiologo.id}
                      >
                        {medAnestesiologo.personal_anestesiologo}
                      </MenuItem>
                    ))}
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
                <InputLabel id="tipo_anestesia_aplicada-label">
                  Tipo de Anestesia Aplicada
                </InputLabel>
                <Select
                  labelId="tipo_anestesia_aplicada-label"
                  id="tipo_anestesia_aplicada"
                  name="tipo_anestesia_aplicada"
                  value={datosPIQ.tipo_anestesia_aplicada}
                  label="Tipo de Anestesia Aplicada"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="raquidea">Raquidea</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="epidural">Epidural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datosPIQ.aplico_lvcs}
                    onChange={handleChange}
                    name="aplico_lvcs"
                    disabled={formLoading}
                  />
                }
                label="¿Lista de Verificacion de Cirugia Segura?"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datosPIQ.evento_adverso}
                    onChange={handleChange}
                    name="evento_adverso"
                    disabled={formLoading}
                  />
                }
                label="¿Incidente o Evento Adverso?"
              />
            </Grid>
            {datosPIQ.evento_adverso && (
              <>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl
                    fullWidth
                    size="small"
                    required
                    disabled={formLoading}
                  >
                    <InputLabel id="severidad-label">Severidad</InputLabel>
                    <Select
                      labelId="severidad-label"
                      id="severidad"
                      name="severidad"
                      value={datosPIQ.severidad}
                      label="Severidad"
                      size="small"
                      onChange={handleChange}
                      required
                    >
                      <MenuItem value="">
                        <em>Seleccione</em>
                      </MenuItem>
                      <MenuItem value="incidente">Incidente</MenuItem>
                      <MenuItem value="evento adverso">Evento Adverso</MenuItem>
                      <MenuItem value="evento centinela">
                        Evento Centinela
                      </MenuItem>
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
                    <InputLabel id="causa-incidencia-label">Causas</InputLabel>
                    <Select
                      labelId="causa-incidencia-label"
                      id="causa_incidencia"
                      name="causa_incidencia"
                      value={datosPIQ.causa_incidencia}
                      label="Causas"
                      size="small"
                      onChange={handleChange}
                      required
                    >
                      <MenuItem value="">
                        <em>Seleccione</em>
                      </MenuItem>
                      {Array.isArray(causaIncidencia) &&
                        causaIncidencia.map((causa) => (
                          <MenuItem key={causa.id} value={causa.id}>
                            {causa.nombre}
                          </MenuItem>
                        ))}
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
                    <InputLabel id="tipo-causa-label">Tipo Causa</InputLabel>
                    <Select
                      labelId="tipo-causa-label"
                      id="tipo_causa"
                      name="tipo_causa"
                      value={datosPIQ.tipo_causa}
                      label="Tipo Causa"
                      size="small"
                      onChange={handleChange}
                      required
                    >
                      <MenuItem value="">
                        <em>Seleccione</em>
                      </MenuItem>
                      {Array.isArray(tipoCausa) &&
                        tipoCausa.map((tcausa) => (
                          <MenuItem key={tcausa.id} value={tcausa.id}>
                            {tcausa.nombre}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Hallazgo Operatorio"
                name="hallazgo_operatorio"
                value={datosPIQ.hallazgo_operatorio}
                onChange={handleChange}
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Tecnica o Procedimiento"
                name="tecnica_procedimiento"
                value={datosPIQ.tecnica_procedimiento}
                onChange={handleChange}
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datosPIQ.complicacion_iq}
                    onChange={handleChange}
                    name="complicacion_iq"
                    disabled={formLoading}
                  />
                }
                label="Complicacion durante la Intervencion"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Especificar complicacion"
                name="detalle_complicacion_iq"
                value={datosPIQ.detalle_complicacion_iq}
                onChange={handleChange}
                size="small"
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
                <InputLabel id="estado-pac-egreso-label">
                  Estado del Paciente al salir de Quirofano
                </InputLabel>
                <Select
                  labelId="estado-pac-egreso-label"
                  id="estado_pac_egreso"
                  name="estado_pac_egreso"
                  value={datosPIQ.estado_pac_egreso}
                  label="Estado del Paciente al salir de Quirofano"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="estable">Estable</MenuItem>
                  <MenuItem value="critico">Critico</MenuItem>
                  <MenuItem value="Fallecido">Fallecido</MenuItem>
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
                <InputLabel id="destino-pac-egreso-label">
                  Estado del Paciente al salir de Quirofano
                </InputLabel>
                <Select
                  labelId="destino-pac-egreso-label"
                  id="destino_pac_egreso"
                  name="destino_pac_egreso"
                  value={datosPIQ.destino_pac_egreso}
                  label="Destino del Paciente al salir de Quirofano"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  <MenuItem value="urpa">URPA</MenuItem>
                  <MenuItem value="observacion">Observacion</MenuItem>
                  <MenuItem value="hospitalizacion">Hospitalizacion</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                required
                control={
                  <Checkbox
                    checked={datosPIQ.anatomia_patologica}
                    onChange={handleChange}
                    name="anatomia_patologica"
                    disabled={formLoading}
                  />
                }
                label="Muestra de Anatomia Patologica"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                label="Especificar Muestra"
                name="detalle_anat_pato"
                value={datosPIQ.detalle_anat_pato}
                onChange={handleChange}
                size="small"
                disabled={formLoading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datosPIQ.material_gasas}
                    onChange={handleChange}
                    name="material_gasas"
                    disabled={formLoading}
                  />
                }
                label="GASAS (Material completo)"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={datosPIQ.material_tapon}
                    onChange={handleChange}
                    name="material_tapon"
                    disabled={formLoading}
                  />
                }
                label="TAPON (Material completo)"
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
