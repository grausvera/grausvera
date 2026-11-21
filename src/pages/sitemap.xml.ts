import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { getEntryPath, getPublishedEntries } from "../data/bitacora";
import { noIndex } from "../data/site-metadata";

// Genera el sitemap a partir de páginas públicas y fichas publicadas.
export const GET: APIRoute = async ({ site }) => {
  const pages = ["/", "/about", "/contact", "/creations", "/bitacora"];

  if (!noIndex) {
    const [creations, entries] = await Promise.all([
      getCollection("creations"),
      getPublishedEntries(),
    ]);
    pages.push(
      ...creations
        .map(({ id }) => `/creations/${encodeURIComponent(id)}`)
        .sort(),
      ...entries.map(({ id }) => getEntryPath(id)),
    );
  }

  const urls = noIndex ? [] : pages.map((path) => new URL(path, site).href);
  const entries = urls
    .map((url) => `  <url><loc>${url}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
