import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WeightChart } from "./weight-chart";

describe("WeightChart", () => {
  it("renders an empty state without entries", () => {
    expect(renderToStaticMarkup(<WeightChart entries={[]} />)).toContain(
      "No hay pesos para este filtro.",
    );
  });

  it("renders a chart for entries", () => {
    const html = renderToStaticMarkup(
      <WeightChart
        entries={[
          {
            id: "1",
            measuredOn: "2026-07-02",
            weightGrams: 2700,
            place: "hospital",
          },
          {
            id: "2",
            measuredOn: "2026-07-04",
            weightGrams: 2520,
            place: "hospital",
          },
        ]}
      />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("Evolucion del peso de Irati");
  });
});
