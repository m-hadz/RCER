import * as React from "react";
import { FilaMarcador } from "@/hooks/useMapManager";

interface SidebarBusquedaProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchPlacesFiltered: FilaMarcador[];
  seleccionarPunto: (workspace_id: string, lng: number, lat: number) => void;
  cerrarDetalle: () => void;
  selectedWorkspaceId: string | null;
  searchMinimized: boolean;
  setSearchMinimized: (val: boolean) => void;
  children?: React.ReactNode;
}

export default function SidebarBusqueda({
  searchQuery,
  setSearchQuery,
  searchPlacesFiltered,
  seleccionarPunto,
  cerrarDetalle,
  selectedWorkspaceId,
  searchMinimized,
  setSearchMinimized,
  children
}: SidebarBusquedaProps) {
  return (
    <>
      {selectedWorkspaceId && (
        searchMinimized ? (
          <div className="absolute left-0 top-0 h-[56px] w-1/3 bg-gray-50/80 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between border-b border-r border-gray-200 transition-all duration-300 animate-in fade-in z-20 pointer-events-auto">
            <button onClick={cerrarDetalle} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors rounded-lg text-xs font-semibold border border-gray-200 shadow-sm text-gray-800">
              ← Volver al mapa
            </button>
            <button onClick={() => setSearchMinimized(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 active:bg-gray-200 transition-colors rounded-lg flex items-center justify-center bg-transparent border-0" title="Expandir buscador">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        ) : (
          <div className="absolute left-0 top-0 w-1/3 h-1/4 flex flex-col min-h-0 bg-gray-50/90 backdrop-blur-md p-4 border-r border-b border-gray-200 shadow-lg transition-all duration-300 animate-in fade-in z-20 pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <button onClick={cerrarDetalle} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors rounded-lg text-xs font-semibold border border-gray-200 shadow-sm text-gray-800">
                ← Volver al mapa
              </button>
              <button onClick={() => setSearchMinimized(true)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 active:bg-gray-200 transition-colors rounded-lg flex items-center justify-center bg-transparent border-0" title="Minimizar buscador">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-2">
                <label htmlFor="buscar-estacion" className="shrink-0 text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar</label>
                <div className="relative flex-1">
                  <input id="buscar-estacion" type="text" placeholder="Escribe el nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900 font-medium placeholder-gray-400" />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 border border-gray-100 rounded-lg bg-white shadow-inner">
              <ul className="divide-y divide-gray-100">
                {searchPlacesFiltered.map((lugar) => {
                  const isSelected = selectedWorkspaceId === lugar.workspace_id;
                  return (
                    <li key={lugar.workspace_id}>
                      <button onClick={() => seleccionarPunto(lugar.workspace_id, Number(lugar.longitud), Number(lugar.latitud))} className={`w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center justify-between hover:bg-gray-50 ${isSelected ? "bg-emerald-50/70 text-emerald-800 border-l-4 border-emerald-500 pl-3" : "text-gray-700"}`}>
                        <span className="truncate pr-4">{lugar.nombre}</span>
                        {isSelected && <span className="shrink-0 text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full text-[10px] font-bold">Seleccionado</span>}
                      </button>
                    </li>
                  );
                })}
                {searchPlacesFiltered.length === 0 && (
                  <li className="px-4 py-8 text-center text-gray-400 text-sm italic">No se encontraron estaciones</li>
                )}
              </ul>
            </div>
          </div>
        )
      )}

      <div className="absolute inset-0 z-0 pointer-events-auto">
        {children}
      </div>
    </>
  );
}