import { Button, Grid, TextField } from '@mui/material';
import { AuthLayout } from '../layout/AuthLayout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUsuario } from "../../services/api";

export const LoginPage = () => {

    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

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

    return (
        <AuthLayout title='Login'>
            <form onSubmit={handleSubmit}>
                    <Grid container>
                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            <TextField 
                            label='Usuario'                            
                            type='text'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder='12345678'
                            fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            <TextField 
                            label='Contraseña'
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Contraseña'
                            fullWidth
                            />
                        </Grid>
                        <Grid container spacing={ 2 } size={{ xs: 12 }} sx={{ mb: 2, mt: 1}}>
                            <Grid size={{ xs: 12 }}>
                                <Button 
                                variant='contained' 
                                type='submit'
                                fullWidth>
                                    Login
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>
        </AuthLayout>
    )
}