import * as React from "react";
import { MapRef } from "react-map-gl/maplibre";

export interface FilaMarcador {
    latitud?: number | string | null;
    longitud?: number | string | null;
    workspace_id: string;
    nombre: string;
    [key: string]: unknown;
}

export interface GeoJSONFeature {
    type: "Feature";
    id: number;
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: {
        workspace_id: string;
        nombre: string;
    };
}

export interface GeoJSONFeatureCollection {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
}

export interface HoverInfo {
    longitude: number;
    latitude: number;
    nombre?: string;
}

export interface MapViewState {
    longitude: number;
    latitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
}

export interface FlightOptions {
    center: [number, number];
    zoom: number;
    bearing: number;
    padding: { right: number; left: number; top: number; bottom: number };
    duration?: number;
    curve?: number;
}

export interface JumpOptions {
    center: [number, number];
    zoom: number;
    bearing: number;
    padding: { right: number; left: number; top: number; bottom: number };
    pitch?: number;
}

export function useMapManager(filas: FilaMarcador[]) {
    const mapRefDefault = React.useRef<MapRef | null>(null);
    const mapRefOutdoor = React.useRef<MapRef | null>(null);
    const pendingOutdoorFlight = React.useRef<JumpOptions | null>(null);

    const [isOutdoorMode, setIsOutdoorMode] = React.useState<boolean>(false);
    const [outdoorInitialState, setOutdoorInitialState] = React.useState<MapViewState | null>(null);
    const [isAnimatingMap, setIsAnimatingMap] = React.useState<boolean>(false);
    const [cursor, setCursor] = React.useState<string>("grab");
    const [hoverInfo, setHoverInfo] = React.useState<HoverInfo | null>(null);

    const geojsonPuntos = React.useMemo<GeoJSONFeatureCollection | null>(() => {
        if (!filas || filas.length === 0) return null;
        return {
            type: "FeatureCollection",
            features: filas.filter((f) => f.latitud != null && f.longitud != null).map((f, index) => ({
                type: "Feature",
                id: index,
                geometry: { type: "Point", coordinates: [Number(f.longitud), Number(f.latitud)] },
                properties: { 
                    workspace_id: f.workspace_id, 
                    nombre: f.nombre,
                    ...(f.url_foto_principal ? { imagen_url: f.url_foto_principal } : {})
                },
            })),
        };
    }, [filas]);

    const syncMaps = (sourceRef: React.RefObject<MapRef | null>, targetRef: React.RefObject<MapRef | null>) => {
        const source = sourceRef.current?.getMap();
        const target = targetRef.current?.getMap();
        if (source && target) {
            target.jumpTo({
                center: source.getCenter(),
                zoom: source.getZoom(),
                bearing: source.getBearing(),
                pitch: source.getPitch(),
                padding: source.getPadding()
            });
        }
    };

    const cerrarDetalle = () => {
        setIsOutdoorMode(false);
        setIsAnimatingMap(true);

        setTimeout(() => {
            const targetState: FlightOptions = {
                center: [-71.0, -39.0],
                zoom: 4,
                bearing: 90,
                padding: { right: 0, left: 0, top: 0, bottom: 0 },
                duration: 1000,
                curve: 0.5
            };

            try {
                mapRefDefault.current?.getMap().resize();
            } catch (e) { }
            mapRefDefault.current?.easeTo(targetState as any);
        }, 200);

        setTimeout(() => {
            setOutdoorInitialState(null);
        }, 500);

        setTimeout(() => {
            setIsAnimatingMap(false);
        }, 1200);
    };

    const seleccionarPunto = async (workspace_id: string | null, targetLng: number, targetLat: number) => {
        if (!workspace_id) return;

        const hasCoords = targetLng != null && targetLat != null && !isNaN(targetLng) && !isNaN(targetLat) && targetLng !== 0 && targetLat !== 0;

        if (hasCoords) {
            const rightPadding = typeof window !== 'undefined' ? window.innerWidth * 0.66 : 0;
            const flightOptions: FlightOptions = {
                center: [targetLng, targetLat],
                zoom: 6.5,
                bearing: 0,
                padding: { right: rightPadding, left: 0, top: 0, bottom: 0 },
                duration: 1000
            };

            setIsAnimatingMap(true);

            if (!outdoorInitialState) {
                setOutdoorInitialState({ longitude: targetLng, latitude: targetLat, zoom: 6.5, bearing: 0, pitch: 0 });
                const { duration, curve, ...jumpOptions } = flightOptions;
                pendingOutdoorFlight.current = jumpOptions;
            } else {
                const { duration, curve, ...jumpOptions } = flightOptions;
                mapRefOutdoor.current?.jumpTo(jumpOptions as any);
            }

            setTimeout(() => {
                mapRefDefault.current?.easeTo(flightOptions as any);
            }, 50);

            setTimeout(() => {
                setIsOutdoorMode(true);
                setIsAnimatingMap(false);
            }, 1000);
        } else {
            setIsOutdoorMode(true);
        }
    };

    return {
        mapRefDefault,
        mapRefOutdoor,
        pendingOutdoorFlight,
        isOutdoorMode,
        setIsOutdoorMode,
        outdoorInitialState,
        setOutdoorInitialState,
        isAnimatingMap,
        cursor,
        setCursor,
        hoverInfo,
        setHoverInfo,
        geojsonPuntos,
        syncMaps,
        seleccionarPunto,
        cerrarDetalle
    };
}