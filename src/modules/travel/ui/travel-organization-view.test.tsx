import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TravelChecklist } from "../application/list-travel-checklist";
import { TravelOrganizationView } from "./travel-organization-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const noopAction = () => {};

describe("TravelOrganizationView", () => {
  it("renders counts, the location tree and a dedicated editor entry point", () => {
    const html = renderToStaticMarkup(
      <TravelOrganizationView
        checklist={checklist}
        createCategoryAction={noopAction}
        updateCategoryAction={noopAction}
        deleteCategoryAction={noopAction}
        reorderCategoryAction={noopAction}
        createLocationAction={noopAction}
        updateLocationAction={noopAction}
        deleteLocationAction={noopAction}
        reorderLocationAction={noopAction}
      />,
    );

    expect(html).toContain("Categorías");
    expect(html).toContain("Higiene");
    expect(html).toContain("1 elemento");
    expect(html).toContain("Habitación del fondo");
    expect(html).toContain("Mochila verde");
    expect(html).toContain('data-depth="1"');
    expect(html).toContain("Nueva categoría");
    expect(html).toContain("Nueva ubicación");
    expect(html).not.toContain('type="number"');
  });

  it("disables deletion when a category or location still has dependants", () => {
    const html = renderToStaticMarkup(
      <TravelOrganizationView
        checklist={checklist}
        createCategoryAction={noopAction}
        updateCategoryAction={noopAction}
        deleteCategoryAction={noopAction}
        reorderCategoryAction={noopAction}
        createLocationAction={noopAction}
        updateLocationAction={noopAction}
        deleteLocationAction={noopAction}
        reorderLocationAction={noopAction}
      />,
    );

    expect(html).toContain("No se puede borrar mientras tenga elementos.");
    expect(html).toContain("No se puede borrar: 1 elemento asignado.");
    expect(html).toContain("No se puede borrar: 1 compartimento hijo.");
  });
});

const checklist: TravelChecklist = {
  categories: [
    { label: "Higiene", slug: "higiene", sortOrder: 10 },
    { label: "Salud", slug: "salud", sortOrder: 20 },
  ],
  groups: [
    {
      category: { label: "Higiene", slug: "higiene", sortOrder: 10 },
      items: [
        {
          id: "item-1",
          label: "Bañera portátil",
          category: "higiene",
          sortOrder: 10,
          isPacked: false,
          storageLocationId: "room",
        },
      ],
      progress: { packed: 0, pending: 1, total: 1 },
    },
    {
      category: { label: "Salud", slug: "salud", sortOrder: 20 },
      items: [],
      progress: { packed: 0, pending: 0, total: 0 },
    },
  ],
  locations: [
    { id: "room", label: "Habitación del fondo", parentId: null, sortOrder: 10 },
    { id: "green", label: "Mochila verde", parentId: "room", sortOrder: 10 },
    { id: "bag", label: "Bolsa grande", parentId: null, sortOrder: 20 },
    { id: "pocket", label: "Bolsillo", parentId: "bag", sortOrder: 10 },
  ],
  locationGroups: [],
  progress: { packed: 0, pending: 1, total: 1 },
};
