// src/features/layout/DashboardLayout.jsx

import * as React from 'react';
import { styled } from '@mui/material/styles'; // No necesitamos createTheme aquí
import CssBaseline from '@mui/material/CssBaseline'; // Esto ya lo tienes en AppTheme, puedes quitarlo si quieres
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// Importa los iconos que vayas a usar
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'; // Ejemplo de icono para hospitalización
import SettingsIcon from '@mui/icons-material/Settings'; // Ejemplo de icono para configuración
import ContentCutIcon from '@mui/icons-material/ContentCut'; // Ejemplo de icono para cirugías


// Importa Outlet y Link de react-router-dom
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';


const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
    },
  }),
);


export const DashboardLayout = () => {
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const location = useLocation();

  // Helper para crear elementos de navegación
  const createNavLink = (to, icon, text) => (
    <ListItemButton component={RouterLink} to={to} selected={location.pathname === to}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItemButton>
  );

  return (
    // ¡IMPORTANTE! Quitamos el ThemeProvider de aquí, ya que AppTheme ya lo proporciona globalmente.
    // También puedes quitar CssBaseline aquí, ya que AppTheme también lo proporciona.
    <Box sx={{ display: 'flex' }}>
      {/* CssBaseline ya lo maneja AppTheme, pero si quieres uno específico para el layout, déjalo. */}
      {/* <CssBaseline /> */}
      <AppBar position="absolute" open={open}>
        <Toolbar
          sx={{
            pr: '24px', // keep right padding when drawer closed
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open drawer"
            onClick={toggleDrawer}
            sx={{
              marginRight: '36px',
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            component="h1"
            variant="h6"
            color="inherit"
            noWrap
            sx={{ flexGrow: 1 }}
          >
            Hqmed Dashboard
          </Typography>
          {/* Aquí puedes agregar elementos adicionales a la barra superior (ej. botón de logout) */}
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {createNavLink('/', <DashboardIcon />, 'Dashboard')}
          <Divider sx={{ my: 1 }} />
          {/* Sección de Cirugías */}
          {createNavLink('/calendario', <ContentCutIcon />, 'Calendario Cirugías')}
          {createNavLink('/registroprog', <ContentCutIcon />, 'Reg. Programado')}
          {createNavLink('/reporteprog', <ContentCutIcon />, 'Rep. Programado')}
          {createNavLink('/reporteoperatorio', <ContentCutIcon />, 'Rep. Operatorios')}
          <Divider sx={{ my: 1 }} />
          {/* Sección de Hospitalización */}
          {createNavLink('/censoscamas', <LocalHospitalIcon />, 'Censos Camas')}
          {createNavLink('/registrohospi', <LocalHospitalIcon />, 'Registro Hospi')}
          {createNavLink('/reportehospi', <LocalHospitalIcon />, 'Reporte Hospi')}
          <Divider sx={{ my: 1 }} />
          {/* Sección de Configuración */}
          {createNavLink('/cambiarcontra', <SettingsIcon />, 'Cambiar Contraseña')}
          {createNavLink('/confcamas', <SettingsIcon />, 'Datos Camas')}
          {createNavLink('/confpersonal', <SettingsIcon />, 'Datos Personal')}
          {createNavLink('/registrousuario', <SettingsIcon />, 'Registrar Usuario')}
          <Divider sx={{ my: 1 }} />
          {/* Puedes añadir un botón de logout aquí */}
          {/* <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton> */}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Toolbar /> {/* Esto es para compensar la altura de la AppBar */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Aquí se renderizará el contenido de las rutas anidadas */}
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};