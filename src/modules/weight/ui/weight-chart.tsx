import {
  buildWeightChartAreaPath,
  buildWeightChartPath,
  buildWeightChartSeries,
} from "../application/weight-chart-series";
import { getWeightPlaceLabel } from "../application/weight-filter";
import { WeightEntry } from "../domain/weight-entry";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightChartProps = {
  entries: WeightEntry[];
};

export function WeightChart({ entries }: WeightChartProps) {
  const series = buildWeightChartSeries(entries);
  const path = buildWeightChartPath(series.points);
  const areaPath = buildWeightChartAreaPath(series.points);
  const firstPoint = series.points[0];
  const latestPoint = series.points.at(-1);

  if (series.points.length === 0) {
    return <p className={styles.empty}>No hay pesos para este filtro.</p>;
  }

  return (
    <div className={styles.chart} aria-label="Evolucion del peso">
      <svg
        viewBox={`0 0 ${series.chartWidth} ${series.chartHeight}`}
        role="img"
        aria-labelledby="weight-chart-title weight-chart-description"
      >
        <title id="weight-chart-title">Evolucion del peso de Irati</title>
        <desc id="weight-chart-description">
          Peso entre {series.minWeight.toLocaleString("es-ES")} y{" "}
          {series.maxWeight.toLocaleString("es-ES")} gramos.
        </desc>
        {series.ticks.map((tick) => (
          <g className={styles.chartTick} key={tick.value}>
            <line x1="42" y1={tick.y} x2="304" y2={tick.y} />
            <text x="34" y={tick.y + 4}>
              {tick.label}
            </text>
          </g>
        ))}
        {areaPath ? <path className={styles.chartArea} d={areaPath} /> : null}
        {path ? <path className={styles.chartLine} d={path} /> : null}
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
          <text className={styles.chartDate} x={firstPoint.x} y="174">
            {firstPoint.dateLabel}
          </text>
        ) : null}
        {latestPoint && latestPoint !== firstPoint ? (
          <text className={styles.chartDate} textAnchor="end" x={latestPoint.x} y="174">
            {latestPoint.dateLabel}
          </text>
        ) : null}
      </svg>
      <div className={styles.chartMeta}>
        <span>
          Minimo <strong>{series.minWeight.toLocaleString("es-ES")} g</strong>
        </span>
        <span className={styles.chartMetaPrimary}>
          Ultimo <strong>{latestPoint?.weightGrams.toLocaleString("es-ES")} g</strong>
        </span>
        <span>
          Maximo <strong>{series.maxWeight.toLocaleString("es-ES")} g</strong>
        </span>
      </div>
    </div>
  );
}
