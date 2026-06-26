import * as React from "react";
import { useCatalogContext } from "@/contexts/CatalogContext";

export default function PanelResumen() {
  const { detalleSeleccionado } = useCatalogContext();

  if (!detalleSeleccionado) return null;

  return (
    <>
      <section className="grid grid-cols-1 gap-6 mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-wrap">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Resumen Temático</h3>
          <p className="font-medium text-gray-900">{detalleSeleccionado.tema || "No especificado"}</p>
        </div>
      </section>

      <section className="prose prose-gray max-w-none text-black text-wrap bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Descripción</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{detalleSeleccionado.descripcion || "Sin descripción disponible."}</p>
      </section>
    </>
  );
}
