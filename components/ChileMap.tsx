"use client";

import * as React from "react";
import Map, { NavigationControl, Source, Layer, MapLayerMouseEvent, MapRef, Popup } from "react-map-gl/maplibre";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";

import { useDuckDb } from "../hooks/useDuckDb"; 

const DEFAULT_MAP_STYLE = `https://api.maptiler.com/maps/019e8e0d-6eac-7277-94ee-b39ae7dc292d/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
const OUTDOOR_MAP_STYLE = `https://api.maptiler.com/maps/outdoor-v4/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
const CHILE_GEOJSON_URL = "/chile_highres.geojson";

const QUERY_MARCADORES = `
  SELECT id_saviia, id_centro_estacion, title AS nombre, latitude AS latitud, longitude AS longitud
  FROM Gobernanza_Torre_Control
  UNION 
  SELECT id_saviia, id_centro_estacion, title AS nombre, latitude AS latitud, longitude AS longitud
  FROM Metadata;
`;

// Utilidad para formatear los timestamps que devuelve DuckDB a fechas legibles
const formatearFecha = (valor: any) => {
  if (!valor) return "?";
  if (!isNaN(Number(valor))) {
    return new Date(Number(valor)).toLocaleDateString('es-CL');
  }
  return String(valor);
};

export default function ChileMap() {
  const mapRef = React.useRef<MapRef>(null);

  const [maskData, setMaskData] = React.useState<any>(null);
  const [chileOutline, setChileOutline] = React.useState<any>(null);
  const [filas, setFilas] = React.useState<any[]>([]);
  const [cursor, setCursor] = React.useState<string>("grab");
  const [hoverInfo, setHoverInfo] = React.useState<{longitude: number, latitude: number, nombre: string} | null>(null);
  const [currentMapStyle, setCurrentMapStyle] = React.useState<string>(DEFAULT_MAP_STYLE);
  
  // NIVEL 1: Dataset
  const [detalleSeleccionado, setDetalleSeleccionado] = React.useState<any | null>(null);
  const [idCentroActual, setIdCentroActual] = React.useState<string | null>(null);
  
  // NIVEL 2: Arquitectura del Centro
  const [entornosCentro, setEntornosCentro] = React.useState<any[] | null>(null);
  const [cargandoEntornos, setCargandoEntornos] = React.useState<boolean>(false);

  // NIVEL 3: Activos Físicos (Tablas)
  const [activosLakehouse, setActivosLakehouse] = React.useState<any[] | null>(null);
  const [idLakehouseActual, setIdLakehouseActual] = React.useState<string | null>(null);
  const [cargandoActivos, setCargandoActivos] = React.useState<boolean>(false);

  // NIVEL 4: Detalle de la Tabla (La "caja negra")
  const [tablaActiva, setTablaActiva] = React.useState<any | null>(null);
  const [detalleTabla, setDetalleTabla] = React.useState<{campos: any[], linaje: any[], metadatos: any[]} | null>(null);
  const [cargandoDetalleTabla, setCargandoDetalleTabla] = React.useState<boolean>(false);

  const { duckDb, loading, error } = useDuckDb();

  React.useEffect(() => {
    if (!duckDb) return;
    const fetchDatosMarcadores = async () => {
      try {
        const conn = await duckDb.connect();
        const result = await conn.query(QUERY_MARCADORES);
        setFilas(result.toArray().map((row: any) => row.toJSON()));
        await conn.close();
      } catch (err) { console.error(err); }
    };
    fetchDatosMarcadores();
  }, [duckDb]);

  React.useEffect(() => {
    // Load the border outline
    fetch(CHILE_GEOJSON_URL)
      .then((res) => res.json())
      .then(setChileOutline)
      .catch(console.error);

    // Load the PRE-CALCULATED mask directly to avoid freezing the browser with turf.mask()
    fetch("/chile_mask.geojson")
      .then((res) => res.json())
      .then(setMaskData)
      .catch(console.error);
  }, []);

  const geojsonPuntos = React.useMemo(() => {
    if (!filas || filas.length === 0) return null;
    return {
      type: "FeatureCollection",
      features: filas.filter((f) => f.latitud != null && f.longitud != null).map((f, index) => ({
        type: "Feature", id: index,
        geometry: { type: "Point", coordinates: [Number(f.longitud), Number(f.latitud)] },
        properties: { id_saviia: f.id_saviia, id_centro_estacion: f.id_centro_estacion, nombre: f.nombre },
      })),
    };
  }, [filas]);

  // -- MANEJADORES DE CLICS (NIVELES 1 AL 3) --
  const onMapClick = React.useCallback(async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.layer?.id !== "marcadores-layer") return;

    const { id_saviia, id_centro_estacion } = feature.properties as any;
    if (!id_saviia || !duckDb) return;

    // Resetear niveles
    setEntornosCentro(null);
    setActivosLakehouse(null);
    setIdLakehouseActual(null);
    setTablaActiva(null);
    setDetalleTabla(null);
    setIdCentroActual(id_centro_estacion || null);

    const paddingDerecho = window.innerWidth * 0.66; 
    const coords = (feature.geometry as any).coordinates;
    setCurrentMapStyle(OUTDOOR_MAP_STYLE);
    mapRef.current?.flyTo({ center: [coords[0], coords[1]], zoom: 6.5, bearing: 0, duration: 1000, padding: { right: paddingDerecho, left: 0, top: 0, bottom: 0 } });

    try {
      const conn = await duckDb.connect();
      const queryDetalle = `
        SELECT id_dataset, MAX(nombre_dataset) AS nombre_dataset, MAX(nombre_estacion) AS nombre_estacion, MAX(resumen_tematico) AS resumen_tematico, MAX(investigador_autor) AS investigador_autor, MAX(fecha_inicio) AS fecha_inicio, MAX(fecha_fin) AS fecha_fin, MAX(nivel_acceso) AS nivel_acceso, MAX(descripcion_detallada) AS descripcion_detallada
        FROM (
            SELECT id_saviia AS id_dataset, title AS nombre_dataset, stationname AS nombre_estacion, subject AS resumen_tematico, author AS investigador_autor, timeperiodcoveredstart AS fecha_inicio, timeperiodcoveredend AS fecha_fin, accesslevel AS nivel_acceso, NULL AS descripcion_detallada FROM Gobernanza_Torre_Control WHERE id_saviia = '${id_saviia}'
            UNION ALL
            SELECT id_saviia AS id_dataset, title AS nombre_dataset, stationname AS nombre_estacion, subject AS resumen_tematico, author AS investigador_autor, timeperiodcoveredstart AS fecha_inicio, timeperiodcoveredend AS fecha_fin, accesslevel AS nivel_acceso, dsdescriptionvalue AS descripcion_detallada FROM Metadata WHERE id_saviia = '${id_saviia}'
        ) AS tarjeta_consolidada GROUP BY id_dataset;
      `;
      const result = await conn.query(queryDetalle);
      const rows = result.toArray().map((row: any) => row.toJSON());
      if (rows.length > 0) setDetalleSeleccionado(rows[0]);
      await conn.close();
    } catch (err) { console.error(err); }
  }, [duckDb]);

  const explorarCentro = async () => {
    if (!idCentroActual || !duckDb) return;
    setCargandoEntornos(true);
    try {
      const conn = await duckDb.connect();
      const queryCentro = `SELECT e.lakehouse_id AS id_contenedor, c.nombre AS centro_investigacion, e.capa AS capa_de_datos, e.tipo AS tipo_tecnologico, e.ambiente AS ambiente_ejecucion FROM Entorno_datos e JOIN Centro_investigacion c ON e.workspace_id = c.workspace_id WHERE c.workspace_id = '${idCentroActual}' ORDER BY CASE e.capa WHEN 'Bronze' THEN 1 WHEN 'Silver' THEN 2 WHEN 'Gold' THEN 3 ELSE 4 END;`;
      const result = await conn.query(queryCentro);
      setEntornosCentro(result.toArray().map((row: any) => row.toJSON()));
      await conn.close();
    } catch (err) { console.error(err); } finally { setCargandoEntornos(false); }
  };

  const explorarLakehouse = async (idLakehouse: string) => {
    if (!duckDb) return;
    setIdLakehouseActual(idLakehouse);
    setTablaActiva(null); // Ocultar tabla activa si se elige otro lakehouse
    setCargandoActivos(true);
    try {
      const conn = await duckDb.connect();
      const queryActivos = `SELECT nombre_tabla AS nombre_del_activo, total_registros AS cantidad_de_registros, fecha_inicio AS primera_medicion, fecha_fin AS ultima_medicion, col_temporal AS columna_de_tiempo FROM Activo_fisico WHERE lakehouse_id = '${idLakehouse}' ORDER BY cantidad_de_registros DESC;`;
      const result = await conn.query(queryActivos);
      setActivosLakehouse(result.toArray().map((row: any) => row.toJSON()));
      await conn.close();
    } catch (err) { console.error(err); } finally { setCargandoActivos(false); }
  };

  // -- NUEVO MANEJADOR: EXPLORAR TABLA (NIVEL 4) --
  const explorarTabla = async (activo: any) => {
    if (!duckDb || !idLakehouseActual) return;
    setTablaActiva(activo);
    setCargandoDetalleTabla(true);
    
    try {
      const conn = await duckDb.connect();
      
      // 1. Campo Estructural
      const qCampos = `SELECT nombre_campo AS columna, tipo_dato AS tipo, es_nullable AS permite_nulos, es_temporal AS es_marcador_de_tiempo FROM Campo_estructural WHERE lakehouse_id = '${idLakehouseActual}' AND nombre_tabla = '${activo.nombre_del_activo}' ORDER BY es_temporal DESC, nombre_campo ASC;`;
      
      // 2. Linaje y Entornos (Tablas en común)
      const qLinaje = `SELECT a.lakehouse_id AS entorno_donde_existe, e.capa AS nivel_de_limpieza, e.ambiente AS ambiente, a.total_registros FROM Activo_fisico a JOIN Entorno_datos e ON a.lakehouse_id = e.lakehouse_id WHERE a.nombre_tabla = '${activo.nombre_del_activo}' AND a.lakehouse_id != '${idLakehouseActual}';`;
      
      // 3. Contexto Conceptual (Metadatos)
      const qMeta = `SELECT DISTINCT m.id_saviia AS id_del_catalogo, m.title AS nombre_del_estudio, m.author AS investigador, m.dsdescriptionvalue AS descripcion FROM Metadata m WHERE m.title LIKE '%${activo.nombre_del_activo}%' OR m.id_saviia = 'ds_pat_meteo';`;

      // Ejecución paralela
      const [resCampos, resLinaje, resMeta] = await Promise.all([
        conn.query(qCampos), conn.query(qLinaje), conn.query(qMeta)
      ]);

      setDetalleTabla({
        campos: resCampos.toArray().map((r: any) => r.toJSON()),
        linaje: resLinaje.toArray().map((r: any) => r.toJSON()),
        metadatos: resMeta.toArray().map((r: any) => r.toJSON())
      });

      await conn.close();
    } catch (err) { console.error("Error profundizando en tabla:", err); } 
    finally { setCargandoDetalleTabla(false); }
  };

  const cerrarDetalle = () => {
    setDetalleSeleccionado(null);
    setEntornosCentro(null);
    setActivosLakehouse(null);
    setIdLakehouseActual(null);
    setTablaActiva(null);
    setCurrentMapStyle(DEFAULT_MAP_STYLE);
    mapRef.current?.flyTo({ center: [-71.0, -39.0], zoom: 4, bearing: 90, duration: 1000, padding: { right: 0, left: 0, top: 0, bottom: 0 } });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      
      {loading && <div className="absolute z-50 top-10 left-10 bg-white px-4 py-2 text-black rounded-md shadow-md border border-gray-100">Iniciando catálogo...</div>}
      
      {detalleSeleccionado && (
        <button onClick={cerrarDetalle} className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white transition-colors rounded-md text-sm font-medium border border-gray-200 shadow-sm text-gray-800">
          ← Volver al mapa
        </button>
      )}

      {/* MAPA BASE */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Map 
          ref={mapRef} 
          initialViewState={{ longitude: -71.0, latitude: -39.0, zoom: 4, bearing: 90, pitch: 0 }} 
          style={{ width: "100%", height: "100%" }} 
          mapStyle={currentMapStyle} 
          minZoom={1} 
          maxZoom={10} 
          interactiveLayerIds={["marcadores-layer"]} 
          onClick={onMapClick} 
          cursor={cursor} 
          onMouseMove={(e) => {
            const feature = e.features?.[0];
            if (feature) {
              setCursor("pointer");
              const coords = (feature.geometry as any).coordinates;
              setHoverInfo({
                longitude: coords[0],
                latitude: coords[1],
                nombre: feature.properties?.nombre
              });
            } else {
              setCursor("grab");
              setHoverInfo(null);
            }
          }}
          onMouseLeave={() => {
            setCursor("grab");
            setHoverInfo(null);
          }}
        >
          {hoverInfo && (
            <Popup
              longitude={hoverInfo.longitude}
              latitude={hoverInfo.latitude}
              closeButton={false}
              closeOnClick={false}
              anchor="bottom"
              offset={10}
              className="custom-tooltip z-50"
            >
              <div className="px-2.5 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-400 rounded-md shadow-md">
                {hoverInfo.nombre}
              </div>
            </Popup>
          )}
          <NavigationControl position="bottom-left" />
          {maskData && <Source id="world-mask" type="geojson" data={maskData}><Layer id="mask-layer" type="fill" paint={{ "fill-color": detalleSeleccionado ? "#a8c5ed" : "#ffffff", "fill-color-transition": { duration: 1000 }, "fill-opacity": 1 }} /></Source>}
          {chileOutline && <Source id="chile-border" type="geojson" data={chileOutline}><Layer id="border-layer" type="line" paint={{ "line-color": "#000000", "line-width": 1, "line-opacity": 0.15 }} /></Source>}
          {geojsonPuntos && <Source id="duckdb-marcadores" type="geojson" data={geojsonPuntos as any}><Layer id="marcadores-layer" type="circle" paint={{ "circle-radius": 7, "circle-color": "#ea580c", "circle-stroke-width": 1.5, "circle-stroke-color": "#ffffff" }} /></Source>}
        </Map>
      </div>

      {/* PANEL DESLIZANTE DERECHO */}
      <div className={`absolute top-0 right-0 h-full w-2/3 bg-white border-l border-gray-200 shadow-2xl transition-transform duration-700 ease-in-out z-20 overflow-hidden flex flex-row ${detalleSeleccionado ? "translate-x-0" : "translate-x-full"}`}>
        
        {detalleSeleccionado && (
          <>
            {/* COLUMNA 1: FICHA DATASET (Nivel 1) */}
            <div className={`h-full overflow-y-auto transition-all duration-500 ease-in-out border-r border-gray-200 ${!entornosCentro ? 'w-full p-8 md:p-12 opacity-100' : (entornosCentro && !activosLakehouse) ? 'w-1/2 p-8 md:p-12 opacity-100' : 'w-0 p-0 opacity-0 overflow-hidden border-r-0'}`}>
              {/* Contenido de la Ficha Dataset (Igual que antes) */}
              <article className="max-w-3xl mx-auto whitespace-nowrap min-w-[400px]">
                <header className="mb-8 border-b border-gray-200 pb-8 text-wrap">
                  <div className="flex flex-col 2xl:flex-row 2xl:items-start justify-between gap-6 mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 flex-1 break-words">{detalleSeleccionado.nombre_dataset || "Sin Título"}</h1>
                    {idCentroActual && !entornosCentro && (
                      <button onClick={explorarCentro} disabled={cargandoEntornos} className="shrink-0 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold transition-colors shadow-sm">{cargandoEntornos ? 'Consultando...' : 'Explorar Arquitectura'}</button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><strong className="font-semibold text-gray-900">Estación:</strong> <span className="break-words">{detalleSeleccionado.nombre_estacion}</span></span>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1"><strong className="font-semibold text-gray-900">ID:</strong> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{detalleSeleccionado.id_dataset}</code></span>
                  </div>
                </header>
                <section className="grid grid-cols-1 gap-6 mb-10 bg-gray-50 p-6 rounded-lg border border-gray-100 text-wrap">
                  <div><h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Resumen Temático</h3><p className="font-medium text-gray-900">{detalleSeleccionado.resumen_tematico || "No especificado"}</p></div>
                </section>
                <section className="prose prose-gray max-w-none text-black text-wrap">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Descripción</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{detalleSeleccionado.descripcion_detallada || "Sin descripción disponible."}</p>
                </section>
              </article>
            </div>

            {/* COLUMNA 2: ARQUITECTURA (Lakehouses - Nivel 2) */}
            {entornosCentro && (
              <div className={`h-full overflow-y-auto transition-all duration-500 ease-in-out border-r border-gray-200 ${activosLakehouse ? 'w-1/3 bg-white p-6' : 'w-1/2 bg-gray-50 p-8 md:p-12'}`}>
                <div className={`flex items-center justify-between mb-6 pb-4 border-b border-gray-200 ${activosLakehouse ? 'mt-4' : ''}`}>
                  <h2 className={`${activosLakehouse ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 transition-all`}>Entornos</h2>
                  {!activosLakehouse && <button onClick={() => setEntornosCentro(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>}
                </div>
                <div className="flex flex-col gap-4">
                  {entornosCentro.map((entorno, idx) => {
                    const isSelected = idLakehouseActual === entorno.id_contenedor;
                    return (
                      <div key={idx} onClick={() => explorarLakehouse(entorno.id_contenedor)} className={`p-5 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md scale-[1.02]' : 'border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-gray-300'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2.5 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wide ${entorno.capa_de_datos === 'Bronze' ? 'bg-amber-100 text-amber-800 border border-amber-200' : entorno.capa_de_datos === 'Silver' ? 'bg-slate-100 text-slate-700 border border-slate-300' : entorno.capa_de_datos === 'Gold' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 'bg-gray-100 text-gray-800'}`}>{entorno.capa_de_datos}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold ${entorno.ambiente_ejecucion === 'PROD' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{entorno.ambiente_ejecucion}</span>
                        </div>
                        <h4 className={`font-mono text-xs sm:text-sm font-semibold mb-1 break-all ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{entorno.id_contenedor}</h4>
                        <p className={`text-xs flex items-center gap-2 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}><span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-gray-400'}`}></span>{entorno.tipo_tecnologico}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COLUMNA 3: ACTIVOS Y DETALLES (Nivel 3 y 4) */}
            {activosLakehouse && (
              <div className="w-2/3 h-full overflow-y-auto bg-gray-50 p-8 md:p-12 relative animate-in slide-in-from-right-8 fade-in duration-500">
                
                {/* --- RENDERIZADO CONDICIONAL: SI HAY UNA TABLA ACTIVA MOSTRAMOS EL DETALLE --- */}
                {tablaActiva ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <button 
                      onClick={() => setTablaActiva(null)}
                      className="mb-6 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      ← Volver a la lista de tablas
                    </button>
                    
                    <div className="mb-8 border-b border-gray-200 pb-6">
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Explorador de Activo</p>
                      <h2 className="text-3xl font-bold text-gray-900 font-mono mb-3">{tablaActiva.nombre_del_activo}</h2>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
                        {tablaActiva.cantidad_de_registros ? tablaActiva.cantidad_de_registros.toLocaleString('es-CL') : 0} Registros
                      </span>
                    </div>

                    {cargandoDetalleTabla ? (
                      <p className="text-gray-500 animate-pulse mt-10 text-center">Analizando Grafo de Conocimiento...</p>
                    ) : (
                      <div className="space-y-10">
                        {/* RESULTADO QUERY 1: Campo Estructural */}
                        <section>
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            1. Esquema Estructural <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{detalleTabla?.campos?.length || 0} Columnas</span>
                          </h3>
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Columna</th>
                                  <th className="px-4 py-3 font-semibold">Tipo</th>
                                  <th className="px-4 py-3 font-semibold">Nullable</th>
                                  <th className="px-4 py-3 font-semibold text-center">Es Temporal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {detalleTabla?.campos?.map((c, i) => (
                                  <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-2.5 font-mono text-gray-900">{c.columna}</td>
                                    <td className="px-4 py-2.5 text-blue-600 font-mono text-xs">{c.tipo}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{c.permite_nulos}</td>
                                    <td className="px-4 py-2.5 text-center">
                                      {c.es_marcador_de_tiempo === 'Sí' ? <span className="text-orange-500">⏱️</span> : <span className="text-gray-300">-</span>}
                                    </td>
                                  </tr>
                                ))}
                                {detalleTabla?.campos?.length === 0 && (
                                  <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">No hay campos estructurales registrados en el catálogo.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        {/* RESULTADO QUERY 2: Linaje (Dónde más existe) */}
                        <section>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">2. Linaje y Disponibilidad</h3>
                          {detalleTabla?.linaje?.length === 0 ? (
                            <p className="text-gray-500 italic text-sm">Esta tabla solo existe en el entorno actual.</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {detalleTabla?.linaje?.map((l, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                                  <div className={`absolute top-0 right-0 bottom-0 w-1 ${l.nivel_de_limpieza === 'Bronze' ? 'bg-amber-400' : l.nivel_de_limpieza === 'Silver' ? 'bg-slate-400' : 'bg-yellow-400'}`}></div>
                                  <p className="text-xs font-bold text-gray-500 mb-1">TAMBIÉN EXISTE EN</p>
                                  <h4 className="font-mono text-sm font-bold text-gray-900 mb-2">{l.entorno_donde_existe}</h4>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Capa {l.nivel_de_limpieza}</span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{l.ambiente}</span>
                                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-semibold">{l.total_registros?.toLocaleString('es-CL')} Regs.</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </section>

                        {/* RESULTADO QUERY 3: Contexto Conceptual */}
                        <section>
                          <h3 className="text-xl font-bold text-gray-900 mb-4">3. Contexto Lógico Relacionado</h3>
                          <div className="space-y-4">
                            {detalleTabla?.metadatos?.map((m, i) => (
                              <div key={i} className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg">
                                <span className="text-indigo-600 text-xs font-bold uppercase tracking-wide">Catálogo de Investigaciones</span>
                                <h4 className="text-lg font-bold text-gray-900 mt-1 mb-2">{m.nombre_del_estudio}</h4>
                                <p className="text-sm text-gray-700 mb-3 line-clamp-3">{m.descripcion || "Sin descripción conceptual."}</p>
                                <div className="flex gap-4 text-xs font-medium text-gray-600">
                                  <span>ID: {m.id_del_catalogo}</span>
                                  <span>Investigador: {m.investigador || "N/A"}</span>
                                </div>
                              </div>
                            ))}
                            {detalleTabla?.metadatos?.length === 0 && (
                               <p className="text-gray-500 italic text-sm">No se encontraron metadatos conceptuales asociados directamente.</p>
                            )}
                          </div>
                        </section>
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- VISTA NORMAL: LISTA DE TABLAS (NIVEL 3) --- */
                  <div className="animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider">Activos Físicos</p>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-mono">{idLakehouseActual}</h2>
                      </div>
                      <button onClick={() => {setActivosLakehouse(null); setIdLakehouseActual(null);}} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                    </div>

                    {cargandoActivos ? (
                      <p className="text-gray-500 animate-pulse">Consultando el catálogo interno...</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {activosLakehouse?.length === 0 ? (
                          <div className="text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
                            <p className="text-gray-500 italic">No hay tablas registradas en este contenedor.</p>
                          </div>
                        ) : (
                          activosLakehouse?.map((activo, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => explorarTabla(activo)}
                              className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                            >
                              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                                  {activo.nombre_del_activo}
                                </h3>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  {activo.cantidad_de_registros ? activo.cantidad_de_registros.toLocaleString('es-CL') : 0} Registros
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                                <div>
                                  <span className="block text-gray-500 font-semibold mb-1 text-xs uppercase">Cobertura Temporal</span>
                                  <span className="text-gray-900 font-medium">
                                    {formatearFecha(activo.primera_medicion)} → {formatearFecha(activo.ultima_medicion)}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-gray-500 font-semibold mb-1 text-xs uppercase">Columna de Partición/Tiempo</span>
                                  <code className="text-gray-800 bg-white border border-gray-200 px-2 py-0.5 rounded">{activo.columna_de_tiempo || "N/A"}</code>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}