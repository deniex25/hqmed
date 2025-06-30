import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Grid,
} from "@mui/material";

// Componentes de @mui/x-date-pickers
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import FileDownloadTwoToneIcon from "@mui/icons-material/FileDownloadTwoTone";
import {
  PlayArrow as PlayArrowIcon, // Ejecutar / Registrar Operación
  Restore as RestoreIcon, // Reprogramar
  Cancel as CancelIcon, // Anular
  Pause as PauseIcon, // Suspender
  RestartAlt as RestartAltIcon, // Reabrir / Deshacer Anulación/Suspensión (si aplica)
} from "@mui/icons-material";

// Custom Components & Hooks
import { BaseFormLayout } from "../../features/layout/BaseFormLayout";
import { FormSection } from "../../features/layout/FormSection";
import { useAlerts } from "../../hooks/useAlerts";
import { CustomDialog } from "../../components/CustomDialog";

// Importa el nuevo componente de diálogo para reprogramar
import { ReprogramarDialog } from "../../components/ReprogramarDialog";

// Servicios API
import {
  obtenerReporteCirugias,
  actualizarEstadoCirugia,
  listarEstablecimientos,
} from "../../services/api";

// Helper para obtener la fecha en formato YYYY-MM-DD
const obtenerFecha = (dias) => {
  const fecha = dayjs().add(dias, "day");
  return fecha.format("YYYY-MM-DD");
};

