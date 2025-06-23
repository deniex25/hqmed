import { useState, useEffect, useCallback, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider, // Para una mejor separación visual
  Chip, // Para representar los turnos o eventos en el calendario
} from "@mui/material";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";
import { useAlerts } from "../../hooks/useAlerts"; // Importar useAlerts
import FileDownloadTwoToneIcon from "@mui/icons-material/FileDownloadTwoTone";
import KeyboardDoubleArrowLeftTwoToneIcon from "@mui/icons-material/KeyboardDoubleArrowLeftTwoTone";
import KeyboardDoubleArrowRightTwoToneIcon from "@mui/icons-material/KeyboardDoubleArrowRightTwoTone";
import {
  obtenerDatosSemana,
  listarEstablecimientos,
  listarTipoServicio, // Asumo que necesitas esta API para los servicios
} from "../../services/api"; // Asegúrate de que estas rutas sean correctas

// Configura dayjs globalmente si no lo has hecho en otro lugar
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

const turnos = ["1", "2", "3", "4"]; // Turnos definidos

export const CirugiaCalendario = () => {
  const { snackbar, showSnackbar, dialog } = useAlerts(); // Usar useAlerts

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [semana, setSemana] = useState([]);
  const [datosCalendario, setDatosCalendario] = useState({}); // Datos de la API
  const [offsetSemana, setOffsetSemana] = useState(0);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [servicioFiltro, setServicioFiltro] = useState("todos"); // Nuevo estado para tipos de servicio
  const [idEstablecimientoSeleccionado, setIdEstablecimientoSeleccionado] =
    useState("todos"); // Cambiado a "todos" como valor por defecto, y renombrado

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  // Carga inicial de establecimientos y tipos de servicio
  const cargarCatalogos = useCallback(async () => {
    setLoading(true);
    try {
      if (esAdmin) {
        const estabs = await listarEstablecimientos();
        setEstablecimientos(estabs.establecimientos || []);
      }
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
      setError("Error al cargar establecimientos o servicios.");
      showSnackbar("Error al cargar los filtros iniciales.", "error");
    } finally {
      setLoading(false);
    }
  }, [esAdmin, showSnackbar]);

  // Genera la semana basado en el offset
  const generarSemana = useCallback((offset = 0) => {
    const hoy = dayjs();
    const lunes = hoy.add(offset, "week").startOf("week"); // Empieza la semana en Lunes
    const nuevaSemana = [];

    for (let i = 0; i < 7; i++) {
      // 7 días de la semana (Lunes a Domingo)
      const dia = lunes.add(i, "day");
      nuevaSemana.push({
        fecha: dia.format("YYYY-MM-DD"),
        label: dia.format("dddd"), // Nombre completo del día
        diaMes: dia.format("DD/MM"), // Día y Mes
        mes: dia.format("MMMM"), // Nombre del mes
        diaCompleto: dia, // Guardar el objeto dayjs para referencia futura
      });
    }
    setSemana(nuevaSemana);
  }, []);

  // Carga los datos del calendario para la semana actual
  const cargarDatosCalendario = useCallback(async () => {
    if (semana.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const fechaInicio = semana[0].fecha;
      const fechaFin = semana[6].fecha; // Ahora son 7 días, así que el último día es el índice 6

      const data = await obtenerDatosSemana(
        servicioFiltro,
        fechaInicio,
        fechaFin,
        idEstablecimientoSeleccionado
      );

      // La API debe devolver un objeto donde las claves sean las fechas y los valores sean objetos con turnos
      // Ejemplo: { '2023-10-26': { '1': [...], '2': [...] }, '2023-10-27': { ... } }
      if (typeof data === "object" && data !== null) {
        setDatosCalendario(data);
        showSnackbar("Datos del calendario cargados.", "success");
        if (
          Object.keys(data).length === 0 ||
          Object.values(data).every((day) => Object.keys(day).length === 0)
        ) {
          showSnackbar(
            "No se encontraron programaciones para la semana seleccionada.",
            "info"
          );
        }
      } else {
        setDatosCalendario({});
        showSnackbar("El formato de datos recibido no es válido.", "warning");
      }
    } catch (err) {
      console.error("Error al cargar datos del calendario:", err);
      setError("Error al cargar datos del calendario. Intente de nuevo.");
      showSnackbar("Error al cargar datos del calendario.", "error");
    } finally {
      setLoading(false);
    }
  }, [semana, servicioFiltro, idEstablecimientoSeleccionado, showSnackbar]);

  // Efectos para cargar datos y semana
  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    generarSemana(offsetSemana);
  }, [offsetSemana, generarSemana]); // Se regenera semana si cambia el offset

  useEffect(() => {
    cargarDatosCalendario();
  }, [
    semana,
    servicioFiltro,
    idEstablecimientoSeleccionado,
    cargarDatosCalendario,
  ]); // Se recargan datos si cambian filtros o semana

  // Manejadores de cambios
  const handleEstablecimientoChange = useCallback((event) => {
    setIdEstablecimientoSeleccionado(event.target.value);
  }, []);

  const handleServicioChange = useCallback((event) => {
    setServicioFiltro(event.target.value);
  }, []);

  const moverSemana = useCallback((direccion) => {
    setOffsetSemana((prev) => prev + direccion);
  }, []);

  const irAlaSemanaActual = useCallback(() => {
    setOffsetSemana(0);
  }, []);

  // Mapeo para nombres de establecimientos y servicios para la UI y Excel
  const establecimientoMap = useMemo(() => {
    const map = {};
    establecimientos.forEach((e) => {
      map[e.id] = e.descripcion;
    });
    return map;
  }, [establecimientos]);

  // Función para renderizar el contenido de cada celda del calendario
  const obtenerContenido = useCallback(
    (fecha, turno) => {
      const items = datosCalendario[fecha]?.[String(turno)] || [];

      if (items.length === 0) {
        return (
          <Typography variant="caption" color="text.secondary">
            No hay programaciones
          </Typography>
        );
      }

      return (
        <Box
          sx={{ display: "flex", flexDirection: "column", gap: 0.5, p: 0.5 }}
        >
          {items.map((item, idx) => (
            <Chip
              key={idx}
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    {item.procedimiento_quirurgico}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.Paciente}
                  </Typography>
                </Box>
              }
              sx={{
                height: "auto",
                "& .MuiChip-label": {
                  whiteSpace: "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  py: 0.5,
                },
                backgroundColor: "#e3f2fd", // light blue
                color: "#1a237e", // dark blue
              }}
            />
          ))}
        </Box>
      );
    },
    [datosCalendario]
  );

  // Lógica de exportación a EXCEL
  const exportarExcel = async () => {
    if (
      !datosCalendario ||
      Object.keys(datosCalendario).length === 0 ||
      Object.values(datosCalendario).every(
        (day) => Object.keys(day).length === 0
      )
    ) {
      showSnackbar("No hay datos para exportar.", "info");
      return;
    }

    setLoading(true);
    try {
      const dataExport = [];

      semana.forEach((dia) => {
        const fecha = dia.fecha;
        const turnosDia = datosCalendario[fecha] || {};

        turnos.forEach((turno) => {
          const items = turnosDia[turno] || [];
          items.forEach((item) => {
            dataExport.push({
              Fecha: fecha,
              Turno: turno,
              Servicio:
                servicioMap[item.id_servicio] ||
                item.Descripcion_Servicio ||
                "N/A",
              Procedimiento: item.procedimiento_quirurgico || "N/A",
              Paciente: item.Paciente || "N/A",
              Establecimiento:
                establecimientoMap[item.id_establecimiento] ||
                item.Nombre_Establecimiento ||
                "N/A",
            });
          });
        });
      });

      if (dataExport.length === 0) {
        showSnackbar(
          "No hay registros para exportar después de filtrar.",
          "info"
        );
        setLoading(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cirugías Programadas");

      const columnasOrdenadas = [
        "Fecha",
        "Turno",
        "Servicio",
        "Procedimiento",
        "Paciente",
        "Establecimiento",
      ];

      // Título fusionado
      const titulo = `Reporte Semanal de Cirugías Programadas: ${semana[0]?.diaCompleto.format(
        "DD/MM/YYYY"
      )} - ${semana[6]?.diaCompleto.format("DD/MM/YYYY")}`;
      worksheet.mergeCells(
        `A1:${String.fromCharCode(64 + columnasOrdenadas.length)}1`
      );
      worksheet.getCell("A1").value = titulo;
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A1").alignment = { horizontal: "center" };
      worksheet.getRow(1).height = 30; // Aumentar altura de la fila del título

      // Encabezados
      const headerRow = worksheet.addRow(columnasOrdenadas);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4CAF50" }, // Verde Material-UI
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Datos
      dataExport.forEach((row) => {
        const dataRow = worksheet.addRow(
          columnasOrdenadas.map((col) => row[col])
        );
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: "left", vertical: "top" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        const headerText = columnasOrdenadas[index] || "";
        let maxLength = headerText.length;

        dataExport.forEach((row) => {
          const cellValue = row[headerText];
          if (cellValue) {
            const cellLength = cellValue.toString().length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });
        column.width = Math.max(maxLength + 2, 15); // Añadir padding y mínimo de 15
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const nombreArchivo = `Reporte_Cirugias_Programadas_${semana[0]?.diaCompleto.format(
        "YYYYMMDD"
      )}_a_${semana[6]?.diaCompleto.format("YYYYMMDD")}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        nombreArchivo
      );
      showSnackbar("Reporte exportado a Excel exitosamente.", "success");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      showSnackbar("Error al exportar el reporte a Excel.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseFormLayout
      title="Monitoreo Semanal de Cirugías Programadas"
      snackbar={snackbar}
      dialog={dialog}
      loading={loading}
    >
      <Grid container spacing={3}>
        {/* Sección de Filtros y Acciones */}
        <Grid size={{ xs: 12 }}>
          <FormSection title="Filtros y Acciones">
            <Grid container spacing={2} alignItems="flex-end">
              {/* Filtro de Servicio */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="servicio-label">Tipo Servicio</InputLabel>
                  <Select
                    labelId="servicio-label"
                    value={servicioFiltro}
                    label="Tipo Servicio"
                    onChange={handleServicioChange}
                    disabled={loading}
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

              {/* Filtro de Establecimiento (solo para admin) */}
              {esAdmin && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              )}

              {/* Botón Exportar a Excel */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadTwoToneIcon />}
                  onClick={exportarExcel}
                  disabled={
                    loading || Object.keys(datosCalendario).length === 0
                  }
                  fullWidth
                >
                  Exportar a Excel
                </Button>
              </Grid>
            </Grid>
          </FormSection>
        </Grid>

        {/* Sección del Calendario */}
        <Grid size={{ xs: 12 }}>
          <FormSection title="Programación Semanal">
            {loading && Object.keys(datosCalendario).length === 0 ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ textAlign: "center", p: 4 }}>
                {error}
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={3}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          backgroundColor: "action.hover",
                        }}
                      >
                        Turno
                      </TableCell>
                      {semana.map((dia) => (
                        <TableCell
                          key={dia.fecha}
                          sx={{
                            fontWeight: "bold",
                            backgroundColor: "primary.light",
                            color: "primary.contrastText",
                            textAlign: "center",
                            minWidth: 150, // Ancho mínimo para las celdas de día
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{ textTransform: "capitalize" }}
                          >
                            {dia.label}
                          </Typography>
                          <Typography variant="body2">{dia.diaMes}</Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {turnos.map((turno) => (
                      <TableRow key={turno}>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            backgroundColor: "action.hover",
                          }}
                        >
                          {turno}
                        </TableCell>
                        {semana.map((dia) => (
                          <TableCell
                            key={`${dia.fecha}-${turno}`}
                            sx={{
                              verticalAlign: "top",
                              minHeight: 120, // Altura mínima para las celdas de contenido
                              backgroundColor: "background.paper",
                            }}
                          >
                            {obtenerContenido(dia.fecha, turno)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {/* Controles de Navegación Semanal */}
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="h6" component="p" color="text.primary">
                {semana[0]?.diaCompleto.format("DD/MM/YYYY")} -{" "}
                {semana[6]?.diaCompleto.format("DD/MM/YYYY")}
              </Typography>
            </Box>
            <Grid
              container
              spacing={2}
              justifyContent="center"
              alignItems="center"
            >
              <Grid>
                <Button
                  variant="outlined"
                  onClick={() => moverSemana(-1)}
                  startIcon={<KeyboardDoubleArrowLeftTwoToneIcon />}
                  disabled={loading}
                >
                  Semana Anterior
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="outlined"
                  onClick={irAlaSemanaActual}
                  disabled={loading}
                >
                  Semana Actual
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="outlined"
                  onClick={() => moverSemana(1)}
                  endIcon={<KeyboardDoubleArrowRightTwoToneIcon />}
                  disabled={loading}
                >
                  Semana Siguiente
                </Button>
              </Grid>
            </Grid>
          </FormSection>
        </Grid>
      </Grid>
    </BaseFormLayout>
  );
};
