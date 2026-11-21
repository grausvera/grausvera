const menu = document.querySelector<HTMLButtonElement>(".menu-toggle");
const siteNavigation = document.querySelector("#site-navigation");
const theme = document.querySelector<HTMLButtonElement>(".theme-toggle");

// Sincroniza el estado accesible del menú y su presentación móvil.
function setMenu(open: boolean) {
  menu?.setAttribute("aria-expanded", String(open));
  menu?.setAttribute("aria-label", open ? "Cerrar menú" : "Menú");
  menu
    ?.querySelector("path")
    ?.setAttribute("d", open ? "m6 6 12 12M18 6 6 18" : "M4 8h16M4 16h12");
  siteNavigation?.classList.toggle("is-open", open);
}

menu?.addEventListener("click", () => {
  setMenu(menu.getAttribute("aria-expanded") !== "true");
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menu?.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menu.focus();
  }
});

document.addEventListener("pointerdown", (event) => {
  if (
    event.target instanceof Element &&
    !event.target.closest(".site-header")
  ) {
    setMenu(false);
  }
});

// Describe la acción del botón según el tema que está visible.
function updateThemeLabel() {
  const dark = document.documentElement.classList.contains("dark");
  theme?.setAttribute(
    "aria-label",
    dark ? "Activar tema claro" : "Activar tema oscuro",
  );
}

updateThemeLabel();
new MutationObserver(updateThemeLabel).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["class"],
});
theme?.addEventListener("click", () => {
  const dark = document.documentElement.classList.toggle("dark");

  try {
    localStorage.setItem("grausvera-theme", dark ? "dark" : "light");
  } catch {
    // La selección se conserva en la página actual.
  }
});
