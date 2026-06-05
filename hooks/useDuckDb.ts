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
        // 1. Obtenemos los bundles automáticamente desde el CDN de jsDelivr
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

        // 2. DuckDB elige el mejor bundle según tu navegador (MVP o EH)
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

        // 3. Creamos el Worker usando la URL segura del bundle
        const worker_url = URL.createObjectURL(
          new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        worker = new Worker(worker_url);
        const logger = new duckdb.ConsoleLogger();
        const database = new duckdb.AsyncDuckDB(logger, worker);

        // 4. Instanciamos la base de datos
        await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
        URL.revokeObjectURL(worker_url);

        const conn = await database.connect();

        // === TU SQL SE MANTIENE EXACTAMENTE IGUAL ===
        await conn.query(`
          CREATE TABLE Centro_investigacion (
    workspace_id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    workspace_nombre VARCHAR(255) NOT NULL,
    ambiente VARCHAR(50)
);

CREATE TABLE Centro_comparte_esquema (
    workspace_id_origen VARCHAR(100),
    workspace_id_destino VARCHAR(100),
    tabla_referencia VARCHAR(100),
    capa VARCHAR(50),
    pct_campos_comunes DECIMAL(5,2),
    
    PRIMARY KEY (workspace_id_origen, workspace_id_destino, tabla_referencia, capa),
    
    FOREIGN KEY (workspace_id_origen) REFERENCES Centro_investigacion(workspace_id),
    FOREIGN KEY (workspace_id_destino) REFERENCES Centro_investigacion(workspace_id)
);

CREATE TABLE Entorno_datos (
    lakehouse_id VARCHAR(100) PRIMARY KEY,
    workspace_id VARCHAR(100) NOT NULL,
    capa VARCHAR(50) NOT NULL,
    tipo VARCHAR(100),
    ambiente VARCHAR(50),
    
    FOREIGN KEY (workspace_id) REFERENCES Centro_investigacion(workspace_id)
);

CREATE TABLE Activo_fisico (
    nombre_tabla VARCHAR(100),
    lakehouse_id VARCHAR(100),
    total_registros BIGINT,
    fecha_inicio DATE,
    fecha_fin DATE,
    col_temporal VARCHAR(50),
    
    PRIMARY KEY (nombre_tabla, lakehouse_id),
    
    FOREIGN KEY (lakehouse_id) REFERENCES Entorno_datos(lakehouse_id)
);

CREATE SEQUENCE seq_id_variable;

CREATE TABLE Variable (
    id_variable INTEGER DEFAULT nextval('seq_id_variable') PRIMARY KEY,
    nombre_variable VARCHAR(100) NOT NULL,
    unidad VARCHAR(50),
    sensor_origen VARCHAR(100)
);

CREATE TABLE Campo_estructural (
    nombre_campo VARCHAR(100),
    nombre_tabla VARCHAR(100),
    lakehouse_id VARCHAR(100),
    
    tipo_dato VARCHAR(50),
    es_nullable VARCHAR(10),
    es_temporal VARCHAR(10),
    
    id_variable INT,
    
    PRIMARY KEY (nombre_campo, nombre_tabla, lakehouse_id),
    
    FOREIGN KEY (nombre_tabla, lakehouse_id) REFERENCES Activo_fisico(nombre_tabla, lakehouse_id),
    
    FOREIGN KEY (id_variable) REFERENCES Variable(id_variable)
);

CREATE TABLE Metadata (
    id_saviia VARCHAR(100) PRIMARY KEY,
    
    id_centro_estacion VARCHAR(100),
    
    id_tiporegistro VARCHAR(100),
    id_proceso VARCHAR(100),
    
    title VARCHAR,
    stationname VARCHAR,
    subtitle VARCHAR,
    depositor VARCHAR,
    dateofcollection VARCHAR,
    subject VARCHAR,
    keyword VARCHAR,
    author VARCHAR,
    authorname VARCHAR,
    dateofdeposit VARCHAR,
    language VARCHAR,
    kindofdata VARCHAR,
    dsdescription VARCHAR,
    dsdescriptionvalue VARCHAR,
    
    latitude VARCHAR,
    longitude VARCHAR,
    geographiccoverage VARCHAR,
    country VARCHAR,
    state VARCHAR,
    city VARCHAR,
    othergeographiccoverage VARCHAR,
    
    timeperiodcovered VARCHAR,
    timeperiodcoveredstart VARCHAR,
    timeperiodcoveredend VARCHAR,
    
    format VARCHAR,
    accesslevel VARCHAR,
    rights VARCHAR,
    license VARCHAR,
    
    alternativetitle VARCHAR,
    publication VARCHAR,
    notestext VARCHAR,
    
    FOREIGN KEY (id_centro_estacion) REFERENCES Centro_investigacion(workspace_id)
);

CREATE TABLE Gobernanza_Torre_Control (
    id_saviia VARCHAR(100) PRIMARY KEY,
    
    id_centro_estacion VARCHAR(100),
    
    id_tiporegistro VARCHAR(100),
    id_proceso VARCHAR(100),
    
    title VARCHAR,
    stationname VARCHAR,
    subject VARCHAR,
    keyword VARCHAR,
    author VARCHAR,
    
    latitude VARCHAR,
    longitude VARCHAR,
    geographiccoverage VARCHAR,
    country VARCHAR,
    
    timeperiodcoveredstart VARCHAR,
    timeperiodcoveredend VARCHAR,
    
    accesslevel VARCHAR,
    rights VARCHAR,
    license VARCHAR,
    
    origen_tabla VARCHAR,

    FOREIGN KEY (id_centro_estacion) REFERENCES Centro_investigacion(workspace_id)
);

-- ==========================================
-- 1. NODOS BASE: Centros de Investigación
-- ==========================================
INSERT INTO Centro_investigacion (workspace_id, nombre, workspace_nombre, ambiente) VALUES 
('ws_patagonia', 'Centro Patagonia', 'Workspace Dev / Prod — Estación Patagonia', 'DEV/PROD'),
('ws_cda', 'CDA', 'Workspace Dev — CDA', 'DEV'),
('ws_atacama', 'Atacama', 'Workspace Dev — Estación Atacama', 'DEV'),
('ws_torre', 'Torre de Control', 'Workspace RCER UC — Torre de Control', 'PROD');
INSERT INTO Centro_investigacion (workspace_id, nombre, workspace_nombre, ambiente) VALUES 
('ws_loa', 'LOA', 'Workspace Dev — Estación Loa', 'DEV'),
('ws_cedel', 'CEDEL', 'Workspace Dev — CEDEL', 'DEV');

-- ==========================================
-- 2. RELACIÓN R6: Compartición de Esquemas
-- ==========================================
-- El documento menciona explícitamente que Patagonia DEV comparte con PROD y Atacama Silver con Gold
INSERT INTO Centro_comparte_esquema (workspace_id_origen, workspace_id_destino, tabla_referencia, capa, pct_campos_comunes) VALUES 
('ws_patagonia', 'ws_patagonia', 'thies_av1', 'Bronze-Gold', 85.50),
('ws_atacama', 'ws_atacama', 'cr1000xseries', 'Silver-Gold', 100.00);

-- ==========================================
-- 3. RELACIÓN R1: Entornos de Datos (Lakehouses)
-- ==========================================
INSERT INTO Entorno_datos (lakehouse_id, workspace_id, capa, tipo, ambiente) VALUES 
('lh_pat_bronze', 'ws_patagonia', 'Bronze', 'Lakehouse', 'DEV'),
('wh_pat_gold', 'ws_patagonia', 'Gold', 'Warehouse SQL', 'PROD'),
('lh_cda_silver', 'ws_cda', 'Silver', 'Lakehouse', 'DEV'),
('lh_ata_silver', 'ws_atacama', 'Silver', 'Lakehouse', 'DEV');
INSERT INTO Entorno_datos (lakehouse_id, workspace_id, capa, tipo, ambiente) VALUES 
('lh_pat_silver', 'ws_patagonia', 'Silver', 'Lakehouse', 'DEV'),
('lh_loa_bronze', 'ws_loa', 'Bronze', 'Lakehouse', 'DEV'),
('lh_cedel_bronze', 'ws_cedel', 'Bronze', 'Lakehouse', 'DEV'),
('lh_torre_bronze', 'ws_torre', 'Bronze', 'Lakehouse', 'PROD');

-- ==========================================
-- 4. RELACIÓN R2: Activos Físicos (Tablas)
-- ==========================================
-- Incluimos los más de 60 millones de registros de Patagonia DEV
INSERT INTO Activo_fisico (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('thies_av1', 'lh_pat_bronze', 60064541, '2018-12-15', '2026-05-09', 'Date'),
('thies_av1', 'wh_pat_gold', 221588, '2018-12-15', '2026-05-19', 'Fecha'),
('sensores_hidrometricos_maldonado', 'lh_pat_bronze', 6373, '2023-09-02', '2024-01-13', 'Fecha_Tiempo'),
('cr1000xseries_hourly', 'lh_ata_silver', 811, '2025-07-29', '2025-09-01', 'TIMESTAMP');
INSERT INTO Activo_fisico (nombre_tabla, lakehouse_id, total_registros, fecha_inicio, fecha_fin, col_temporal) VALUES 
('thies_av1_hourly', 'lh_pat_silver', 11902, '2021-03-12', '2026-04-19', 'Fecha'),
('camaras_trampa', 'lh_pat_silver', 153, '2019-04-09', '2023-11-07', 'Date_picture'),
('cr1000xseries_table10min', 'lh_ata_silver', 4867, '2025-07-29', '2025-09-01', 'TIMESTAMP'),
('loa_prospeccion_2023', 'lh_loa_bronze', 250, '2023-04-24', '2023-04-26', 'fecha'),
('participantes_iie_2024', 'lh_cedel_bronze', 558, NULL, NULL, NULL),
('tabla_metadatos_saviia', 'lh_torre_bronze', 19, NULL, NULL, NULL);

-- ==========================================
-- 5. PUENTE SEMÁNTICO: Variables Conceptuales
-- ==========================================
-- DuckDB asignará automáticamente id_variable = 1, 2 y 3
INSERT INTO Variable (nombre_variable, unidad, sensor_origen) VALUES 
('Temperatura', 'Celsius', 'Thies AV1 / CR1000X'),
('Velocidad Viento', 'm/s', 'Thies AV1'),
('Precipitación', 'mm', 'CDA Sensor');

-- ==========================================
-- 6. RELACIÓN R3: Campos Estructurales
-- ==========================================
-- Conectamos las columnas físicas con la variable conceptual (id_variable 1 = Temperatura)
INSERT INTO Campo_estructural (nombre_campo, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal, id_variable) VALUES 
('AirTemperature', 'thies_av1', 'lh_pat_bronze', 'double', 'Sí', 'No', 1),
('Date', 'thies_av1', 'lh_pat_bronze', 'string', 'Sí', 'Sí', NULL),
('Temperatura_C', 'thies_av1', 'wh_pat_gold', 'float', 'Sí', 'No', 1),
('AirTC_Avg', 'cr1000xseries_hourly', 'lh_ata_silver', 'double', 'Sí', 'No', 1),
('TIMESTAMP', 'cr1000xseries_hourly', 'lh_ata_silver', 'timestamp', 'Sí', 'Sí', NULL);

-- Campos de Cámaras Trampa (Patagonia)
INSERT INTO Campo_estructural (nombre_campo, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal, id_variable) VALUES 
('Date_picture', 'camaras_trampa', 'lh_pat_silver', 'date', 'Sí', 'Sí', NULL),
('Descrip_picture', 'camaras_trampa', 'lh_pat_silver', 'string', 'Sí', 'No', NULL);

-- Campos Arqueológicos (LOA)
INSERT INTO Campo_estructural (nombre_campo, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal, id_variable) VALUES 
('fecha', 'loa_prospeccion_2023', 'lh_loa_bronze', 'string', 'Sí', 'Sí', NULL),
('utm_e', 'loa_prospeccion_2023', 'lh_loa_bronze', 'string', 'Sí', 'No', NULL),
('ceramica_mon', 'loa_prospeccion_2023', 'lh_loa_bronze', 'string', 'Sí', 'No', NULL);

-- Campos de Congreso (CEDEL)
INSERT INTO Campo_estructural (nombre_campo, nombre_tabla, lakehouse_id, tipo_dato, es_nullable, es_temporal, id_variable) VALUES 
('especialidad_participante', 'participantes_iie_2024', 'lh_cedel_bronze', 'string', 'Sí', 'No', NULL),
('tipo_participacion_congreso', 'participantes_iie_2024', 'lh_cedel_bronze', 'string', 'Sí', 'No', NULL);

-- ==========================================
-- 7. NODO DATASET: Metadatos de Estaciones
-- ==========================================
INSERT INTO Metadata (id_saviia, id_centro_estacion, title, kindofdata, subject, latitude, longitude) VALUES 
('ds_pat_meteo', 'ws_patagonia', 'Datos Meteorológicos Maldonado', 'Sensor Data', 'Climatología', '-47.123', '-72.456'),
('ds_ata_clima', 'ws_atacama', 'Climatología CR1000X', 'Sensor Data', 'Meteorología', '-22.912', '-68.199');

-- ==========================================
-- 8. RELACIÓN R5: Gobernanza en Torre de Control
-- ==========================================
-- OJO: Patagonia no se inserta aquí por la regla especial del documento
INSERT INTO Gobernanza_Torre_Control (id_saviia, id_centro_estacion, title, subject, latitude, longitude, accesslevel) VALUES 
('ds_ata_clima', 'ws_atacama', 'Climatología CR1000X', 'Meteorología', '-22.912', '-68.199', 'Público'),
('ds_cda_neblina', 'ws_cda', 'Red Sensores Neblina', 'Meteorología', '-27.111', '-70.222', 'Restringido');
INSERT INTO Metadata (id_saviia, id_centro_estacion, title, kindofdata, subject, latitude, longitude) VALUES 
('ds_loa_arq', 'ws_loa', 'Prospección Arqueológica LOA 2023', 'Survey Data', 'Arqueología', '-21.450', '-69.010'),
('ds_cedel_iie', 'ws_cedel', 'Participantes Congreso IIE 2024', 'Administrative Data', 'Educación', '-39.280', '-71.980');

INSERT INTO Gobernanza_Torre_Control (id_saviia, id_centro_estacion, title, subject, accesslevel) VALUES 
('ds_loa_arq', 'ws_loa', 'Prospección Arqueológica LOA 2023', 'Arqueología', 'Restringido'),
('ds_cedel_iie', 'ws_cedel', 'Participantes Congreso IIE 2024', 'Educación', 'Restringido');

UPDATE Gobernanza_Torre_Control SET stationname = title WHERE stationname IS NULL;
UPDATE Metadata SET stationname = title WHERE stationname IS NULL;
UPDATE Metadata SET accesslevel = 'Público' WHERE id_centro_estacion = 'ws_patagonia';
UPDATE Gobernanza_Torre_Control SET stationname = title WHERE stationname IS NULL AND id_saviia IN ('ds_loa_arq', 'ds_cedel_iie');
UPDATE Metadata SET stationname = title WHERE stationname IS NULL AND id_saviia IN ('ds_loa_arq', 'ds_cedel_iie');
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