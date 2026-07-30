"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  buildWeightChartAreaPath,
  buildWeightChartPath,
  buildWeightChartSeries,
} from "../application/weight-chart-series";
import { getWeightPlaceLabel } from "../application/weight-filter";
import { WeightEntry } from "../domain/weight-entry";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightChartProps = {
  birthDate: string;
  entries: WeightEntry[];
};

export function WeightChart({ birthDate, entries }: WeightChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ChartTooltipPoint | null>(null);
  const expandedChartRef = useRef<HTMLElement>(null);
  const series = buildWeightChartSeries(entries, birthDate);
  const path = buildWeightChartPath(series.points);
  const areaPath = buildWeightChartAreaPath(series.points);
  const firstPoint = series.points[0];
  const latestPoint = series.points.at(-1);
  const closeExpandedChart = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    expandedChartRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExpandedChart();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeExpandedChart, isExpanded]);

  if (series.points.length === 0) {
    return <p className={styles.empty}>No hay pesos para mostrar aquí.</p>;
  }

  return (
    <div className={styles.chart}>
      <div className={styles.chartHeader}>
        <p>Referencia OMS orientativa. No sustituye una revisión médica.</p>
        <button
          aria-label="Ver gráfica de peso a pantalla completa"
          className={styles.chartExpandButton}
          onClick={() => setIsExpanded(true)}
          type="button"
        >
          Ver grande
        </button>
      </div>
      <WeightChartSvg
        areaPath={areaPath}
        firstPoint={firstPoint}
        idPrefix="weight-chart"
        latestPoint={latestPoint}
        linePath={path}
        series={series}
        selectedPoint={selectedPoint}
        onPointSelect={setSelectedPoint}
      />
      <WeightChartLegend />
      <WeightChartMeta
        latestPoint={latestPoint}
        maxWeight={series.maxWeight}
        minWeight={series.minWeight}
      />

      {isExpanded ? (
        <div
          className={styles.chartFullscreenBackdrop}
          onClick={closeExpandedChart}
          role="presentation"
        >
          <section
            aria-labelledby="weight-chart-fullscreen-title"
            aria-modal="true"
            className={styles.chartFullscreen}
            onClick={(event) => event.stopPropagation()}
            ref={expandedChartRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className={styles.chartFullscreenHeader}>
              <div>
                <p>Peso</p>
                <h2 id="weight-chart-fullscreen-title">Evolución y referencia OMS</h2>
              </div>
              <button
                aria-label="Cerrar gráfica a pantalla completa"
                className={styles.chartCloseButton}
                onClick={closeExpandedChart}
                type="button"
              >
                Cerrar
              </button>
            </div>
            <div className={styles.chartFullscreenCanvas}>
              <WeightChartSvg
                areaPath={areaPath}
                firstPoint={firstPoint}
                idPrefix="weight-chart-fullscreen"
                latestPoint={latestPoint}
                linePath={path}
                series={series}
                selectedPoint={selectedPoint}
                onPointSelect={setSelectedPoint}
              />
            </div>
            <WeightChartLegend />
            <WeightChartMeta
              latestPoint={latestPoint}
              maxWeight={series.maxWeight}
              minWeight={series.minWeight}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

type WeightChartSvgProps = {
  areaPath: string;
  firstPoint: ReturnType<typeof buildWeightChartSeries>["points"][number] | undefined;
  idPrefix: string;
  latestPoint: ReturnType<typeof buildWeightChartSeries>["points"][number] | undefined;
  linePath: string;
  series: ReturnType<typeof buildWeightChartSeries>;
  selectedPoint: ChartTooltipPoint | null;
  onPointSelect: (point: ChartTooltipPoint | null) => void;
};

type ChartTooltipPoint =
  | {
      date: string;
      dateLabel: string;
      gramsPerDay: number | null;
      isEstimated: false;
      placeLabel: string;
      weightLabel: string;
      x: number;
      y: number;
    }
  | {
      date: string;
      dateLabel: string;
      gramsPerDay: number;
      isEstimated: true;
      placeLabel?: never;
      weightLabel: string;
      x: number;
      y: number;
    };

function WeightChartSvg({
  areaPath,
  firstPoint,
  idPrefix,
  latestPoint,
  linePath,
  series,
  selectedPoint,
  onPointSelect,
}: WeightChartSvgProps) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * series.chartWidth;

    onPointSelect(findNearestTooltipPoint(series, x));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    handlePointerMove(event);
  }

  return (
    <div
      aria-label="Evolución del peso. Desliza por la gráfica para consultar la estimación diaria."
      className={styles.chartCanvas}
      onPointerCancel={() => onPointSelect(null)}
      onPointerDown={handlePointerDown}
      onPointerLeave={() => onPointSelect(null)}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
    >
      <svg
        viewBox={`0 0 ${series.chartWidth} ${series.chartHeight}`}
        role="img"
        aria-labelledby={`${idPrefix}-title ${idPrefix}-description`}
      >
        <title id={`${idPrefix}-title`}>Evolución del peso de Irati</title>
        <desc id={`${idPrefix}-description`}>
          Peso entre {series.minWeight.toLocaleString("es-ES")} y{" "}
          {series.maxWeight.toLocaleString("es-ES")} gramos, con referencia OMS de peso para la edad
          en niñas.
        </desc>
        {series.ticks.map((tick) => (
          <g className={styles.chartTick} key={tick.value}>
            <line x1="42" y1={tick.y} x2="304" y2={tick.y} />
            <text x="34" y={tick.y + 4}>
              {tick.label}
            </text>
          </g>
        ))}
        {series.referenceCurves.map((curve) => {
          const referencePath = buildWeightChartPath(curve.points);
          const lastReferencePoint = curve.points.at(-1);

          return (
            <g className={styles.chartReferenceGroup} key={curve.label}>
              <path
                className={`${styles.chartReferenceCurve} ${
                  curve.label === "P50" ? styles.chartReferenceCurveMedian : ""
                }`}
                d={referencePath}
              />
              {lastReferencePoint ? (
                <text
                  className={styles.chartReferenceLabel}
                  textAnchor="end"
                  x={lastReferencePoint.x}
                  y={lastReferencePoint.y - 3}
                >
                  {curve.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {areaPath ? <path className={styles.chartArea} d={areaPath} /> : null}
        {linePath ? <path className={styles.chartLine} d={linePath} /> : null}
        {series.points.map((point) => {
          const isLatestPoint = latestPoint === point;

          return (
            <circle
              aria-label={`${point.dateLabel}, ${point.weightLabel}, ${getWeightPlaceLabel(point.place)}`}
              className={isLatestPoint ? styles.chartLatestPoint : styles.chartPoint}
              cx={point.x}
              cy={point.y}
              key={`${point.date}-${point.weightGrams}`}
              onFocus={() => onPointSelect(buildOfficialTooltipPoint(series, point))}
              r={isLatestPoint ? 5 : 3.8}
              tabIndex={0}
            />
          );
        })}
        {selectedPoint ? <ChartTooltip point={selectedPoint} /> : null}
        {firstPoint ? (
          <text className={styles.chartDate} x="42" y={series.chartHeight - 6}>
            Nacimiento
          </text>
        ) : null}
        {latestPoint && latestPoint !== firstPoint ? (
          <text
            className={styles.chartDate}
            textAnchor="end"
            x={latestPoint.x}
            y={series.chartHeight - 6}
          >
            {latestPoint.dateLabel}
          </text>
        ) : null}
      </svg>
    </div>
  );
}

function buildOfficialTooltipPoint(
  series: ReturnType<typeof buildWeightChartSeries>,
  point: ReturnType<typeof buildWeightChartSeries>["points"][number],
): ChartTooltipPoint {
  return {
    date: point.date,
    dateLabel: point.dateLabel,
    gramsPerDay:
      series.estimatePoints.find((estimate) => estimate.date === point.date)?.gramsPerDay ?? null,
    isEstimated: false,
    placeLabel: getWeightPlaceLabel(point.place),
    weightLabel: point.weightLabel,
    x: point.x,
    y: point.y,
  };
}

function findNearestTooltipPoint(
  series: ReturnType<typeof buildWeightChartSeries>,
  x: number,
): ChartTooltipPoint {
  const officialDates = new Set(series.points.map((point) => point.date));
  const candidates: ChartTooltipPoint[] = [
    ...series.points.map((point) => buildOfficialTooltipPoint(series, point)),
    ...series.estimatePoints
      .filter((point) => !officialDates.has(point.date))
      .map((point) => ({ ...point, isEstimated: true as const })),
  ];

  return candidates.reduce((nearest, point) =>
    Math.abs(point.x - x) < Math.abs(nearest.x - x) ? point : nearest,
  );
}

function ChartTooltip({ point }: { point: ChartTooltipPoint }) {
  const tooltipWidth = 126;
  const tooltipHeight = 58;
  const tooltipX = Math.min(Math.max(point.x - tooltipWidth / 2, 44), 304 - tooltipWidth);
  const tooltipY = Math.max(point.y - tooltipHeight - 4, 4);
  const pointType = point.isEstimated ? "Peso estimado" : `Registrado · ${point.placeLabel}`;
  const dailyRate =
    point.gramsPerDay === null
      ? "Sin estimación previa"
      : `${formatGramsPerDay(point.gramsPerDay)} g/día estimados`;

  return (
    <g className={styles.chartTooltip} pointerEvents="none">
      <rect height={tooltipHeight} rx="8" width={tooltipWidth} x={tooltipX} y={tooltipY} />
      <text x={tooltipX + 8} y={tooltipY + 16}>
        {point.dateLabel}
      </text>
      <text x={tooltipX + 8} y={tooltipY + 32}>
        {point.weightLabel} · {pointType}
      </text>
      <text x={tooltipX + 8} y={tooltipY + 48}>
        {dailyRate}
      </text>
    </g>
  );
}

function formatGramsPerDay(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })}`;
}

function WeightChartLegend() {
  return (
    <div className={styles.chartLegend} aria-label="Leyenda de la gráfica">
      <span className={styles.chartLegendWeight}>Peso registrado</span>
      <span className={styles.chartLegendEstimate}>Estimación diaria · desliza por la gráfica</span>
      <span>Referencia OMS: P3 P15 P50 P85 P97</span>
    </div>
  );
}

type WeightChartMetaProps = {
  latestPoint: ReturnType<typeof buildWeightChartSeries>["points"][number] | undefined;
  maxWeight: number;
  minWeight: number;
};

function WeightChartMeta({ latestPoint, maxWeight, minWeight }: WeightChartMetaProps) {
  return (
    <div className={styles.chartMeta}>
      <span>
        Mínimo <strong>{minWeight.toLocaleString("es-ES")} g</strong>
      </span>
      <span className={styles.chartMetaPrimary}>
        Último <strong>{latestPoint?.weightGrams.toLocaleString("es-ES")} g</strong>
      </span>
      <span>
        Máximo <strong>{maxWeight.toLocaleString("es-ES")} g</strong>
      </span>
    </div>
  );
}
