import { getCollection, getEntry, type CollectionEntry } from "astro:content";

const dateFormat = new Intl.DateTimeFormat("es", {
  dateStyle: "long",
  timeZone: "UTC",
});

// Devuelve solo las entradas públicas, de la más reciente a la más antigua.
export async function getPublishedEntries() {
  const entries = await getCollection("bitacora", ({ data }) => !data.draft);

  return entries.sort(
    (first, second) =>
      second.data.date.localeCompare(first.data.date) ||
      first.id.localeCompare(second.id),
  );
}

// Construye la URL pública a partir del UUID de la entrada.
export function getEntryPath(id: string) {
  return `/bitacora/${encodeURIComponent(id)}`;
}

// Formatea la fecha editorial sin desplazarla por la zona horaria del servidor.
export function formatEntryDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

// Usa una portada editorial propia o reutiliza la de la creación relacionada.
export async function getEntryCover(data: CollectionEntry<"bitacora">["data"]) {
  if (data.cover) {
    return data.cover;
  }

  const creation = data.creation ? await getEntry(data.creation) : undefined;
  return creation?.data.cover;
}
