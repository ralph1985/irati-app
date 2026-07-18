import { buildWeightChartPath, buildWeightChartSeries } from "../application/weight-chart-series";
import { WeightEntry } from "../domain/weight-entry";
import styles from "../../../app/(app)/peso/page.module.css";

type WeightChartProps = {
  entries: WeightEntry[];
};

export function WeightChart({ entries }: WeightChartProps) {
  const series = buildWeightChartSeries(entries);
  const path = buildWeightChartPath(series.points);
  const latestPoint = series.points.at(-1);

  if (series.points.length === 0) {
    return <p className={styles.empty}>No hay pesos para este filtro.</p>;
  }

  return (
    <div className={styles.chart} aria-label="Evolucion del peso">
      <svg viewBox="0 0 320 180" role="img" aria-labelledby="weight-chart-title">
        <title id="weight-chart-title">Evolucion del peso de Irati</title>
        <line x1="24" y1="156" x2="296" y2="156" />
        <line x1="24" y1="24" x2="24" y2="156" />
        {series.points.length > 1 ? <path d={path} /> : null}
        {series.points.map((point) => (
          <circle key={`${point.date}-${point.weightGrams}`} cx={point.x} cy={point.y} r="4" />
        ))}
      </svg>
      <div className={styles.chartMeta}>
        <span>{series.minWeight.toLocaleString("es-ES")} g</span>
        <strong>{latestPoint?.weightGrams.toLocaleString("es-ES")} g</strong>
        <span>{series.maxWeight.toLocaleString("es-ES")} g</span>
      </div>
    </div>
  );
}
