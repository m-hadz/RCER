'use client';

import { useEffect, useState } from "react";
import * as duckdb from '@duckdb/duckdb-wasm';

export function useDuckDb() {
  const [duckDb, setDuckDb] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let worker: Worker | null = null;

    const init = async () => {
      try {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);

        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);

        const conn = await database.connect();

        await conn.query(`
          CREATE TABLE Estacion (
    workspace_id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    workspace_nombre VARCHAR(255) NOT NULL,
    tema VARCHAR(255),
    descripcion VARCHAR,
    ambiente VARCHAR(50),
    latitud DOUBLE,
    longitud DOUBLE
);

CREATE TABLE Lakehouse (
    lakehouse_id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL,
    capa VARCHAR(50) NOT NULL,
    tipo VARCHAR(100),
    ambiente VARCHAR(50),

    FOREIGN KEY (workspace_id) REFERENCES Estacion(workspace_id)
);

CREATE TABLE Tabla (
    nombre_tabla VARCHAR(100),
    lakehouse_id VARCHAR(100),
    total_registros BIGINT,
    fecha_inicio DATE,
    fecha_fin DATE,
    col_temporal VARCHAR(50),

    PRIMARY KEY (nombre_tabla, lakehouse_id),

    FOREIGN KEY (lakehouse_id) REFERENCES Lakehouse(lakehouse_id)
);

CREATE TABLE Columnas (
    nombre_tabla VARCHAR(100),
    lakehouse_id VARCHAR(100),

    nombre_columna VARCHAR(50),
    tipo_dato VARCHAR(50),
    es_nullable BOOLEAN,
    es_temporal BOOLEAN,

    PRIMARY KEY (nombre_tabla, lakehouse_id, nombre_columna),

    FOREIGN KEY (nombre_tabla, lakehouse_id) REFERENCES Tabla(nombre_tabla, lakehouse_id)
);

-- ==========================================
-- 1. NODOS BASE: Estaciones
-- ==========================================
INSERT INTO Estacion (workspace_id, nombre, workspace_nombre, tema, descripcion, ambiente, latitud, longitud) VALUES 
('ws_patagonia', 'Centro Patagonia', 'Workspace Dev / Prod — Estación Patagonia', 'Ecología y Cambio Climático', 'Estudio de ecosistemas australes, monitoreo de flora y fauna mediante cámaras trampa, y dinámica climática para impulsar la ciencia en el territorio.', 'DEV/PROD', -35.123, -71.456),
('ws_cda', 'CDA', 'Workspace Dev — CDA', 'Estudios de Aridez', 'Investigación sobre adaptación a la extrema aridez, captación de niebla y recursos hídricos en el ecosistema del desierto.', 'DEV', -27.111, -70.222),
('ws_atacama', 'Atacama', 'Workspace Dev — Estación Atacama', 'Geología y Clima Extremo', 'Análisis de formaciones geológicas y recolección continua de datos meteorológicos y atmosféricos en el desierto de Atacama.', 'DEV', -22.912, -68.199),
('ws_torre', 'Torre de Control', 'Workspace RCER UC — Torre de Control', 'Coordinación Científica', 'Centro neurálgico para la gestión integral, cruce de datos inter-estaciones y administración centralizada de la red de conocimientos.', 'PROD', -33.456, -70.654);

INSERT INTO Estacion (workspace_id, nombre, workspace_nombre, tema, descripcion, ambiente, latitud, longitud) VALUES 
('ws_loa', 'LOA', 'Workspace Dev — Estación Loa', 'Arqueología y Patrimonio', 'Prospección territorial, registro de hallazgos como material cerámico y preservación del patrimonio cultural en la cuenca del río Loa.', 'DEV', -21.450, -69.010),
('ws_cedel', 'CEDEL', 'Workspace Dev — CEDEL', 'Desarrollo Local y Educación', 'Centro dedicado al desarrollo sustentable, integración comunitaria, y organización de congresos e instancias de participación territorial.', 'DEV', -39.280, -71.980);

-- ==========================================
-- 2. RELACIÓN R1: Lakehouses
-- ==========================================
INSERT INTO Lakehouse (lakehouse_id, workspace_id, capa, tipo, ambiente) VALUES 
('lh_pat_bronze', 'ws_patagonia', 'Bronze', 'Lakehouse', 'DEV'),
('wh_pat_gold', 'ws_patagonia', 'Gold', 'Warehouse SQL', 'PROD'),
('lh_cda_silver', 'ws_cda', 'Silver', 'Lakehouse', 'DEV'),
('lh_ata_silver', 'ws_atacama', 'Silver', 'Lakehouse', 'DEV');

INSERT INTO Lakehouse (lakehouse_id, workspace_id, capa, tipo, ambiente) VALUES 
('lh_pat_silver', 'ws_patagonia', 'Silver', 'Lakehouse', 'DEV'),
('lh_loa_bronze', 'ws_loa', 'Bronze', 'Lakehouse', 'DEV'),
('lh_cedel_bronze', 'ws_cedel', 'Bronze', 'Lakehouse', 'DEV'),
('lh_torre_bronze', 'ws_torre', 'Bronze', 'Lakehouse', 'PROD');

-- ==========================================
-- 3. RELACIÓN R2: Tablas (Modern Data Stack & Semántica)
-- ==========================================

-- Patagonia: Manteniendo el volumen masivo, pero añadiendo metadatos de formato de tabla (ej. Apache Iceberg) y visión computacional
INSERT INTO Tabla (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('thies_av1_raw', 'lh_pat_bronze', 60064541, '2018-12-15', '2026-05-09', 'timestamp_utc'),
('patagonia_iceberg_manifests', 'wh_pat_gold', 142, '2023-01-01', '2026-05-19', 'commit_time'),
('camaras_trampa_cv_bbox', 'lh_pat_silver', 84530, '2019-04-09', '2023-11-07', 'capture_date');

-- Atacama y CDA: Optimizaciones para lectura rápida
INSERT INTO Tabla (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('cr1000x_duckdb_optimized', 'lh_ata_silver', 450890, '2025-07-29', '2025-09-01', 'TIMESTAMP_ISO'),
('cr1000xseries_table10min', 'lh_ata_silver', 4867, '2025-07-29', '2025-09-01', 'TIMESTAMP_ISO'),
('cda_niebla_sensores', 'lh_cda_silver', 120500, '2024-01-01', '2025-12-31', 'fecha_lectura');

-- LOA (Arqueología): Evolucionado de un Excel plano a un modelo de Grafo de Conocimiento y GeoJSON
INSERT INTO Tabla (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('loa_arkg_triples', 'lh_loa_bronze', 254000, NULL, NULL, 'extraction_date'),
('loa_prospeccion_geo', 'lh_loa_bronze', 3420, '2023-04-24', '2023-04-26', 'fecha_hallazgo');

-- Torre y CEDEL: Nodos de federación y participación
INSERT INTO Tabla (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('saviia_sparql_endpoints', 'lh_torre_bronze', 12, NULL, NULL, NULL),
('participantes_iie_anonymized', 'lh_cedel_bronze', 558, NULL, NULL, 'registration_date');

-- ==========================================
-- 4. RELACIÓN R3: Columnas
-- ==========================================

-- Patagonia: Series de tiempo masivas e Iceberg
INSERT INTO Columnas (nombre_columna, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal) VALUES 
('timestamp_utc', 'thies_av1_raw', 'lh_pat_bronze', 'timestamp', FALSE, TRUE),
('AirTemperature_C', 'thies_av1_raw', 'lh_pat_bronze', 'double', TRUE, FALSE),
('snapshot_id', 'patagonia_iceberg_manifests', 'wh_pat_gold', 'bigint', FALSE, FALSE),
('added_data_files_count', 'patagonia_iceberg_manifests', 'wh_pat_gold', 'int', FALSE, FALSE);

-- Patagonia: Visión computacional para las cámaras trampa
INSERT INTO Columnas (nombre_columna, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal) VALUES 
('capture_date', 'camaras_trampa_cv_bbox', 'lh_pat_silver', 'date', FALSE, TRUE),
('bounding_box_json', 'camaras_trampa_cv_bbox', 'lh_pat_silver', 'json', FALSE, FALSE),
('confidence_score', 'camaras_trampa_cv_bbox', 'lh_pat_silver', 'float', FALSE, FALSE);

-- Atacama: Estructura tipada para ingesta
INSERT INTO Columnas (nombre_columna, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal) VALUES 
('TIMESTAMP_ISO', 'cr1000x_duckdb_optimized', 'lh_ata_silver', 'timestamp', FALSE, TRUE),
('AirTC_Avg', 'cr1000x_duckdb_optimized', 'lh_ata_silver', 'double', TRUE, FALSE),
('TIMESTAMP_ISO', 'cr1000xseries_table10min', 'lh_ata_silver', 'timestamp', FALSE, TRUE),
('Solar_Radiation_Wm2', 'cr1000xseries_table10min', 'lh_ata_silver', 'double', TRUE, FALSE),
('Soil_Moisture_VWC', 'cr1000xseries_table10min', 'lh_ata_silver', 'double', TRUE, FALSE),
('Wind_Speed_ms', 'cr1000xseries_table10min', 'lh_ata_silver', 'double', TRUE, FALSE),
('Albedo_Avg', 'cr1000xseries_table10min', 'lh_ata_silver', 'double', TRUE, FALSE),
('Battery_Voltage_Min', 'cr1000xseries_table10min', 'lh_ata_silver', 'float', FALSE, FALSE),
('Panel_Temperature_C', 'cr1000xseries_table10min', 'lh_ata_silver', 'float', FALSE, FALSE);

-- LOA (Arqueología): Esquema para ArKG (Arqueología Knowledge Graph) y Mapas
INSERT INTO Columnas (nombre_columna, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal) VALUES 
('subject_uri', 'loa_arkg_triples', 'lh_loa_bronze', 'string', FALSE, FALSE),
('predicate_uri', 'loa_arkg_triples', 'lh_loa_bronze', 'string', FALSE, FALSE),
('object_value', 'loa_arkg_triples', 'lh_loa_bronze', 'string', TRUE, FALSE),
('geometry_geojson', 'loa_prospeccion_geo', 'lh_loa_bronze', 'json', FALSE, FALSE),
('maplibre_cluster_id', 'loa_prospeccion_geo', 'lh_loa_bronze', 'int', TRUE, FALSE),
('rdf_type', 'loa_prospeccion_geo', 'lh_loa_bronze', 'string', TRUE, FALSE);

-- Torre de control: Gestión de endpoints semánticos
INSERT INTO Columnas (nombre_columna, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal) VALUES 
('endpoint_url', 'saviia_sparql_endpoints', 'lh_torre_bronze', 'string', FALSE, FALSE),
('ontology_version', 'saviia_sparql_endpoints', 'lh_torre_bronze', 'string', TRUE, FALSE);
        `);

        await conn.close();
        setDuckDb(database);
        setLoading(false);
      } catch (error: any) {
        setError(error);
        setLoading(false);
        console.error('Failed to initialize DuckDB:', error);
      }
    };

    init();

    return () => {
      worker?.terminate();
    };
  }, []);

  return { duckDb, error, loading };
}