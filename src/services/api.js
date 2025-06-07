//let backendUrl = "https://ristrujillo.gob.pe:8888/api"; // Por defecto, internet
//let backendUrl = "https://api.ristrujillo.gob.pe/api";
let backendUrl = "http://10.0.0.10:8080";

let verificarTokenInterval; // Variable global para almacenar el setInterval

// Verifica si el token está por expirar (menos de 5 minutos)
// Verifica si el token está por expirar en los próximos 5 minutos
function tokenPorExpirar() {
  const token = sessionStorage.getItem("token");
  if (!token) return true;

  try {
    const decoded = JSON.parse(atob(token.split(".")[1]));
    const exp = decoded.exp * 1000; // Convertir a milisegundos
    const now = Date.now();

    return exp - now < 5 * 60 * 1000; // Si faltan menos de 5 minutos, retorna true
  } catch {
    return true; // Si hay error, asumimos que el token está vencido o corrupto
  }
}

// Función que cierra sesión tras la advertencia de inactividad
function cerrarSesionEn5Minutos() {
  if (!sessionStorage.getItem("token")) return; // Si el token ya fue eliminado, no hacer nada

  setTimeout(() => {
    if (tokenPorExpirar()) {
      logoutUsuario();
      window.location.href = "/login";
    }
  }, 5 * 60 * 1000); // Esperar 5 minutos
}

// Función que revisa el estado del token cada minuto
function verificarExpiracionToken() {
  if (verificarTokenInterval) clearInterval(verificarTokenInterval); // Evita duplicar intervalos

  verificarTokenInterval = setInterval(() => {
    if (!sessionStorage.getItem("token")) {
      clearInterval(verificarTokenInterval); // Si no hay token, detener el intervalo
      return;
    }

    if (tokenPorExpirar()) {
      alert("Tu sesión está por expirar en 5 minutos por inactividad.");
      cerrarSesionEn5Minutos();
    }
  }, 60 * 1000); // Verifica cada minuto
}

// Llamar a la verificación al iniciar la app
verificarExpiracionToken();

// Renueva el token
async function renovarToken() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    logoutUsuario();
    window.location.href = "/login";
    throw new Error("Sesión expirada.");
  }
  try {
    const response = await fetch(`${backendUrl}/renovar-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // if (response.ok) {
    //   const data = await response.json();
    //   sessionStorage.setItem("token", data.token);
    //   return data.token;
    // } else {
    //   // Si la renovación falla, forzamos logout
    //   logoutUsuario();
    //   window.location.href = "/login";
    //   throw new Error("No autorizado, sesión cerrada");
    // }
    if (!response.ok) {
      // Si la renovación falla, forzamos logout
      logoutUsuario();
      window.location.href = "/login";
      throw new Error("No autorizado, sesión cerrada");
    }

    const data = await response.json();
    sessionStorage.setItem("token", data.token);
    return data.token;
  } catch (error) {
    // Manejar errores de red u otros errores inesperados
    logoutUsuario();
    window.location.href = "/login";
    throw new Error(error.message || "Error al renovar el token");
  }
}

// Función base para realizar solicitudes al backend
export async function fetchAPI(endpoint, options = {}) {
  if (
    tokenPorExpirar() &&
    endpoint !== "/login" &&
    endpoint !== "/renovar-token" &&
    !sessionStorage.getItem("renovacionEnCurso")
  ) {
    sessionStorage.setItem("renovacionEnCurso", "true");
    try {
      await renovarToken();
    } catch (error) {
      console.error("Fallo al renovar token:", error);
      throw new Error("No se pudo renovar el token, por favor inicie sesión.");
    } finally {
      sessionStorage.removeItem("renovacionEnCurso");
    }
  }

  const token = sessionStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(`${backendUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 404) {
      // No se encontraron resultados
      return { status: response.status, data: [] }; // Devuelve un array vacío
    }

    if (response.status === 400) {
      // Solicitud incorrecta (faltan parámetros)
      const errorData = await response.json();
      return { status: response.status, data: errorData }; // Devuelve los datos del error
    }

    if (!response.ok) {
      let errorMessage = ""; //`Error ${response.status}: `
      let errorData = {};
      try {
        errorData = await response.json();
        errorMessage +=
          errorData.mensaje ||
          errorData.error ||
          errorData.message ||
          "Ocurrió un error inesperado.";
      } catch {
        errorMessage += "No se pudo obtener más información";
      }
      throw { status: response.status, message: errorMessage, data: errorData };
    }
    // Devolver el código de estado junto con los datos
    return {
      status: response.status,
      data: response.status === 204 ? null : await response.json(),
    };
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    throw error;
  }
}

