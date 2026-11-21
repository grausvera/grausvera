const surface = document.querySelector(".brand-cursor-effects");
const sparkModel = surface
  ?.querySelector("template")
  ?.content.querySelector("svg");

if (surface && sparkModel) {
  setupCursorEffects(surface, sparkModel);
}

// Refleja la pulsación del ratón y añade un destello en las zonas que admiten el efecto.
function setupCursorEffects(surface: Element, sparkModel: SVGSVGElement) {
  const pointer = matchMedia("(hover: hover) and (pointer: fine)");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const sparks = new Map<SVGSVGElement, number>();

  // Restaura la apariencia del cursor al soltar el ratón.
  function release() {
    document.body.classList.remove("brand-cursor-pressing");
  }

  // Retira cada destello al terminar su animación o al salir de la página.
  function removeSpark(spark: SVGSVGElement) {
    clearTimeout(sparks.get(spark));
    sparks.delete(spark);
    spark.remove();
  }

  // Limpia el efecto al perder el foco o cambiar las preferencias de interacción.
  function clear() {
    release();

    for (const spark of sparks.keys()) {
      removeSpark(spark);
    }
  }

  // Conserva las interacciones propias del editor de texto y de los medios.
  function press(event: PointerEvent) {
    const target = event.target;

    if (
      !pointer.matches ||
      motion.matches ||
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      !event.isPrimary ||
      !(target instanceof Element)
    ) {
      return;
    }

    const cursor = getComputedStyle(target).cursor;

    if (/\/(?:point|press)(?:-dark)?\.svg/.test(cursor)) {
      document.body.classList.add("brand-cursor-pressing");
    }

    if (
      target.closest(
        "input, textarea, select, [contenteditable], canvas, [role='slider'], .contact-card, video, dialog",
      )
    ) {
      return;
    }

    const oldest = sparks.keys().next().value;

    if (sparks.size >= 4 && oldest) {
      removeSpark(oldest);
    }

    const spark = sparkModel.cloneNode(true) as SVGSVGElement;
    spark.style.left = `${event.clientX}px`;
    spark.style.top = `${event.clientY}px`;
    surface.append(spark);
    sparks.set(
      spark,
      window.setTimeout(() => removeSpark(spark), 460),
    );
  }

  window.addEventListener("pointerdown", press, { passive: true });
  window.addEventListener("pointerup", release, true);
  window.addEventListener("pointercancel", release, true);
  window.addEventListener("blur", clear);
  window.addEventListener("pagehide", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clear();
    }
  });
  pointer.addEventListener("change", clear);
  motion.addEventListener("change", clear);
}
