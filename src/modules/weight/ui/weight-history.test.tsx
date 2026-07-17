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
    ).toContain("Todavia no hay pesos registrados.");
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
            place: "pediatra",
            notes: null,
          },
        ]}
        updateAction={noopAction}
      />,
    );

    expect(html).toContain("3200 g");
    expect(html).toContain("Pediatra");
  });
});
