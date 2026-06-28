import * as React from "react";
import Map, { NavigationControl, Source, Layer, Popup, MapRef, MapLayerMouseEvent, Marker } from "react-map-gl/maplibre";
import { HoverInfo, GeoJSONFeatureCollection, JumpOptions, MapViewState } from "@/hooks/useMapManager";

export interface VisorMapasProps {
  mapRefDefault: React.RefObject<MapRef | null>;
  mapRefOutdoor: React.RefObject<MapRef | null>;
  isOutdoorMode: boolean;
  outdoorInitialState: MapViewState | null;
  outdoorStyle: any;
  defaultStyle: any;
  seleccionarPunto: (workspace_id: string | null, targetLng: number, targetLat: number) => void;
  cursor: string;
  setCursor: (val: string) => void;
  hoverInfo: HoverInfo | null;
  setHoverInfo: (info: HoverInfo | null) => void;
  pendingOutdoorFlight: React.MutableRefObject<JumpOptions | null>;
  syncMaps: (source: React.RefObject<MapRef | null>, target: React.RefObject<MapRef | null>) => void;
  maskData: any;
  geojsonPuntos: GeoJSONFeatureCollection | null;
  isAnimatingMap: boolean;
}

import { useCatalogContext } from "@/contexts/CatalogContext";

const CHILE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-110, -60],
  [-30, -18]
];

