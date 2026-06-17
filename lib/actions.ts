"use server";

import prisma from "@/lib/db";

export async function getMarcadores() {
    return await prisma.estacion.findMany({
        where: { latitud: { not: null }, longitud: { not: null } },
        select: {
            workspace_id: true,
            nombre: true,
            workspace_nombre: true,
            latitud: true,
            longitud: true,
        },
    });
}

export async function getDetalleEstacion(workspace_id: string) {
    const estacion = await prisma.estacion.findUnique({
        where: { workspace_id },
        include: {
            lakehouses: { include: { tablas: true } }
        }
    });

    if (!estacion) return null;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    estacion.lakehouses.forEach(l => {
        l.tablas.forEach(t => {
            if (t.fecha_inicio) {
                if (!minDate || t.fecha_inicio < minDate) minDate = t.fecha_inicio;
            }
            if (t.fecha_fin) {
                if (!maxDate || t.fecha_fin > maxDate) maxDate = t.fecha_fin;
            }
        });
    });

    return {
        workspace_id: estacion.workspace_id,
        nombre: estacion.nombre,
        workspace_nombre: estacion.workspace_nombre,
        ambiente: estacion.ambiente,
        descripcion: estacion.descripcion,
        tema: estacion.tema,
        fecha_inicio: minDate,
        fecha_fin: maxDate
    };
}

export async function getLakehouses(workspace_id: string) {
    const lakehouses = await prisma.lakehouse.findMany({
        where: { workspace_id }
    });

    const ordenCapas: Record<string, number> = { 'Bronze': 1, 'Silver': 2, 'Gold': 3 };
    return lakehouses.sort((a, b) => (ordenCapas[a.capa] || 4) - (ordenCapas[b.capa] || 4));
}

export async function getTablas(lakehouse_id: string) {
    return await prisma.tabla.findMany({
        where: { lakehouse_id },
        orderBy: { total_registros: 'desc' }
    });
}

export async function getDetalleTabla(lakehouse_id: string, nombre_tabla: string) {
    const campos = await prisma.columna.findMany({
        where: { lakehouse_id, nombre_tabla },
        orderBy: [
            { es_temporal: 'desc' },
            { nombre_columna: 'asc' }
        ]
    });

    const linajeRaw = await prisma.tabla.findMany({
        where: {
            nombre_tabla,
            lakehouse_id: { not: lakehouse_id }
        },
        include: { lakehouse: true }
    });

    const linaje = linajeRaw.map(t => ({
        lakehouse_id: t.lakehouse_id,
        capa: t.lakehouse?.capa,
        ambiente: t.lakehouse?.ambiente,
        total_registros: t.total_registros
    }));

    return { campos, linaje };
}