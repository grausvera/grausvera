// Escala el marco sin cambiar el ancho con que el sitio calcula sus puntos de quiebre.
function setupPreview(preview: HTMLElement) {
  const surface = preview.querySelector<HTMLElement>(
    ".responsive-preview-surface",
  );
  const frame = preview.querySelector<HTMLElement>(".responsive-device-frame");
  const viewport = preview.querySelector<HTMLElement>(
    ".responsive-frame-viewport",
  );
  const iframe = preview.querySelector("iframe");
  const dimensions = preview.querySelector(".responsive-dimensions");
  const buttons = [
    ...preview.querySelectorAll<HTMLButtonElement>("[data-device]"),
  ];

  if (
    !surface ||
    !frame ||
    !viewport ||
    !iframe ||
    !dimensions ||
    !buttons.length
  ) {
    return;
  }

  let selected = buttons[0];
  const root = document.documentElement;

  // Recalcula el tamaño físico del marco al cambiar de dispositivo o ancho disponible.
  function resize() {
    const width = Number(selected.dataset.width);
    const height = Number(selected.dataset.height);
    const scale = Math.min(
      1,
      Math.max(1, surface!.clientWidth - 2) / width,
      640 / height,
    );

    frame!.className = `responsive-device-frame is-${selected.dataset.device}`;
    frame!.style.width = `${width * scale + 2}px`;
    frame!.style.height = `${height * scale + 29}px`;
    viewport!.style.width = `${width * scale}px`;
    viewport!.style.height = `${height * scale}px`;
    iframe!.style.width = `${width}px`;
    iframe!.style.height = `${height}px`;
    iframe!.style.transform = `scale(${scale})`;
    dimensions!.textContent = `${width} × ${height} px`;
  }

  // Refleja el tema del sitio en el documento incrustado del mismo origen.
  function syncTheme() {
    iframe?.contentDocument?.documentElement?.classList.toggle(
      "dark",
      root.classList.contains("dark"),
    );
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      selected.setAttribute("aria-pressed", "false");
      selected = button;
      selected.setAttribute("aria-pressed", "true");
      resize();
    });
  }

  iframe.addEventListener("load", syncTheme);
  preview
    .querySelector("[data-preview-reset]")
    ?.addEventListener("click", () => {
      iframe.src = "/";
    });
  new ResizeObserver(resize).observe(surface);
  new MutationObserver(syncTheme).observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });
  resize();
  syncTheme();
}

document
  .querySelectorAll<HTMLElement>(".responsive-showcase")
  .forEach(setupPreview);
