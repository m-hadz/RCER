"use client";

import * as React from "react";
import SidebarBusqueda from "./SidebarBusqueda";
import PanelDetalleDerecho from "./PanelDetalleDerecho";
import VisorMapas from "./VisorMapas";

import { useCatalogContext, CatalogProvider } from "@/contexts/CatalogContext";
import { useMapManager } from "@/hooks/useMapManager";
import { useJsonIngestion } from "@/hooks/useJsonIngestion";
import { useMapStyles } from "@/hooks/useMapStyles";

function ChileMapOrchestrator() {
  const { defaultStyle, outdoorStyle, maskData, errorStyles } = useMapStyles();

  const {
    filas, searchQuery, setSearchQuery, searchPlacesFiltered,
    detalleSeleccionado, cargarDetalleWorkspace, limpiarSeleccion,
    loadingMapData, errorCatalog, searchMinimized, setSearchMinimized,
    selectedWorkspaceId
  } = useCatalogContext();

  const {
    mapRefDefault, mapRefOutdoor, isOutdoorMode, geojsonPuntos,
    seleccionarPunto, cerrarDetalle, cursor, setCursor, hoverInfo, setHoverInfo,
    pendingOutdoorFlight, syncMaps, outdoorInitialState, isAnimatingMap
  } = useMapManager(filas);

  const { estadoIngesta, mensajeIngesta, manejarSubidaArchivo } = useJsonIngestion(detalleSeleccionado?.workspace_id);

  const [historyStack, setHistoryStack] = React.useState<string[]>([]);

  const handleSeleccionarPunto = React.useCallback(async (workspace_id: string | null, targetLng: number, targetLat: number) => {
    if (!workspace_id) {
       setHistoryStack([]);
    } else if (selectedWorkspaceId && selectedWorkspaceId !== workspace_id) {
       setHistoryStack(prev => [...prev, selectedWorkspaceId]);
    }

    if (workspace_id) {
      cargarDetalleWorkspace(workspace_id);
    }
    seleccionarPunto(workspace_id, targetLng, targetLat);
  }, [cargarDetalleWorkspace, seleccionarPunto, selectedWorkspaceId]);

  const handleCerrarDetalle = React.useCallback(() => {
    setHistoryStack([]);
    limpiarSeleccion();
    cerrarDetalle();
  }, [limpiarSeleccion, cerrarDetalle]);

  const handleVolverAtras = React.useCallback(() => {
      if (historyStack.length === 0) return;
      const previousId = historyStack[historyStack.length - 1];
      const previousPunto = filas.find(f => f.workspace_id === previousId);
      
      if (previousPunto && previousPunto.longitud && previousPunto.latitud) {
          setHistoryStack(prev => prev.slice(0, -1));
          cargarDetalleWorkspace(previousId);
          seleccionarPunto(previousId, previousPunto.longitud, previousPunto.latitud);
      }
  }, [historyStack, filas, cargarDetalleWorkspace, seleccionarPunto]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      {loadingMapData && (
        <div className="absolute z-50 top-10 left-10 bg-white px-4 py-3 rounded-md shadow-md border border-gray-100 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 text-sm font-semibold">Iniciando catálogo...</span>
        </div>
      )}

      {(errorCatalog || errorStyles) && (
        <div className="absolute z-50 top-10 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-sm font-bold">{errorCatalog || errorStyles}</span>
        </div>
      )}

      <SidebarBusqueda
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlacesFiltered={searchPlacesFiltered}
        seleccionarPunto={handleSeleccionarPunto}
        cerrarDetalle={handleCerrarDetalle}
        selectedWorkspaceId={detalleSeleccionado?.workspace_id || null}
        searchMinimized={searchMinimized}
        setSearchMinimized={setSearchMinimized}
      >
        <VisorMapas
          mapRefDefault={mapRefDefault}
          mapRefOutdoor={mapRefOutdoor}
          isOutdoorMode={isOutdoorMode}
          outdoorInitialState={outdoorInitialState}
          outdoorStyle={outdoorStyle}
          defaultStyle={defaultStyle}
          seleccionarPunto={handleSeleccionarPunto}
          cursor={cursor}
          setCursor={setCursor}
          hoverInfo={hoverInfo}
          setHoverInfo={setHoverInfo}
          pendingOutdoorFlight={pendingOutdoorFlight}
          syncMaps={syncMaps}
          maskData={maskData}
          geojsonPuntos={geojsonPuntos}
          isAnimatingMap={isAnimatingMap}
        />
      </SidebarBusqueda>

      <PanelDetalleDerecho
        estadoIngesta={estadoIngesta}
        mensajeIngesta={mensajeIngesta}
        manejarSubidaArchivo={manejarSubidaArchivo}
        seleccionarPunto={handleSeleccionarPunto}
        volverAtras={handleVolverAtras}
        puedeVolverAtras={historyStack.length > 0}
      />
    </div>
  );
}

export default function ChileMap() {
  return (
    <CatalogProvider>
      <ChileMapOrchestrator />
    </CatalogProvider>
  );
}