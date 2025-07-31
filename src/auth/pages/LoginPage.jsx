import {
  Button,
  Grid,
  TextField,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { AuthLayout } from "../layout/AuthLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../../services/api";
import logoImage from "../../assets/logologinneg.png";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [mostrarContrasenia, setMostrarContrasenia] = useState({
    ingreso: false,
  });

  //Lo usamos para cargar el usuario guardado cuando inician los componentes
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true); // Check the box if username was remembered
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
    } else {
      // If unchecked, remove any previously saved username
      localStorage.removeItem("rememberedUsername");
    }

    const resultado = await loginUsuario(username, password);

    if (resultado.success) {
      const token = sessionStorage.getItem("token");

      if (token) {
        sessionStorage.setItem("lastActivity", Date.now());
        navigate("/", { replace: true });
      } else {
        console.error("El token desapareció antes de la redirección.");
      }
    } else {
      sessionStorage.removeItem("lastActivity");
      setError(resultado.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  const toggleMostrar = (campo) => {
    setMostrarContrasenia((prev) => ({
      ...prev,
      [campo]: !prev[campo],
    }));
  };

  // El componente del logo que se pasará a AuthLayout
  const LogoComponent = (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      // Aquí puedes añadir estilos específicos para el logo si no van en el Grid del AuthLayout
    >
      <img
        src={logoImage}
        alt="Logo de la Aplicación"
        style={{ width: "300px", height: "auto" }} // Ajusta el tamaño y forma
      />
    </Box>
  );

  return (
    <AuthLayout title="Login" logoComponent={LogoComponent}>
      <form onSubmit={handleSubmit}>
        <Grid container>
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <TextField
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <TextField
              label="Contraseña"
              type={mostrarContrasenia.ingreso ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleMostrar("ingreso")}
                      edge="end"
                    >
                      {mostrarContrasenia.ingreso ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ mt: 1, mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary" // You can set the color (e.g., 'secondary', 'success', etc.)
                />
              }
              label="Recordar usuario"
            />
          </Grid>
          <Grid container spacing={2} size={{ xs: 12 }} sx={{ mb: 2, mt: 2 }}>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" type="submit" fullWidth>
                Login
              </Button>
            </Grid>
          </Grid>
          {error && (
            <Grid size={{ xs: 12 }} sx={{ mt: 1, mb: 2 }}>
              <Alert
                variant="filled"
                severity="error"
                sx={{
                  width: "100%", // Asegura que ocupe todo el ancho del Grid item
                  textAlign: "center", // Centra el texto dentro del Alert
                  justifyContent: "center", // Centra también el icono y el texto juntos
                }}
              >
                {error}
              </Alert>
            </Grid>
          )}
        </Grid>
      </form>
    </AuthLayout>
  );
};