export const ReporteCirugiasProgramadas = () => {
  const { snackbar, showSnackbar, dialog, showDialog, hideDialog } =
    useAlerts();

  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoHospFiltro, setEstadoHospFiltro] = useState("todos"); // Filtro por estado de programación
  const [servicioFiltro, setServicioFiltro] = useState("todos"); // Filtro por servicio (si aplica)
  const [fechaInicio, setFechaInicio] = useState(dayjs(obtenerFecha(-7)));
  const [fechaFin, setFechaFin] = useState(dayjs(obtenerFecha(0)));
  const [establecimientos, setEstablecimientos] = useState([]);
  const [idEstablecimiento, setIdEstablecimiento] = useState("todos");
  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const navigate = useNavigate();

  // Estados para el diálogo de Reprogramación
  const [isReprogramarDialogOpen, setIsReprogramarDialogOpen] = useState(false);
  const [selectedCirugiaReprogramar, setSelectedCirugiaReprogramar] =
    useState(null);

  // Estados para el diálogo de Suspender/Anular (usando CustomDialog)
  const [motivoDialog, setMotivoDialog] = useState({
    open: false,
    title: "",
    message: "",
    motivo: "",
    actionType: "", // 'suspender' o 'anular'
    idCirugia: null,
  });

  // Carga inicial de datos y establecimientos
  useEffect(() => {
    const cargarInicial = async () => {
      setLoading(true);
      try {
        const datosEstab = await listarEstablecimientos();
        setEstablecimientos(datosEstab.establecimientos || []);
        await cargarDatos(); // Carga inicial de datos de cirugías después de obtener establecimientos
      } catch (err) {
        console.error("Error en la carga inicial:", err);
        setError("Error al cargar datos iniciales.");
        showSnackbar("Error al cargar datos iniciales.", "error");
      } finally {
        setLoading(false);
      }
    };
    cargarInicial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para cargar los datos del reporte, con useCallback para optimización
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedFechaInicio = fechaInicio
        ? fechaInicio.format("YYYY-MM-DD")
        : "";
      const formattedFechaFin = fechaFin ? fechaFin.format("YYYY-MM-DD") : "";

      const datosCP = await obtenerReporteCirugias(
        estadoHospFiltro,
        servicioFiltro,
        formattedFechaInicio,
        formattedFechaFin,
        idEstablecimiento
      );
      setDatos(datosCP);
    } catch (err) {
      console.error("Error al obtener los datos del reporte:", err);
      setError("Error al obtener los datos del reporte.");
      showSnackbar("Error al obtener los datos del reporte.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    estadoHospFiltro,
    servicioFiltro,
    fechaInicio,
    fechaFin,
    idEstablecimiento,
    showSnackbar,
  ]);

  // useEffect para recargar datos cuando los filtros cambian (separado de la carga inicial)
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Función para exportar a EXCEL
  const exportarExcel = async () => {
    if (datos.length === 0) {
      showSnackbar("No hay datos para exportar.", "info");
      return;
    }

    const columnasOrdenadas = [
      "Fecha Programada",
      "Orden Turno",
      "Servicio",
      "Medico Cirujano",
      "Medico Anestesiologo",
      "Estado",
      "Paciente",
      "Observacion",
      "Establecimiento",
    ];

    const dataExport = datos.map((cirugias) => ({
      "Fecha Programada": cirugias.fecha_programada,
      "Orden Turno": cirugias.id_orden_turno,
      Servicio: cirugias.Descripcion_Servicio,
      "Medico Cirujano": cirugias.Personal_Cirujano,
      "Medico Anestesiologo": cirugias.Personal_Anestesiologo,
      Estado: cirugias.estado_programacion,
      Paciente: cirugias.Paciente,
      Observacion: cirugias.observacion,
      Establecimiento: cirugias.Establecimiento,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte Cirugía Programada");

    const titulo = `Reporte de Cirugías: ${fechaInicio.format(
      "YYYY-MM-DD"
    )} a ${fechaFin.format("YYYY-MM-DD")}`;
    worksheet.mergeCells("A1:I1");
    worksheet.getCell("A1").value = titulo;
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    const headerRow = worksheet.addRow(columnasOrdenadas);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "ADD8E6" },
      };
      cell.alignment = { horizontal: "center" };
    });

    dataExport.forEach((row) => {
      const rowData = columnasOrdenadas.map((col) => row[col]);
      const dataRow = worksheet.addRow(rowData);
      dataRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center" };
      });
    });

    worksheet.columns.forEach((col, index) => {
      const maxLength = Math.max(
        columnasOrdenadas[index].length,
        ...dataExport.map((row) =>
          row[columnasOrdenadas[index]]
            ? row[columnasOrdenadas[index]].toString().length
            : 0
        )
      );
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const nombreArchivo = `Reporte_Cirugia_Programada_${fechaInicio.format(
      "YYYY-MM-DD"
    )}_a_${fechaFin.format("YYYY-MM-DD")}.xlsx`;
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      nombreArchivo
    );
  };

  // =========================================================
  // Lógica para Registrar Operación
  // =========================================================
  const handleRegistrarOperacionClick = useCallback(
    (cirugiaData) => {
      if (!cirugiaData) {
        showSnackbar("Error: Datos de cirugía no disponibles.", "error");
        return;
      }

      const estado = cirugiaData.estado_programacion;

      if (estado === "ejecutado") {
        showSnackbar(
          "No es posible registrar una operación de una cirugía que ya ha sido atendida.",
          "warning"
        );
        return;
      }
      if (estado === "anulado") {
        showSnackbar("Esta cirugía ya ha sido anulada.", "warning");
        return;
      }
      if (estado === "suspendido") {
        showSnackbar("La cirugía está suspendida.", "warning");
        return;
      }

      if (estado === "programado" || estado === "reprogramado") {
        // Navegar a la página de registro de operación
        navigate("/dashboard/reporteOperatorio", {
          state: {
            idTipoDocPac: cirugiaData.id_tipo_doc,
            nroDocPac: cirugiaData.nro_doc_pac,
            // Puedes pasar más datos si son necesarios para la pantalla de reporteOperatorio
            idCirugiaProgramada: cirugiaData.id_cirugia_programada,
            fechaProgramada: cirugiaData.fecha_programada,
          },
        });
      }
    },
    [navigate, showSnackbar]
  );

  // =========================================================
  // Lógica para Reprogramar Cirugía (usa ReprogramarDialog)
  // =========================================================
  const handleReprogramarClick = useCallback(
    (cirugiaData) => {
      if (!cirugiaData) {
        showSnackbar("Error: Datos de cirugía no disponibles.", "error");
        return;
      }
      const estado = cirugiaData.estado_programacion;
      if (estado === "ejecutado") {
        showSnackbar(
          "No es posible reprogramar una cirugía que ya ha sido atendida.",
          "warning"
        );
        return;
      }
      if (estado === "anulado") {
        showSnackbar("Esta programación está anulada.", "warning");
        return;
      }
      if (estado === "suspendido") {
        showSnackbar(
          "No se puede reprogramar una cirugía suspendida.",
          "warning"
        );
        return;
      }

      if (estado === "programado" || estado === "reprogramado") {
        setSelectedCirugiaReprogramar({
          idCirugiaProgramada: cirugiaData.id_cirugia_programada,
          fechaProgramadaOriginal: cirugiaData.fecha_programada,
          // Puedes pasar otros datos si el ReprogramarDialog los necesita, como el ID del servicio, etc.
        });
        setIsReprogramarDialogOpen(true);
      }
    },
    [showSnackbar]
  );

  const handleSaveReprogramacion = async (reprogramacionData) => {
    // reprogramacionData contiene { fechaReprogramacion, idOrdenTurno }
    try {
      if (!selectedCirugiaReprogramar?.idCirugiaProgramada) {
        throw new Error("ID de cirugía no disponible para reprogramar.");
      }

      await actualizarEstadoCirugia(
        selectedCirugiaReprogramar.idCirugiaProgramada,
        "reprogramado",
        reprogramacionData.fechaReprogramacion,
        reprogramacionData.idOrdenTurno,
        null // No se requiere motivo para reprogramar
      );
      showSnackbar("Cirugía reprogramada correctamente.", "success");
      await cargarDatos(); // Refrescar los datos de la tabla
      setIsReprogramarDialogOpen(false); // Cerrar el diálogo
      // setFilaSeleccionada(null); // Ya no se usa para seleccionar acciones
    } catch (error) {
      console.error("Error al reprogramar la cirugía:", error);
      showSnackbar(
        "Error al reprogramar la cirugía: " +
          (error.message || "Error desconocido."),
        "error"
      );
      throw error; // Propaga el error para que ReprogramarDialog pueda manejar su estado de carga
    }
  };

  // =========================================================
  // Lógica para Suspender Cirugía (usa CustomDialog)
  // =========================================================
  const handleSuspenderClick = useCallback(
    (cirugiaData) => {
      if (!cirugiaData) {
        showSnackbar(
          "Error: Datos de cirugía no disponibles para suspender.",
          "error"
        );
        return;
      }
      const estado = cirugiaData.estado_programacion;
      if (estado === "ejecutado") {
        showSnackbar(
          "No se puede suspender una cirugía que ya ha sido atendida.",
          "warning"
        );
        return;
      }
      if (estado === "anulado") {
        showSnackbar(
          "No se puede suspender una programación que se encuentra anulada.",
          "warning"
        );
        return;
      }
      if (estado === "suspendido") {
        showSnackbar("La cirugía ya está suspendida.", "warning");
        return;
      }

      if (estado === "programado" || estado === "reprogramado") {
        setMotivoDialog({
          open: true,
          title: "Suspender Cirugía",
          message: "Ingrese el motivo de la suspensión de la cirugía.",
          motivo: "", // Limpiar motivo
          actionType: "suspender",
          idCirugia: cirugiaData.id_cirugia_programada,
        });
      }
    },
    [showSnackbar]
  );

  // =========================================================
  // Lógica para Anular Cirugía (usa CustomDialog)
  // =========================================================
  const handleAnularClick = useCallback(
    (cirugiaData) => {
      if (!cirugiaData) {
        showSnackbar(
          "Error: Datos de cirugía no disponibles para anular.",
          "error"
        );
        return;
      }
      const estado = cirugiaData.estado_programacion;
      if (estado === "ejecutado") {
        showSnackbar(
          "No se puede anular una cirugía que ya ha sido atendida.",
          "warning"
        );
        return;
      }
      if (estado === "anulado") {
        showSnackbar("Esta programación ya ha sido anulada.", "warning");
        return;
      }
      if (estado === "suspendido") {
        showSnackbar("No se puede anular una cirugía suspendida.", "warning");
        return;
      }

      if (estado === "programado" || estado === "reprogramado") {
        setMotivoDialog({
          open: true,
          title: "Anular Cirugía",
          message: "Ingrese el motivo de la anulación de la cirugía.",
          motivo: "", // Limpiar motivo
          actionType: "anular",
          idCirugia: cirugiaData.id_cirugia_programada,
        });
      }
    },
    [showSnackbar]
  );

  const handleMotivoDialogChange = (event) => {
    setMotivoDialog((prev) => ({ ...prev, motivo: event.target.value }));
  };

  const handleConfirmMotivo = async () => {
    if (!motivoDialog.motivo.trim()) {
      showSnackbar("Por favor, ingrese el motivo.", "error");
      return;
    }

    setLoading(true); // Activar carga global mientras se procesa la acción
    try {
      let estadoActualizar = "";
      if (motivoDialog.actionType === "suspender") {
        estadoActualizar = "suspendido";
      } else if (motivoDialog.actionType === "anular") {
        estadoActualizar = "anulado";
      }

      const respuesta = await actualizarEstadoCirugia(
        motivoDialog.idCirugia,
        estadoActualizar,
        null, // fecha (no aplica para suspender/anular)
        null, // idOrdenTurno (no aplica para suspender/anular)
        motivoDialog.motivo // motivo
      );

      if (respuesta) {
        showSnackbar(`Cirugía ${estadoActualizar} correctamente.`, "success");
        // setFilaSeleccionada(null); // Ya no es necesario deseleccionar
        await cargarDatos(); // Refrescar los datos de la tabla
      } else {
        showSnackbar(`Error al ${estadoActualizar} la cirugía.`, "error");
      }
    } catch (error) {
      console.error(
        `Error al procesar la acción '${motivoDialog.actionType}':`,
        error
      );
      showSnackbar(
        `Error al procesar la acción: ${error.message || "Desconocido"}`,
        "error"
      );
    } finally {
      setLoading(false); // Desactivar carga global
      setMotivoDialog((prev) => ({ ...prev, open: false })); // Cerrar diálogo
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BaseFormLayout
        title="Reporte de Cirugías Programadas"
        snackbar={snackbar}
        dialog={dialog}
        loading={loading}
      >
        <Grid container spacing={3}>
          {/* Sección de Filtros */}
          <Grid size={{ xs: 12 }}>
            <FormSection title="Filtros de Búsqueda">
              <Grid container spacing={2}>
                {esAdmin && (
                  <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="establecimiento-label">
                        Establecimiento
                      </InputLabel>
                      <Select
                        labelId="establecimiento-label"
                        id="establecimiento"
                        value={idEstablecimiento}
                        label="Establecimiento"
                        onChange={(e) => setIdEstablecimiento(e.target.value)}
                        disabled={!esAdmin}
                      >
                        <MenuItem value="todos">Todos</MenuItem>
                        {establecimientos.map((estab) => (
                          <MenuItem key={estab.id} value={estab.id}>
                            {estab.descripcion}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="estado-label">Estado</InputLabel>
                    <Select
                      labelId="estado-label"
                      id="estado"
                      value={estadoHospFiltro}
                      label="Estado"
                      onChange={(e) => setEstadoHospFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="programado">Programado</MenuItem>
                      <MenuItem value="reprogramado">Reprogramado</MenuItem>
                      <MenuItem value="ejecutado">Ejecutado</MenuItem>
                      <MenuItem value="suspendido">Suspendido</MenuItem>
                      <MenuItem value="anulado">Anulado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Si tienes una lista de servicios para filtrar */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="servicio-label">Servicio</InputLabel>
                    <Select
                      labelId="servicio-label"
                      id="servicio"
                      value={servicioFiltro}
                      label="Servicio"
                      onChange={(e) => setServicioFiltro(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="1">Medicina</MenuItem>
                      <MenuItem value="2">Cirugia</MenuItem>
                      <MenuItem value="3">Ginecologia</MenuItem>
                      <MenuItem value="4">Obstetricia-Partos</MenuItem>
                      <MenuItem value="5">ARNP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="Fecha de Inicio"
                    value={fechaInicio}
                    onChange={(newValue) => setFechaInicio(newValue)}
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="Fecha Fin"
                    value={fechaFin}
                    onChange={(newValue) => setFechaFin(newValue)}
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Grid>
          {/* Sección de Tabla de Resultados */}
          <Grid size={{ xs: 12 }}>
            <FormSection title="Resultados de Cirugías">
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" sx={{ textAlign: "center", p: 4 }}>
                  {error}
                </Typography>
              ) : datos.length === 0 ? (
                <Typography sx={{ textAlign: "center", p: 4 }}>
                  No se encontraron datos para los filtros seleccionados.
                </Typography>
              ) : (
                <>
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
                    <Table
                      stickyHeader
                      aria-label="reporte cirugias"
                      size="small"
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell>Fecha Programada</TableCell>
                          <TableCell>Orden Turno</TableCell>
                          <TableCell>Servicio</TableCell>
                          <TableCell>Médico Cirujano</TableCell>
                          <TableCell>Médico Anestesiólogo</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Paciente</TableCell>
                          <TableCell>Observación</TableCell>
                          <TableCell>Establecimiento</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datos.map((row) => (
                          <TableRow
                            key={row.id_cirugia_programada}
                            sx={{
                              "&:hover": {
                                backgroundColor: (theme) =>
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            <TableCell>{row.fecha_programada}</TableCell>
                            <TableCell>{row.id_orden_turno}</TableCell>
                            <TableCell>{row.Descripcion_Servicio}</TableCell>
                            <TableCell>{row.Personal_Cirujano}</TableCell>
                            <TableCell>{row.Personal_Anestesiologo}</TableCell>
                            <TableCell>{row.estado_programacion}</TableCell>
                            <TableCell>{row.Paciente}</TableCell>
                            <TableCell>{row.observacion}</TableCell>
                            <TableCell>{row.Establecimiento}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                {/* Botón Registrar Operación */}
                                {(row.estado_programacion === "programado" ||
                                  row.estado_programacion ===
                                    "reprogramado") && (
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Evita que se propague el evento de clic de la fila
                                      handleRegistrarOperacionClick(row);
                                    }}
                                    title="Registrar Operacion"
                                  >
                                    <PlayArrowIcon />
                                  </IconButton>
                                )}

                                {/* Botón Reprogramar */}
                                {(row.estado_programacion === "programado" ||
                                  row.estado_programacion ===
                                    "reprogramado") && (
                                  <IconButton
                                    color="info"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReprogramarClick(row);
                                    }}
                                    title="Reprogramar Cirugia"
                                  >
                                    <RestoreIcon />
                                  </IconButton>
                                )}

                                {/* Botón Suspender */}
                                {(row.estado_programacion === "programado" ||
                                  row.estado_programacion ===
                                    "reprogramado") && (
                                  <IconButton
                                    color="warning"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSuspenderClick(row);
                                    }}
                                    title="Suspender Cirugia"
                                  >
                                    <PauseIcon />
                                  </IconButton>
                                )}

                                {/* Botón Anular */}
                                {(row.estado_programacion === "programado" ||
                                  row.estado_programacion === "reprogramado" ||
                                  row.estado_programacion === "suspendido") && (
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAnularClick(row);
                                    }}
                                    title="Anular Registro"
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "center",
                      mt: 3,
                    }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FileDownloadTwoToneIcon />}
                      onClick={exportarExcel}
                      //sx={{ p: 1.5 }}
                    >
                      Exportar a Excel
                    </Button>
                  </Box>
                </>
              )}
            </FormSection>
          </Grid>
        </Grid>

        {/* =================================================== */}
        {/* Renderiza el componente ReprogramarDialog */}
        {/* =================================================== */}
        {isReprogramarDialogOpen && selectedCirugiaReprogramar && (
          <ReprogramarDialog
            open={isReprogramarDialogOpen}
            onClose={() => {
              setIsReprogramarDialogOpen(false);
              setSelectedCirugiaReprogramar(null); // Limpiar al cerrar
            }}
            onSave={handleSaveReprogramacion}
            showSnackbar={showSnackbar}
            initialData={selectedCirugiaReprogramar}
          />
        )}

        {/* =================================================== */}
        {/* Diálogo de Suspender/Anular (usa CustomDialog genérico) */}
        {/* =================================================== */}
        <CustomDialog
          open={motivoDialog.open}
          title={motivoDialog.title}
          onConfirm={handleConfirmMotivo}
          onCancel={() =>
            setMotivoDialog((prev) => ({ ...prev, open: false, motivo: "" }))
          } // Limpiar motivo al cancelar
          confirmText="Confirmar"
          cancelText="Cancelar"
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            {motivoDialog.message}
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="Motivo"
            multiline
            rows={4}
            value={motivoDialog.motivo}
            onChange={handleMotivoDialogChange}
            placeholder="Ingrese el motivo"
            sx={{ mt: 2 }}
            required
            error={!motivoDialog.motivo.trim() && motivoDialog.open}
            helperText={
              !motivoDialog.motivo.trim() && motivoDialog.open
                ? "El motivo es requerido."
                : ""
            }
          />
        </CustomDialog>
      </BaseFormLayout>
    </LocalizationProvider>
  );
};
