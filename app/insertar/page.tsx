"use client";

import { useState } from "react";
import { ingerirPlantillaJson } from "@/lib/actions";

export default function PaginaIngesta() {
    const [estado, setEstado] = useState<"idle" | "cargando" | "exito" | "error">("idle");
    const [mensaje, setMensaje] = useState("");

    const manejarSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        setEstado("cargando");
        setMensaje("Leyendo archivo JSON...");

        const reader = new FileReader();

        reader.onload = async (evento) => {
            try {
                const contenido = evento.target?.result as string;
                const jsonParseado = JSON.parse(contenido);

                setMensaje("Inyectando datos en SQLite...");

                const respuesta = await ingerirPlantillaJson(jsonParseado);

                if (respuesta.success) {
                    setEstado("exito");
                    setMensaje("¡Catálogo actualizado con éxito!");
                } else {
                    setEstado("error");
                    setMensaje(respuesta.error || "Error desconocido al insertar.");
                }
            } catch (error) {
                setEstado("error");
                setMensaje("El archivo no es un JSON válido.");
            }
        };

        reader.onerror = () => {
            setEstado("error");
            setMensaje("Error al leer el archivo físico.");
        };

        reader.readAsText(archivo);

        e.target.value = "";
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ingesta de Metadatos</h1>
                <p className="text-sm text-gray-500 mb-8">
                    Sube un archivo <code className="bg-gray-100 px-1 rounded text-blue-600">.json</code> con la estructura del Lakehouse o Estación.
                </p>

                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept=".json"
                        onChange={manejarSubida}
                        disabled={estado === "cargando"}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="flex flex-col items-center pointer-events-none">
                        <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                            {estado === "cargando" ? "Procesando..." : "Haz clic o arrastra tu JSON aquí"}
                        </span>
                    </div>
                </div>

                {estado !== "idle" && (
                    <div className={`mt-6 p-4 rounded-lg text-sm font-medium text-center ${estado === "cargando" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        estado === "exito" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                        {mensaje}
                    </div>
                )}
            </div>
        </div>
    );
}