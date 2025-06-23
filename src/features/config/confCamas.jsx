import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  IconButton,
} from "@mui/material"; // Asegúrate que esta importación es para Material UI v5+

import AddIcon from "@mui/icons-material/Add"; // Icono para guardar/registrar
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle"; // Icono para cambiar estado
import DeleteForeverIcon from "@mui/icons-material/DeleteForever"; // Icono para anular
import ClearAllIcon from "@mui/icons-material/ClearAll"; // Icono para limpiar

import { BaseFormLayout } from "../layout/BaseFormLayout"; // Si tienes este layout
import { FormSection } from "../layout/FormSection"; // Si tienes este componente de sección
import { useAlerts } from "../../hooks/useAlerts"; // Tu hook de alertas personalizado
import { CustomDialog } from "../../components/CustomDialog"; // Tu componente de diálogo personalizado

import {
  registrarCama,
  listarTipoServicio,
  listarCamas,
  listarEstablecimientos,
  actualizarEstadoCamas,
} from "../../services/api";

// Mapeo de servicios a nombres de camas (mantenerlo afuera para que no se re-renderice)
const SERVICIOS_MAP = {
  medicina: ["1M", "2M", "3M", "4M", "5M", "6M", "7M", "8M", "9M"],
  cirugia: ["1C", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C"],
  ginecologia: ["1G", "2G", "3G", "4G", "5G", "6G", "7G", "8G", "9G"],
  obstetricia_partos: [
    "1OP",
    "2OP",
    "3OP",
    "4OP",
    "5OP",
    "6OP",
    "7OP",
    "8OP",
    "9OP",
  ],
  pediatria: ["1P", "2P", "3P", "4P", "5P", "6P", "7P", "8P", "9P"],
};

export const ConfCamas = () => {
  const { snackbar, showSnackbar, dialog, hideDialog } =
    useAlerts();

  const [listaCamas, setListaCamas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tipoServicioId, setTipoServicioId] = useState("");
  const [opcionesCamas, setOpcionesCamas] = useState([]);
  const [tipoServicioCama, setTipoServicioCama] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [idEstablecimientoSeleccionado, setIdEstablecimientoSeleccionado] =
    useState("todos");
  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const [datosFormulario, setDatosFormulario] = useState({
    Id_Tipo_Servicio: "", // Cambiado de "0" a "" para consistencia con Select
    nombre_cama: "",
    estado_cama: "",
    detalle_motivo: "",
    id_establecimiento: esAdmin ? "todos" : null, // Si no es admin, no debería ser 'todos'
  });

  // Estado para el diálogo de anulación/cambio de estado
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "Cancelar",
    onConfirm: () => {},
    textFieldLabel: "",
    textFieldValue: "",
    onTextFieldChange: () => {},
    showTextField: false,
    idToProcess: null, // ID de la cama a procesar
    actionType: null, // 'changeState' o 'anular'
  });

  // Efecto para cargar datos iniciales (tipos de servicio y establecimientos)
  const cargarDatosIniciales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const servicios = await listarTipoServicio();
      setTipoServicioCama(servicios);
      if (esAdmin) {
        const estabs = await listarEstablecimientos();
        // Asegúrate de que estabs.establecimientos sea un array
        setEstablecimientos(estabs.establecimientos || []);
      }
    } catch (err) {
      console.error("Error cargando datos iniciales:", err);
      setError("Error al cargar datos iniciales. Por favor, intente de nuevo.");
      showSnackbar("Error al cargar datos iniciales.", "error");
    } finally {
      setLoading(false);
    }
  }, [esAdmin, showSnackbar]);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // Efecto para obtener camas cuando cambia el establecimiento seleccionado
  const obtenerCamas = useCallback(
    async (idEstablecimiento) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listarCamas(idEstablecimiento);
        if (Array.isArray(data)) {
          setListaCamas(data);
          if (data.length === 0) {
            showSnackbar(
              "No se encontraron camas para el filtro seleccionado.",
              "info"
            );
          } else {
            showSnackbar("Camas cargadas exitosamente.", "success");
          }
        } else {
          setListaCamas([]);
          showSnackbar(
            "El servidor no devolvió una lista válida de camas.",
            "warning"
          );
        }
      } catch (err) {
        console.error("Error al cargar camas:", err);
        setError("No se pudo cargar la lista de camas.");
        showSnackbar("Error al cargar la lista de camas.", "error");
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  // Actualiza las camas cuando el establecimiento cambia
  useEffect(() => {
    obtenerCamas(idEstablecimientoSeleccionado);
  }, [idEstablecimientoSeleccionado, obtenerCamas]); // Dependencia de obtenerCamas

  const handleEstablecimientoChange = useCallback((event) => {
    const nuevoEstablecimiento = event.target.value;
    setIdEstablecimientoSeleccionado(nuevoEstablecimiento);
    setDatosFormulario((prev) => ({
      ...prev,
      id_establecimiento: nuevoEstablecimiento,
    }));
  }, []);

  const handleTipoServicioChange = useCallback(
    (event) => {
      const servicioId = event.target.value;
      setTipoServicioId(servicioId);
      const servicioSeleccionado = tipoServicioCama.find(
        (serv) => serv.id === servicioId
      );
      let nuevasOpcionesCamas = [];
      
      if (servicioSeleccionado) {
        const nombreServicio = servicioSeleccionado.descripcion
          .toLowerCase()
          .replace(/\s+/g, "_");
        nuevasOpcionesCamas = SERVICIOS_MAP[nombreServicio] || [];
      }
      setOpcionesCamas(nuevasOpcionesCamas);
      setDatosFormulario((prev) => ({
        ...prev,
        Id_Tipo_Servicio: servicioId,
        nombre_cama: "", // Resetear la cama seleccionada
      }));
    },
    [tipoServicioCama]
  );

  const handleFormChange = useCallback((event) => {
    const { name, value } = event.target;
    setDatosFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleGuardar = useCallback(async () => {
    if (!datosFormulario.nombre_cama) {
      showSnackbar("Debe seleccionar una cama", "error");
      return;
    }
    if (esAdmin && datosFormulario.id_establecimiento === "todos") {
      showSnackbar("Debe seleccionar un establecimiento", "error");
      return;
    }
    if (
      datosFormulario.estado_cama === "inoperativa" &&
      !datosFormulario.detalle_motivo
    ) {
      showSnackbar("Debe ingresar un motivo para cama inoperativa", "error");
      return;
    }

    setLoading(true);
    try {
      const datosParaEnviar = {
        ...datosFormulario,
        id_establecimiento: esAdmin ? datosFormulario.id_establecimiento : null, // Solo enviar si es admin
      };
      const respuesta = await registrarCama(datosParaEnviar);

      showSnackbar(
        respuesta.mensaje || "Cama registrada exitosamente",
        "success"
      );
      limpiarCampos();
      obtenerCamas(idEstablecimientoSeleccionado);
    } catch (err) {
      console.error("Error al guardar cama:", err);
      showSnackbar(err.message || "Error al guardar cama.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    datosFormulario,
    esAdmin,
    showSnackbar,
    obtenerCamas,
    idEstablecimientoSeleccionado,
  ]);

  const limpiarCampos = useCallback(() => {
    setDatosFormulario({
      Id_Tipo_Servicio: "",
      nombre_cama: "",
      estado_cama: "",
      detalle_motivo: "",
      id_establecimiento: esAdmin ? "todos" : null,
    });
    setTipoServicioId("");
    setOpcionesCamas([]);
  }, [esAdmin]);

  // 2. Define handleConfirmAnularCama DESPUÉS (o antes, si no tiene dependencias mutuas)
  const handleConfirmAnularCama = useCallback(
    async (idCama) => {
      hideDialog();
      setLoading(true);
      try {
        const response = await actualizarEstadoCamas(
          idCama,
          "anulado",
          "Anulación manual por usuario"
        );
        showSnackbar(
          response?.mensaje || "Cama anulada correctamente",
          "success"
        );
        obtenerCamas(idEstablecimientoSeleccionado);
      } catch (err) {
        console.error("Error al anular cama:", err);
        showSnackbar(err.message || "Error al anular cama.", "error");
      } finally {
        setLoading(false);
        setDialogState({
          open: false,
          title: "",
          message: "",
          onConfirm: () => {},
          textFieldValue: "", // Asegúrate de resetear el textFieldValue también al anular
          showTextField: false,
        });
      }
    },
    [hideDialog, showSnackbar, obtenerCamas, idEstablecimientoSeleccionado]
  );

  // 3. Define handleOpenCambiarEstadoDialog AHORA
  const handleOpenCambiarEstadoDialog = useCallback(
    (cama) => {
      const estadoActual = cama.estado;
      let nuevoEstado = "";
      let requiereMotivo = false;

      if (estadoActual === "operativa") {
        nuevoEstado = "inoperativa";
        requiereMotivo = true;
      } else if (estadoActual === "inoperativa") {
        nuevoEstado = "operativa";
      } else {
        showSnackbar(`Estado actual inválido ('${estadoActual}')`, "error");
        return;
      }

      let motivoTemporal = "";

      // Abrimos el diálogo y limpiamos textFieldValue siempre
      setDialogState({
        open: true,
        title: `Confirmar Cambio de Estado a '${nuevoEstado}'`,
        message: `¿Deseas cambiar el estado de la cama ${cama.nombre_cama} de '${estadoActual}' a '${nuevoEstado}'?`,
        confirmText: "Sí, cambiar",
        cancelText: "Cancelar",
        textFieldLabel: "Motivo de Inoperatividad",
        textFieldValue: "",
        showTextField: requiereMotivo,
        idToProcess: cama.id_cama,
        actionType: "changeState",
        onTextFieldChange: (e) => {
          motivoTemporal = e.target.value;
          setDialogState((prev) => ({
            ...prev,
            textFieldValue: motivoTemporal,
          }));
        },
        onConfirm: () => {
          const motivoFinal = motivoTemporal.trim(); // Ahora se usa directamente
          if (requiereMotivo && !motivoFinal) {
            showSnackbar(
              "El motivo es requerido para el estado inoperativa.",
              "warning"
            );
            return;
          }

          hideDialog();
          setLoading(true);
          actualizarEstadoCamas(cama.id_cama, nuevoEstado, motivoFinal || null)
            .then((response) => {
              showSnackbar(
                response?.mensaje ||
                  `Estado de cama actualizado a '${nuevoEstado}'`,
                "success"
              );
              obtenerCamas(idEstablecimientoSeleccionado);
            })
            .catch((err) => {
              console.error("Error al actualizar estado de cama:", err);
              showSnackbar(
                err.message || "Error al actualizar estado de cama.",
                "error"
              );
            })
            .finally(() => {
              setLoading(false);
              setDialogState({
                open: false,
                title: "",
                message: "",
                confirmText: "",
                cancelText: "",
                onConfirm: () => {},
                textFieldLabel: "",
                textFieldValue: "",
                onTextFieldChange: () => {},
                showTextField: false,
                idToProcess: null,
                actionType: null,
              });
            });
        },
      });
    },
    [
      showSnackbar,
      actualizarEstadoCamas,
      obtenerCamas,
      idEstablecimientoSeleccionado,
      hideDialog,
    ]
  );

  // 4. Define handleOpenAnularDialog AHORA
  const handleOpenAnularDialog = useCallback(
    (cama) => {
      setDialogState({
        open: true,
        title: "Confirmar Anulación de Cama",
        message: `¿Estás seguro que deseas anular la cama ${cama.nombre_cama}? Esta acción no se puede deshacer.`,
        confirmText: "Sí, anular",
        cancelText: "Cancelar",
        onConfirm: () => handleConfirmAnularCama(cama.id_cama),
        textFieldLabel: "",
        textFieldValue: "",
        onTextFieldChange: () => {},
        showTextField: false,
        idToProcess: cama.id_cama,
        actionType: "anular",
      });
    },
    [showSnackbar, handleConfirmAnularCama] // <--- ¡IMPORTANTE! Añade handleConfirmAnularCama a las dependencias
  );

  // Memoización del mapeo de tipos de servicio para la tabla

  const establecimientoMap = useMemo(() => {
    const map = {};
    establecimientos.forEach((e) => {
      map[e.id] = e.descripcion; // Asumiendo que 'descripcion' es el nombre del establecimiento
    });
    return map;
  }, [establecimientos]);
  return (
    <BaseFormLayout
      title="Gestión de Camas"
      snackbar={snackbar}
      dialog={dialog}
      loading={loading}
    >
      <Grid container spacing={3}>
        {/* Sección de Establecimiento (solo para admin) */}
        {esAdmin && (
          <Grid size={{ xs: 12 }}>
            <FormSection title="Filtro de Establecimiento">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="establecimiento-label">
                      Establecimiento
                    </InputLabel>
                    <Select
                      labelId="establecimiento-label"
                      value={idEstablecimientoSeleccionado}
                      label="Establecimiento"
                      onChange={handleEstablecimientoChange}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      {Array.isArray(establecimientos) &&
                        establecimientos.map((estab) => (
                          <MenuItem key={estab.id} value={estab.id}>
                            {estab.descripcion}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </FormSection>
          </Grid>
        )}

        {/* Sección de Registro de Cama */}
        <Grid size={{ xs: 12 }}>
          <FormSection title="Registrar Cama">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="tipo-servicio-label">
                    Tipo de Servicio
                  </InputLabel>
                  <Select
                    labelId="tipo-servicio-label"
                    value={tipoServicioId}
                    label="Tipo de Servicio"
                    onChange={handleTipoServicioChange}
                  >
                    <MenuItem value="">Seleccione</MenuItem>
                    {tipoServicioCama.map((servicio) => (
                      <MenuItem key={servicio.id} value={servicio.id}>
                        {servicio.descripcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small" disabled={!tipoServicioId}>
                  <InputLabel id="nombre-cama-label">Nombre Cama</InputLabel>
                  <Select
                    labelId="nombre-cama-label"
                    value={datosFormulario.nombre_cama}
                    label="Nombre Cama"
                    onChange={handleFormChange}
                    name="nombre_cama"
                  >
                    <MenuItem value="">Seleccione</MenuItem>
                    {opcionesCamas.map((opcion, index) => (
                      <MenuItem key={index} value={opcion}>
                        {opcion}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="estado-cama-label">Estado</InputLabel>
                  <Select
                    labelId="estado-cama-label"
                    value={datosFormulario.estado_cama}
                    label="Estado"
                    onChange={handleFormChange}
                    name="estado_cama"
                  >
                    <MenuItem value="">Seleccione</MenuItem>
                    <MenuItem value="operativa">Operativa</MenuItem>
                    <MenuItem value="inoperativa">Inoperativa</MenuItem>
                    <MenuItem value="anulaoa">Anulado</MenuItem>{" "}
                    {/* Podrías incluir "anulada" aquí o manejarla solo vía acción */}
                  </Select>
                </FormControl>
              </Grid>
              {datosFormulario.estado_cama === "inoperativa" && (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Motivo Inoperativa"
                    name="detalle_motivo"
                    value={datosFormulario.detalle_motivo}
                    onChange={handleFormChange}
                    multiline
                    rows={1}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGuardar}
                  disabled={loading}
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{ height: "40px" }} // Asegura la altura de 40px para consistencia
                >
                  {loading ? <CircularProgress size={24} /> : "Registrar Cama"}
                </Button>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={limpiarCampos}
                  fullWidth
                  startIcon={<ClearAllIcon />}
                  sx={{ height: "40px" }}
                >
                  Limpiar Campos
                </Button>
              </Grid>
            </Grid>
          </FormSection>
        </Grid>

        {/* Sección de Listado de Camas */}
        <Grid size={{ xs: 12 }}>
          <FormSection title="Listado de Camas">
            {loading && listaCamas.length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ textAlign: "center", p: 4 }}>
                {error}
              </Typography>
            ) : listaCamas.length === 0 ? (
              <Typography sx={{ textAlign: "center", p: 4 }}>
                No hay camas registradas o no se encontraron para el
                establecimiento.
              </Typography>
            ) : (
              <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                  width: "100%",
                  overflowX: "auto",
                  maxHeight: 450,
                  overflowY: "auto",
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 150 }}>
                        Tipo de Servicio
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Nombre Cama</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Estado</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        Motivo Inoperativa
                      </TableCell>
                      {esAdmin && (
                        <TableCell sx={{ minWidth: 150 }}>
                          Establecimiento
                        </TableCell>
                      )}
                      <TableCell sx={{ minWidth: 120 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listaCamas.map((cama) => (
                      <TableRow
                        key={cama.id_cama}
                        sx={{
                          "&:hover": {
                            backgroundColor: (theme) =>
                              theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell>{cama.tipo_servicio || "N/A"}</TableCell>
                        <TableCell>{cama.nombre_cama}</TableCell>
                        <TableCell>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: "bold",
                              color:
                                cama.estado === "operativa"
                                  ? "success.main"
                                  : cama.estado === "inoperativa"
                                  ? "warning.main"
                                  : "error.main",
                            }}
                          >
                            {cama.estado}
                          </Typography>
                        </TableCell>
                        <TableCell>{cama.detalle_motivo || "N/A"}</TableCell>
                        {esAdmin && (
                          <TableCell>
                            {establecimientoMap[cama.id_establecimiento] ||
                              cama.establecimiento ||
                              "N/A"}
                          </TableCell>
                        )}
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              color="info"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCambiarEstadoDialog(cama);
                              }}
                              disabled={loading}
                              title="Cambiar Estado"
                            >
                              <ChangeCircleIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAnularDialog(cama);
                              }}
                              disabled={loading}
                              title="Anular Cama"
                            >
                              <DeleteForeverIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </FormSection>
        </Grid>
      </Grid>

      {/* Diálogo Universal para Cambiar Estado / Anular */}
      <CustomDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={() => setDialogState({ ...dialogState, open: false })}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      >
        <Typography
          variant="body1"
          sx={{ mb: dialogState.showTextField ? 2 : 0 }}
        >
          {dialogState.message}
        </Typography>
        {dialogState.showTextField && (
          <TextField
            fullWidth
            size="small"
            label={dialogState.textFieldLabel}
            multiline
            rows={2}
            value={dialogState.textFieldValue}
            onChange={dialogState.onTextFieldChange}
            placeholder="Ingrese el motivo aquí"
            required
            error={
              !dialogState.textFieldValue.trim() &&
              dialogState.actionType === "changeState"
            }
            helperText={
              !dialogState.textFieldValue.trim() &&
              dialogState.actionType === "changeState"
                ? "Este campo es requerido."
                : ""
            }
          />
        )}
      </CustomDialog>
    </BaseFormLayout>
  );
};
