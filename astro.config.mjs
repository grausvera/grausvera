import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import hosting from "./vercel.json" with { type: "json" };

// Usa las mismas rutas antiguas en la compilación local y en Vercel.
const redirects = Object.fromEntries(
  hosting.redirects.map(({ source, destination }) => [source, destination]),
);

// Cada página pública se genera como HTML durante la compilación.
export default defineConfig({
  output: "static",
  redirects,
  integrations: [mdx()],
  site: "https://grausvera.vercel.app",
  // Oculta la barra de desarrollo también dentro de la vista responsive.
  devToolbar: { enabled: false },
});
