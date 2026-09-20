import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FriendsView } from "./friends-view";

const groups = [
  {
    label: "Grupo A",
    entries: [
      {
        adultsLabel: "Familia A",
        childrenLabel: "Niña A y Niño B",
        groupLabel: "Grupo A",
        id: "a",
        sortOrder: 10,
      },
    ],
  },
];

describe("FriendsView", () => {
  it("renders groups collapsed with a native disclosure control", () => {
    const html = renderToStaticMarkup(<FriendsView groups={groups} />);

    expect(html).toMatch(/<details[^>]*>/);
    expect(html).toMatch(/<summary[^>]*>/);
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
  });

  it("renders a search field for parents and children", () => {
    const html = renderToStaticMarkup(<FriendsView groups={groups} />);

    expect(html).toMatch(/<input[^>]*type="search"/);
    expect(html).toContain("Buscar por padres o niños");
  });

  it("renders group, adult context and highlighted children", () => {
    const html = renderToStaticMarkup(<FriendsView groups={groups} />);

    expect(html).toContain("Grupo A");
    expect(html).toContain("Familia A");
    expect(html).toContain("Niña A y Niño B");
    expect(html).toMatch(/<strong[^>]*>Niña A y Niño B<\/strong>/);
  });

  it("renders a clear empty state", () => {
    const html = renderToStaticMarkup(<FriendsView groups={[]} />);
    expect(html).toContain("Todavía no hay amigos guardados.");
  });
});
