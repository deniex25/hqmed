import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoutTwoToneIcon from "@mui/icons-material/LogoutTwoTone";
import VaccinesTwoToneIcon from "@mui/icons-material/VaccinesTwoTone";
import TableViewTwoToneIcon from "@mui/icons-material/TableViewTwoTone";
import HotelTwoToneIcon from "@mui/icons-material/HotelTwoTone";
import BedroomParentTwoToneIcon from "@mui/icons-material/BedroomParentTwoTone";
import CalendarMonthTwoToneIcon from "@mui/icons-material/CalendarMonthTwoTone";
import AppRegistrationTwoToneIcon from "@mui/icons-material/AppRegistrationTwoTone";
import SummarizeTwoToneIcon from "@mui/icons-material/SummarizeTwoTone";
import CalendarViewMonthTwoToneIcon from "@mui/icons-material/CalendarViewMonthTwoTone";
import PersonAddTwoToneIcon from "@mui/icons-material/PersonAddTwoTone";
import BadgeTwoToneIcon from "@mui/icons-material/BadgeTwoTone";
import ManageAccountsTwoToneIcon from "@mui/icons-material/ManageAccountsTwoTone";
import SyncLockTwoToneIcon from "@mui/icons-material/SyncLockTwoTone";

import {
  useNavigate,
  Outlet,
  Link as RouterLink,
  useLocation,
} from "react-router-dom";

const drawerWidthOpen = 240;
const drawerWidthClosed = 0;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // Comportamiento cuando el drawer está cerrado (por defecto)
  marginLeft: drawerWidthClosed,
  width: `calc(100% - ${drawerWidthClosed}px)`,
  // Comportamiento cuando el drawer está abierto
  ...(open && {
    marginLeft: drawerWidthOpen,
    width: `calc(100% - ${drawerWidthOpen}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: open ? drawerWidthOpen : drawerWidthClosed,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      width: theme.spacing(7),
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

export const DashboardLayout = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));

  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  const location = useLocation();

  const createNavLink = (to, icon, text) => (
    <ListItemButton
      component={RouterLink}
      to={to}
      selected={location.pathname === to}
      sx={{
        // ESTILOS POR DEFECTO (para pantallas grandes si no se sobrescriben)
        minHeight: 48,
        justifyContent: open ? "initial" : "center", // Este lo dejas para la animación
        px: 5.8, // Padding por defecto (ej. para desktop)

        // ESTILOS ESPECÍFICOS PARA PANTALLAS PEQUEÑAS
        [theme.breakpoints.down("sm")]: {
          // Se aplica cuando el ancho es MENOR que 'sm' (es decir, en 'xs')
          // Aquí pones los estilos que quieres que se apliquen SOLO en pantallas pequeñas
          // según tu requerimiento original:
          minHeight: 40, // Puedes dejarlo igual o ajustar
          justifyContent: "center", // Si quieres que siempre esté centrado en móvil cuando está contraído
          px: 4.5, // El padding más grande que mencionaste para móvil
        },
      }}
      onClick={() => {
        // LÓGICA DE CLICK CONDICIONAL
        if (!isDesktop) {
          // Si NO es desktop (es decir, es una pantalla pequeña)
          if (open) {
            // Si el drawer está abierto (expandido)
            setOpen(false); // Ciérralo (contráelo a solo iconos)
          }
        }
        // En pantallas grandes (isDesktop es true), la lógica de onClick no se ejecuta automáticamente aquí.
        // Si quieres que en desktop al hacer clic en un item se expanda el drawer,
        // puedes añadir una condición else:
        // else {
        //   if (!open) setOpen(true);
        // }
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItemButton>
  );
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
    return;
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            aria-label="open drawer"
            sx={{
              marginRight: "36px",
              ...(open && { display: "none" }),
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
            HQMED - Red de Salud Trujillo
          </Typography>
          <IconButton
            color="blanco"
            title="Cerrar Sesion"
            onClick={handleLogout}
          >
            <LogoutTwoToneIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <Toolbar
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: [1],
          }}
        >
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Toolbar>
        <Divider />
        <List component="nav">
          {createNavLink("/", <DashboardIcon />, "Dashboard")}
          <Divider sx={{ my: 1 }} />
          {createNavLink(
            "/registrohospi",
            <VaccinesTwoToneIcon />,
            "Registro Hospitalario"
          )}
          {createNavLink(
            "/reportehospi",
            <TableViewTwoToneIcon />,
            "Reporte Hospitalizacion"
          )}
          {createNavLink("/censoscamas", <HotelTwoToneIcon />, "Censos Camas")}
          <Divider sx={{ my: 1 }} />
          {createNavLink(
            "/calendario",
            <CalendarMonthTwoToneIcon />,
            "Calendario Cirugías Prog"
          )}
          {createNavLink(
            "/registroprog",
            <AppRegistrationTwoToneIcon />,
            "Registrar Programacion"
          )}
          {createNavLink(
            "/reporteoperatorio",
            <SummarizeTwoToneIcon />,
            "Reporte Operatorio"
          )}
          {createNavLink(
            "/reporteprog",
            <CalendarViewMonthTwoToneIcon />,
            "Reporte Programacion"
          )}

          <Divider sx={{ my: 1 }} />

          {createNavLink(
            "/confcamas",
            <BedroomParentTwoToneIcon />,
            "Datos Camas"
          )}
          {createNavLink(
            "/confpaciente",
            <PersonAddTwoToneIcon />,
            "Datos Paciente"
          )}
          {createNavLink(
            "/confpersonal",
            <BadgeTwoToneIcon />,
            "Datos Personal"
          )}
          {createNavLink(
            "/registrousuario",
            <ManageAccountsTwoToneIcon />,
            "Registrar Usuario"
          )}
          {createNavLink(
            "/cambiarcontra",
            <SyncLockTwoToneIcon />,
            "Cambiar Contraseña"
          )}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === "light"
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        <Container maxWidth="false" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