// Autenticación de usuario
export const loginUsuario = async (username, password) => {
  try {
    const response = await fetchAPI("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error en login:",
        response.data.message || "Error desconocido"
      );
      return {
        success: false,
        message: response.data.message || "Error desconocido",
      };
    }

    // Verificar si se recibió un token válido
    if (!response.data.token) {
      console.error("Error: No se recibió un token válido del backend.");
      return { success: false, message: "No se recibió un token válido" };
    }

    // Almacenar los datos del usuario en sessionStorage
    sessionStorage.setItem("token", response.data.token);
    sessionStorage.setItem("nombres_personal", response.data.nombres_personal);
    sessionStorage.setItem(
      "id_establecimiento",
      response.data.id_establecimiento
    );
    sessionStorage.setItem("establecimiento", response.data.establecimiento);
    sessionStorage.setItem("id_tipo_usuario", response.data.id_tipo_usuario);

    // Iniciar la verificación del token solo después de iniciar sesión
    verificarExpiracionToken();

    return { success: true };
  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, message: error.message || "Error desconocido" };
  }
};

// Cierre de sesión
export const logoutUsuario = () => {
  sessionStorage.clear();
  clearInterval(verificarTokenInterval); // Detener la verificación del token
  window.location.href = "/login";
};

export const changePassword = async (data) => {
  try {
    const responseData = await fetchAPI("/changePassword", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { status: responseData.status, mensaje: responseData.data.message };
  } catch (error) {
    console.error("Error al intentar cambiar la contraseña:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export async function registrarCama(data) {
  try {
    const response = await fetchAPI("/registrarCama", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error al registrar cama:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
}

export async function registrarCirugiaProg(data) {
  try {
    const response = await fetchAPI("/registrarCirugiaProg", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al registrar la Cirugia Programada:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
}

export async function registrarIntervencionQ(data) {
  try {
    const response = await fetchAPI("/registrarIntervencionQ", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al registrar la Intervencion Quirurgica:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
}

// Hospitalizaciones
export const obtenerReporteHospi = async (
  estado_hosp,
  servicio,
  fechaInicio,
  fechaFin,
  idEstablecimiento
) => {
  let url = `/reporteHospi?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  if (estado_hosp !== "todos") {
    url += `&estado_hosp=${estado_hosp}`;
  }
  if (servicio !== "todos") {
    url += `&id_tipo_servicio=${servicio}`;
  }
  if (idEstablecimiento !== "todos") {
    url += `&id_establecimiento=${idEstablecimiento}`;
  }
  try {
    const response = await fetchAPI(url, {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data.datos || []; // Retorna los datos o un array vacío si no hay datos
  } catch (error) {
    console.error("Error obteniendo reporte de hospitalizacion:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

export const obtenerDatosSemana = async (
  servicio,
  fechaInicio,
  fechaFin,
  idEstablecimiento
) => {
  let url = `/reporteCalendarioCirugias?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&id_tipo_servicio=${servicio}&id_establecimiento=${idEstablecimiento}`;

  try {
    const response = await fetchAPI(url, {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data.calendario || []; // Retorna los datos o un array vacío si no hay datos
  } catch (error) {
    console.error("Error obteniendo Datos de la Semana:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

// Cirugías
export const obtenerReporteCirugias = async (
  tipo,
  servicio,
  fechaInicio,
  fechaFin,
  idEstablecimiento
) => {
  let url = `/reporteCirugias?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  if (tipo !== "Todos") {
    url += `&tipo=${tipo}`;
  }
  if (servicio !== "Todos") {
    url += `&id_tipo_servicio=${servicio}`;
  }
  if (idEstablecimiento !== "todos") {
    url += `&id_establecimiento=${idEstablecimiento}`;
  }

  try {
    const response = await fetchAPI(url, {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data.datos || []; // Retorna los datos o un array vacío si no hay datos
  } catch (error) {
    console.error("Error obteniendo reporte de cirugias:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

export const obtenerReporteCensos = async (
  servicio,
  fechaInicio,
  fechaFin,
  idEstablecimiento
) => {
  let url = `/reporteCensos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;

  if (servicio !== "todos") {
    url += `&id_tipo_servicio=${servicio}`;
  }
  if (idEstablecimiento !== "todos") {
    url += `&id_establecimiento=${idEstablecimiento}`;
  }

  try {
    const response = await fetchAPI(url, {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data.datos || []; // Retorna los datos o un array vacío si no hay datos
  } catch (error) {
    console.error("Error obteniendo reporte de censos:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

// Búsquedas
export const buscarPacientePorDocumento = async (id_tipo_doc, nro_doc_pac) => {
  try {
    const response = await fetchAPI(
      `/buscarPacienteDoc?id_tipo_doc=${id_tipo_doc}&nro_doc_pac=${nro_doc_pac}`
    );
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al registrar la Intervencion Quirurgica:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const buscarPacienteProg = async (id_tipo_doc, nro_doc_pac) => {
  try {
    const response = await fetchAPI(
      `/buscarPacienteProg?id_tipo_doc=${id_tipo_doc}&nro_doc_pac=${nro_doc_pac}`
    );
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al registrar la Intervencion Quirurgica:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const buscarDatosCIE = async (query) => {
  try {
    const response = await fetchAPI(`/buscarDatosCie?query=${query}`);
    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error buscando datos CIE:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

export const actualizarEstadoHospitalizacion = async (
  idHospitalizacion,
  nuevoEstado,
  tipoAlta,
  fechaAlta,
  horaAlta,
  codigoCie,
  dxCie,
  motivoAnulacion
) => {
  const data = {
    id_hospitalizacion: idHospitalizacion,
    nuevoEstado: nuevoEstado,
    tipo_alta: tipoAlta,
    fecha_alta: fechaAlta,
    hora_alta: horaAlta,
    codigo_cie_alta: codigoCie,
    descripcion_cie_alta: dxCie,
    motivo_anulacion: motivoAnulacion,
  };

  try {
    const response = await fetchAPI("/actualizarEstadoHospitalizacion", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error actualizando el estado del paciente:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error actualizando el estado del paciente:", error);
    throw error;
  }
};

export const actualizarEstadoCirugia = async (
  idCirugiaProgramada,
  nuevoEstado,
  fechaReprogramada,
  idOrdenTurno,
  motivoAnulacion
) => {
  const data = {
    id_cirugia_programada: idCirugiaProgramada,
    nuevoEstado,
    fecha_reprogramada: fechaReprogramada,
    id_orden_turno: idOrdenTurno,
    motivo_anulacion: motivoAnulacion,
  };

  try {
    const response = await fetchAPI("/actualizarEstadoCirugia", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error actualizando el estado del paciente:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error actualizando el estado del paciente:", error);
    throw error;
  }
};

export const actualizarEstadoCamas = async (idCama, nuevoEstado, motivo) => {
  const data = {
    id_cama: idCama,
    nuevoEstado,
    detalle_motivo: motivo,
  };
  try {
    const response = await fetchAPI("/actualizarEstadoCamas", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error actualizando el estado de la cama:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error actualizando el estado de la cama:", error);
    throw error;
  }
};

export const registrarUsuario = async (datosUsuario) => {
  // Agrega userData como parámetro
  try {
    const response = await fetch(`${backendUrl}/registrarUsuario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosUsuario), // Envía los datos del usuario en el cuerpo de la solicitud
    });

    if (!response.ok) {
      throw new Error(`Error al registrar usuario: ${response.status}`);
    }

    const data = await response.json();
    return data; // Retorna los datos JSON directamente
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    throw error; // Propaga el error
  }
};

export const listarProfesiones = async () => {
  try {
    const response = await fetch(`${backendUrl}/listarProfesiones`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Error al listar profesiones: ${response.status}`);
    }

    const data = await response.json();
    return data; // Retorna los datos JSON directamente
  } catch (error) {
    console.error("Error al listar profesiones:", error);
    throw error; // Propaga el error
  }
};

export const listarEstablecimientos = async () => {
  try {
    const response = await fetch(`${backendUrl}/listarEstablecimientos`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Error al listar establecimientos: ${response.status}`);
    }

    const data = await response.json();
    return data; // Retorna los datos JSON directamente
  } catch (error) {
    console.error("Error al listar establecimientos:", error);
    throw error; // Propaga el error
  }
};

// Gestión de camas
export const listarCamas = async (idEstablecimiento) => {
  try {
    let url = `/listarCamas`;

    if (idEstablecimiento !== "todos") {
      url += `?&id_establecimiento=${idEstablecimiento}`;
    }
    const response = await fetchAPI(url, {
      method: "GET",
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar camas:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar camas:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarTipoServicio = async () => {
  try {
    const response = await fetchAPI("/listarTipoServicio", {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Tipo de Servicio:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }
    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Tipo de Servicio:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarTipoServicioCirugia = async () => {
  try {
    const response = await fetchAPI("/listarTipoServicioCirugia", {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Tipo de Servicio:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Tipo de Servicio:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarTipoDocumento = async () => {
  try {
    const response = await fetchAPI("/listarTipoDocumento", {
      method: "GET",
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Tipo de Documento:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data;
  } catch (error) {
    console.error("Error al listar Tipo de Documento:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarProfMedico = async () => {
  try {
    const response = await fetchAPI("/listarProfMedico", {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Medico:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Profesionales Medicos:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarProfCirujano = async () => {
  try {
    const response = await fetchAPI("/listarProfCirujano", {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Cirujano:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Profesionales Cirujanos:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarProfAnestesiologo = async () => {
  try {
    const response = await fetchAPI("/listarProfAnestesiologo", {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Anestesiologo:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Profesionales Cirujanos:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const listarCamasPorServicio = async (idTipoServicio, fechaIngreso) => {
  try {
    let url = `/listarCamasDispo?id_tipo_servicio=${idTipoServicio}&fecha_ingreso=${fechaIngreso}`;

    const response = await fetchAPI(url, {
      method: "GET",
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data.datos || []; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Camas Disponibles por Servicio:", error);
    return []; // Retorna un array vacío en caso de error
  }
};

export const listarTurnosDispo = async (turnoDispo) => {
  try {
    const response = await fetchAPI(
      `/listarTurnosDispo?fecha_programada=${turnoDispo}`,
      {
        method: "GET",
      }
    );
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al listar Tipo de Documento:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna directamente los datos obtenidos de fetchAPI
  } catch (error) {
    console.error("Error al listar Camas Disponibles por Servicio:", error);
    throw error; // Propaga el error para que pueda ser manejado por el componente que llama a esta función
  }
};

export const guardarPaciente = async (data) => {
  try {
    const response = await fetchAPI("/pacienteRADatos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al registrar cama:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna el mensaje de éxito
  } catch (error) {
    console.error("Error al registrar/actualizar el paciente:", error);
    return { error: error.message };
  }
};

export const guardarPersonal = async (data) => {
  try {
    const response = await fetchAPI("/personalRADatos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al registrar cama:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    return response.data; // Retorna el mensaje de éxito
  } catch (error) {
    console.error("Error al registrar/actualizar el personal:", error);
    return { error: error.message };
  }
};

export const guardarPacienteHospi = async (datosPHosp) => {
  try {
    const response = await fetchAPI("/guardarPacienteHospitalizacion", {
      method: "POST",
      body: JSON.stringify(datosPHosp),
    });

    // Verificar el código de estado HTTP
    if (response.status !== 200 && response.status !== 201) {
      console.error(
        "Error al registrar cama:",
        response.data.message || "Error desconocido"
      );
      throw { message: response.data.message || "Error desconocido" }; // Lanza un error para ser manejado por el componente
    }

    // Devolver los datos obtenidos de fetchAPI
    // Devolver el mensaje de éxito
    return response.data; // Ahora response.data contiene el mensaje de éxito
  } catch (error) {
    console.error("Error al registrar la hospitalización:", error);
    return { error: error.message };
  }
};

export const generarPDF = async (datos) => {
  try {
    const token = sessionStorage.getItem("token"); // Obtener el token de sesión

    if (!token) {
      throw new Error("No hay token disponible");
    }
    const response = await fetch(`${backendUrl}/generarPDF`, {
      method: "POST",
      body: JSON.stringify(datos),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Agregar el token en el encabezado
      },
    });

    if (!response.ok) {
      throw new Error(`Error al generar PDF: ${response.statusText}`);
    }

    return await response.blob(); // Solo retorna el Blob sin abrir la ventana
  } catch (error) {
    console.error("Error al generar PDF:", error);
    throw error;
  }
};
