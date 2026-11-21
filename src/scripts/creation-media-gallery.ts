import { layoutGalleryWall } from "../data/gallery-wall";
import { setupVideoPreview } from "./gallery-video-preview";
import { createViewerVideo } from "./viewer-video";

// Ajusta el muro a su ancho real y conecta sus enlaces con el visor nativo.
function setupGallery(gallery: HTMLElement) {
  const wall = gallery.querySelector<HTMLElement>("[data-gallery-wall]");
  const dialog = gallery.querySelector("dialog");
  const videoControls = gallery.querySelector<HTMLTemplateElement>(
    "[data-video-controls]",
  );
  const playbackSlot = gallery.querySelector<HTMLElement>(
    "[data-playback-slot]",
  );
  const fullscreen = gallery.querySelector<HTMLButtonElement>(
    "[data-video-fullscreen]",
  );
  const frame = gallery.querySelector<HTMLElement>(".gallery-dialog-frame");
  const stage = gallery.querySelector<HTMLElement>(".gallery-dialog-stage");
  const position = gallery.querySelector("[data-gallery-position]");
  const previous = gallery.querySelector<HTMLButtonElement>("[data-previous]");
  const next = gallery.querySelector<HTMLButtonElement>("[data-next]");
  const cards = Array.from(
    gallery.querySelectorAll<HTMLElement>(".creation-masonry-card"),
  );
  const links = Array.from(
    gallery.querySelectorAll<HTMLAnchorElement>("[data-open-media]"),
  );

  if (
    !wall ||
    !dialog ||
    !stage ||
    !frame ||
    !playbackSlot ||
    !fullscreen ||
    !position ||
    !previous ||
    !next ||
    !links.length
  ) {
    return;
  }

  const allItems = cards.map(({ dataset }) => ({
    id: dataset.id,
    width: Number(dataset.width),
    height: Number(dataset.height),
  }));
  let activeIndex = 0;
  let measuredWidth = 0;

  const resize = new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);

    if (!width || width === measuredWidth) {
      return;
    }

    measuredWidth = width;
    const layout = layoutGalleryWall(allItems, width);
    wall.style.aspectRatio = `${layout.width} / ${layout.height}`;

    for (const frame of layout.frames) {
      const { style } = cards[frame.index];
      style.left = `${(frame.x / layout.width) * 100}%`;
      style.top = `${(frame.y / layout.height) * 100}%`;
      style.width = `${(frame.width / layout.width) * 100}%`;
      style.height = `${(frame.height / layout.height) * 100}%`;
    }
  });

  resize.observe(wall);
  previous.hidden = links.length === 1;
  next.hidden = links.length === 1;

  // Selecciona la variante que contrasta con el tema y crea el medio solo al abrirlo.
  function showMedia(index: number) {
    activeIndex = (index + links.length) % links.length;
    const link = links[activeIndex];
    const darkPage = document.documentElement.classList.contains("dark");
    const source = darkPage ? link.dataset.dark : link.dataset.light;
    const description = link.dataset.alt ?? "";

    if (link.dataset.kind === "video") {
      const { video, controls } = createViewerVideo(
        source ?? link.href,
        description,
        link.dataset.hasAudio === "true",
        videoControls,
      );
      stage?.replaceChildren(video);
      playbackSlot?.replaceChildren(...(controls ? [controls] : []));

      if (playbackSlot && fullscreen) {
        playbackSlot.hidden = !controls;
        fullscreen.hidden = !document.fullscreenEnabled;
      }
    } else {
      if (playbackSlot && fullscreen) {
        playbackSlot.replaceChildren();
        playbackSlot.hidden = true;
        fullscreen.hidden = true;
      }

      const image = new Image();
      const still = darkPage ? link.dataset.stillDark : link.dataset.stillLight;
      const reducedMotion = matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      image.src = (reducedMotion ? still : undefined) ?? source ?? link.href;
      image.alt = description;
      stage?.replaceChildren(image);
    }

    if (position) {
      position.textContent = `${activeIndex + 1} / ${links.length}`;
    }
  }

  for (const [index, link] of links.entries()) {
    const card = cards[index];
    const expand = card.querySelector<HTMLButtonElement>("[data-expand-video]");
    const restart = card.querySelector<HTMLButtonElement>(
      "[data-restart-media]",
    );

    // Abre el mismo visor desde un recurso táctil o el botón de escritorio.
    function openMedia() {
      showMedia(index);
      dialog?.showModal();
    }

    if (restart) {
      restart.hidden = false;
    }

    if (expand) {
      const video = setupVideoPreview(link, openMedia);
      expand.hidden = false;
      expand.addEventListener("click", openMedia);
      restart?.addEventListener("click", () => {
        video.currentTime = 0;
      });
      continue;
    }

    let restartCount = 0;
    restart?.addEventListener("click", () => {
      restartCount++;

      for (const image of link.querySelectorAll("img")) {
        const source = new URL(image.src);
        if (!source.pathname.endsWith(".gif")) {
          continue;
        }

        // Una URL distinta reinicia el GIF aunque el navegador comparta su decodificación.
        source.searchParams.set("replay", String(restartCount));
        image.src = source.href;
      }
    });

    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      openMedia();
    });
  }

  previous.addEventListener("click", () => showMedia(activeIndex - 1));
  next.addEventListener("click", () => showMedia(activeIndex + 1));
  dialog.addEventListener("keydown", (event) => {
    if (
      event.target instanceof HTMLVideoElement ||
      event.target instanceof HTMLInputElement ||
      links.length < 2
    ) {
      return;
    }

    if (event.key === "ArrowLeft") {
      showMedia(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      showMedia(activeIndex + 1);
    }
  });
  fullscreen.addEventListener("click", () => {
    const request =
      document.fullscreenElement === frame
        ? document.exitFullscreen()
        : frame.requestFullscreen();

    void request.catch(() => {});
  });
  frame.addEventListener("fullscreenchange", () => {
    fullscreen.setAttribute(
      "aria-label",
      document.fullscreenElement === frame
        ? "Salir de pantalla completa"
        : "Pantalla completa",
    );
  });
  dialog.addEventListener("close", () => {
    stage.replaceChildren();
    playbackSlot.replaceChildren();

    if (document.fullscreenElement === frame) {
      void document.exitFullscreen().catch(() => {});
    }
  });
}

document
  .querySelectorAll<HTMLElement>(".creation-media-gallery")
  .forEach(setupGallery);
