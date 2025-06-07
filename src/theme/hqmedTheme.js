import { createTheme } from "@mui/material";
import { red } from "@mui/material/colors";

export const HqmedTheme = createTheme({
  palette: {
    primary: {
      main: "#292254",
    },
    secondary: {
      main: "#543884",
    },
    error: {
      main: red.A400,
    },
  },
});
