// El dibujo no sustituye los controles, los medios ni la selección del texto.
const drawingExcludedSelector = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role]",
  "[contenteditable]:not([contenteditable='false'])",
  "[draggable='true']",
  "canvas",
  "img",
  "svg",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
  "dialog",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "dt",
  "dd",
  "span",
  "pre",
  "code",
  ".story-scrubbable",
  "[data-no-draw]",
].join(",");

// Evita iniciar trazos sobre controles u otras zonas que deben conservar su interacción normal.
export function isDrawingBlocked(target: Element) {
  if (target.closest(drawingExcludedSelector)) {
    return true;
  }

  // Los paneles opacos ocultarían la tinta que se dibuja detrás del contenido.
  let element: Element | null = target;

  while (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
    const hasText = Array.from(element.childNodes).some((node) => {
      return (
        node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())
      );
    });

    if (hasText) {
      return true;
    }

    const style = getComputedStyle(element);
    const background = style.backgroundColor;

    if (
      style.backgroundImage !== "none" ||
      (background !== "transparent" && background !== "rgba(0, 0, 0, 0)")
    ) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}
