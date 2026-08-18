import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingButton } from "./pending-submit-button";

describe("LoadingButton", () => {
  it("keeps the label and exposes the pending state", () => {
    const html = renderToStaticMarkup(
      <LoadingButton pending pendingAriaLabel="Guardando datos" type="submit">
        Guardar
      </LoadingButton>,
    );

    expect(html).toContain("Guardando datos");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toContain('class="');
    expect(html).toContain("Guardar");
  });

  it("keeps an icon button accessible while pending", () => {
    const html = renderToStaticMarkup(
      <LoadingButton
        aria-label="Borrar peso"
        pending
        pendingAriaLabel="Borrando peso"
        type="submit"
      >
        <span aria-hidden="true">×</span>
      </LoadingButton>,
    );

    expect(html).toContain('aria-label="Borrando peso"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("×");
  });
});
