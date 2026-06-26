import * as React from "react";
import ChartBuilder from "@/components/ChartBuilder";
import { useCatalogContext } from "@/contexts/CatalogContext";

const parseBoolean = (val: any): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const lowerVal = val.toLowerCase();
    if (lowerVal === 'sí' || lowerVal === 'si' || lowerVal === 'true' || lowerVal === '1') return true;
  }
  return false;
};

export default function ExploradorActivo() {
  const { tablaActiva, setTablaActiva, cargandoDetalleTabla, detalleTabla, idLakehouseActual } = useCatalogContext();

  if (!tablaActiva) return null;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <button onClick={() => setTablaActiva(null)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
        ← Volver a la lista de tablas
      </button>

      <div className="mb-8 border-b border-gray-200 pb-6">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Explorador de Activo</p>
        <h2 className="text-3xl font-bold text-gray-900 font-mono mb-3">{tablaActiva.nombre_tabla}</h2>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
          {tablaActiva.total_registros ? tablaActiva.total_registros.toLocaleString('es-CL') : 0} Registros
        </span>
      </div>

      {cargandoDetalleTabla ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 mt-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Analizando Grafo de Conocimiento...</p>
        </div>
      ) : (
        <div className="space-y-10">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              1. Esquema Estructural 
              <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{detalleTabla?.campos?.length || 0} Columnas</span>
            </h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Columna</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Nullable</th>
                    <th className="px-4 py-3 font-semibold text-center">Es Temporal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalleTabla?.campos?.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-mono text-gray-900">{c.nombre_columna}</td>
                      <td className="px-4 py-2.5 text-blue-600 font-mono text-xs">{c.tipo_dato}</td>
                      <td className="px-4 py-2.5 text-gray-600">{parseBoolean(c.es_nullable) ? 'Sí' : 'No'}</td>
                      <td className="px-4 py-2.5 text-center">{parseBoolean(c.es_temporal) ? <span className="text-orange-500">⏱️</span> : <span className="text-gray-300">-</span>}</td>
                    </tr>
                  ))}
                  {detalleTabla?.campos?.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">No hay campos estructurales registrados en el catálogo.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              2. Visualización
              <span className="text-xs font-normal text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Nuevo</span>
            </h3>
            <p className="text-sm text-gray-600 mb-2">Configura los ejes para explorar los datos de esta tabla.</p>

            {detalleTabla?.campos && idLakehouseActual && tablaActiva && (
              <ChartBuilder
                campos={detalleTabla.campos}
                lakehouseId={idLakehouseActual}
                tablaNombre={tablaActiva.nombre_tabla}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
