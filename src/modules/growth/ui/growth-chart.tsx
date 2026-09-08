"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import {
  buildGrowthChartAreaPath,
  buildGrowthChartPath,
  buildGrowthChartSeries,
  type GrowthChartRange,
  type GrowthEntry,
  type GrowthMetric,
} from "../application/growth-chart-series";
import styles from "../../../app/(app)/peso/page.module.css";

type GrowthChartProps = {
  birthDate: string;
  entries: GrowthEntry[];
  metric: GrowthMetric;
  title: string;
};

export function GrowthChart({ birthDate, entries, metric, title }: GrowthChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [range, setRange] = useState<GrowthChartRange>("current");
  const [selectedPoint, setSelectedPoint] = useState<GrowthChartPoint | null>(null);
  const expandedChartRef = useRef<HTMLElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const series = buildGrowthChartSeries(entries, birthDate, metric, range);
  const linePath = buildGrowthChartPath(series.points);
  const areaPath = buildGrowthChartAreaPath(series.points);
  const latestPoint = series.points.at(-1);
  const closeExpandedChart = useCallback(() => setIsExpanded(false), []);

  useEffect(() => {
    if (!isExpanded) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    expandedChartRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExpandedChart();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const trigger = expandButtonRef.current;

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [closeExpandedChart, isExpanded]);

  if (series.points.length === 0) {
    return <p className={styles.empty}>No hay medidas para mostrar aquí.</p>;
  }

  return (
    <div className={styles.chart}>
      <div className={styles.chartHeader}>
        <p>Referencia OMS orientativa. No sustituye una revisión médica.</p>
        <div className={styles.chartHeaderActions}>
          <GrowthChartRangeToggle range={range} onRangeChange={setRange} />
          <button
            aria-label={`Ver gráfica de ${title.toLowerCase()} a pantalla completa`}
            className={styles.chartExpandButton}
            onClick={() => setIsExpanded(true)}
            ref={expandButtonRef}
            type="button"
          >
            Ver grande
          </button>
        </div>
      </div>

      <GrowthChartSvg
        areaPath={areaPath}
        idPrefix={`${metric}-chart`}
        linePath={linePath}
        selectedPoint={selectedPoint}
        series={series}
        title={title}
        onPointSelect={setSelectedPoint}
      />
      <div className={styles.chartLegend}>
        <span className={styles.chartLegendWeight}>{title}</span>
        <span>OMS: P3 P15 P50 P85 P97</span>
      </div>
      <GrowthChartMeta
        latestPoint={latestPoint}
        maxValue={series.maxValue}
        minValue={series.minValue}
      />

      {isExpanded ? (
        <div
          className={styles.chartFullscreenBackdrop}
          onClick={closeExpandedChart}
          role="presentation"
        >
          <section
            aria-labelledby={`${metric}-chart-fullscreen-title`}
            aria-modal="true"
            className={styles.chartFullscreen}
            onClick={(event) => event.stopPropagation()}
            ref={expandedChartRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className={styles.chartFullscreenHeader}>
              <div>
                <p>{title}</p>
                <h2 id={`${metric}-chart-fullscreen-title`}>Evolución y referencia OMS</h2>
              </div>
              <GrowthChartRangeToggle range={range} onRangeChange={setRange} />
              <button
                aria-label={`Cerrar gráfica de ${title.toLowerCase()}`}
                className={styles.chartCloseButton}
                onClick={closeExpandedChart}
                type="button"
              >
                Cerrar
              </button>
            </div>
            <div className={styles.chartFullscreenCanvas}>
              <GrowthChartSvg
                areaPath={areaPath}
                idPrefix={`${metric}-chart-fullscreen`}
                linePath={linePath}
                selectedPoint={selectedPoint}
                series={series}
                title={title}
                onPointSelect={setSelectedPoint}
              />
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.chartLegendWeight}>{title}</span>
              <span>OMS: P3 P15 P50 P85 P97</span>
            </div>
            <GrowthChartMeta
              latestPoint={latestPoint}
              maxValue={series.maxValue}
              minValue={series.minValue}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}

function GrowthChartRangeToggle({
  range,
  onRangeChange,
}: {
  range: GrowthChartRange;
  onRangeChange: (range: GrowthChartRange) => void;
}) {
  return (
    <div className={styles.chartRangeToggle} aria-label="Rango de edad de la gráfica">
      {(
        [
          ["current", "Edad actual"],
          ["twoYears", "2 años"],
          ["fourYears", "4 años"],
        ] as const
      ).map(([value, label]) => (
        <button
          aria-pressed={range === value}
          className={range === value ? styles.chartRangeButtonActive : styles.chartRangeButton}
          key={value}
          onClick={() => onRangeChange(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

type GrowthChartPoint = {
  date: string;
  dateLabel: string;
  placeLabel: string;
  valueLabel: string;
  x: number;
  y: number;
};

function GrowthChartSvg({
  areaPath,
  idPrefix,
  linePath,
  selectedPoint,
  series,
  title,
  onPointSelect,
}: {
  areaPath: string;
  idPrefix: string;
  linePath: string;
  selectedPoint: GrowthChartPoint | null;
  series: ReturnType<typeof buildGrowthChartSeries>;
  title: string;
  onPointSelect: (point: GrowthChartPoint | null) => void;
}) {
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * series.chartWidth;
    onPointSelect(findNearestPoint(series, x));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    handlePointerMove(event);
  }

  return (
    <div
      aria-label={`Evolución de ${title.toLowerCase()}. Desliza por la gráfica para consultar las medidas.`}
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
        <title id={`${idPrefix}-title`}>Evolución de {title.toLowerCase()} de Irati</title>
        <desc id={`${idPrefix}-description`}>
          {title} entre {series.minValue.toLocaleString("es-ES")} y{" "}
          {series.maxValue.toLocaleString("es-ES")} centímetros, con referencia OMS.
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
          const path = buildGrowthChartPath(curve.points);
          const lastPoint = curve.points.at(-1);
          return (
            <g className={styles.chartReferenceGroup} key={curve.label}>
              <path
                className={`${styles.chartReferenceCurve} ${curve.label === "P50" ? styles.chartReferenceCurveMedian : ""}`}
                d={path}
              />
              {lastPoint ? (
                <text className={styles.chartReferenceLabel} x={lastPoint.x} y={lastPoint.y - 3}>
                  {curve.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {areaPath ? <path className={styles.chartArea} d={areaPath} /> : null}
        {linePath ? <path className={styles.chartLine} d={linePath} /> : null}
        {series.points.map((point, index) => (
          <g key={`${point.date}-${index}`}>
            <circle
              className={
                index === series.points.length - 1 ? styles.chartLatestPoint : styles.chartPoint
              }
              cx={point.x}
              cy={point.y}
              r={index === series.points.length - 1 ? 6 : 4.5}
            />
            {index === 0 || index === series.points.length - 1 ? (
              <text
                className={styles.chartDate}
                textAnchor={index === 0 ? "start" : "end"}
                x={point.x}
                y={352}
              >
                {point.dateLabel}
              </text>
            ) : null}
          </g>
        ))}
        {selectedPoint ? (
          <g
            className={styles.chartTooltip}
            pointerEvents="none"
            transform={`translate(${Math.min(selectedPoint.x - 42, 226)}, ${Math.max(selectedPoint.y - 52, 4)})`}
          >
            <rect height="42" rx="8" width="84" />
            <text textAnchor="middle" x="42" y="15">
              {selectedPoint.valueLabel}
            </text>
            <text textAnchor="middle" x="42" y="29">
              {selectedPoint.dateLabel} · {selectedPoint.placeLabel}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function GrowthChartMeta({
  latestPoint,
  maxValue,
  minValue,
}: {
  latestPoint: ReturnType<typeof buildGrowthChartSeries>["points"][number] | undefined;
  maxValue: number;
  minValue: number;
}) {
  return (
    <div className={styles.chartMeta}>
      <span className={styles.chartMetaPrimary}>
        Última<strong>{latestPoint?.valueLabel ?? "Sin datos"}</strong>
      </span>
      <span>
        Máxima<strong>{maxValue.toLocaleString("es-ES")} cm</strong>
      </span>
      <span>
        Mínima<strong>{minValue.toLocaleString("es-ES")} cm</strong>
      </span>
    </div>
  );
}

function findNearestPoint(
  series: ReturnType<typeof buildGrowthChartSeries>,
  x: number,
): GrowthChartPoint | null {
  const point = series.points.reduce((nearest, candidate) =>
    Math.abs(candidate.x - x) < Math.abs(nearest.x - x) ? candidate : nearest,
  );

  return point
    ? {
        date: point.date,
        dateLabel: point.dateLabel,
        placeLabel: formatPlace(point.place),
        valueLabel: point.valueLabel,
        x: point.x,
        y: point.y,
      }
    : null;
}

function formatPlace(place: GrowthEntry["place"]): string {
  return place === "pediatra" ? "Pediatra" : place === "hospital" ? "Hospital" : "Farmacia";
}
