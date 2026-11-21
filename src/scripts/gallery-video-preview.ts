// Reproduce solo la variante visible y conserva la posición al cambiar de tema.
export function setupVideoPreview(
  link: HTMLAnchorElement,
  openMedia: () => void,
) {
  const video = document.createElement("video");
  const touchLayout = matchMedia("(hover: none), (pointer: coarse)");
  const viewerLabel =
    link.getAttribute("aria-label") ?? "Abrir video en el visor";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  let position = 0;
  let inView = false;
  let paused = reducedMotion.matches;
  let dragStart: { x: number; time: number } | undefined;
  let moved = false;

  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = "none";
  video.setAttribute("aria-hidden", "true");
  video.style.visibility = "hidden";
  link.append(video);
  link.addEventListener("dragstart", (event) => event.preventDefault());
  link.classList.add("gallery-video-surface");
  link.setAttribute("role", "button");
  // El nombre accesible describe lo que hará pulsar la tarjeta.
  function updateLabel() {
    link.setAttribute(
      "aria-label",
      touchLayout.matches ? viewerLabel : "Reproducir o pausar video",
    );
  }

  updateLabel();
  touchLayout.addEventListener("change", updateLabel);

  // El navegador puede impedir la reproducción automática y conservar el respaldo.
  function updatePlayback() {
    if (inView && !paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  // El cambio de archivo espera los metadatos antes de restaurar el tiempo.
  function updateSource() {
    const source = root.classList.contains("dark")
      ? link.dataset.dark
      : link.dataset.light;

    if (!source || video.getAttribute("src") === source) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      position = video.currentTime;
    }

    video.style.visibility = "hidden";
    video.src = source;
    updatePlayback();
  }

  video.addEventListener("loadedmetadata", () => {
    video.currentTime = Math.min(position, video.duration || position);
  });
  video.addEventListener("loadeddata", () => {
    video.style.visibility = "";
  });
  new MutationObserver(updateSource).observe(root, {
    attributes: true,
    attributeFilter: ["class"],
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;

    if (inView) {
      if (!reducedMotion.matches) {
        video.preload = "auto";
      }

      updateSource();
    }

    updatePlayback();
  }).observe(link);

  // El desplazamiento horizontal recorre el video. El vertical sigue desplazando la página.
  link.addEventListener("pointerdown", (event) => {
    if (
      event.button !== 0 ||
      touchLayout.matches ||
      event.pointerType === "touch"
    ) {
      return;
    }

    moved = false;
    dragStart = { x: event.clientX, time: video.currentTime };
    link.setPointerCapture(event.pointerId);
  });
  link.addEventListener("pointermove", (event) => {
    if (!dragStart || !Number.isFinite(video.duration)) {
      return;
    }

    const distance = event.clientX - dragStart.x;

    if (Math.abs(distance) > 5) {
      moved = true;
    }

    if (moved) {
      const time =
        dragStart.time + (distance / link.clientWidth) * video.duration;
      video.currentTime = Math.max(0, Math.min(video.duration, time));
    }
  });
  for (const eventName of ["pointerup", "pointercancel"]) {
    link.addEventListener(eventName, () => {
      dragStart = undefined;
    });
  }

  // El ratón controla la vista previa y el toque abre el visor.
  function togglePlayback() {
    paused = !paused;
    updatePlayback();
  }

  link.addEventListener("click", (event) => {
    event.preventDefault();

    if (
      touchLayout.matches ||
      (event instanceof PointerEvent && event.pointerType === "touch")
    ) {
      openMedia();
    } else if (!moved || event.detail === 0) {
      togglePlayback();
    }

    moved = false;
  });
  link.addEventListener("keydown", (event) => {
    if (event.key === " ") {
      event.preventDefault();
      if (touchLayout.matches) {
        openMedia();
      } else {
        togglePlayback();
      }
    }
  });

  return video;
}
