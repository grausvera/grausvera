import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

// Cada página pública se genera como HTML durante la compilación.
export default defineConfig({
  output: "static",
  integrations: [mdx()],
  site: "https://grausvera.vercel.app",
  // Oculta la barra de desarrollo también dentro de la vista responsive.
  devToolbar: { enabled: false },
});
