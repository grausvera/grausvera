import type { APIRoute } from "astro";
import { noIndex } from "../data/site-metadata";

// Las vistas de prueba permiten leer la etiqueta noindex y omiten el sitemap de producción.
export const GET: APIRoute = ({ site }) => {
  const rules = ["User-agent: *", "Allow: /"];

  if (!noIndex) {
    rules.push(`Sitemap: ${new URL("/sitemap.xml", site).href}`);
  }

  return new Response(`${rules.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
