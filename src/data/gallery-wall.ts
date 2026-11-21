type Dimensions = { id?: string; width: number; height: number };
type WallLayout = { width: number; height: number; frames: WallFrame[] };
type WallFrame = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type Leaf = { index: number; count: number; aspect: number; gapOffset: number };
type Branch = {
  direction: "horizontal" | "vertical";
  first: Node;
  second: Node;
  count: number;
  aspect: number;
  gapOffset: number;
};
type Node = Leaf | Branch;
type Region = { node: Node; area: number };
type Candidate = {
  node: Node;
  height: number;
  frames: WallFrame[];
  regions: Region[];
  score: number;
  signature: string;
};

const CANDIDATE_LIMIT = 8;
const INSERTION_LIMIT = 18;
const cachedLayouts = new Map<string, WallLayout>();

// Produce una semilla estable para que el mismo contenido y orden generen la misma composición.
function hash(value: string) {
  let result = 2166136261;

  for (const character of value) {
    result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  }

  return result >>> 0;
}

// Obtiene una proporción utilizable y limita formatos extremos sin recortar el archivo original.
function aspectRatio(item: Dimensions, width: number) {
  if (
    !item.width ||
    !item.height ||
    item.width <= 0 ||
    item.height <= 0 ||
    !Number.isFinite(item.width) ||
    !Number.isFinite(item.height)
  ) {
    return 4 / 3;
  }

  // Los formatos extremos permanecen completos dentro de un marco utilizable.
  const maximum = Math.max(1, Math.min(12, width / 64));

  return Math.max(1 / 12, Math.min(maximum, item.width / item.height));
}

// Une dos regiones horizontales o verticales calculando la proporción y separación resultantes.
function combine(
  first: Node,
  second: Node,
  direction: Branch["direction"],
): Branch {
  const count = first.count + second.count;

  if (direction === "vertical") {
    return {
      direction,
      first,
      second,
      count,
      aspect: 1 / (1 / first.aspect + 1 / second.aspect),
      gapOffset: first.gapOffset + second.gapOffset + 1,
    };
  }

  // Las ramas colocadas lado a lado comparten altura, incluido el espacio entre ellas.
  const aspect = first.aspect + second.aspect;

  return {
    direction,
    first,
    second,
    count,
    aspect,
    gapOffset:
      (first.aspect * first.gapOffset + second.aspect * second.gapOffset - 1) /
      aspect,
  };
}

// Calcula la altura de una región a partir de su ancho, proporción y espacios internos.
function heightAtWidth(node: Node, width: number, gap: number) {
  return width / node.aspect + node.gapOffset * gap;
}

// Convierte el árbol de composición en marcos y conserva los índices originales del documento.
function place(
  node: Node,
  x: number,
  y: number,
  width: number,
  gap: number,
  frames: WallFrame[],
  regions?: Region[],
) {
  const height = heightAtWidth(node, width, gap);

  regions?.push({ node, area: width * height });

  if ("index" in node) {
    // El orden del documento y del visor conserva el índice original.
    frames[node.index] = { index: node.index, x, y, width, height };

    return;
  }

  if (node.direction === "vertical") {
    const firstHeight = heightAtWidth(node.first, width, gap);

    place(node.first, x, y, width, gap, frames, regions);
    place(node.second, x, y + firstHeight + gap, width, gap, frames, regions);

    return;
  }

  const firstWidth = node.first.aspect * (height - node.first.gapOffset * gap);

  place(node.first, x, y, firstWidth, gap, frames, regions);
  place(
    node.second,
    x + firstWidth + gap,
    y,
    width - firstWidth - gap,
    gap,
    frames,
    regions,
  );
}

