// Muestra el tiempo del video en minutos y segundos, incluso antes de cargarlo.
function formatTime(value: number) {
  const seconds = Number.isFinite(value) ? Math.floor(value) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// Crea un reproductor con controles propios y conserva los nativos como respaldo.
export function createViewerVideo(
  source: string,
  description: string,
  hasAudio: boolean,
  template: HTMLTemplateElement | null,
) {
  const video = document.createElement("video");
  const toolbar = template?.content.cloneNode(true) as
    DocumentFragment | undefined;

  video.src = source;
  video.controls = true;
  video.playsInline = true;
  video.muted = true;
  video.autoplay = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  video.setAttribute("aria-label", description);

  const play = toolbar?.querySelector<HTMLButtonElement>("[data-video-play]");
  const restart = toolbar?.querySelector<HTMLButtonElement>(
    "[data-video-restart]",
  );
  const seek = toolbar?.querySelector<HTMLInputElement>("[data-video-seek]");
  const time = toolbar?.querySelector("[data-video-time]");
  const mute = toolbar?.querySelector<HTMLButtonElement>("[data-video-mute]");
  const volume = toolbar?.querySelector<HTMLInputElement>(
    "[data-video-volume]",
  );

  if (!toolbar || !play || !restart || !seek || !time || !mute || !volume) {
    return { video, controls: null };
  }

  video.controls = false;

  // Sincroniza el contador y la barra, también cuando la posición cambia por teclado.
  function updateTime() {
    if (!seek || !time) {
      return;
    }

    const hasDuration = Number.isFinite(video.duration) && video.duration > 0;
    seek.disabled = !hasDuration;
    seek.max = String(hasDuration ? video.duration : 1);
    seek.value = String(video.currentTime);
    seek.setAttribute(
      "aria-valuetext",
      `${formatTime(video.currentTime)} de ${formatTime(video.duration)}`,
    );
    time.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  }

  // Refleja el estado de reproducción, incluido el final del video.
  function updatePlay() {
    const paused = video.paused || video.ended;
    play?.setAttribute("aria-label", paused ? "Reproducir" : "Pausar");
    play?.toggleAttribute("data-playing", !paused);
  }

  // Alterna la reproducción sin depender de los controles del navegador.
  function togglePlayback() {
    if (video.paused || video.ended) {
      void video.play().catch(() => updatePlay());
    } else {
      video.pause();
    }
  }

  play.addEventListener("click", togglePlayback);
  video.addEventListener("click", togglePlayback);
  restart.addEventListener("click", () => {
    video.currentTime = 0;
    void video.play().catch(() => updatePlay());
  });
  seek.addEventListener("input", () => {
    video.currentTime = seek.valueAsNumber;
    updateTime();
  });
  for (const event of [
    "loadedmetadata",
    "durationchange",
    "timeupdate",
    "seeked",
  ]) {
    video.addEventListener(event, updateTime);
  }
  for (const event of ["play", "pause", "ended"]) {
    video.addEventListener(event, updatePlay);
  }

  if (hasAudio) {
    mute.disabled = false;
    mute.setAttribute("aria-label", "Activar sonido");
    volume.hidden = false;
    mute.addEventListener("click", () => {
      video.muted = !video.muted;
    });
    volume.addEventListener("input", () => {
      video.volume = volume.valueAsNumber;
      video.muted = video.volume === 0;
    });
    video.addEventListener("volumechange", () => {
      const silent = video.muted || video.volume === 0;
      mute.setAttribute("aria-label", silent ? "Activar sonido" : "Silenciar");
      mute.toggleAttribute("data-audible", !silent);
    });
  }

  return { video, controls: toolbar };
}
