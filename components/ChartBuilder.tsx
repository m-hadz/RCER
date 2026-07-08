"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { obtenerDatosParaGrafico } from "@/lib/duckdb";

const Plot = dynamic(() => import("react-plotly.js"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded-lg">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    )
});

interface Campo {
    nombre_columna: string;
    tipo_dato: string;
    es_nullable: boolean;
    es_temporal: boolean | null;
}

interface ChartBuilderProps {
    tablaNombre: string;
    lakehouseId: string;
    campos: Campo[];
}

export interface WindRoseConfig {
    numBins?: number;
    resolution?: number;
    baseColorHSL?: { h: number, s: number, lStart: number, lEnd: number };
}

export default function ChartBuilder({ tablaNombre, lakehouseId, campos }: ChartBuilderProps) {
    const [tipoGrafico, setTipoGrafico] = React.useState<string>("");
    const [ejeX, setEjeX] = React.useState<string>("");
    const [ejeY, setEjeY] = React.useState<string>("");
    const [cargandoDatos, setCargandoDatos] = React.useState<boolean>(false);
    const [datosGrafico, setDatosGrafico] = React.useState<any[] | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const columnasTemporales = campos.filter(c => c.es_temporal);
    const columnasNumericas = campos.filter(c =>
        c.tipo_dato.toLowerCase().includes('int') ||
        c.tipo_dato.toLowerCase().includes('float') ||
        c.tipo_dato.toLowerCase().includes('double') ||
        c.tipo_dato.toLowerCase().includes('numeric') ||
        c.tipo_dato.toLowerCase().includes('decimal')
    );

    React.useEffect(() => {
        if (tipoGrafico === "line" && columnasTemporales.length > 0 && !ejeX) {
            setEjeX(columnasTemporales[0].nombre_columna);
        }
    }, [tipoGrafico, columnasTemporales, ejeX]);

    const handleGenerarGrafico = async () => {
        if (!tipoGrafico || !ejeX || !ejeY) return;

        setCargandoDatos(true);
        setError(null);

        try {
            const datos = await obtenerDatosParaGrafico(lakehouseId, tablaNombre, [ejeX, ejeY]);
            setDatosGrafico(datos);
        } catch (err: any) {
            setError(err.message || "Error al obtener los datos del Lakehouse.");
        } finally {
            setCargandoDatos(false);
        }
    };

    const processWindRose = (data: any[], colDirection: string, colSpeed: string, config: WindRoseConfig = {}) => {
        const {
            numBins = 5,
            resolution = 16,
            baseColorHSL = { h: 3, s: 80, lStart: 90, lEnd: 30 }
        } = config;

        let minSpeed = Infinity;
        let maxSpeed = -Infinity;
        const validData: { degrees: number, speed: number }[] = [];

        data.forEach(d => {
            const degrees = parseFloat(d[colDirection]);
            const speed = parseFloat(d[colSpeed]);
            if (!isNaN(degrees) && !isNaN(speed)) {
                validData.push({ degrees, speed });
                if (speed < minSpeed) minSpeed = speed;
                if (speed > maxSpeed) maxSpeed = speed;
            }
        });

        if (validData.length === 0) return [];
        if (minSpeed === maxSpeed) {
            minSpeed = Math.max(0, minSpeed - 1);
            maxSpeed = maxSpeed + 1;
        }

        const rangeStep = (maxSpeed - minSpeed) / numBins;
        const speedRanges = Array.from({ length: numBins }, (_, i) => {
            const min = minSpeed + i * rangeStep;
            const isLast = i === numBins - 1;
            const max = isLast ? Infinity : min + rangeStep;
            const displayMax = min + rangeStep;
            
            const l = baseColorHSL.lStart - (i / Math.max(1, numBins - 1)) * (baseColorHSL.lStart - baseColorHSL.lEnd);
            const color = `hsl(${baseColorHSL.h}, ${baseColorHSL.s}%, ${l}%)`;
            
            return {
                name: isLast ? `> ${min.toFixed(1)}` : `${min.toFixed(1)} - ${displayMax.toFixed(1)}`,
                min,
                max,
                color
            };
        });

        const sectorAngle = 360 / resolution;
        const directions = Array.from({ length: resolution }, (_, i) => {
            if (resolution === 16) {
                return ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][i];
            } else if (resolution === 8) {
                return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][i];
            }
            return `${(i * sectorAngle).toFixed(1)}°`;
        });

        const groupedData: Record<string, number[]> = {};
        speedRanges.forEach(r => groupedData[r.name] = new Array(resolution).fill(0));

        validData.forEach(({ degrees, speed }) => {
            let dirIndex = Math.floor(((degrees + (sectorAngle / 2)) % 360) / sectorAngle);
            if (dirIndex === resolution) dirIndex = 0;

            const range = speedRanges.find(r => speed >= r.min && speed < r.max) || speedRanges[speedRanges.length - 1];
            groupedData[range.name][dirIndex] += 1;
        });

        return speedRanges.map(range => ({
            r: groupedData[range.name],
            theta: directions,
            name: range.name,
            type: "barpolar",
            marker: { color: range.color, line: { color: 'white', width: 0.5 } }
        }));
    };

    const generarTraces = (): any[] => {
        if (!datosGrafico) return [];

        if (tipoGrafico === "windrose") {
            return processWindRose(datosGrafico, ejeX, ejeY);
        }

        const xValues = datosGrafico.map(d => d[ejeX] || d.x);
        const yValues = datosGrafico.map(d => d[ejeY] || d.y);

        if (tipoGrafico === "density") {
            return [{ x: xValues, y: yValues, type: "histogram2dcontour", colorscale: "Viridis" }];
        }

        if (tipoGrafico === "violin") {
            return [{ x: xValues, y: yValues, type: "violin", box: { visible: true }, meanline: { visible: true }, points: "outliers", line: { color: '#8b5cf6' } }];
        }

        if (tipoGrafico === "bar_avg") {
            return [{ x: xValues, y: yValues, type: "histogram", histfunc: "avg", marker: { color: '#f59e0b', line: { color: 'white', width: 1 } } }];
        }

        const plotlyType = tipoGrafico === "line" || tipoGrafico === "scatter" ? "scatter" :
                           tipoGrafico === "box" ? "box" :
                           tipoGrafico === "bar" ? "bar" : "scatter";

        const plotlyMode = tipoGrafico === "line" ? "lines" :
                           tipoGrafico === "scatter" ? "markers" : undefined;

        return [{ x: xValues, y: yValues, type: plotlyType, mode: plotlyMode, marker: { color: '#3b82f6' }, line: { color: '#3b82f6', width: 2 } }];
    };

    const generarLayout = () => {
        const baseLayout = {
            title: `Visualización de ${tablaNombre}`,
            autosize: true,
            margin: { l: 50, r: 30, t: 50, b: 50 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };

        if (tipoGrafico === "windrose") {
            return {
                ...baseLayout,
                barmode: "stack",
                showlegend: true,
                polar: {
                    angularaxis: { direction: "clockwise" },
                    radialaxis: { angle: 90 }
                }
            };
        }

        return {
            ...baseLayout,
            xaxis: { title: ejeX, automargin: true },
            yaxis: { title: ejeY, automargin: true }
        };
    };

    return (
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Gráfico</label>
                    <select
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={tipoGrafico}
                        onChange={(e) => setTipoGrafico(e.target.value)}
                    >
                        <option value="">Selecciona un tipo...</option>
                        <optgroup label="Básicos">
                            <option value="line">Líneas (Serie temporal)</option>
                            <option value="bar">Barras (Cantidades brutas)</option>
                            <option value="scatter">Dispersión (Correlación)</option>
                        </optgroup>
                        <optgroup label="Estadísticos / Agregaciones">
                            <option value="bar_avg">Barras (Promedio por categoría)</option>
                            <option value="box">Cajas y Bigotes (Mediana y cuartiles)</option>
                            <option value="violin">Violín (Densidad y Promedios)</option>
                        </optgroup>
                        <optgroup label="Científicos / Meteorológicos">
                            <option value="windrose">Rosa de los Vientos (Polar)</option>
                            <option value="density">Mapa de Densidad (Concentración)</option>
                        </optgroup>
                    </select>
                </div>

                {tipoGrafico && (
                    <div className="animate-in fade-in duration-300">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            {tipoGrafico === 'windrose' ? 'Dirección (Ángulo)' : 'Eje X (Dimensión)'}
                        </label>
                        <select
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            value={ejeX}
                            onChange={(e) => setEjeX(e.target.value)}
                        >
                            <option value="">Selecciona columna...</option>
                            {campos.map(c => (
                                <option
                                    key={c.nombre_columna}
                                    value={c.nombre_columna}
                                    disabled={c.nombre_columna === ejeY}
                                >
                                    {c.nombre_columna} {c.es_temporal ? '(⏱️)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {tipoGrafico && (
                    <div className="animate-in fade-in duration-300">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            {tipoGrafico === 'windrose' ? 'Magnitud (Radio/Velocidad)' : 'Eje Y (Métrica)'}
                        </label>
                        <select
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                            value={ejeY}
                            onChange={(e) => setEjeY(e.target.value)}
                        >
                            <option value="">Selecciona columna...</option>
                            {columnasNumericas.length > 0 ? (
                                <>
                                    <optgroup label="Recomendados (Numéricos)">
                                        {columnasNumericas.map(c => (
                                            <option
                                                key={c.nombre_columna}
                                                value={c.nombre_columna}
                                                disabled={c.nombre_columna === ejeX}
                                            >
                                                {c.nombre_columna}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Otras columnas">
                                        {campos.filter(c => !columnasNumericas.includes(c)).map(c => (
                                            <option
                                                key={c.nombre_columna}
                                                value={c.nombre_columna}
                                                disabled={c.nombre_columna === ejeX}
                                            >
                                                {c.nombre_columna}
                                            </option>
                                        ))}
                                    </optgroup>
                                </>
                            ) : (
                                campos.map(c => (
                                    <option
                                        key={c.nombre_columna}
                                        value={c.nombre_columna}
                                        disabled={c.nombre_columna === ejeX}
                                    >
                                        {c.nombre_columna}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="text-sm text-red-500 font-semibold">
                    {error && <span>{error}</span>}
                </div>

                <button
                    onClick={handleGenerarGrafico}
                    disabled={!tipoGrafico || !ejeX || !ejeY || cargandoDatos}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                    {cargandoDatos ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Procesando...
                        </>
                    ) : (
                        "Visualizar Datos"
                    )}
                </button>
            </div>

            {(datosGrafico || cargandoDatos) && (
                <div className="mt-6 relative border border-gray-200 rounded-lg overflow-hidden bg-white min-h-[400px]">

                    {cargandoDatos && (
                        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-semibold text-blue-700 bg-white px-3 py-1 rounded-full shadow-sm">
                                Procesando nuevos datos...
                            </p>
                        </div>
                    )}

                    {datosGrafico && (
                        <div className={cargandoDatos ? "opacity-50 blur-sm pointer-events-none transition-all duration-300" : "opacity-100 animate-in fade-in duration-500"}>
                            <Plot
                                data={generarTraces()}
                                layout={generarLayout()}
                                useResizeHandler={true}
                                style={{ width: "100%", height: "400px" }}
                                config={{ responsive: true, displayModeBar: true }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}