import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WeightChart } from "./weight-chart";

describe("WeightChart", () => {
  it("renders an empty state without entries", () => {
    expect(renderToStaticMarkup(<WeightChart birthDate="2026-07-02" entries={[]} />)).toContain(
      "No hay pesos para mostrar aquí.",
    );
  });

  it("renders a chart for entries", () => {
    const html = renderToStaticMarkup(
      <WeightChart
        birthDate="2026-07-02"
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
    expect(html).toContain("Evolución del peso de Irati");
    expect(html).toContain("2,52 kg");
    expect(html).toContain("Último");
    expect(html).toContain("Hospital");
    expect(html).toContain("Referencia OMS");
    expect(html).toContain("Ver grande");
    expect(html).toContain("Edad actual");
    expect(html).toContain("2 años");
    expect(html).toContain("4 años");
    expect(html).toContain("P15");
    expect(html).toContain("P85");
    expect(html.match(/<circle/g)).toHaveLength(2);
    expect(html).toContain("Desliza por la gráfica");
  });

  it("renders readable metadata with a single entry", () => {
    const html = renderToStaticMarkup(
      <WeightChart
        birthDate="2026-07-02"
        entries={[
          {
            id: "1",
            measuredOn: "2026-07-02",
            weightGrams: 2700,
            place: "hospital",
          },
        ]}
      />,
    );

    expect(html).toContain("2700 g");
    expect(html).toContain("2,7 kg");
    expect(html).toContain("Último");
  });
});
