import prisma from "../lib/db";

async function main() {
    await prisma.columna.deleteMany();
    await prisma.tabla.deleteMany();
    await prisma.lakehouse.deleteMany();
    await prisma.estacion.deleteMany();
    const estaciones = [
        { workspace_id: 'ws_patagonia', nombre: 'Centro Patagonia', workspace_nombre: 'Workspace Dev / Prod — Estación Patagonia', tema: 'Ecología y Cambio Climático', descripcion: 'Estudio de ecosistemas australes, monitoreo de flora y fauna mediante cámaras trampa, y dinámica climática para impulsar la ciencia en el territorio.', ambiente: 'DEV/PROD', latitud: -35.123, longitud: -71.456 },
        { workspace_id: 'ws_cda', nombre: 'CDA', workspace_nombre: 'Workspace Dev — CDA', tema: 'Estudios de Aridez', descripcion: 'Investigación sobre adaptación a la extrema aridez, captación de niebla y recursos hídricos en el ecosistema del desierto.', ambiente: 'DEV', latitud: -27.111, longitud: -70.222 },
        { workspace_id: 'ws_atacama', nombre: 'Atacama', workspace_nombre: 'Workspace Dev — Estación Atacama', tema: 'Geología y Clima Extremo', descripcion: 'Análisis de formaciones geológicas y recolección continua de datos meteorológicos y atmosféricos en el desierto de Atacama.', ambiente: 'DEV', latitud: -22.912, longitud: -68.199 },
        { workspace_id: 'ws_torre', nombre: 'Torre de Control', workspace_nombre: 'Workspace RCER UC — Torre de Control', tema: 'Coordinación Científica', descripcion: 'Centro neurálgico para la gestión integral, cruce de datos inter-estaciones y administración centralizada de la red de conocimientos.', ambiente: 'PROD', latitud: -33.456, longitud: -70.654 },
        { workspace_id: 'ws_loa', nombre: 'LOA', workspace_nombre: 'Workspace Dev — Estación Loa', tema: 'Arqueología y Patrimonio', descripcion: 'Prospección territorial, registro de hallazgos como material cerámico y preservación del patrimonio cultural en la cuenca del río Loa.', ambiente: 'DEV', latitud: -21.450, longitud: -69.010 },
        { workspace_id: 'ws_cedel', nombre: 'CEDEL', workspace_nombre: 'Workspace Dev — CEDEL', tema: 'Desarrollo Local y Educación', descripcion: 'Centro dedicado al desarrollo sustentable, integración comunitaria, y organización de congresos e instancias de participación territorial.', ambiente: 'DEV', latitud: -39.280, longitud: -71.980 }
    ];

    await prisma.estacion.createMany({ data: estaciones });
    const lakehouses = [
        { lakehouse_id: 'lh_pat_bronze', workspace_id: 'ws_patagonia', capa: 'Bronze', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'wh_pat_gold', workspace_id: 'ws_patagonia', capa: 'Gold', tipo: 'Warehouse SQL', ambiente: 'PROD' },
        { lakehouse_id: 'lh_cda_silver', workspace_id: 'ws_cda', capa: 'Silver', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'lh_ata_silver', workspace_id: 'ws_atacama', capa: 'Silver', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'lh_pat_silver', workspace_id: 'ws_patagonia', capa: 'Silver', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'lh_loa_bronze', workspace_id: 'ws_loa', capa: 'Bronze', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'lh_cedel_bronze', workspace_id: 'ws_cedel', capa: 'Bronze', tipo: 'Lakehouse', ambiente: 'DEV' },
        { lakehouse_id: 'lh_torre_bronze', workspace_id: 'ws_torre', capa: 'Bronze', tipo: 'Lakehouse', ambiente: 'PROD' }
    ];

    await prisma.lakehouse.createMany({ data: lakehouses });
    const tablas = [
        { nombre_tabla: 'thies_clima_raw', lakehouse_id: 'lh_pat_bronze', total_registros: 4500120, fecha_inicio: new Date('2020-01-01'), fecha_fin: new Date('2026-05-01'), col_temporal: 'timestamp_utc' },

        { nombre_tabla: 'censo_fauna_gold', lakehouse_id: 'wh_pat_gold', total_registros: 1540, fecha_inicio: new Date('2021-03-15'), fecha_fin: new Date('2025-11-20'), col_temporal: 'fecha_censo' },

        { nombre_tabla: 'calidad_agua_cda', lakehouse_id: 'lh_cda_silver', total_registros: 340500, fecha_inicio: new Date('2023-01-10'), fecha_fin: new Date('2026-02-28'), col_temporal: 'fecha_lectura' },

        { nombre_tabla: 'radiacion_solar_duckdb', lakehouse_id: 'lh_ata_silver', total_registros: 890000, fecha_inicio: new Date('2024-06-01'), fecha_fin: new Date('2026-06-20'), col_temporal: 'timestamp_iso' },

        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', total_registros: 84530, fecha_inicio: new Date('2019-04-09'), fecha_fin: new Date('2023-11-07'), col_temporal: 'capture_date' },

        { nombre_tabla: 'loa_arq_hallazgos', lakehouse_id: 'lh_loa_bronze', total_registros: 12500, fecha_inicio: new Date('2015-10-01'), fecha_fin: new Date('2024-04-12'), col_temporal: 'fecha_excavacion' },

        { nombre_tabla: 'cedel_encuestas_sociales', lakehouse_id: 'lh_cedel_bronze', total_registros: 4320, fecha_inicio: new Date('2022-03-01'), fecha_fin: new Date('2025-12-15'), col_temporal: 'fecha_registro' },

        { nombre_tabla: 'sparql_endpoints_metrics', lakehouse_id: 'lh_torre_bronze', total_registros: 678000, fecha_inicio: new Date('2025-01-01'), fecha_fin: new Date('2026-06-25'), col_temporal: 'query_timestamp' },

        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', total_registros: 525600, fecha_inicio: new Date('2025-01-01'), fecha_fin: new Date('2025-12-31'), col_temporal: 'timestamp_utc' }
    ];

    await prisma.tabla.createMany({ data: tablas });
    const columnas = [
        { nombre_tabla: 'thies_clima_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'timestamp_utc', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'thies_clima_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'temperatura_c', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'thies_clima_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'humedad_relativa_pct', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'thies_clima_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'sensor_estado', tipo_dato: 'string', es_nullable: false, es_temporal: false },

        { nombre_tabla: 'censo_fauna_gold', lakehouse_id: 'wh_pat_gold', nombre_columna: 'fecha_censo', tipo_dato: 'date', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'censo_fauna_gold', lakehouse_id: 'wh_pat_gold', nombre_columna: 'especie_nombre', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'censo_fauna_gold', lakehouse_id: 'wh_pat_gold', nombre_columna: 'individuos_contados', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'censo_fauna_gold', lakehouse_id: 'wh_pat_gold', nombre_columna: 'zona_observacion', tipo_dato: 'string', es_nullable: true, es_temporal: false },

        { nombre_tabla: 'calidad_agua_cda', lakehouse_id: 'lh_cda_silver', nombre_columna: 'fecha_lectura', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'calidad_agua_cda', lakehouse_id: 'lh_cda_silver', nombre_columna: 'nivel_ph', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'calidad_agua_cda', lakehouse_id: 'lh_cda_silver', nombre_columna: 'salinidad_ppm', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'calidad_agua_cda', lakehouse_id: 'lh_cda_silver', nombre_columna: 'profundidad_metros', tipo_dato: 'int', es_nullable: false, es_temporal: false },

        { nombre_tabla: 'radiacion_solar_duckdb', lakehouse_id: 'lh_ata_silver', nombre_columna: 'timestamp_iso', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'radiacion_solar_duckdb', lakehouse_id: 'lh_ata_silver', nombre_columna: 'irradiancia_wm2', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'radiacion_solar_duckdb', lakehouse_id: 'lh_ata_silver', nombre_columna: 'indice_uv', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'radiacion_solar_duckdb', lakehouse_id: 'lh_ata_silver', nombre_columna: 'albedo_avg', tipo_dato: 'float', es_nullable: true, es_temporal: false },

        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', nombre_columna: 'capture_date', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', nombre_columna: 'confidence_score', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', nombre_columna: 'bounding_box_area', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', nombre_columna: 'modelo_inferencia', tipo_dato: 'string', es_nullable: false, es_temporal: false },

        { nombre_tabla: 'loa_arq_hallazgos', lakehouse_id: 'lh_loa_bronze', nombre_columna: 'fecha_excavacion', tipo_dato: 'date', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'loa_arq_hallazgos', lakehouse_id: 'lh_loa_bronze', nombre_columna: 'rdf_type', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'loa_arq_hallazgos', lakehouse_id: 'lh_loa_bronze', nombre_columna: 'peso_gramos', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'loa_arq_hallazgos', lakehouse_id: 'lh_loa_bronze', nombre_columna: 'maplibre_cluster_id', tipo_dato: 'int', es_nullable: true, es_temporal: false },

        { nombre_tabla: 'cedel_encuestas_sociales', lakehouse_id: 'lh_cedel_bronze', nombre_columna: 'fecha_registro', tipo_dato: 'date', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'cedel_encuestas_sociales', lakehouse_id: 'lh_cedel_bronze', nombre_columna: 'grupo_etario', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'cedel_encuestas_sociales', lakehouse_id: 'lh_cedel_bronze', nombre_columna: 'nivel_ingresos_usd', tipo_dato: 'int', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'cedel_encuestas_sociales', lakehouse_id: 'lh_cedel_bronze', nombre_columna: 'satisfaccion_indice', tipo_dato: 'float', es_nullable: false, es_temporal: false },

        { nombre_tabla: 'sparql_endpoints_metrics', lakehouse_id: 'lh_torre_bronze', nombre_columna: 'query_timestamp', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'sparql_endpoints_metrics', lakehouse_id: 'lh_torre_bronze', nombre_columna: 'execution_time_ms', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'sparql_endpoints_metrics', lakehouse_id: 'lh_torre_bronze', nombre_columna: 'triples_returned', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'sparql_endpoints_metrics', lakehouse_id: 'lh_torre_bronze', nombre_columna: 'query_type', tipo_dato: 'string', es_nullable: false, es_temporal: false },

        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'timestamp_utc', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'velocidad_viento_ms', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'direccion_viento_grados', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'rafaga_maxima_ms', tipo_dato: 'float', es_nullable: true, es_temporal: false },
        { nombre_tabla: 'vientos_patagonia_raw', lakehouse_id: 'lh_pat_bronze', nombre_columna: 'estacion_id', tipo_dato: 'string', es_nullable: false, es_temporal: false }
    ];

    await prisma.columna.createMany({ data: columnas });
    const relaciones = [
        { estacion_origen_id: 'ws_patagonia', estacion_destino_id: 'ws_cda' },
        { estacion_origen_id: 'ws_patagonia', estacion_destino_id: 'ws_cedel' },

        { estacion_origen_id: 'ws_cda', estacion_destino_id: 'ws_torre' },

        { estacion_origen_id: 'ws_atacama', estacion_destino_id: 'ws_torre' },
        { estacion_origen_id: 'ws_atacama', estacion_destino_id: 'ws_cedel' },

        { estacion_origen_id: 'ws_torre', estacion_destino_id: 'ws_atacama' },

        { estacion_origen_id: 'ws_loa', estacion_destino_id: 'ws_patagonia' },
        { estacion_origen_id: 'ws_loa', estacion_destino_id: 'ws_atacama' },
        { estacion_origen_id: 'ws_loa', estacion_destino_id: 'ws_cedel' },

        { estacion_origen_id: 'ws_cedel', estacion_destino_id: 'ws_torre' },
        { estacion_origen_id: 'ws_cedel', estacion_destino_id: 'ws_loa' }
    ];

    await prisma.relacion.createMany({ data: relaciones });
}

main()
    .catch((e) => {
        console.error("Error ejecutando el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });