import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getMarcadores,
  getDetalleEstacion,
  getLakehouses,
  getTablas,
  getDetalleTabla
} from "@/lib/actions";

export interface RelacionDestino {
  destino: {
    workspace_id: string;
    nombre: string;
    latitud: number | null;
    longitud: number | null;
  };
}

export interface DetalleEstacion {
  workspace_id: string;
  nombre: string;
  workspace_nombre: string;
  ambiente?: string | null;
  descripcion?: string | null;
  tema?: string | null;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
  imagenes?: { url: string }[];
  relaciones?: RelacionDestino[];
}

export function useCatalogData() {
  const [filas, setFilas] = useState<any[]>([]);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState<DetalleEstacion | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [idCentroActual, setIdCentroActual] = useState<string | null>(null);
  const [entornosCentro, setEntornosCentro] = useState<any[] | null>(null);
  const [cargandoEntornos, setCargandoEntornos] = useState<boolean>(false);
  const [activosLakehouse, setActivosLakehouse] = useState<any[] | null>(null);
  const [idLakehouseActual, setIdLakehouseActual] = useState<string | null>(null);
  const [cargandoActivos, setCargandoActivos] = useState<boolean>(false);
  const [tablaActiva, setTablaActiva] = useState<any | null>(null);
  const [detalleTabla, setDetalleTabla] = useState<{ campos: any[] } | null>(null);
  const [cargandoDetalleTabla, setCargandoDetalleTabla] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMinimized, setSearchMinimized] = useState<boolean>(false);
  const [loadingMapData, setLoadingMapData] = useState<boolean>(true);
  const [errorCatalog, setErrorCatalog] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatosMarcadores = async () => {
      try {
        setErrorCatalog(null);
        const data = await getMarcadores();
        if (Array.isArray(data)) {
          setFilas(data);
        } else {
          throw new Error("El formato de los marcadores no es un array válido");
        }
      } catch (err) {
        console.error("Error cargando marcadores:", err);
        setErrorCatalog("Error de conexión al obtener el catálogo base.");
      } finally {
        setLoadingMapData(false);
      }
    };
    fetchDatosMarcadores();
  }, []);

  const searchPlacesFiltered = useMemo(() => {
    if (!filas || filas.length === 0) return [];
    const sorted = [...filas]
      .filter((f) => f.nombre)
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));

    if (!searchQuery.trim()) return sorted;

    const query = searchQuery.toLowerCase();
    return sorted.filter((f) => String(f.nombre).toLowerCase().includes(query));
  }, [filas, searchQuery]);

  const cargarDetalleWorkspace = useCallback(async (workspace_id: string) => {
    setSelectedWorkspaceId(workspace_id);
    setEntornosCentro(null);
    setActivosLakehouse(null);
    setIdLakehouseActual(null);
    setTablaActiva(null);
    setDetalleTabla(null);
    setIdCentroActual(workspace_id);

    try {
      setErrorCatalog(null);
      const data = await getDetalleEstacion(workspace_id);
      if (data) setDetalleSeleccionado(data);
      else throw new Error("No hay detalle disponible.");
    } catch (err) {
      console.error("Error cargando detalle:", err);
      setErrorCatalog("Error al cargar detalles de la estación.");
    }

    setCargandoEntornos(true);
    try {
      const dataLakehouses = await getLakehouses(workspace_id);
      if (!Array.isArray(dataLakehouses)) throw new Error("Entornos inválidos");
      setEntornosCentro(dataLakehouses);

      if (dataLakehouses && dataLakehouses.length > 0) {
        let selectedEnv = dataLakehouses.find((e: any) => e.capa === 'Gold') ||
                          dataLakehouses.find((e: any) => e.capa === 'Silver') ||
                          dataLakehouses.find((e: any) => e.capa === 'Bronze') ||
                          dataLakehouses[0];

        if (selectedEnv) {
          setIdLakehouseActual(selectedEnv.lakehouse_id);
          setCargandoActivos(true);
          try {
            const dataTablas = await getTablas(selectedEnv.lakehouse_id);
            if (!Array.isArray(dataTablas)) throw new Error("Tablas inválidas");
            setActivosLakehouse(dataTablas);
          } catch (err) {
            console.error(err);
            setErrorCatalog("Error al cargar las tablas del entorno inicial.");
          } finally {
            setCargandoActivos(false);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorCatalog("Error al cargar los entornos de la estación.");
    } finally {
      setCargandoEntornos(false);
    }
  }, []);

  const explorarLakehouse = async (idLakehouse: string) => {
    setIdLakehouseActual(idLakehouse);
    setTablaActiva(null);
    setCargandoActivos(true);
    setErrorCatalog(null);
    try {
      const data = await getTablas(idLakehouse);
      if (!Array.isArray(data)) throw new Error("Tablas inválidas");
      setActivosLakehouse(data);
    } catch (err) {
      console.error(err);
      setErrorCatalog("Error al explorar las tablas del entorno seleccionado.");
    } finally {
      setCargandoActivos(false);
    }
  };

  const explorarTabla = async (activo: any) => {
    if (!idLakehouseActual) return;
    setTablaActiva(activo);
    setCargandoDetalleTabla(true);
    setErrorCatalog(null);
    try {
      const data = await getDetalleTabla(idLakehouseActual, activo.nombre_tabla);
      if (!data) throw new Error("Detalle inválido");
      setDetalleTabla(data);
    } catch (err) {
      console.error("Error profundizando en tabla:", err);
      setErrorCatalog("Error al cargar los detalles estructurales de la tabla.");
    } finally {
      setCargandoDetalleTabla(false);
    }
  };

  const limpiarSeleccion = useCallback(() => {
    setDetalleSeleccionado(null);
    setSelectedWorkspaceId(null);
    setSearchQuery("");
    setSearchMinimized(false);
    setEntornosCentro(null);
    setActivosLakehouse(null);
    setIdLakehouseActual(null);
    setTablaActiva(null);
    setIdCentroActual(null);
    setErrorCatalog(null);
  }, []);

  return {
    filas,
    detalleSeleccionado,
    selectedWorkspaceId,
    idCentroActual,
    entornosCentro,
    cargandoEntornos,
    activosLakehouse,
    idLakehouseActual,
    cargandoActivos,
    tablaActiva,
    setTablaActiva,
    detalleTabla,
    cargandoDetalleTabla,
    searchQuery,
    setSearchQuery,
    searchMinimized,
    setSearchMinimized,
    loadingMapData,
    errorCatalog,
    searchPlacesFiltered,
    cargarDetalleWorkspace,
    explorarLakehouse,
    explorarTabla,
    limpiarSeleccion
  };
}