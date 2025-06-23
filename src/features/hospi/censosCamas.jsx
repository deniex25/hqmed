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
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";

// Componentes de @mui/x-date-pickers
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { BaseFormLayout } from "../layout/BaseFormLayout";
import { FormSection } from "../layout/FormSection";
import { useAlerts } from "../../hooks/useAlerts";
// Iconos
import FileDownloadTwoToneIcon from "@mui/icons-material/FileDownloadTwoTone";

import {
  listarEstablecimientos,
  obtenerReporteCensos,
} from "../../services/api";

const oPrimerDiaDelMes = () => dayjs().startOf("month");
const oUltimoDiaDelMes = () => dayjs().endOf("month");

export const CensosCamas = () => {
  const { snackbar, showSnackbar, dialog } = useAlerts();
  const [datosCensoCamas, setDatosCensoCamas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [servicioFiltro, setServicioFiltro] = useState("todos");
  const [fechaInicio, setFechaInicio] = useState(oPrimerDiaDelMes());
  const [fechaFin, setFechaFin] = useState(oUltimoDiaDelMes());
  const [establecimientos, setEstablecimientos] = useState([]);
  const [idEstablecimientoFiltro, setIdEstablecimientoFiltro] =
    useState("todos");

  const rol = sessionStorage.getItem("id_tipo_usuario");
  const esAdmin = parseInt(rol) === 1;

  const handleFechaInicioChange = (date) => setFechaInicio(date);
  const handleFechaFinChange = (date) => setFechaFin(date);

  const cargarEstablecimientos = useCallback(async () => {
    if (esAdmin) {
      try {
        const datosEstab = await listarEstablecimientos();
        setEstablecimientos(datosEstab.establecimientos || []);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setError(
          "Error al cargar datos iniciales. Por favor, intente de nuevo."
        );
        showSnackbar("Error al cargar datos iniciales.", "error");
      }
    }
  }, [esAdmin, showSnackbar]);

  const consultarCensos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const formattedFechaInicio = fechaInicio
        ? fechaInicio.format("YYYY-MM-DD")
        : null;
      const formattedFechaFin = fechaFin ? fechaFin.format("YYYY-MM-DD") : null;

      const data = await obtenerReporteCensos(
        servicioFiltro,
        formattedFechaInicio,
        formattedFechaFin,
        idEstablecimientoFiltro
      );
      setDatosCensoCamas(data);
    } catch (err) {
      console.error("Error al cargar censos camas:", err);
      setError("No se pudo cargar la lista de censos camas.");
      showSnackbar("Error al cargar la lista de censos camas.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    servicioFiltro,
    fechaInicio,
    fechaFin,
    idEstablecimientoFiltro,
    showSnackbar,
  ]);

  useEffect(() => {
    cargarEstablecimientos();
  }, [cargarEstablecimientos]);

  useEffect(() => {
    consultarCensos();
  }, [consultarCensos]);

  const handleEstablecimientoChange = useCallback((event) => {
    setIdEstablecimientoFiltro(event.target.value);
  }, []);

  const handleServicioChange = useCallback((event) => {
    setServicioFiltro(event.target.value);
  }, []);

  // Memoización del mapeo de tipos de servicio para la tabla
  const establecimientoMap = useMemo(() => {
    const map = {};
    establecimientos.forEach((e) => {
      map[e.id] = e.descripcion; // Asumiendo que 'descripcion' es el nombre del establecimiento
    });
    return map;
  }, [establecimientos]);

  // Lógica de exportación a Excel adaptada de tu ReporteCamas.jsx
  const exportarExcel = async () => {
    if (datosCensoCamas.length === 0) {
      showSnackbar("No hay datos para exportar.", "info");
      return;
    }

    setLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Reporte Censos");

      // **1️⃣ Definir el orden de las columnas**
      const columnasOrdenadas = [
        "Fecha Censo", // A
        "Servicio", // B
        "Establecimiento", // C
        "Camas Desocupadas", // D
        "Camas Disponibles", // E
        "Camas Inoperativas", // F
        "Camas Ocupadas", // G
        "Camas Operativas", // H
        "Egresos", // I
        "Ingresos", // J
        "Saldo Día Actual", // K
        "Saldo Día Anterior", // L
      ];

      // **2️⃣ Procesar los datos**
      const dataExport = datosCensoCamas.map((item) => ({
        "Fecha Censo": item.fecha_censo,
        Servicio:
          item.Descripcion_Servicio || "N/A", // Usar id_servicio si viene, o Descripcion_Servicio
        Establecimiento:
          establecimientoMap[item.id_establecimiento] ||
          item.Nombre_Establecimiento ||
          "N/A", // Usar id_establecimiento si viene, o Nombre_Establecimiento
        "Camas Desocupadas": item.camas_desocupadas,
        "Camas Disponibles": item.camas_disponibles,
        "Camas Inoperativas": item.camas_inoperativas,
        "Camas Ocupadas": item.camas_ocupadas,
        "Camas Operativas": item.camas_operativas,
        Egresos: item.egresos,
        Ingresos: item.ingresos,
        "Saldo Día Actual": item.saldo_dia_actual,
        "Saldo Día Anterior": item.saldo_dia_anterior,
      }));

      // **3️⃣ Crear el libro y la hoja de Excel**
      // Ya se crearon workbook y worksheet al inicio de la función.

      // **4️⃣ Agregar título fusionado**
      const titulo = `Reporte de Censos: ${fechaInicio.format(
        "DD/MM/YYYY"
      )} a ${fechaFin.format("DD/MM/YYYY")}`;
      worksheet.mergeCells(
        `A1:${String.fromCharCode(64 + columnasOrdenadas.length)}1`
      );
      worksheet.getCell("A1").value = titulo;
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A1").alignment = { horizontal: "center" };

      // **5️⃣ Agregar encabezados con estilos**
      const headerRow = worksheet.addRow(columnasOrdenadas);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } }; // Texto blanco
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4CAF50" }, // Verde Material-UI (o "ADD8E6" para azul claro)
        };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          // Añadimos bordes para que se vea más profesional
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      const headerRowNumber = headerRow.number;

      // **6️⃣ Agregar datos**
      let lastDataRowNumber = headerRowNumber;
      dataExport.forEach((row) => {
        const rowData = columnasOrdenadas.map((col) => row[col]);
        const dataRow = worksheet.addRow(rowData);
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: "center" };
          cell.border = {
            // Añadimos bordes para las celdas de datos
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
        lastDataRowNumber = dataRow.number;
      });

      // **7️⃣ Calcular totales**
      const totalRowDataMap = columnasOrdenadas.reduce((totals, col) => {
        if (
          col !== "Fecha Censo" &&
          col !== "Servicio" &&
          col !== "Establecimiento"
        ) {
          totals[col] = dataExport.reduce((sum, row) => {
            const value = row[col] ? parseFloat(row[col]) : 0;
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
        } else {
          totals[col] = "";
        }
        return totals;
      }, {});

      // **8️⃣ Agregar y formatear la fila de totales**
      const totalsRowIndex = lastDataRowNumber + 1;
      const totalsRow = worksheet.addRow(
        columnasOrdenadas.map((col, idx) => {
          if (idx === 0) return "Totales"; // La primera celda
          if (idx < 3) return ""; // Las siguientes dos celdas fusionadas
          return totalRowDataMap[col]; // El resto de los totales
        })
      );

      // Fusionar A, B, C para la palabra "Totales"
      worksheet.mergeCells(`A${totalsRowIndex}:C${totalsRowIndex}`);

      // Aplicar estilos a la fila de totales
      totalsRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const actualCell = worksheet.getCell(totalsRowIndex, colNumber);
        actualCell.font = { bold: true };
        actualCell.alignment = { horizontal: "center", vertical: "middle" };
        actualCell.border = { top: { style: "thin" } }; // SOLO borde superior
      });
      // Asegurarse de que el borde superior se aplique a toda la celda fusionada
      worksheet.getCell(`A${totalsRowIndex}`).border = {
        top: { style: "thin" },
      };

      // **9️⃣ Agregar "Total Dias Estancia" y su valor (CON BORDES SOLO EN ESTAS CELDAS)**
      const estanciaRowIndex = totalsRowIndex + 2;
      const totalCamasOcupadas = totalRowDataMap["Camas Ocupadas"];

      // Celda para el texto (Columna C)
      const cellEstanciaLabel = worksheet.getCell(`C${estanciaRowIndex}`);
      cellEstanciaLabel.value = "Total Días Estancia:"; // Corregido "Dias" a "Días"
      cellEstanciaLabel.font = { size: 14, bold: true };
      cellEstanciaLabel.alignment = { horizontal: "right", vertical: "middle" };
      // Bordes externos SOLO para esta celda
      cellEstanciaLabel.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // Celda para el valor (Columna D)
      const cellEstanciaValue = worksheet.getCell(`D${estanciaRowIndex}`);
      cellEstanciaValue.value = totalCamasOcupadas;
      cellEstanciaValue.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cellEstanciaValue.font = { size: 14 };
      // Bordes externos SOLO para esta celda
      cellEstanciaValue.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      // **10️⃣ Ajustar ancho de columnas automáticamente**
      worksheet.columns.forEach((column, index) => {
        // Calcula el ancho máximo basado en cabecera y datos
        const headerText = columnasOrdenadas[index] || "";
        const headerLength = headerText.length;

        let maxLength = headerLength;

        dataExport.forEach((row) => {
          const cellValue = row[headerText];
          if (cellValue) {
            const cellLength = cellValue.toString().length;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          }
        });

        // Considerar los anchos de las celdas de totales y "Dias Estancia"
        if (index === 2) {
          // Columna para "Establecimiento" (donde se fusiona "Totales" y "Total Dias Estancia")
          const estanciaLabelLength = "Total Días Estancia:".length;
          if (estanciaLabelLength > maxLength) {
            maxLength = estanciaLabelLength;
          }
          // También considerar el ancho de "Totales" si es la primera celda fusionada
          const totalesLabelLength = "Totales".length;
          if (totalesLabelLength > maxLength) {
            maxLength = totalesLabelLength;
          }
        } else if (index === 3) {
          // Columna para "Camas Desocupadas" (donde se pone el valor de "Total Dias Estancia")
          const estanciaValueLength = totalCamasOcupadas.toString().length;
          if (estanciaValueLength > maxLength) {
            maxLength = estanciaValueLength;
          }
        }

        // Aplicar el ancho calculado con un padding extra (mínimo 12-15 para legibilidad)
        column.width = Math.max(maxLength + 2, 15);
      });

      // **11️⃣ Generar el archivo Excel y descargarlo**
      const buffer = await workbook.xlsx.writeBuffer();
      const nombreArchivo = `Reporte_Censos_${fechaInicio.format(
        "YYYYMMDD"
      )}_a_${fechaFin.format("YYYYMMDD")}.xlsx`;

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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BaseFormLayout
        title="Censos Camas"
        snackbar={snackbar}
        dialog={dialog}
        loading={loading}
      >
        <Grid container spacing={3}>
          {/* Sección de Establecimiento (solo para admin) */}

          <Grid size={{ xs: 12 }}>
            <FormSection title="Filtro de Censos Cama">
              <Grid container spacing={2}>
                {esAdmin && (
                  <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                    <FormControl fullWidth size="small" disabled={loading}>
                      <InputLabel id="establecimiento-label">
                        Establecimiento
                      </InputLabel>
                      <Select
                        labelId="establecimiento-label"
                        value={idEstablecimientoFiltro}
                        label="Establecimiento"
                        onChange={handleEstablecimientoChange}
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
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControl fullWidth size="small" disabled={loading}>
                    <InputLabel id="tipo-servicio-label">
                      Tipo de Servicio
                    </InputLabel>
                    <Select
                      labelId="tipo-servicio-label"
                      value={servicioFiltro}
                      label="Tipo de Servicio"
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
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  {/* DatePicker para Fecha Inicio */}
                  <DatePicker
                    label="Fecha Inicio"
                    value={fechaInicio}
                    onChange={handleFechaInicioChange}
                    format="DD/MM/YYYY" // Formato de visualización
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  {/* DatePicker para Fecha Fin */}
                  <DatePicker
                    label="Fecha Fin"
                    value={fechaFin}
                    onChange={handleFechaFinChange}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </Grid>

          {/* Sección de Listado de Camas */}
          <Grid size={{ xs: 12 }}>
            <FormSection title="Listado de Censo Camas">
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Typography color="error" sx={{ textAlign: "center", p: 4 }}>
                  {error}
                </Typography>
              ) : datosCensoCamas.length === 0 ? (
                <Typography sx={{ textAlign: "center", p: 4 }}>
                  No hay censos de camas registrados o no se encontraron para
                  los filtros aplicados.
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
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ minWidth: 110 }}>
                            Fecha Censo
                          </TableCell>
                          <TableCell sx={{ minWidth: 110 }}>Servicio</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            Saldo dia Anterior
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>Ingresos</TableCell>
                          <TableCell sx={{ minWidth: 80 }}>Egresos</TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Saldo dia Actual
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Camas Disponibles
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Camas Ocupadas
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Camas Desocupadas
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Camas Operativas
                          </TableCell>
                          <TableCell sx={{ minWidth: 80 }}>
                            Camas Inoperativas
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            Establecimiento
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {datosCensoCamas.map((cama) => (
                          <TableRow
                            key={cama.id_censo}
                            sx={{
                              "&:hover": {
                                backgroundColor: (theme) =>
                                  theme.palette.action.hover,
                              },
                            }}
                          >
                            <TableCell>{cama.fecha_censo || "N/A"}</TableCell>
                            <TableCell>
                              {cama.Descripcion_Servicio || "N/A"}
                            </TableCell>
                            <TableCell>
                              {cama.saldo_dia_anterior || "N/A"}
                            </TableCell>
                            <TableCell>{cama.ingresos || 0}</TableCell>
                            <TableCell>{cama.egresos || 0}</TableCell>
                            <TableCell>{cama.saldo_dia_actual || 0}</TableCell>
                            <TableCell>{cama.camas_disponibles || 0}</TableCell>
                            <TableCell>{cama.camas_ocupadas || 0}</TableCell>
                            <TableCell>{cama.camas_desocupadas || 0}</TableCell>
                            <TableCell>{cama.camas_operativas || 0}</TableCell>
                            <TableCell>
                              {cama.camas_inoperativas || 0}
                            </TableCell>
                            <TableCell>
                              {cama.Nombre_Establecimiento || 0}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<FileDownloadTwoToneIcon />}
                      onClick={exportarExcel}
                      disabled={loading || datosCensoCamas.length === 0}
                    >
                      Exportar a Excel
                    </Button>
                  </Box>
                </>
              )}
            </FormSection>
          </Grid>
        </Grid>
      </BaseFormLayout>
    </LocalizationProvider>
  );
};
