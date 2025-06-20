// src/features/hospi/hospReporte.jsx

import React, { useState, useEffect, useCallback } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Material-UI Components
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
} from "@mui/material";

// Componentes de @mui/x-date-pickers
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // Importar dayjs para manejar los estados de fecha/hora

// Importa el nuevo componente AltaDialog
import { AltaDialog } from "../../components/AltaDialog";

// Iconos
import FileDownloadTwoToneIcon from "@mui/icons-material/FileDownloadTwoTone";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

// Custom Components & Hooks
import { BaseFormLayout } from "../../features/layout/BaseFormLayout";
import { FormSection } from "../../features/layout/FormSection";
import { useAlerts } from "../../hooks/useAlerts";
import { CustomDialog } from "../../components/CustomDialog"; // Asegúrate de que esta ruta sea correcta para tu CustomDialog genérico

import {
  obtenerReporteHospi,
  actualizarEstadoHospitalizacion,
  listarEstablecimientos,
} from "../../services/api";

// Helper para obtener la fecha en formato YYYY-MM-DD
const obtenerFecha = (dias) => {
  const fecha = dayjs().add(dias, "day"); // Usar dayjs directamente
  return fecha.format("YYYY-MM-DD"); // Formato YYYY-MM-DD
};

export const ReporteHospi = () => {
  const { snackbar, showSnackbar, dialog, showDialog, hideDialog } =
    useAlerts();

  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadoHospFiltro, setEstadoHospFiltro] = useState("todos");
  const [servicioFiltro, setServicioFiltro] = useState("todos");
  // Usar dayjs para los estados de fecha con DatePicker/TimePicker
  const [fechaInicio, setFechaInicio] = useState(dayjs(obtenerFecha(-7)));
  const [fechaFin, setFechaFin] = useState(dayjs(obtenerFecha(0)));
  const [establecimientos, setEstablecimientos] = useState([]);
  const [idEstablecimientoFiltro, setIdEstablecimientoFiltro] =
    useState("todos");
  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  // Estados para el nuevo AltaDialog componente
  const [isAltaDialogOpen, setIsAltaDialogOpen] = useState(false);
  const [selectedHospitalizationData, setSelectedHospitalizationData] =
    useState(null);

  // Estado para el diálogo de Anulación (se mantiene aquí, ya que es más simple)
  const [anularDialog, setAnularDialog] = useState({
    open: false,
    motivoAnulacion: "",
  });

  // Obtener establecimientos al cargar
  useEffect(() => {
    const obtenerEstablecimientos = async () => {
      try {
        const datosEstab = await listarEstablecimientos();
        setEstablecimientos(datosEstab.establecimientos || []);
      } catch (error) {
        console.error("Error al obtener establecimientos:", error);
        showSnackbar("Error al obtener los establecimientos", "error");
      }
    };
    obtenerEstablecimientos();
  }, [showSnackbar]);

  // Consultar datos de reporte
  const consultarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Formatear los objetos dayjs a strings YYYY-MM-DD para la API
      const formattedFechaInicio = fechaInicio
        ? fechaInicio.format("YYYY-MM-DD")
        : "";
      const formattedFechaFin = fechaFin ? fechaFin.format("YYYY-MM-DD") : "";

      const datosHosp = await obtenerReporteHospi(
        estadoHospFiltro,
        servicioFiltro,
        formattedFechaInicio,
        formattedFechaFin,
        idEstablecimientoFiltro
      );
      setDatos(datosHosp);
    } catch (err) {
      console.error("Error al obtener los datos:", err);
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
    idEstablecimientoFiltro,
    showSnackbar,
  ]);

  // Consultar datos al cambiar filtros (o al montar por primera vez)
  useEffect(() => {
    consultarDatos();
  }, [consultarDatos]);

  // Función para exportar a EXCEL
  const exportarExcel = async () => {
    if (datos.length === 0) {
      showSnackbar("No hay datos para exportar.", "warning");
      return;
    }

    const columnasOrdenadas = [
      "Fecha Ingreso",
      "Servicio",
      "Hora Ingreso",
      "Fecha Alta",
      "Hora Alta",
      "Cama",
      "Tipo Doc",
      "Nro Doc",
      "Paciente",
      "Estado",
      "Codigo CIE Alta",
      "Diagnostico CIE Alta",
      "Establecimiento",
    ];

    const dataExport = datos.map((hospitalizaciones) => {
      const horaIngresoSinMilisegundos = hospitalizaciones.hora_ingreso
        ? hospitalizaciones.hora_ingreso.split(".")[0]
        : "";
      const horaAltaSinMilisegundos = hospitalizaciones.hora_alta
        ? hospitalizaciones.hora_alta.split(".")[0]
        : "";
      return {
        "Fecha Ingreso": hospitalizaciones.fecha_ingreso,
        Servicio: hospitalizaciones.Descripcion_Servicio,
        "Hora Ingreso": horaIngresoSinMilisegundos,
        "Fecha Alta": hospitalizaciones.fecha_alta,
        "Hora Alta": horaAltaSinMilisegundos,
        Cama: hospitalizaciones.nombre_cama,
        "Tipo Doc": hospitalizaciones.Abrev_Tipo_Doc,
        "Nro Doc": hospitalizaciones.nro_doc_pac,
        Paciente: hospitalizaciones.Paciente,
        Estado: hospitalizaciones.estado_hosp,
        "Codigo CIE Alta": hospitalizaciones.codigo_cie_alta,
        "Diagnostico CIE Alta": hospitalizaciones.descripcion_cie_alta,
        Establecimiento: hospitalizaciones.Establecimiento,
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte Hospitalizaciones");

    // Usa .format() de dayjs para las fechas en el título
    const titulo = `Reporte de Hospitalizaciones: ${fechaInicio.format(
      "YYYY-MM-DD"
    )} a ${fechaFin.format("YYYY-MM-DD")}`;
    worksheet.mergeCells("A1:M1");
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
    // Usa .format() de dayjs para las fechas en el nombre del archivo
    const nombreArchivo = `Reporte_Hospitalizaciones_${fechaInicio.format(
      "YYYY-MM-DD"
    )}_a_${fechaFin.format("YYYY-MM-DD")}.xlsx`;
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      nombreArchivo
    );
  };

  // Manejadores de cambios de filtro
  const handleEstadoHospChange = (event) =>
    setEstadoHospFiltro(event.target.value);
  const handleServicioChange = (event) => setServicioFiltro(event.target.value);
  const handleIdEstablecimientoChange = (event) =>
    setIdEstablecimientoFiltro(event.target.value);
  // Los manejadores de fecha y hora ahora esperan objetos dayjs
  const handleFechaInicioChange = (date) => setFechaInicio(date);
  const handleFechaFinChange = (date) => setFechaFin(date);

  // =========================================================
  // Lógica del Nuevo Diálogo de Alta (usando AltaDialog)
  // =========================================================

  const handleOpenAltaDialog = (hospitalizationData) => {
    // <-- Recibe los datos directamente
    if (!hospitalizationData) {
      // Esto no debería ocurrir si se llama desde el botón de la fila
      showSnackbar("Error: Datos de hospitalización no disponibles.", "error");
      return;
    }

    if (hospitalizationData.estado_hosp === "alta") {
      showSnackbar("El paciente ya ha sido dado de alta.", "warning");
      return;
    }
    if (hospitalizationData.estado_hosp === "anulado") {
      showSnackbar("El registro está anulado.", "warning");
      return;
    }

    if (hospitalizationData.estado_hosp === "hospitalizado") {
      setSelectedHospitalizationData({
        id: hospitalizationData.id_hospitalizacion, // ID esencial para la operación
        // Si AltaDialog necesita pre-llenar campos de una hosp. existente, pásalos aquí:
        tipoAlta: hospitalizationData.tipo_alta || "alta medica", // Asegúrate que estas props existan en tu objeto de datos si las vas a usar.
        fechaAlta: hospitalizationData.fecha_alta, // Pasa como string, AltaDialog lo convierte a dayjs
        horaAlta: hospitalizationData.hora_alta, // Pasa como string, AltaDialog lo convierte a dayjs
        codigoCIEAlta: hospitalizationData.codigo_cie_alta,
        descripcionCIEAlta: hospitalizationData.descripcion_cie_alta,
        // Cualquier otra data que AltaDialog necesite para editar
      });
      setIsAltaDialogOpen(true);
    }
  };

  const handleCloseAltaDialog = () => {
    setIsAltaDialogOpen(false);
    setSelectedHospitalizationData(null); // Limpiar datos seleccionados
  };

  const handleSaveAlta = async (altaData) => {
    // altaData contiene { tipoAlta, fechaAlta, horaAlta, codigoCIEAlta, descripcionCIEAlta }
    // que viene del AltaDialog
    try {
      await actualizarEstadoHospitalizacion(
        selectedHospitalizationData.id, // Usa el ID de la hospitalización que abrio el diálogo
        "alta",
        altaData.tipoAlta,
        altaData.fechaAlta, // Ya viene formateado como string "YYYY-MM-DD"
        altaData.horaAlta, // Ya viene formateado como string "HH:mm:ss"
        altaData.codigoCIEAlta,
        altaData.descripcionCIEAlta
      );
      showSnackbar("Hospitalización dada de alta correctamente.", "success");
      await consultarDatos(); // Refrescar los datos de la tabla
      handleCloseAltaDialog(); // Cerrar el diálogo
    } catch (error) {
      console.error("Error al dar de alta la hospitalización:", error);
      showSnackbar(
        "Error al dar de alta la hospitalización: " +
          (error.message || "Error desconocido."),
        "error"
      );
      throw error; // Lanza el error para que AltaDialog pueda manejar su estado de carga
    }
  };

  // =========================================================
  // Lógica del Diálogo de Anulación
  // =========================================================

  const handleOpenAnularDialog = (hospitalizationData) => {
    // <-- Recibe los datos directamente
    if (!hospitalizationData) {
      showSnackbar(
        "Error: Datos de hospitalización no disponibles para anular.",
        "error"
      );
      return;
    }

    if (hospitalizationData.estado_hosp === "alta") {
      showSnackbar(
        "No se puede anular una hospitalización dada de alta.",
        "warning"
      );
      return;
    }
    if (hospitalizationData.estado_hosp === "anulado") {
      showSnackbar("Esta hospitalización ya ha sido anulada.", "warning");
      return;
    }

    if (hospitalizationData.estado_hosp === "hospitalizado") {
      // Asegúrate de almacenar el ID de la hospitalización que se va a anular
      // Puedes usar setSelectedHospitalizationData para esto, o un estado separado si lo prefieres
      setSelectedHospitalizationData({
        id: hospitalizationData.id_hospitalizacion,
      }); // Almacena solo el ID para anular
      setAnularDialog({
        open: true,
        motivoAnulacion: "",
      });
    }
  };

  const handleCloseAnularDialog = () => {
    setAnularDialog((prev) => ({ ...prev, open: false }));
  };

  const handleAnularDialogChange = (event) => {
    setAnularDialog((prev) => ({
      ...prev,
      motivoAnulacion: event.target.value,
    }));
  };

  const handleConfirmAnular = async () => {
    if (!anularDialog.motivoAnulacion.trim()) {
      showSnackbar("Por favor, ingrese el motivo de anulación.", "error");
      return;
    }

    const idToAnnull = selectedHospitalizationData?.id;
    if (!idToAnnull) {
      showSnackbar(
        "Error: No se ha seleccionado una hospitalización para anular.",
        "error"
      );
      return;
    }

    showDialog({
      open: true,
      title: "¿Confirmar Anulación?",
      message: "¿Está seguro de que desea anular esta hospitalización?",
      onConfirm: async () => {
        hideDialog();
        try {
          await actualizarEstadoHospitalizacion(
            idToAnnull,
            "anulado",
            null, // tipoAlta
            null, // fechaAlta
            null, // horaAlta
            null, // codigoCIEAlta
            anularDialog.motivoAnulacion // motivoAnulacion
          );
          showSnackbar("Hospitalización anulada correctamente.", "success");
          await consultarDatos();
          handleCloseAnularDialog();
        } catch (error) {
          console.error("Error al anular la hospitalización:", error);
          showSnackbar(
            "Error al anular la hospitalización: " +
              (error.message || "Error desconocido."),
            "error"
          );
        }
      },
      onCancel: hideDialog,
    });
  };

  return (
    // LocalizationProvider debe envolver a todos los DatePicker/TimePicker
    // Nota: El LocalizationProvider en AltaDialog también es válido, pero tenerlo aquí
    // asegura que cualquier componente de fecha/hora en este archivo o sus descendientes
    // (si no tienen su propio LocalizationProvider) funcionará correctamente.
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BaseFormLayout
        title="Reporte de Hospitalización"
        snackbar={snackbar}
        dialog={dialog}
        loading={loading}
      >
        <Grid container spacing={3}>
          {/* Sección de Filtros */}
          <Grid size={{ xs: 12 }}>
            <FormSection title="Filtros de Reporte">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="establecimiento-label">
                      Establecimiento
                    </InputLabel>
                    <Select
                      labelId="establecimiento-label"
                      value={idEstablecimientoFiltro}
                      label="Establecimiento"
                      onChange={handleIdEstablecimientoChange}
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
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="estado-hosp-label">Estado</InputLabel>
                    <Select
                      labelId="estado-hosp-label"
                      value={estadoHospFiltro}
                      label="Estado"
                      onChange={handleEstadoHospChange}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="hospitalizado">Hospitalizado</MenuItem>
                      <MenuItem value="alta">Alta</MenuItem>
                      <MenuItem value="anulado">Anulado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="servicio-label">Servicio</InputLabel>
                    <Select
                      labelId="servicio-label"
                      value={servicioFiltro}
                      label="Servicio"
                      onChange={handleServicioChange}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value="1">Medicina</MenuItem>
                      <MenuItem value="2">
                        Cirugia
                      </MenuItem>
                      <MenuItem value="3">Ginecologia</MenuItem>
                      <MenuItem value="4">Obstetricia-Partos</MenuItem>
                      <MenuItem value="5">ARNP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  {/* DatePicker para Fecha Inicio */}
                  <DatePicker
                    label="Fecha Inicio"
                    value={fechaInicio}
                    onChange={handleFechaInicioChange}
                    format="DD/MM/YYYY" // Formato de visualización
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  {/* DatePicker para Fecha Fin */}
                  <DatePicker
                    label="Fecha Fin"
                    value={fechaFin}
                    onChange={handleFechaFinChange}
                    format="DD/MM/YYYY"
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
            <FormSection title="Resultados de Hospitalizaciones">
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
                    sx={{
                      width: "100%", // Asegura que ocupe todo el ancho disponible
                      overflowX: "auto", // ¡Esto es lo que añade el scroll horizontal!
                      maxHeight: 450, // Opcional: añade un scroll vertical si la tabla es muy larga
                      overflowY: "auto", // Habilita el scroll vertical si maxHeight se excede
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Paciente</TableCell>
                          <TableCell>Nro. Doc.</TableCell>
                          <TableCell>Fecha Ingreso</TableCell>
                          <TableCell>Hora Ingreso</TableCell>
                          <TableCell>Cama</TableCell>
                          <TableCell>Servicio</TableCell>
                          <TableCell>Establecimiento</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Fecha Alta</TableCell>
                          <TableCell>Hora Alta</TableCell>
                          <TableCell>CIE Alta</TableCell>
                          <TableCell>Motivo Anulación</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datos.map((row) => (
                          <TableRow
                            key={row.id_hospitalizacion}
                            sx={{
                              "&:hover": {
                                cursor: "pointer",
                                backgroundColor: "#f5f5f5",
                              },
                            }}
                          >
                            <TableCell>{row.Paciente}</TableCell>
                            <TableCell>{row.nro_doc_pac}</TableCell>
                            <TableCell>{row.fecha_ingreso}</TableCell>
                            <TableCell>
                              {row.hora_ingreso
                                ? row.hora_ingreso.split(".")[0]
                                : ""}
                            </TableCell>
                            <TableCell>{row.nombre_cama}</TableCell>
                            <TableCell>{row.Descripcion_Servicio}</TableCell>
                            <TableCell>{row.Establecimiento}</TableCell>
                            <TableCell>{row.estado_hosp}</TableCell>
                            <TableCell>{row.fecha_alta || "-"}</TableCell>
                            <TableCell>
                              {row.hora_alta
                                ? row.hora_alta.split(".")[0]
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {row.codigo_cie_alta
                                ? `${row.codigo_cie_alta} - ${row.descripcion_cie_alta}`
                                : "-"}
                            </TableCell>
                            <TableCell>{row.motivo_anulacion || "-"}</TableCell>
                            <TableCell>
                              {row.estado_hosp === "hospitalizado" && (
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <IconButton
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAltaDialog(row); // Abre el nuevo AltaDialog
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAnularDialog(row);
                                    }}
                                  >
                                    <CancelIcon />
                                  </IconButton>
                                </Box>
                              )}
                              {(row.estado_hosp === "alta" ||
                                row.estado_hosp === "anulado") && (
                                <IconButton
                                  color="info"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showSnackbar(
                                      "Funcionalidad de reabrir no implementada",
                                      "info"
                                    );
                                  }}
                                >
                                  <RestartAltIcon />
                                </IconButton>
                              )}
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
        {/* Renderiza el nuevo componente AltaDialog CONDICIONALMENTE */}
        {/* =================================================== */}
        {isAltaDialogOpen &&
          selectedHospitalizationData && ( // <-- ¡CLAVE! Renderiza solo si ambos son true
            <AltaDialog
              open={isAltaDialogOpen}
              onClose={handleCloseAltaDialog}
              onSave={handleSaveAlta}
              showSnackbar={showSnackbar}
              initialData={selectedHospitalizationData}
            />
          )}

        {/* =================================================== */}
        {/* Diálogo de Anulación (usa CustomDialog genérico) */}
        {/* =================================================== */}
        <CustomDialog
          open={anularDialog.open}
          title="Anular Hospitalización"
          onConfirm={handleConfirmAnular}
          onCancel={handleCloseAnularDialog}
          confirmText="Confirmar"
          cancelText="Cancelar"
        >
          {/* El contenido del diálogo de anulación va aquí directamente */}
          <TextField
            fullWidth
            size="small"
            label="Motivo de Anulación"
            multiline
            rows={4}
            value={anularDialog.motivoAnulacion}
            onChange={handleAnularDialogChange}
            placeholder="Ingrese el motivo de anulación"
            required
            error={!anularDialog.motivoAnulacion.trim() && anularDialog.open} // Solo muestra error cuando está abierto y vacío
            helperText={
              !anularDialog.motivoAnulacion.trim() && anularDialog.open
                ? "El motivo de anulación es requerido."
                : ""
            }
          />
        </CustomDialog>
      </BaseFormLayout>
    </LocalizationProvider>
  );
};
