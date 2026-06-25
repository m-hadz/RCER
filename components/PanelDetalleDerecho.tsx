import * as React from "react";
import { useCatalogContext } from "@/contexts/CatalogContext";
import ExploradorActivo from "./PanelDerecho/ExploradorActivo";
import ListaTablas from "./PanelDerecho/ListaTablas";
import SelectorEntorno from "./PanelDerecho/SelectorEntorno";
import PanelResumen from "./PanelDerecho/PanelResumen";

export interface PanelDetalleDerechoProps {
  estadoIngesta: "idle" | "cargando" | "exito" | "error";
  mensajeIngesta: string;
  manejarSubidaArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PanelDetalleDerecho({
  estadoIngesta,
  mensajeIngesta,
  manejarSubidaArchivo
}: PanelDetalleDerechoProps) {
  const { detalleSeleccionado, selectedWorkspaceId, activosLakehouse, cargandoActivos, tablaActiva } = useCatalogContext();

  return (
    <div className={`absolute top-0 right-0 h-full w-2/3 bg-white border-l border-gray-200 shadow-2xl transition-transform duration-700 ease-in-out z-20 overflow-hidden flex flex-row ${selectedWorkspaceId ? "translate-x-0" : "translate-x-full"}`}>
      {!detalleSeleccionado ? (
        <div className="w-full h-full flex items-center justify-center bg-white p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm font-semibold">Cargando detalles de la estación...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="h-full overflow-y-auto transition-all duration-500 ease-in-out border-r border-gray-200 w-1/2 p-8 md:p-12">
            <article className="max-w-3xl mx-auto min-w-[400px]">
              <header className="mb-8 border-b border-gray-200 pb-8 text-wrap">
                <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-6 mb-4">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex-1 break-words">
                    {detalleSeleccionado.nombre || "Sin Título"}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <strong className="font-semibold text-gray-900">Estación:</strong>
                    <span className="break-words">{detalleSeleccionado.workspace_nombre}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <strong className="font-semibold text-gray-900">ID:</strong>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{detalleSeleccionado.workspace_id}</code>
                  </span>
                </div>
              </header>

              {(activosLakehouse || cargandoActivos) && (
                <div className="animate-in fade-in duration-500">
                  {tablaActiva ? <ExploradorActivo /> : <ListaTablas />}
                </div>
              )}
            </article>
          </div>

          <div className="w-1/2 h-full overflow-y-auto bg-gray-50 p-8 md:p-12 relative animate-in slide-in-from-right-8 fade-in duration-500 flex flex-col justify-between">
            <div>
              <SelectorEntorno />
              <PanelResumen />
            </div>

            <div className="mt-12 flex flex-col items-end">
              {estadoIngesta !== "idle" && estadoIngesta !== "cargando" && (
                <div className={`mb-3 text-sm font-medium px-4 py-2 rounded-lg shadow-sm border ${estadoIngesta === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'} animate-in fade-in slide-in-from-bottom-2`}>
                  {mensajeIngesta}
                </div>
              )}

              <label className={`relative cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm ${estadoIngesta === 'cargando' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-95'}`}>
                {estadoIngesta === 'cargando' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                )}
                {estadoIngesta === 'cargando' ? 'Procesando archivo...' : 'Agregar Datos (JSON)'}

                <input
                  type="file"
                  accept=".json"
                  onChange={manejarSubidaArchivo}
                  disabled={estadoIngesta === "cargando"}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}