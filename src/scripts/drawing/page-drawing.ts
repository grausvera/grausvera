import {
  collectDrawingSurfaces,
  maskDrawingSurfaces,
} from "./drawing-surfaces";
import { isDrawingBlocked } from "./drawing-targets";

type Point = { x: number; y: number };
type Mark = { from: Point; control: Point; to: Point; time: number };
type Drawing = { id: number; previous: Point; middle: Point };

// Dibuja trazos temporales sobre el documento y deja los controles por delante.
function setupPageDrawing(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
) {
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const lifetime = 2800;
  let marks: Mark[] = [];
  let active: Drawing | null = null;
  let frame = 0;
  let surfaces: Element[] = [];
  let surfacesDirty = true;
  let width = innerWidth;
  let height = innerHeight;
  let dark = document.documentElement.classList.contains("dark");
  let ink = getComputedStyle(document.body)
    .getPropertyValue(dark ? "--text" : "--accent")
    .trim();

  // Redibuja los trazos temporales con su opacidad actual y retira los que ya vencieron.
  function paint(now: number) {
    frame = 0;
    context.clearRect(0, 0, width, height);
    marks = marks.filter((mark) => now - mark.time < lifetime);

    if (!marks.length) {
      surfaces = [];
      surfacesDirty = true;
      return;
    }

    if (surfacesDirty) {
      surfaces = collectDrawingSurfaces(document.body);
      surfacesDirty = false;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = ink;

    for (const mark of marks) {
      const progress = Math.max(0, (now - mark.time - 550) / (lifetime - 550));

      context.globalAlpha = (1 - progress * progress) * (dark ? 0.92 : 0.95);
      context.lineWidth = dark ? 2.1 : 2;
      context.beginPath();
      context.moveTo(mark.from.x - scrollX, mark.from.y - scrollY);
      context.quadraticCurveTo(
        mark.control.x - scrollX,
        mark.control.y - scrollY,
        mark.to.x - scrollX,
        mark.to.y - scrollY,
      );
      context.stroke();
    }

    context.globalAlpha = 1;
    maskDrawingSurfaces(context, surfaces, width, height);

    if (marks.length > 0) {
      frame = requestAnimationFrame(paint);
    }
  }

  // Solicita un cuadro solo cuando no existe otro pendiente para el dibujo.
  function schedule() {
    if (!frame) {
      frame = requestAnimationFrame(paint);
    }
  }

  // Incorpora un punto del puntero al trazo activo en las coordenadas del documento.
  function add(from: Point, control: Point, to: Point) {
    marks.push({ from, control, to, time: performance.now() });

    if (marks.length > 800) {
      marks.splice(0, marks.length - 800);
    }

    schedule();
  }

  // Completa la última curva y termina el seguimiento del puntero activo.
  function stop() {
    if (active) {
      add(active.middle, active.previous, active.previous);
    }

    active = null;
  }

  // Borra los trazos y reinicia el estado temporal del dibujo.
  function clear() {
    active = null;
    marks = [];
    surfaces = [];
    surfacesDirty = true;
    cancelAnimationFrame(frame);
    frame = 0;
    context.clearRect(0, 0, width, height);
  }

  // Adapta el canvas a las dimensiones y densidad de píxeles de la ventana.
  function resize() {
    clear();
    width = innerWidth;
    height = innerHeight;

    const scale = Math.min(devicePixelRatio || 1, 3);

    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  // Inicia un trazo si la pulsación ocurre fuera de un control excluido.
  function down(event: PointerEvent) {
    if (
      !pointer.matches ||
      motion.matches ||
      document.hidden ||
      event.defaultPrevented ||
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !event.isPrimary
    ) {
      return;
    }

    if (!(event.target instanceof Element) || isDrawingBlocked(event.target)) {
      return;
    }

    // Retira el foco activo y descarta selecciones de texto previas antes de iniciar el trazo.
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body &&
      !document.activeElement.contains(event.target)
    ) {
      document.activeElement.blur();
    }

    const selection = window.getSelection();

    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges();
    }

    const point = { x: event.pageX, y: event.pageY };

    active = { id: event.pointerId, previous: point, middle: point };

    if (event.cancelable) {
      event.preventDefault();
    }

    add(point, point, { x: point.x + 0.1, y: point.y + 0.1 });
  }

  // Continúa el trazo activo incluso cuando el puntero atraviesa otros elementos.
  function move(event: PointerEvent) {
    if (!active || event.pointerId !== active.id) {
      return;
    }

    if (!(event.buttons & 1)) {
      stop();

      return;
    }

    const samples = event.getCoalescedEvents?.();

    for (const sample of samples?.length ? samples : [event]) {
      if (!active) {
        break;
      }

      const point = { x: sample.pageX, y: sample.pageY };

      if (
        Math.hypot(point.x - active.previous.x, point.y - active.previous.y) <
        0.75
      ) {
        continue;
      }

      const middle: Point = {
        x: (point.x + active.previous.x) / 2,
        y: (point.y + active.previous.y) / 2,
      };

      add(active.middle, active.previous, middle);
      active = { ...active, previous: point, middle };
    }
  }

  // Actualiza las coordenadas del dibujo al desplazarse el documento.
  function scroll() {
    stop();

    if (marks.length > 0) {
      schedule();
    }
  }

  // Detiene el dibujo cuando la pestaña deja de estar visible.
  function hidden() {
    if (document.hidden) {
      clear();
    }
  }

  // Procesa los atajos de teclado previstos para limpiar o terminar el dibujo.
  function key(event: KeyboardEvent) {
    if (event.key === "Escape") {
      clear();
    }
  }

  // Invalida candidatos por cambios reales del documento, sin medirlos cuando no hay tinta visible.
  function invalidateSurfaces() {
    surfacesDirty = true;

    if (marks.length) {
      schedule();
    }
  }

  const surfaceChanges = new MutationObserver((changes) => {
    // La narración se actualiza fotograma a fotograma y no cambia las superficies elevadas.
    if (
      changes.some(
        ({ target }) =>
          !(
            target instanceof Element &&
            target.closest(".story-narration, [data-story]")
          ),
      )
    ) {
      invalidateSurfaces();
    }
  });

  const theme = new MutationObserver(() => {
    surfacesDirty = true;
    dark = document.documentElement.classList.contains("dark");
    ink = getComputedStyle(document.body)
      .getPropertyValue(dark ? "--text" : "--accent")
      .trim();

    if (marks.length > 0) {
      schedule();
    }
  });

  resize();
  theme.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  surfaceChanges.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "hidden",
      "open",
      "disabled",
      "role",
      "href",
      "data-drawing-surface",
    ],
  });
  document.addEventListener("pointerover", invalidateSurfaces, true);
  document.addEventListener("focusin", invalidateSurfaces, true);
  document.addEventListener("transitionrun", invalidateSurfaces, true);
  window.addEventListener("pointerdown", down, { passive: false });
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerup", stop, true);
  window.addEventListener("pointercancel", stop, true);
  window.addEventListener("blur", clear);
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("pagehide", clear);
  pointer.addEventListener("change", clear);
  motion.addEventListener("change", clear);
}

// Corrige el lápiz heredado en superficies donde la pizarra no acepta un trazo.
function syncDrawingCursor() {
  let blockedTarget: Element | undefined;

  document.addEventListener("pointerover", (event) => {
    if (event.pointerType !== "mouse" || !(event.target instanceof Element)) {
      return;
    }

    blockedTarget?.removeAttribute("data-no-draw-cursor");
    blockedTarget = undefined;
    const target = event.target;

    if (
      getComputedStyle(target).cursor.includes("/cursors/pencil") &&
      isDrawingBlocked(target)
    ) {
      target.setAttribute("data-no-draw-cursor", "");
      blockedTarget = target;
    }
  });
}

const canvas = document.querySelector<HTMLCanvasElement>(
  ".brand-page-drawing-canvas",
);
const context = canvas?.getContext("2d");

if (canvas && context) {
  setupPageDrawing(canvas, context);
  syncDrawingCursor();
}
