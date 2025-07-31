import { Grid, Typography } from "@mui/material";
import { Box } from "@mui/system";

export const AuthLayout = ({ children, title = "", logoComponent }) => {
  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "100vh", backgroundColor: "primary.main", padding: 4 }}
    >
      <Grid
        size={{ xs: 12 }}// Toma el ancho completo disponible en dispositivos extra pequeños}} // Es importante usar 'item' cuando está dentro de un 'container'
        sx={{
          width: { sm: 450 }, // Mantén el mismo ancho que la caja de login para centrado
          mb: 3, // Margen inferior para separar el logo del formulario
        }}
      >
        {logoComponent}
      </Grid>
      <Grid
        className="box-shadow"
        size={{ xs: 12 }}
        sx={{
          width: { sm: 450 },
          backgroundColor: "white",
          padding: 3,
          borderRadius: 2,
        }}
      >
        <Typography variant="h5" sx={{ mb: 1 }}>
          {title}
        </Typography>

        {children}
      </Grid>
    </Grid>
  );
};