export default function VisorMapas({
  mapRefDefault,
  mapRefOutdoor,
  isOutdoorMode,
  outdoorInitialState,
  outdoorStyle,
  defaultStyle,
  seleccionarPunto,
  cursor,
  setCursor,
  hoverInfo,
  setHoverInfo,
  pendingOutdoorFlight,
  syncMaps,
  maskData,
  geojsonPuntos,
  isAnimatingMap,
}: VisorMapasProps) {

  const { detalleSeleccionado, selectedWorkspaceId, searchMinimized } = useCatalogContext();
  const [mapaCargado, setMapaCargado] = React.useState(false);
  const handleMouseMove = React.useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature) {
      setCursor("pointer");
      const coords = (feature.geometry as any).coordinates;
      setHoverInfo({ longitude: coords[0], latitude: coords[1], nombre: feature.properties?.nombre });
    } else {
      setCursor("grab");
      setHoverInfo(null);
    }
  }, [setCursor, setHoverInfo]);

  const handleMouseLeave = React.useCallback(() => {
    setCursor("grab");
    setHoverInfo(null);
  }, [setCursor, setHoverInfo]);

  const onMapClick = React.useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (!feature || feature.layer?.id !== "marcadores-layer") return;

    const { workspace_id } = feature.properties as any;
    const coords = (feature.geometry as any).coordinates;
    const targetLng = coords[0];
    const targetLat = coords[1];

    seleccionarPunto(workspace_id, targetLng, targetLat);
  }, [seleccionarPunto]);

  const mapLayers = (
    <>
      <NavigationControl position="bottom-left" />
      {maskData && (
        <Source id="world-mask" type="geojson" data={maskData}>
          <Layer id="mask-layer" type="fill" paint={{ "fill-color": detalleSeleccionado ? "#a8c5ed" : "#ffffff", "fill-color-transition": { duration: 1000 }, "fill-opacity": 1 }} />
        </Source>
      )}
      {geojsonPuntos && (
        <Source id="duckdb-marcadores" type="geojson" data={geojsonPuntos as any}>
          <Layer
            id="marcadores-layer"
            type="circle"
            paint={{
              "circle-radius": [
                "case",
                ["==", ["get", "workspace_id"], selectedWorkspaceId || ""],
                10,
                7
              ] as any,
              "circle-color": [
                "case",
                ["==", ["get", "workspace_id"], selectedWorkspaceId || ""],
                "#10b981",
                "#ea580c"
              ] as any,
              "circle-stroke-width": [
                "case",
                ["==", ["get", "workspace_id"], selectedWorkspaceId || ""],
                2.5,
                1.5
              ] as any,
              "circle-stroke-color": "#ffffff"
            }}
          />
        </Source>
      )}
      {(() => {
        if (selectedWorkspaceId) return null;

        const featuresWithImages = [...(geojsonPuntos?.features || [])]
          .filter(f => (f.properties as any).imagen_url)
          .sort((a, b) => (b.geometry as any).coordinates[1] - (a.geometry as any).coordinates[1]);

        return featuresWithImages.map((feature, index) => {
          const coords = (feature.geometry as any).coordinates;
          const { workspace_id, nombre, imagen_url } = feature.properties as any;

          const distance = 90 + (index % 4) * 65;
          const y2 = -distance;

          return (
            <Marker
              key={workspace_id}
              longitude={coords[0]}
              latitude={coords[1]}
              anchor="center"
            >
              <svg
                className="absolute pointer-events-none"
                style={{ overflow: 'visible', top: 0, left: 0 }}
              >
                <line x1="0" y1="-8" x2="0" y2={y2} stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 2" />
              </svg>

              <div
                className="absolute pointer-events-auto flex items-center gap-2"
                style={{ left: '-30px', top: `${y2 - 30}px` }}
                onClick={(e) => {
                  e.stopPropagation();
                  seleccionarPunto(workspace_id, coords[0], coords[1]);
                }}
                onMouseEnter={() => {
                  setCursor("pointer");
                }}
                onMouseLeave={() => {
                  setCursor("grab");
                }}
                onMouseMove={(e) => {
                  e.stopPropagation();
                }}
              >
                <div
                  className={`w-[60px] h-[60px] flex-shrink-0 rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer hover:scale-110 transition-transform ${selectedWorkspaceId === workspace_id ? "border-emerald-500 border-[4px]" : "border-slate-800 border-[3px]"}`}
                >
                  <img src={imagen_url} alt={nombre} className="w-full h-full object-cover pointer-events-none" />
                </div>

                <div className="px-1 py-1 pointer-events-none whitespace-nowrap">
                  <span
                    className="text-[13px] font-extrabold text-[#0066cc] uppercase tracking-wide"
                    style={{ WebkitTextStroke: '0.5px white', textShadow: '0px 1px 2px rgba(255,255,255,0.8)' }}
                  >
                    {nombre}
                  </span>
                </div>
              </div>
            </Marker>
          );
        });
      })()}
    </>
  );

  const renderPopup = () => {
    if (!hoverInfo) return null;
    return (
      <Popup longitude={hoverInfo.longitude} latitude={hoverInfo.latitude} closeButton={false} closeOnClick={false} anchor="bottom" offset={14} className="z-50 pointer-events-none custom-tooltip">
        <div className="px-3 py-1.5 text-sm font-bold text-gray-800 bg-white border border-gray-300 shadow-md rounded pointer-events-none">
          {hoverInfo.nombre || "Estación Desconocida"}
        </div>
      </Popup>
    );
  };

  return (
    <div className={`relative w-full h-full bg-gray-100 transition-all duration-700 ease-in-out border-t border-gray-200 ${mapaCargado ? "opacity-100" : "opacity-0"} ${isAnimatingMap ? "blur-[3px] scale-[1.01]" : "blur-0 scale-100"}`}>
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ease-in-out ${isOutdoorMode ? "opacity-100" : "opacity-0"}`}>
        {outdoorInitialState && (
          <Map
            ref={mapRefOutdoor}
            initialViewState={outdoorInitialState as any}
            style={{ width: "100%", height: "100%" }}
            mapStyle={outdoorStyle}
            minZoom={4} maxZoom={10}
            maxBounds={CHILE_MAX_BOUNDS}
            interactiveLayerIds={["marcadores-layer"]}
            onClick={onMapClick}
            cursor={cursor}
            onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
            onLoad={(e) => {
              if (pendingOutdoorFlight.current) {
                e.target.jumpTo(pendingOutdoorFlight.current as any);
                pendingOutdoorFlight.current = null;
              }
            }}
            onMove={(e) => { if (e.originalEvent && isOutdoorMode) syncMaps(mapRefOutdoor, mapRefDefault); }}
          >
            {isOutdoorMode && renderPopup()}
            {mapLayers}
          </Map>
        )}
      </div>

      <div className={`absolute inset-0 z-10 transition-opacity duration-500 ease-in-out ${isOutdoorMode ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <Map
          ref={mapRefDefault}
          initialViewState={{ longitude: -71.0, latitude: -39.0, zoom: 4, bearing: 90, pitch: 0 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={defaultStyle}
          minZoom={4} maxZoom={10}
          maxBounds={CHILE_MAX_BOUNDS}
          interactiveLayerIds={["marcadores-layer"]}
          onClick={onMapClick}
          onLoad={() => setMapaCargado(true)}
          cursor={cursor}
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
          onMove={(e) => { if (e.originalEvent && !isOutdoorMode && outdoorInitialState) syncMaps(mapRefDefault, mapRefOutdoor); }}
        >
          {!isOutdoorMode && renderPopup()}
          {mapLayers}
        </Map>
      </div>
    </div>
  );
}