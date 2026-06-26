import { useState, useEffect } from "react";
import type { StyleSpecification } from "maplibre-gl";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";

const DEFAULT_MAP_STYLE_URL = `https://api.maptiler.com/maps/019e8e0d-6eac-7277-94ee-b39ae7dc292d/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;
const OUTDOOR_MAP_STYLE_URL = `https://api.maptiler.com/maps/outdoor-v4/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

export type MapLibreStyle = StyleSpecification | any;
export type MaskGeoJSON = FeatureCollection<Polygon | MultiPolygon> | any;

export function useMapStyles() {
  const [defaultStyle, setDefaultStyle] = useState<MapLibreStyle>(DEFAULT_MAP_STYLE_URL);
  const [outdoorStyle, setOutdoorStyle] = useState<MapLibreStyle>(OUTDOOR_MAP_STYLE_URL);
  const [maskData, setMaskData] = useState<MaskGeoJSON>(null);
  const [errorStyles, setErrorStyles] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [defaultRes, outdoorRes, maskRes] = await Promise.all([
          fetch(DEFAULT_MAP_STYLE_URL),
          fetch(OUTDOOR_MAP_STYLE_URL),
          fetch("/chile_mask.geojson")
        ]);

        if (defaultRes.ok) {
          const defaultJson = await defaultRes.json();
          setDefaultStyle(defaultJson);
        }

        if (outdoorRes.ok) {
          const outdoorJson = await outdoorRes.json();
          setOutdoorStyle(outdoorJson);
        }

        if (maskRes.ok) {
          const maskJson = await maskRes.json();
          setMaskData(maskJson);
        }
      } catch (e) {
        console.error("Error cargando estilos o geojson:", e);
        setErrorStyles("Error cargando los estilos del mapa. Por favor, refresca la página.");
      }
    };

    fetchResources();
  }, []);

  return { defaultStyle, outdoorStyle, maskData, errorStyles };
}
