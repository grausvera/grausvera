export type DrawingSurfaceStyle = Pick<
  CSSStyleDeclaration,
  | "backgroundColor"
  | "backgroundImage"
  | "boxShadow"
  | "borderTopWidth"
  | "borderRightWidth"
  | "borderBottomWidth"
  | "borderLeftWidth"
  | "borderTopColor"
  | "borderRightColor"
  | "borderBottomColor"
  | "borderLeftColor"
>;
type DrawingBox = { x: number; y: number; width: number; height: number };
type SurfaceClip = { element: Element; horizontal: boolean; vertical: boolean };

const mediaKinds = new Set([
  "img",
  "video",
  "canvas",
  "iframe",
  "object",
  "embed",
]);
const interactiveSelector = "a,button,input,textarea,select,summary,[role]";

// Reconoce también colores calculados por color-mix, cuya opacidad puede conservar la sintaxis con barra.
function visibleColor(color: string) {
  const value = color.trim().toLowerCase();

  if (!value || value === "transparent") {
    return false;
  }

  const slash = value.match(/\/\s*([\d.]+)%?\s*\)$/);

  if (slash) {
    return Number.parseFloat(slash[1]) > 0;
  }

  if (/^(rgba|hsla)\(/.test(value) && value.includes(",")) {
    return Number.parseFloat(value.split(",")[3]) > 0;
  }

  return true;
}

// Un fondo, una sombra o un contorno completo representan una superficie; un subrayado sigue siendo parte de la pizarra.
export function hasDrawingSurface(style: DrawingSurfaceStyle, kind = "") {
  if (
    mediaKinds.has(kind) ||
    visibleColor(style.backgroundColor) ||
    style.backgroundImage !== "none" ||
    style.boxShadow !== "none"
  ) {
    return true;
  }

  const borders = [
    [style.borderTopWidth, style.borderTopColor],
    [style.borderRightWidth, style.borderRightColor],
    [style.borderBottomWidth, style.borderBottomColor],
    [style.borderLeftWidth, style.borderLeftColor],
  ];

  return borders.every(
    ([width, color]) => Number.parseFloat(width) > 0 && visibleColor(color),
  );
}

// Conserva candidatos que pueden adquirir un fondo al pasar el cursor, sin revisar todo el DOM en cada cuadro.
export function collectDrawingSurfaces(root: Element) {
  return Array.from(root.querySelectorAll("*")).filter((element) => {
    if (
      element.closest(".brand-page-drawing-canvas,.brand-cursor-effects") ||
      element.closest('[data-drawing-surface="board"]')
    ) {
      return false;
    }

    const style = getComputedStyle(element);
    const animatedPaint =
      style.transitionDuration
        .split(",")
        .some((duration) => Number.parseFloat(duration) > 0) &&
      /all|background|border|box-shadow/.test(style.transitionProperty);

    return (
      element.getAttribute("data-drawing-surface") === "raised" ||
      hasDrawingSurface(style, element.localName) ||
      element.matches(interactiveSelector) ||
      animatedPaint
    );
  });
}

// Traduce los radios, incluidos porcentajes y escalados, a las esquinas que admite el canvas.
function surfaceRadii(
  element: Element,
  box: DrawingBox,
  style: CSSStyleDeclaration,
) {
  const scaleX =
    element instanceof HTMLElement && element.offsetWidth
      ? box.width / element.offsetWidth
      : 1;
  const scaleY =
    element instanceof HTMLElement && element.offsetHeight
      ? box.height / element.offsetHeight
      : 1;
  const corners = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ];

  return corners.map((corner) => {
    const [horizontal, vertical = horizontal] = corner.split(/\s+/);
    const x = Number.parseFloat(horizontal) || 0;
    const y = Number.parseFloat(vertical) || 0;

    return {
      x: horizontal.endsWith("%") ? (box.width * x) / 100 : x * scaleX,
      y: vertical.endsWith("%") ? (box.height * y) / 100 : y * scaleY,
    };
  });
}

// Retira tinta dentro de las superficies visibles, incluso con fondos transparentes, respetando esquinas y recortes de sus ancestros.
export function maskDrawingSurfaces(
  context: CanvasRenderingContext2D,
  surfaces: Element[],
  width: number,
  height: number,
) {
  const styles = new Map<Element, CSSStyleDeclaration>();
  const boxes = new Map<Element, DOMRect>();

  // Comparte las lecturas de padres y contenedores desplazables entre todas sus superficies hijas.
  function styleOf(element: Element) {
    let style = styles.get(element);

    if (!style) {
      style = getComputedStyle(element);
      styles.set(element, style);
    }

    return style;
  }

  // Mide cada contenedor una sola vez por cuadro, para seguir desplazamientos y transiciones sin guardar posiciones obsoletas.
  function boxOf(element: Element) {
    let box = boxes.get(element);

    if (!box) {
      box = element.getBoundingClientRect();
      boxes.set(element, box);
    }

    return box;
  }

  context.save();
  context.globalCompositeOperation = "destination-out";
  context.globalAlpha = 1;
  context.fillStyle = "#000";

  for (const element of surfaces) {
    if (
      !element.isConnected ||
      element.closest('[data-drawing-surface="board"]')
    ) {
      continue;
    }

    const style = styleOf(element);

    if (
      style.visibility !== "visible" ||
      Number(style.opacity) === 0 ||
      (element.getAttribute("data-drawing-surface") !== "raised" &&
        !hasDrawingSurface(style, element.localName))
    ) {
      continue;
    }

    const rectangles = Array.from(element.getClientRects()).filter(
      (box) =>
        box.width > 0 &&
        box.height > 0 &&
        box.right > 0 &&
        box.bottom > 0 &&
        box.left < width &&
        box.top < height,
    );

    if (!rectangles.length) {
      continue;
    }

    const clips: SurfaceClip[] = [];
    let parent = element.parentElement;
    let visible = true;

    while (
      parent &&
      parent !== document.body &&
      parent !== document.documentElement
    ) {
      const parentStyle = styleOf(parent);

      if (Number(parentStyle.opacity) === 0) {
        visible = false;
        break;
      }

      const horizontal = parentStyle.overflowX !== "visible";
      const vertical = parentStyle.overflowY !== "visible";

      if (horizontal || vertical) {
        clips.push({ element: parent, horizontal, vertical });
      }

      parent = parent.parentElement;
    }

    if (!visible) {
      continue;
    }

    context.save();

    for (const clip of clips) {
      const box = boxOf(clip.element);

      context.beginPath();

      if (clip.horizontal && clip.vertical) {
        context.roundRect(
          box.x,
          box.y,
          box.width,
          box.height,
          surfaceRadii(clip.element, box, styleOf(clip.element)),
        );
      } else {
        context.rect(
          clip.horizontal ? box.x : 0,
          clip.vertical ? box.y : 0,
          clip.horizontal ? box.width : width,
          clip.vertical ? box.height : height,
        );
      }

      context.clip();
    }

    context.beginPath();

    for (const box of rectangles) {
      context.roundRect(
        box.x,
        box.y,
        box.width,
        box.height,
        surfaceRadii(element, box, style),
      );
    }

    context.fill();
    context.restore();
  }

  context.restore();
}
