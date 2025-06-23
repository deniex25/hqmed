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
  Box,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  buscarPacientePorDocumento,
  listarTipoDocumento,
  listarTipoServicio,
  listarEstablecimientos,
  registrarCirugiaProg,
  listarTurnosDispo,
  listarProfCirujano,
  listarProfAnestesiologo,
} from "../../services/api";
import { BaseFormLayout } from "../layout/BaseFormLayout";
import { useCIEAutocomplete } from "../../hooks/useCIEAutocomplete";
import { FormSection } from "../layout/FormSection";

export const RegistroProgramacion = () => {
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
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [medCirujano, setMedCirujano] = useState([]);
  const [medAnestesiologo, setMedAnestesiologo] = useState([]);
  const [tipoServicio, setTipoServicio] = useState([]);
  const navigate = useNavigate();

  const [datosPProgC, setDatosPProgC] = useState({
    id_tipo_doc: "",
    nro_doc_pac: "",
    nombres_paciente: "",
    fecha_nac_pac: "",
    sexo_pac: "",
    edad: "",
    tipo_cirugia: "",
    id_orden_turno: "",
    id_tipo_servicio: "",
    fecha_programacion: null,
    id_per_cirujano: "",
    id_per_anestesiologo: "",
    codigo_cie_prog: "",
    descripcion_cie_prog: "",
    procedimiento_quirurgico: "",
    id_establecimiento: "",
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
    setDatosPProgC((prev) => callback(prev));
  }, []);

  const cieProps = useCIEAutocomplete(
    "codigo_cie_prog",
    "descripcion_cie_prog",
    datosPProgC,
    updateFormData,
    "ambos"
  );

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setFormLoading(true);
      try {
        const [documentos, servicios, cirujanos, anestesiologos] =
          await Promise.all([
            listarTipoDocumento(),
            listarTipoServicio(),
            listarProfCirujano(),
            listarProfAnestesiologo(),
          ]);
        setTipoDocumento(documentos);
        setTipoServicio(servicios);
        setMedCirujano(cirujanos);
        setMedAnestesiologo(anestesiologos);

        if (esAdmin) {
          const datosEstab = await listarEstablecimientos();
          setEstablecimientos(datosEstab.establecimientos || []);
        }
        if (datosPProgC.fecha_programacion) {
          listarTurnosDispo(datosPProgC.fecha_programacion)
            .then((turnos) => {
              setTurnosDisponibles(turnos);
              if (turnos.length > 0) {
                setDatosPProgC((prev) => ({
                  ...prev,
                  id_orden_turno: turnos[0].id,
                }));
              }
            })
            .catch(console.error);
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
  }, [
    esAdmin,
    showSnackbar,
    datosPProgC.id_establecimiento,
    datosPProgC.fecha_programacion,
  ]);

  const handleBuscarPaciente = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      setFormLoading(true);

      if (!datosPProgC.id_tipo_doc || !datosPProgC.nro_doc_pac) {
        showSnackbar(
          "Por favor, seleccione el tipo y número de documento antes de buscar.",
          "warning"
        );
        setFormLoading(false);
        return;
      }

      try {
        const resultado = await buscarPacientePorDocumento(
          datosPProgC.id_tipo_doc,
          datosPProgC.nro_doc_pac
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
              setDatosPProgC((prev) => ({
                ...prev,
                nombres_paciente: "",
                fecha_nac_pac: "",
                sexo_pac: "",
                edad: "",
              }));
            }
          );
        } else {
          setDatosPProgC((prevDatos) => ({
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosPProgC((prevDatos) => ({
      ...prevDatos,
      [name]: value,
    }));
  };

  const handleGuardar = async () => {
    if (
      !datosPProgC.id_tipo_doc ||
      !datosPProgC.nro_doc_pac ||
      !datosPProgC.nombres_paciente ||
      !datosPProgC.tipo_cirugia ||
      !datosPProgC.fecha_programacion ||
      !datosPProgC.id_orden_turno ||
      !datosPProgC.id_tipo_servicio ||
      !datosPProgC.id_per_cirujano ||
      !datosPProgC.id_per_anestesiologo
    ) {
      showSnackbar(
        "Por favor, complete todos los campos obligatorios.",
        "error"
      );
      return;
    }

    setFormLoading(true);
    try {
      console.log(datosPProgC);
      const respuesta = await registrarCirugiaProg(datosPProgC);
      console.log(respuesta);
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
    setDatosPProgC({
      ...datosPProgC,
      id_establecimiento: establecimientoSeleccionado,
    });
  };

  const limpiarCampos = useCallback(() => {
    setDatosPProgC({
      id_tipo_doc: "",
      nro_doc_pac: "",
      nombres_paciente: "",
      fecha_nac_pac: "",
      sexo_pac: "",
      edad: "",
      tipo_cirugia: "",
      id_orden_turno: "",
      id_tipo_servicio: "",
      fecha_programacion: null,
      id_per_cirujano: "",
      id_per_anestesiologo: "",
      codigo_cie_prog: "",
      descripcion_cie_prog: "",
      procedimiento_quirurgico: "",
      id_establecimiento: esAdmin ? "" : "1",
    });
  }, [esAdmin]);

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
        title="Registro de Programacion de Cirugias"
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
                  value={datosPProgC.id_establecimiento}
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
                  value={datosPProgC.id_tipo_doc}
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
                value={datosPProgC.nro_doc_pac}
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
                value={datosPProgC.nombres_paciente}
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
                value={dayjs(datosPProgC.fecha_nac_pac)}
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
                  datosPProgC.sexo_pac === "M"
                    ? "Masculino"
                    : datosPProgC.sexo_pac === "F"
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
                value={datosPProgC.edad}
                size="small"
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
                readOnly
                disabled
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Detalles de la Programacion de Cirugia">
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
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
                  value={datosPProgC.tipo_cirugia}
                  label="Tipo de Cirugia *"
                  onChange={handleChange}
                >
                  <MenuItem value="emergencia">Emergencia</MenuItem>
                  <MenuItem value="programada">Programada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Fecha Programacion"
                name="fecha_programacion"
                value={
                  datosPProgC.fecha_programacion
                    ? dayjs(datosPProgC.fecha_programacion)
                    : null
                }
                onChange={(newValue) => {
                  // Si newValue es un objeto Dayjs válido, formatearlo a 'YYYY-MM-DD'
                  const formattedDate = newValue
                    ? newValue.format("YYYY-MM-DD")
                    : null;
                  setDatosPProgC({
                    ...datosPProgC,
                    fecha_programacion: formattedDate, // Guardar como string 'YYYY-MM-DD' o null
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="cama-label">Orden Turno</InputLabel>
                <Select
                  labelId="orden-turno-label"
                  id="id_orden_turno"
                  name="id_orden_turno"
                  value={datosPProgC.id_orden_turno}
                  label="Turno Asignado"
                  size="small"
                  onChange={handleChange}
                  required
                >
                  {Array.isArray(turnosDisponibles) &&
                    turnosDisponibles.map((ordenTurno) => (
                      <MenuItem key={ordenTurno.id} value={ordenTurno.id}>
                        {ordenTurno.id}
                      </MenuItem>
                    ))}
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
                <InputLabel id="tipo-servicio-label">
                  Tipo de Servicio
                </InputLabel>
                <Select
                  labelId="tipo-servicio-label"
                  id="id_tipo_servicio"
                  name="id_tipo_servicio"
                  value={datosPProgC.id_tipo_servicio}
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl
                fullWidth
                size="small"
                required
                disabled={formLoading}
              >
                <InputLabel id="id-per-cirujano-label">
                  Medico Cirujano
                </InputLabel>
                <Select
                  labelId="id-per-cirujano-label"
                  id="id_per_cirujano"
                  name="id_per_cirujano"
                  value={datosPProgC.id_per_cirujano}
                  label="Medico Cirujano"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(medCirujano) &&
                    medCirujano.map((med) => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.personal_cirujano}
                      </MenuItem>
                    ))}
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
                <InputLabel id="id-per-anestesiologo-label">
                  Medico Anestesiologo
                </InputLabel>
                <Select
                  labelId="id-per-anestesiologo-label"
                  id="id_per_anestesiologo"
                  name="id_per_anestesiologo"
                  value={datosPProgC.id_per_anestesiologo}
                  label="Medico Anestesiologo"
                  onChange={handleChange}
                >
                  <MenuItem value="">
                    <em>Seleccione</em>
                  </MenuItem>
                  {Array.isArray(medAnestesiologo) &&
                    medAnestesiologo.map((med) => (
                      <MenuItem key={med.id} value={med.id}>
                        {med.personal_anestesiologo}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Diagnóstico CIE-10">
          <Grid container spacing={3}>
            {/* Primer Diagnóstico */}
            <Grid size={{ xs: 12 }}>
              <Autocomplete
                id="cie_prog_autocomplete"
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
                  datosPProgC.codigo_cie_prog &&
                  datosPProgC.descripcion_cie_prog
                    ? {
                        codigoCie: datosPProgC.codigo_cie_prog,
                        nombreCie: datosPProgC.descripcion_cie_prog,
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
                    name="codigo_cie_prog"
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

        <FormSection title="Procedimiento Quirurgico">
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small" required disabled={formLoading}>
              <InputLabel id="procedimiento-quirurgico-label">
                Procedimiento Quirurgico
              </InputLabel>
              <Select
                labelId="procedimiento-quirurgico-label"
                id="procedimiento_quirurgico"
                name="procedimiento_quirurgico"
                value={datosPProgC.procedimiento_quirurgico}
                label="Procedimiento Quirurgico"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Seleccione</em>
                </MenuItem>
                <MenuItem value="cesarea">Cesarea</MenuItem>
              </Select>
            </FormControl>
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
