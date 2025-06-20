// src/hooks/useCIEAutocomplete.js
import { useState, useCallback, useRef, useEffect } from 'react';
import { buscarCIE10 } from '../services/api';

export const useCIEAutocomplete = (codigoField, descripcionField, formData, updateFormData, searchMode = 'ambos') => {
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const debounceRef = useRef(null);
  const debounceTimeout = 500;

  const codigoFieldName = codigoField;
  const descripcionFieldName = descripcionField;

  // Inicializa inputValue basado en formData o vacío
  const [inputValue, setInputValue] = useState(() => {
    const initialCode = formData[codigoFieldName];
    const initialDesc = formData[descripcionFieldName];
    return (initialCode && initialDesc) ? `${initialCode} - ${initialDesc}` : '';
  });

  // === CAMBIO CLAVE AQUÍ: LÓGICA DE SINCRONIZACIÓN ===
  // Este useEffect solo actualiza inputValue cuando formData[codigoFieldName] o formData[descripcionFieldName] cambian
  useEffect(() => {
    const currentCode = formData[codigoFieldName];
    const currentDesc = formData[descripcionFieldName];
    const newDisplayValue = (currentCode && currentDesc) ? `${currentCode} - ${currentDesc}` : '';

    // Solo actualiza inputValue si el valor de visualización derivado de formData es diferente
    // Esto previene que el useEffect sobrescriba lo que el usuario está escribiendo.
    // También se asegura de que si los campos de formData se vacían, el inputValue también lo haga.
    if (inputValue !== newDisplayValue) {
      setInputValue(newDisplayValue);
    }

    // Opcional: limpiar sugerencias si los campos de formData se vacían
    if (!currentCode && !currentDesc && sugerencias.length > 0) {
      setSugerencias([]);
      setMostrarOpciones(false);
    }

  }, [formData[codigoFieldName], formData[descripcionFieldName], codigoFieldName, descripcionFieldName]); // <-- ¡Quitamos inputValue de las dependencias!

  const handleCIEInputChange = useCallback(async (event, newInputValue, reason) => {
    // console.log("handleCIEInputChange called. newInputValue:", newInputValue, "reason:", reason); // Para depuración
    setInputValue(newInputValue); // Siempre actualiza inputValue a lo que el usuario está escribiendo

    if (reason === 'input' && newInputValue.length > 0) {
      setLoading(true);
      setMostrarOpciones(true);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        try {
          const data = await buscarCIE10(newInputValue, searchMode);
          setSugerencias(Array.isArray(data) ? data : []);
          setMostrarOpciones(Array.isArray(data) && data.length > 0);
        } catch (error) {
          console.error(`Error al buscar CIE con modo ${searchMode}:`, error);
          setSugerencias([]);
          setMostrarOpciones(false);
        } finally {
          setLoading(false);
        }
      }, debounceTimeout);
    } else if (reason === 'clear' || newInputValue.length === 0) {
      setSugerencias([]);
      setLoading(false);
      setMostrarOpciones(false);
      // Cuando el input se borra, también limpiamos los campos en formData
      updateFormData(prev => ({
        ...prev,
        [codigoFieldName]: '',
        [descripcionFieldName]: ''
      }));
    }
  }, [searchMode, updateFormData, codigoFieldName, descripcionFieldName]);

  const handleCIEChange = useCallback((event, newValue) => {
    if (newValue) {
      updateFormData(prev => ({
        ...prev,
        [codigoFieldName]: newValue.codigoCie,
        [descripcionFieldName]: newValue.nombreCie,
      }));
      // Una vez que se selecciona una opción, establecemos inputValue al valor seleccionado
      setInputValue(`${newValue.codigoCie} - ${newValue.nombreCie}`);
      setMostrarOpciones(false);
    } else {
      updateFormData(prev => ({
        ...prev,
        [codigoFieldName]: '',
        [descripcionFieldName]: ''
      }));
      setInputValue(''); // Si se deselecciona, limpia inputValue
    }
    setSugerencias([]);
  }, [updateFormData, codigoFieldName, descripcionFieldName]);

  const handleKeyDownCIE = useCallback((event) => {
    if (event.key === 'Enter') {
      if (sugerencias.length > 0 && mostrarOpciones) {
        event.preventDefault();
        handleCIEChange(null, sugerencias[0]);
      }
    }
  }, [sugerencias, mostrarOpciones, handleCIEChange]);

  const handleFocusCIE = useCallback(() => {
    // Si necesitas alguna lógica al enfocar
  }, []);

  const handleBlurCIE = useCallback(() => {
    // Retrasar el cierre de las opciones para permitir clics en las sugerencias
    setTimeout(() => {
      setMostrarOpciones(false);
      const currentCode = formData[codigoFieldName];
      const currentDesc = formData[descripcionFieldName];

      // Si el campo de texto tiene contenido PERO no hay un valor seleccionado en formData
      // o el texto actual no coincide con el valor seleccionado, revertimos.
      if (!currentCode && !currentDesc && inputValue.length > 0) {
        // Si el usuario escribió algo pero no seleccionó nada al salir, limpia el input y formData
        setInputValue('');
        updateFormData(prev => ({
            ...prev,
            [codigoFieldName]: '',
            [descripcionFieldName]: ''
        }));
        setSugerencias([]);
      } else if (currentCode && currentDesc && inputValue !== `${currentCode} - ${currentDesc}`) {
        // Si hay un valor seleccionado, pero el usuario lo modificó y salió, revertimos al valor seleccionado
        setInputValue(`${currentCode} - ${currentDesc}`);
        setSugerencias([]); // Asegura que las sugerencias se limpien
      } else if (!currentCode && !currentDesc && inputValue.length === 0) {
          // Si está vacío y se sale, asegurar que las sugerencias estén limpias
          setSugerencias([]);
      }
    }, 100);
  }, [formData, codigoFieldName, descripcionFieldName, inputValue, updateFormData]); // Agregamos updateFormData a las dependencias

  return {
    sugerencias,
    loading,
    mostrarOpciones,
    inputValue,
    handleCIEChange,
    handleCIEInputChange,
    handleFocusCIE,
    handleBlurCIE,
    handleKeyDownCIE,
  };
};