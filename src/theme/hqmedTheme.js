import { createTheme } from "@mui/material";
import { red } from "@mui/material/colors";

const baseFontSize = 12;
const spacingUnit = 6;

export const HqmedTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536, // Este es el valor por defecto de Material-UI para xl
    },
  },
  
  palette: {
    primary: { main: "#003277" },
    secondary: { main: "#175888" },
    error: { main: red.A400 },
    blanco: { main: "#FFFFFF" },
  },

  // typography: {
  //   fontSize: baseFontSize,
  //   h1: { fontSize: "2.5rem" },
  //   h2: { fontSize: "2rem" },
  //   h3: { fontSize: "1.75rem" },
  //   h4: { fontSize: "1.5rem" },
  //   h5: { fontSize: "1.25rem" },
  //   h6: { fontSize: "1rem" },
  //   body1: { fontSize: "0.875rem" }, // 14px
  //   body2: { fontSize: "0.75rem" }, // 12px
  //   button: { fontSize: "0.875rem" },
  //   caption: { fontSize: "0.625rem" },
  //   overline: { fontSize: "0.625rem" },
  // },

  // spacing: spacingUnit,

  // components: {
  //   MuiButton: {
  //     styleOverrides: {
  //       root: {
  //         padding: "6px 12px",
  //         minHeight: "32px",
  //         textTransform: "none",
  //       },
  //       sizeSmall: { padding: "4px 8px", minHeight: "28px" },
  //       sizeMedium: { padding: "6px 12px", minHeight: "32px" },
  //       sizeLarge: { padding: "8px 16px", minHeight: "40px" },
  //     },
  //   },

  //   // AÑADE ESTO para controlar el padding y min-height de TODOS los inputs base
  //   MuiInputBase: {
  //     styleOverrides: {
  //       root: {
  //         // Estilos para el tamaño por defecto (medium)
  //         // Puedes ajustar estos valores para que coincidan con la altura que deseas para los inputs 'normal'
  //         //minHeight: '48px', // Ejemplo: si quieres que todos los inputs "normal" tengan 48px de alto
  //         "& .MuiInputBase-input": {
  //           //padding: "10px 14px", // Ya lo tienes en MuiTextField. Asegúrate de que coincida.
  //         },
  //       },
  //       sizeSmall: {
  //         // Estilos para el tamaño 'small'
  //         //minHeight: '40px', // <-- ¡Define una altura uniforme para todos los inputs small!
  //         "& .MuiInputBase-input": {
  //           //padding: "8px 12px", // Ya lo tienes en MuiTextField. Asegúrate de que coincida.
  //         },
  //       },
  //     },
  //   },

  //   MuiTextField: {
  //     // Mantén esto si necesitas ajustes específicos para TextField más allá de InputBase
  //     styleOverrides: {
  //       root: {
  //         // Remueve el padding del input base de aquí si lo pones en MuiInputBase
  //         // o asegúrate de que sean consistentes.
  //         "& .MuiInputBase-input": {
  //           // padding: "10px 14px", // Esto se movería a MuiInputBase.root
  //           height: "auto",
  //         },
  //         "& .MuiInputLabel-root": {
  //           //transform: "translate(14px, 12px) scale(1)",
  //         },
  //         "& .MuiInputLabel-shrink": {
  //           //transform: "translate(14px, -9px) scale(0.75)",
  //         },
  //       },
  //       sizeSmall: {
  //         "& .MuiInputBase-input": {
  //           // padding: "8px 12px", // Esto se movería a MuiInputBase.sizeSmall
  //         },
  //         "& .MuiInputLabel-root": {
  //           //transform: "translate(12px, 10px) scale(1)",
  //         },
  //         "& .MuiInputLabel-shrink": {
  //           //transform: "translate(12px, -7px) scale(0.75)",
  //         },
  //       },
  //     },
  //   },

  //   MuiListItemIcon: {
  //     styleOverrides: {
  //       root: { minWidth: "36px" },
  //     },
  //   },

  //   MuiListItemText: {
  //     styleOverrides: {
  //       primary: { fontSize: "0.875rem" },
  //       secondary: { fontSize: "0.75rem" },
  //     },
  //   },

  //   MuiAppBar: {
  //     styleOverrides: {
  //       root: {
  //         minHeight: "48px",
  //         "@media (min-width:600px)": { minHeight: "48px" },
  //       },
  //     },
  //   },

  //   MuiToolbar: {
  //     styleOverrides: {
  //       root: {
  //         minHeight: "48px",
  //         "@media (min-width:600px)": { minHeight: "48px" },
  //       },
  //     },
  //   },

  //   MuiDrawer: {
  //     styleOverrides: {
  //       paper: {
  //         width: "200px",
  //         "@media (min-width:600px)": { width: "200px" },
  //       },
  //     },
  //   },

  //   MuiContainer: {
  //     styleOverrides: {
  //       root: {
          
  //         paddingLeft: spacingUnit * 2 + "px",
  //         paddingRight: spacingUnit * 2 + "px",          
  //       },
  //     },
  //   },

  //   MuiTableCell: {
  //     styleOverrides: {
  //       head: {
  //         fontSize: "0.80rem",
  //         fontWeight: "bold",
  //         backgroundColor: "#f5f5f5",
  //         padding: "6px 12px",
  //       },
  //       body: {
  //         fontSize: "0.70rem",
  //         padding: "6px 12px",
  //       },
  //     },
  //   },
  // },
});
