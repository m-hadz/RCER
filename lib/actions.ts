"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

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

async function upsertColumnas(tx: any, columnas: any[], nombre_tabla: string, lakehouse_id: string) {
    if (!columnas || !Array.isArray(columnas)) return;
    for (const col of columnas) {
        await tx.columna.upsert({
            where: { nombre_tabla_lakehouse_id_nombre_columna: { nombre_tabla, lakehouse_id, nombre_columna: col.nombre_columna } },
            update: { tipo_dato: col.tipo_dato, es_nullable: col.es_nullable, es_temporal: col.es_temporal },
            create: { nombre_tabla, lakehouse_id, nombre_columna: col.nombre_columna, tipo_dato: col.tipo_dato, es_nullable: col.es_nullable, es_temporal: col.es_temporal }
        });
    }
}

async function upsertTablas(tx: any, tablas: any[], lakehouse_id: string) {
    if (!tablas || !Array.isArray(tablas)) return;
    for (const tabla of tablas) {
        await tx.tabla.upsert({
            where: { nombre_tabla_lakehouse_id: { nombre_tabla: tabla.nombre_tabla, lakehouse_id } },
            update: { total_registros: tabla.total_registros, fecha_inicio: tabla.fecha_inicio ? new Date(tabla.fecha_inicio) : null, fecha_fin: tabla.fecha_fin ? new Date(tabla.fecha_fin) : null, col_temporal: tabla.col_temporal },
            create: { nombre_tabla: tabla.nombre_tabla, lakehouse_id, total_registros: tabla.total_registros, fecha_inicio: tabla.fecha_inicio ? new Date(tabla.fecha_inicio) : null, fecha_fin: tabla.fecha_fin ? new Date(tabla.fecha_fin) : null, col_temporal: tabla.col_temporal }
        });
        await upsertColumnas(tx, tabla.columnas, tabla.nombre_tabla, lakehouse_id);
    }
}

async function upsertLakehouses(tx: any, lakehouses: any[], workspace_id: string) {
    if (!lakehouses || !Array.isArray(lakehouses)) return;
    for (const lh of lakehouses) {
        await tx.lakehouse.upsert({
            where: { lakehouse_id: lh.lakehouse_id },
            update: { capa: lh.capa, tipo: lh.tipo, ambiente: lh.ambiente },
            create: { lakehouse_id: lh.lakehouse_id, workspace_id, capa: lh.capa, tipo: lh.tipo, ambiente: lh.ambiente }
        });
        await upsertTablas(tx, lh.tablas, lh.lakehouse_id);
    }
}

export async function ingerirPlantillaJson(plantilla: any) {
    try {
        await prisma.$transaction(async (tx) => {
            if (plantilla.workspace_id && !plantilla.lakehouse_id) {
                await tx.estacion.upsert({
                    where: { workspace_id: plantilla.workspace_id },
                    update: { nombre: plantilla.nombre, workspace_nombre: plantilla.workspace_nombre, tema: plantilla.tema, descripcion: plantilla.descripcion, ambiente: plantilla.ambiente, latitud: plantilla.latitud, longitud: plantilla.longitud },
                    create: { workspace_id: plantilla.workspace_id, nombre: plantilla.nombre, workspace_nombre: plantilla.workspace_nombre, tema: plantilla.tema, descripcion: plantilla.descripcion, ambiente: plantilla.ambiente, latitud: plantilla.latitud, longitud: plantilla.longitud }
                });
                await upsertLakehouses(tx, plantilla.lakehouses, plantilla.workspace_id);
            }
            else if (plantilla.lakehouse_id && plantilla.workspace_id) {
                await upsertLakehouses(tx, [plantilla], plantilla.workspace_id);
            }
            else if (plantilla.nombre_tabla && plantilla.lakehouse_id) {
                await upsertTablas(tx, [plantilla], plantilla.lakehouse_id);
            }
            else if (plantilla.nombre_columna && plantilla.nombre_tabla && plantilla.lakehouse_id) {
                await upsertColumnas(tx, [plantilla], plantilla.nombre_tabla, plantilla.lakehouse_id);
            }
            else {
                throw new Error("Estructura JSON no reconocida.");
            }
        });

        revalidatePath("/");
        return { success: true };

    } catch (error) {
        console.error("Error en la ingesta transaccional:", error);
        return { success: false, error: "Falló la inserción. Verifica la consola y asegúrate de que el ID padre exista." };
    }
}