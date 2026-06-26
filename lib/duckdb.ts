'use server';

import { DuckDBInstance } from '@duckdb/node-api';
import path from 'path';

let instance: DuckDBInstance | null = null;

export async function obtenerDatosParaGrafico(
    lakehouse_id: string,
    nombre_tabla: string,
    columnas: string[]
) {
    try {
        if (!instance) {
            instance = await DuckDBInstance.create(':memory:');
        }

        const connection = await instance.connect();

        const rutaArchivo = path.join(process.cwd(), 'data_lake', lakehouse_id, `${nombre_tabla}.csv`);

        console.log("----> [DUCKDB] Buscando archivo en:", rutaArchivo);

        const columnasSelect = columnas.map(col => `"${col}"`).join(', ');
        const columnasWhere = columnas.map(col => `"${col}" IS NOT NULL`).join(' AND ');

        const query = `
            SELECT ${columnasSelect}
            FROM read_csv_auto('${rutaArchivo}')
            WHERE ${columnasWhere}
            LIMIT 5000;
        `;

        console.log("----> [DUCKDB] Ejecutando Query:", query);

        const result = await connection.run(query);
        const rows = await result.getRows();

        const datosLimpios = rows.map((row: any) => {
            const obj: any = {};

            const limpiarValor = (val: any) => {
                if (val === null || val === undefined) return null;

                if (typeof val === 'bigint') return Number(val);

                if (typeof val === 'object') {
                    if ('micros' in val) {
                        const millis = Number(BigInt(val.micros) / BigInt(1000));
                        return new Date(millis).toISOString();
                    }
                    if (val instanceof Date) {
                        return val.toISOString();
                    }
                    return val.toString();
                }

                return val;
            };

            if (Array.isArray(row)) {
                columnas.forEach((colName, index) => {
                    obj[colName] = limpiarValor(row[index]);
                });
            } else {
                for (const key in row) {
                    obj[key] = limpiarValor(row[key]);
                }
            }

            return obj;
        });

        return datosLimpios;

    } catch (error) {
        console.error("----> [DUCKDB] ERROR CRÍTICO:", error);
        throw new Error("No se pudieron cargar los datos analíticos.");
    }
}