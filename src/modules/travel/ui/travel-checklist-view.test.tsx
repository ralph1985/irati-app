import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TravelChecklistView } from "./travel-checklist-view";
import { TravelChecklist } from "../application/list-travel-checklist";

const noopAction = () => {};

describe("TravelChecklistView", () => {
  it("renders an empty state", () => {
    expect(
      renderToStaticMarkup(
        <TravelChecklistView
          checklist={{
            groups: [],
            progress: {
              packed: 0,
              pending: 0,
              total: 0,
            },
          }}
          createAction={noopAction}
          deleteAction={noopAction}
          resetAction={noopAction}
          setPackedAction={noopAction}
          updateAction={noopAction}
        />,
      ),
    ).toContain("Todavia no hay items de viaje.");
  });

  it("renders grouped checklist items and progress", () => {
    const html = renderToStaticMarkup(
      <TravelChecklistView
        checklist={checklist}
        createAction={noopAction}
        deleteAction={noopAction}
        resetAction={noopAction}
        setPackedAction={noopAction}
        updateAction={noopAction}
      />,
    );

    expect(html).toContain("1 de 2");
    expect(html).toContain("Higiene");
    expect(html).toContain("Pañales");
    expect(html).toContain("Talla 1");
    expect(html).toContain("Preparado");
    expect(html).toContain("Añadir item");
  });
});

const checklist: TravelChecklist = {
  progress: {
    packed: 1,
    pending: 1,
    total: 2,
  },
  groups: [
    {
      category: "higiene",
      progress: {
        packed: 1,
        pending: 1,
        total: 2,
      },
      items: [
        {
          id: "item-1",
          label: "Pañales",
          category: "higiene",
          sortOrder: 10,
          isPacked: false,
          notes: "Talla 1",
        },
        {
          id: "item-2",
          label: "Toallitas",
          category: "higiene",
          sortOrder: 20,
          isPacked: true,
          notes: null,
        },
      ],
    },
  ],
};
