import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WeightHistory } from "./weight-history";

const noopAction = () => {};

describe("WeightHistory", () => {
  it("renders an empty state", () => {
    expect(
      renderToStaticMarkup(
        <WeightHistory deleteAction={noopAction} entries={[]} updateAction={noopAction} />,
      ),
    ).toContain("Aún no hay pesos en este filtro.");
  });

  it("renders registered weight entries", () => {
    const html = renderToStaticMarkup(
      <WeightHistory
        deleteAction={noopAction}
        entries={[
          {
            id: "weight-1",
            measuredOn: "2026-07-17",
            weightGrams: 3200,
            place: "hospital",
            notes: null,
          },
        ]}
        updateAction={noopAction}
      />,
    );

    expect(html).toContain("3200 g");
    expect(html).toContain("Hospital");
    expect(html).toContain('aria-label="Editar peso de');
    expect(html).toContain('aria-label="Borrar peso de');
    expect(html).not.toContain(">Editar<");
    expect(html).not.toContain(">Borrar<");
  });
});
