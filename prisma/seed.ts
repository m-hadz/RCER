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
        { nombre_tabla: 'thies_av1_raw', lakehouse_id: 'lh_pat_bronze', total_registros: 60064541, fecha_inicio: new Date('2018-12-15'), fecha_fin: new Date('2026-05-09'), col_temporal: 'timestamp_utc' },
        { nombre_tabla: 'patagonia_iceberg_manifests', lakehouse_id: 'wh_pat_gold', total_registros: 142, fecha_inicio: new Date('2023-01-01'), fecha_fin: new Date('2026-05-19'), col_temporal: 'commit_time' },
        { nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', total_registros: 84530, fecha_inicio: new Date('2019-04-09'), fecha_fin: new Date('2023-11-07'), col_temporal: 'capture_date' },
        { nombre_tabla: 'cr1000x_duckdb_optimized', lakehouse_id: 'lh_ata_silver', total_registros: 450890, fecha_inicio: new Date('2025-07-29'), fecha_fin: new Date('2025-09-01'), col_temporal: 'TIMESTAMP_ISO' },
        { nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', total_registros: 4867, fecha_inicio: new Date('2025-07-29'), fecha_fin: new Date('2025-09-01'), col_temporal: 'TIMESTAMP_ISO' },
        { nombre_tabla: 'cda_niebla_sensores', lakehouse_id: 'lh_cda_silver', total_registros: 120500, fecha_inicio: new Date('2024-01-01'), fecha_fin: new Date('2025-12-31'), col_temporal: 'fecha_lectura' },
        { nombre_tabla: 'loa_arkg_triples', lakehouse_id: 'lh_loa_bronze', total_registros: 254000, fecha_inicio: null, fecha_fin: null, col_temporal: 'extraction_date' },
        { nombre_tabla: 'loa_prospeccion_geo', lakehouse_id: 'lh_loa_bronze', total_registros: 3420, fecha_inicio: new Date('2023-04-24'), fecha_fin: new Date('2023-04-26'), col_temporal: 'fecha_hallazgo' },
        { nombre_tabla: 'saviia_sparql_endpoints', lakehouse_id: 'lh_torre_bronze', total_registros: 12, fecha_inicio: null, fecha_fin: null, col_temporal: null },
        { nombre_tabla: 'participantes_iie_anonymized', lakehouse_id: 'lh_cedel_bronze', total_registros: 558, fecha_inicio: null, fecha_fin: null, col_temporal: 'registration_date' }
    ];

    await prisma.tabla.createMany({ data: tablas });
    const columnas = [
        { nombre_columna: 'timestamp_utc', nombre_tabla: 'thies_av1_raw', lakehouse_id: 'lh_pat_bronze', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_columna: 'AirTemperature_C', nombre_tabla: 'thies_av1_raw', lakehouse_id: 'lh_pat_bronze', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'snapshot_id', nombre_tabla: 'patagonia_iceberg_manifests', lakehouse_id: 'wh_pat_gold', tipo_dato: 'bigint', es_nullable: false, es_temporal: false },
        { nombre_columna: 'added_data_files_count', nombre_tabla: 'patagonia_iceberg_manifests', lakehouse_id: 'wh_pat_gold', tipo_dato: 'int', es_nullable: false, es_temporal: false },
        { nombre_columna: 'capture_date', nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', tipo_dato: 'date', es_nullable: false, es_temporal: true },
        { nombre_columna: 'bounding_box_json', nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', tipo_dato: 'json', es_nullable: false, es_temporal: false },
        { nombre_columna: 'confidence_score', nombre_tabla: 'camaras_trampa_cv_bbox', lakehouse_id: 'lh_pat_silver', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_columna: 'TIMESTAMP_ISO', nombre_tabla: 'cr1000x_duckdb_optimized', lakehouse_id: 'lh_ata_silver', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_columna: 'AirTC_Avg', nombre_tabla: 'cr1000x_duckdb_optimized', lakehouse_id: 'lh_ata_silver', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'TIMESTAMP_ISO', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'timestamp', es_nullable: false, es_temporal: true },
        { nombre_columna: 'Solar_Radiation_Wm2', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'Soil_Moisture_VWC', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'Wind_Speed_ms', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'Albedo_Avg', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'double', es_nullable: true, es_temporal: false },
        { nombre_columna: 'Battery_Voltage_Min', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_columna: 'Panel_Temperature_C', nombre_tabla: 'cr1000xseries_table10min', lakehouse_id: 'lh_ata_silver', tipo_dato: 'float', es_nullable: false, es_temporal: false },
        { nombre_columna: 'subject_uri', nombre_tabla: 'loa_arkg_triples', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_columna: 'predicate_uri', nombre_tabla: 'loa_arkg_triples', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_columna: 'object_value', nombre_tabla: 'loa_arkg_triples', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'string', es_nullable: true, es_temporal: false },
        { nombre_columna: 'geometry_geojson', nombre_tabla: 'loa_prospeccion_geo', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'json', es_nullable: false, es_temporal: false },
        { nombre_columna: 'maplibre_cluster_id', nombre_tabla: 'loa_prospeccion_geo', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'int', es_nullable: true, es_temporal: false },
        { nombre_columna: 'rdf_type', nombre_tabla: 'loa_prospeccion_geo', lakehouse_id: 'lh_loa_bronze', tipo_dato: 'string', es_nullable: true, es_temporal: false },
        { nombre_columna: 'endpoint_url', nombre_tabla: 'saviia_sparql_endpoints', lakehouse_id: 'lh_torre_bronze', tipo_dato: 'string', es_nullable: false, es_temporal: false },
        { nombre_columna: 'ontology_version', nombre_tabla: 'saviia_sparql_endpoints', lakehouse_id: 'lh_torre_bronze', tipo_dato: 'string', es_nullable: true, es_temporal: false }
    ];

    await prisma.columna.createMany({ data: columnas });
}

main()
    .catch((e) => {
        console.error("Error ejecutando el seed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });