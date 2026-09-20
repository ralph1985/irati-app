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