// Penaliza alineaciones que vuelven demasiado uniforme la composición del mosaico.
function alignmentPenalty(
  node: Node,
  width: number,
  gap: number,
  wallWidth: number,
  height: number,
): number {
  if ("index" in node) {
    return 0;
  }

  const regionHeight = heightAtWidth(node, width, gap);
  const firstWidth =
    node.direction === "vertical"
      ? width
      : node.first.aspect * (regionHeight - node.first.gapOffset * gap);
  const secondWidth =
    node.direction === "vertical" ? width : width - firstWidth - gap;

  // Los cortes verticales largos hacen que el conjunto parezca columnas independientes.
  const longCutPenalty =
    node.direction === "horizontal" && node.count >= 3
      ? Math.max(0, regionHeight / height - 0.55) ** 2 * 5
      : 0;

  // Repetir divisiones en la misma dirección produce filas o columnas uniformes.
  const repeatedCuts = [node.first, node.second].filter(
    (child) => "direction" in child && child.direction === node.direction,
  ).length;
  const alignedArea = (width * regionHeight) / (wallWidth * height);

  return (
    longCutPenalty +
    repeatedCuts * alignedArea * 0.7 +
    alignmentPenalty(node.first, firstWidth, gap, wallWidth, height) +
    alignmentPenalty(node.second, secondWidth, gap, wallWidth, height)
  );
}

// Puntúa el equilibrio entre altura, tamaños y variedad de los marcos candidatos.
function score(
  frames: WallFrame[],
  height: number,
  width: number,
  weights: number[],
) {
  const referenceColumns = width < 600 ? 2 : 3;
  const targetHeight = Math.max(
    220,
    (frames.length * width) / referenceColumns ** 2,
  );
  const totalArea = frames.reduce(
    (sum, frame) => sum + frame.width * frame.height,
    0,
  );
  const totalWeight = weights
    .slice(0, frames.length)
    .reduce((sum, weight) => sum + weight, 0);
  const minimumWidth = Math.min(140, width * 0.4);
  let sizePenalty = 0;
  let hierarchyPenalty = 0;

  for (const frame of frames) {
    const targetArea = (totalArea * weights[frame.index]) / totalWeight;

    sizePenalty += Math.max(0, 1 - frame.width / minimumWidth) ** 2;
    sizePenalty += Math.max(0, 1 - frame.height / 80) ** 2;
    hierarchyPenalty +=
      Math.log((frame.width * frame.height) / targetArea) ** 2;
  }

  return (
    Math.log(height / targetHeight) ** 2 +
    sizePenalty * 8 +
    (hierarchyPenalty * 0.7) / frames.length
  );
}

// Descarta composiciones inválidas y calcula los marcos y la puntuación de una alternativa.
function evaluate(
  node: Node,
  width: number,
  gap: number,
  weights: number[],
): Candidate | null {
  const height = heightAtWidth(node, width, gap);

  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }

  const frames: WallFrame[] = [];
  const regions: Region[] = [];

  place(node, 0, 0, width, gap, frames);

  if (
    frames.some(
      (frame) =>
        frame.width <= 0 ||
        frame.height <= 0 ||
        !Number.isFinite(frame.width) ||
        !Number.isFinite(frame.height),
    )
  ) {
    return null;
  }

  return {
    node,
    height,
    frames,
    regions,
    score:
      score(frames, height, width, weights) +
      alignmentPenalty(node, width, gap, width, height),
    signature: "",
  };
}

// Inserta una nueva región en la rama elegida sin mutar el árbol de la alternativa anterior.
function insert(
  node: Node,
  target: Node,
  addition: Node,
  direction: Branch["direction"],
): Node {
  if (node === target) {
    return combine(node, addition, direction);
  }

  if ("index" in node) {
    return node;
  }

  const first = insert(node.first, target, addition, direction);
  const second = insert(node.second, target, addition, direction);

  if (first === node.first && second === node.second) {
    return node;
  }

  return combine(first, second, node.direction);
}

// Selecciona regiones donde dividir la composición para incorporar el siguiente recurso.
function insertionPoints(candidate: Candidate, width: number, gap: number) {
  if (!candidate.regions.length) {
    place(candidate.node, 0, 0, width, gap, [], candidate.regions);
  }

  // Cualquier región anterior puede volver a dividirse; ninguna sección se cierra.
  const largest = [...candidate.regions]
    .sort((a, b) => b.area / b.node.count - a.area / a.node.count)
    .slice(0, INSERTION_LIMIT)
    .map((region) => region.node);
  const last = candidate.regions.find(
    (region) =>
      "index" in region.node &&
      region.node.index === candidate.frames.length - 1,
  );

  return new Set([candidate.node, ...largest, ...(last ? [last.node] : [])]);
}

