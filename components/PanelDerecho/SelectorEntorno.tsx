import * as React from "react";
import { useCatalogContext } from "@/contexts/CatalogContext";

export default function SelectorEntorno() {
  const { entornosCentro, idLakehouseActual, explorarLakehouse } = useCatalogContext();

  if (!entornosCentro || entornosCentro.length === 0) return null;

  return (
    <section className="mb-8 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Entorno Seleccionado (Capa)</h3>
      <div className="relative">
        <select
          className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 py-3 px-4 pr-10 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold cursor-pointer transition-colors"
          value={idLakehouseActual || ""}
          onChange={(e) => explorarLakehouse(e.target.value)}
        >
          {entornosCentro.map((entorno: any) => (
            <option key={entorno.lakehouse_id} value={entorno.lakehouse_id}>
              {entorno.capa} — {entorno.ambiente} ({entorno.tipo})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </section>
  );
}
