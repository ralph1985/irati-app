"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
};

function WeightChartSvg({
  areaPath,
  firstPoint,
  idPrefix,
  latestPoint,
  linePath,
  series,
}: WeightChartSvgProps) {
  return (
    <div className={styles.chartCanvas} aria-label="Evolución del peso">
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
              r={isLatestPoint ? 5 : 3.8}
            />
          );
        })}
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

function WeightChartLegend() {
  return (
    <div className={styles.chartLegend} aria-label="Leyenda de la gráfica">
      <span className={styles.chartLegendWeight}>Peso registrado</span>
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