// Conserva un conjunto pequeño de alternativas distintas para limitar el costo de búsqueda.
function retain(candidates: Candidate[], candidate: Candidate | null) {
  if (
    !candidate ||
    (candidates.length === CANDIDATE_LIMIT &&
      candidate.score >= candidates[candidates.length - 1].score)
  ) {
    return;
  }

  // Evita conservar varias estructuras que producen la misma composición visual.
  candidate.signature = candidate.frames
    .map((frame) =>
      [frame.x, frame.y, frame.width, frame.height]
        .map((value) => Math.round(value * 10))
        .join(","),
    )
    .sort()
    .join(";");

  const duplicate = candidates.findIndex(
    (saved) => saved.signature === candidate.signature,
  );

  if (duplicate !== -1) {
    if (candidates[duplicate].score <= candidate.score) {
      return;
    }

    candidates.splice(duplicate, 1);
  }

  candidates.push(candidate);
  candidates.sort((a, b) => a.score - b.score);
  candidates.splice(CANDIDATE_LIMIT);
}

// Reajusta una composición global al añadir cada archivo; no distribuye bloques independientes.
export function layoutGalleryWall(
  items: readonly Dimensions[],
  availableWidth: number,
): WallLayout {
  const width =
    Number.isFinite(availableWidth) && availableWidth > 0
      ? availableWidth
      : 780;
  const gap = width < 600 ? 10 : 12;

  if (!items.length) {
    return { width, height: 0, frames: [] as WallFrame[] };
  }

  const leaves: Leaf[] = items.map((item, index) => ({
    index,
    count: 1,
    aspect: aspectRatio(item, width),
    gapOffset: 0,
  }));

  // La secuencia determina la jerarquía; no cambia al recargar ni entre variantes de tema.
  const order = items.map((item, index) => item.id ?? index).join("|");
  const weights = items.map((_, index) =>
    index === 0 ? 1.7 : 0.6 + (hash(`${order}:${index}`) % 9) / 10,
  );
  const cacheKey = `${width}:${order}:${leaves.map((leaf) => leaf.aspect).join(",")}`;
  const cached = cachedLayouts.get(cacheKey);

  if (cached) {
    return cached;
  }

  const initial = evaluate(leaves[0], width, gap, weights)!;
  let candidates = [initial];

  for (const leaf of leaves.slice(1)) {
    const next: Candidate[] = [];

    for (const candidate of candidates) {
      for (const target of insertionPoints(candidate, width, gap)) {
        retain(
          next,
          evaluate(
            insert(candidate.node, target, leaf, "horizontal"),
            width,
            gap,
            weights,
          ),
        );
        retain(
          next,
          evaluate(
            insert(candidate.node, target, leaf, "vertical"),
            width,
            gap,
            weights,
          ),
        );
      }
    }

    candidates = next;
  }

  // El orden elige entre alternativas de calidad similar, no solo intercambia sus imágenes.
  const alternatives = candidates.filter(
    (candidate) => candidate.score <= candidates[0].score + 0.3,
  );
  const best = alternatives[hash(order) % alternatives.length];

  // Solo una obra individual puede centrarse para limitar una altura excesiva.
  if (items.length === 1) {
    const height = Math.min(best.height, Math.max(440, Math.min(680, width)));
    const frameWidth = height * leaves[0].aspect;

    return {
      width,
      height,
      frames: [
        {
          index: 0,
          x: (width - frameWidth) / 2,
          y: 0,
          width: frameWidth,
          height,
        },
      ],
    };
  }

  const result = { width, height: best.height, frames: best.frames };

  // Reutiliza geometría al cargar variantes de igual proporción; no conserva datos ni archivos.
  if (cachedLayouts.size >= 12) {
    const oldest = cachedLayouts.keys().next().value;

    if (oldest !== undefined) {
      cachedLayouts.delete(oldest);
    }
  }

  cachedLayouts.set(cacheKey, result);

  return result;
}
