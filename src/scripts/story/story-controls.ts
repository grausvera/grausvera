import { createStoryRenderer } from "./render-story-frame.js";
import {
  ENDING_DURATION,
  ENDING_POSITION,
  PRESENTATION_DURATION,
  endingNarrationTime,
} from "./story-ending.js";
import { toEndingSeconds, toPresentationTime } from "./story-playback.js";
import { summaryAt } from "./story-summary.js";

const dragStep = (1000 / 60) * 8;

// Mantiene el reloj, los gestos y la narración sincronizados con el lienzo original.
function setupStory(surface: HTMLElement) {
  const canvas = surface.querySelector("canvas");
  const narration = surface.parentElement?.querySelector(".story-narration");
  const visibleText = narration?.querySelector("[data-story-visible]");
  const accessibleText = narration?.querySelector("[data-story-text]");

  if (!canvas || !narration || !visibleText || !accessibleText) {
    return;
  }

  const render = createStoryRenderer(canvas);
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  let position = 0;
  let paused = false;
  let visible = false;
  let frame = 0;
  let previousTime: number | undefined;
  let palette = { paper: "#eee9df", ink: "#171a2b", soft: "#777c72" };
  let drag: { id: number; x: number; y: number; started: boolean } | undefined;

  // Pinta un cuadro usando la misma posición para el dibujo y sus frases.
  function draw() {
    const elapsed = endingNarrationTime(position);
    const cue = summaryAt(elapsed);
    const endingTime =
      position >= PRESENTATION_DURATION
        ? ENDING_DURATION
        : position >= ENDING_POSITION
          ? toEndingSeconds((position - ENDING_POSITION) / 1000)
          : null;

    render({ elapsed, endingTime, ...palette });
    const text = (motion.matches ? cue.text : cue.visible) ?? "";
    if (visibleText!.textContent !== text) {
      visibleText!.textContent = text;
    }

    if (accessibleText!.textContent !== cue.text) {
      accessibleText!.textContent = cue.text ?? "";
    }

    narration!.classList.toggle("is-typing", !motion.matches && cue.typing);
    const seconds = String(Math.round(position / 1000));
    surface.setAttribute("aria-valuenow", seconds);
    surface.setAttribute(
      "aria-valuetext",
      `${seconds} segundos. ${paused ? "En pausa. " : ""}${cue.text ?? ""}`,
    );
    surface.dataset.paused = String(paused);
  }

  // Ajusta el lienzo a pantallas densas y actualiza los colores al alternar el tema.
  function refreshCanvas() {
    const bounds = canvas!.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.round(bounds.width * ratio);
    const height = Math.round(bounds.height * ratio);
    const styles = getComputedStyle(canvas!);

    if (canvas!.width !== width || canvas!.height !== height) {
      canvas!.width = width;
      canvas!.height = height;
    }

    palette = {
      paper: styles.getPropertyValue("--bg").trim() || "#eee9df",
      ink: root.classList.contains("dark") ? "#e5e8db" : "#171a2b",
      soft: styles.getPropertyValue("--muted").trim() || "#777c72",
    };
    draw();
  }

  // Limita los saltos y el avance continuo a la duración de la historia.
  function seek(time: number) {
    position = Math.max(0, Math.min(time, PRESENTATION_DURATION));
    draw();
  }

  // Avanza con el tiempo transcurrido y termina al llegar al último cuadro.
  function tick(now: number) {
    const elapsed =
      previousTime === undefined ? 0 : Math.min(now - previousTime, 100);
    previousTime = now;
    seek(position + elapsed);

    if (position < PRESENTATION_DURATION) {
      frame = requestAnimationFrame(tick);
    }
  }

  // Suspende el reloj al ocultar la pestaña, pausar o empezar a arrastrar.
  function sync() {
    cancelAnimationFrame(frame);
    previousTime = undefined;
    draw();

    if (
      visible &&
      !document.hidden &&
      !motion.matches &&
      !drag &&
      !paused &&
      position < PRESENTATION_DURATION
    ) {
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(refreshCanvas).observe(canvas);
  new MutationObserver(refreshCanvas).observe(root, {
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  new IntersectionObserver(
    ([entry]) => {
      const entering = entry.isIntersecting && !visible;
      visible = entry.isIntersecting;

      if (entering && !paused) {
        seek(motion.matches ? toPresentationTime(21000) : 0);
      }

      sync();
    },
    { rootMargin: "-72px 0px 0px 0px" },
  ).observe(surface);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", () => {
    if (motion.matches) {
      seek(toPresentationTime(21000));
    }

    sync();
  });

  surface.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0 || drag) {
      return;
    }

    surface.dataset.pointerFocus = "true";
    surface.focus({ preventScroll: true });
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      started: false,
    };
    surface.setPointerCapture(event.pointerId);
    sync();
  });
  surface.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) {
      return;
    }

    const distance = event.clientX - drag.x;
    if (
      !drag.started &&
      (Math.abs(distance) < 4 ||
        (event.pointerType === "touch" &&
          Math.abs(event.clientY - drag.y) > Math.abs(distance)))
    ) {
      return;
    }

    drag.started = true;
    drag.x = event.clientX;
    seek(position + distance * dragStep);
  });
  for (const name of [
    "pointerup",
    "pointercancel",
    "lostpointercapture",
  ] as const) {
    surface.addEventListener(name, (event) => {
      if (drag?.id === event.pointerId) {
        drag = undefined;
        surface.classList.remove("is-dragging");
        sync();
      }
    });
  }
  surface.addEventListener("gotpointercapture", () =>
    surface.classList.add("is-dragging"),
  );
  surface.addEventListener("blur", () => delete surface.dataset.pointerFocus);
  surface.addEventListener("keydown", (event) => {
    delete surface.dataset.pointerFocus;
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const targets: Record<string, number> = {
      ArrowLeft: position - 8000,
      ArrowRight: position + 8000,
      Home: 0,
      End: PRESENTATION_DURATION,
    };

    if (event.key === " ") {
      event.preventDefault();

      if (!event.repeat) {
        paused = !paused;
        sync();
      }
    } else if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      seek(targets[event.key]);
      sync();
    }
  });

  if (motion.matches) {
    position = toPresentationTime(21000);
  }

  refreshCanvas();
}

document.querySelectorAll<HTMLElement>("[data-story]").forEach(setupStory);
