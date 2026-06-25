import * as React from "react";
import { useCatalogContext } from "@/contexts/CatalogContext";

const formatearFecha = (valor: any) => {
  if (!valor) return "?";
  const dateObj = new Date(valor);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString('es-CL');
  }
  return String(valor);
};

export default function ListaTablas() {
  const { activosLakehouse, cargandoActivos, idLakehouseActual, explorarTabla } = useCatalogContext();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <p className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider">Activos Físicos</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{idLakehouseActual}</h2>
        </div>
      </div>

      {cargandoActivos ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Consultando el catálogo interno...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activosLakehouse?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
              <p className="text-gray-500 italic">No hay tablas registradas en este contenedor.</p>
            </div>
          ) : (
            activosLakehouse?.map((activo, idx) => (
              <div key={idx} onClick={() => explorarTabla(activo)} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
                    </svg>
                    {activo.nombre_tabla}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {activo.total_registros ? activo.total_registros.toLocaleString('es-CL') : 0} Registros
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                  <div>
                    <span className="block text-gray-500 font-semibold mb-1 text-xs uppercase">Cobertura Temporal</span>
                    <span className="text-gray-900 font-medium">{formatearFecha(activo.fecha_inicio)} → {formatearFecha(activo.fecha_fin)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 font-semibold mb-1 text-xs uppercase">Columna de Partición/Tiempo</span>
                    <code className="text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded">{activo.col_temporal || "N/A"}</code>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
