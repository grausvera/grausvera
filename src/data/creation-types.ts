export const creationGroups = [
  { id: "software", label: "Software" },
  { id: "literature", label: "Literatura" },
  { id: "visual-art", label: "Arte visual" },
  { id: "music", label: "Música" },
  { id: "universes", label: "Universos" },
  { id: "other", label: "Otras creaciones" },
] as const;

export const creationTypes = {
  website: { label: "Sitio web", group: "software" },
  software: { label: "Aplicación", group: "software" },
  tool: { label: "Herramienta", group: "software" },
  game: { label: "Videojuego", group: "software" },
  library: { label: "Librería", group: "software" },
  api: { label: "API", group: "software" },
  story: { label: "Historia o libro", group: "literature" },
  illustration: { label: "Ilustración", group: "visual-art" },
  identity: { label: "Identidad visual", group: "visual-art" },
  model: { label: "Modelo 3D", group: "visual-art" },
  animation: { label: "Animación y video", group: "visual-art" },
  music: { label: "Música", group: "music" },
  universe: { label: "Universo", group: "universes" },
  general: { label: "Otra creación", group: "other" },
} as const;
