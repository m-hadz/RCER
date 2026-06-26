import { useState } from "react";
import { ingerirPlantillaJson } from "@/lib/actions";

export function useJsonIngestion(expectedWorkspaceId?: string) {
    const [estadoIngesta, setEstadoIngesta] = useState<"idle" | "cargando" | "exito" | "error">("idle");
    const [mensajeIngesta, setMensajeIngesta] = useState("");

    const manejarSubidaArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;

        setEstadoIngesta("cargando");

        const reader = new FileReader();

        reader.onload = async (evento) => {
            try {
                const contenido = evento.target?.result as string;
                const jsonParseado = JSON.parse(contenido);

                if (expectedWorkspaceId && jsonParseado.workspace_id && jsonParseado.workspace_id !== expectedWorkspaceId) {
                    setEstadoIngesta("error");
                    setMensajeIngesta("El JSON no corresponde a la estación actual.");
                    setTimeout(() => {
                        setEstadoIngesta("idle");
                        setMensajeIngesta("");
                    }, 5000);
                    return;
                }

                const respuesta = await ingerirPlantillaJson(jsonParseado, expectedWorkspaceId);

                if (respuesta.success) {
                    setEstadoIngesta("exito");
                    setMensajeIngesta("¡Datos ingresados exitosamente!");
                } else {
                    setEstadoIngesta("error");
                    setMensajeIngesta(respuesta.error || "Error desconocido al insertar.");
                }
            } catch (error) {
                setEstadoIngesta("error");
                setMensajeIngesta("El archivo no es un JSON válido.");
            }

            setTimeout(() => {
                setEstadoIngesta("idle");
                setMensajeIngesta("");
            }, 5000);
        };

        reader.onerror = () => {
            setEstadoIngesta("error");
            setMensajeIngesta("Error al leer el archivo físico.");
            setTimeout(() => setEstadoIngesta("idle"), 5000);
        };

        reader.readAsText(archivo);
        e.target.value = "";
    };

    return { estadoIngesta, mensajeIngesta, manejarSubidaArchivo };
}