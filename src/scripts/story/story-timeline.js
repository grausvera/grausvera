import { scriptChapters } from "./story-script.js";

// Cuenta las palabras para asignar tiempo de lectura a cada fragmento narrado.
const count = (text) => text.split(/\s+/).length;

// Divide el texto narrado en fragmentos utilizados por la línea de tiempo.
function split(text) {
  const parts = [];

  for (const sentence of text.match(/[^.!?…]+(?:[.!?…]+[»”]?|$)/g) || [text]) {
    const words = sentence.trim().split(/\s+/);

    while (words.length > 20) {
      let n = 17;

      for (let i = 10; i < 19; i++) {
        if (/[,;:]$/.test(words[i])) {
          n = i + 1;
        }
      }

      parts.push(words.splice(0, n).join(" "));
    }

    if (words.length) {
      parts.push(words.join(" "));
    }
  }

  return parts;
}

const cues = [];
const chapters = [];
export const scenes = [];
let clock = 0;

for (const [index, script] of scriptChapters.entries()) {
  // Cada bloque se amplía si requiere más tiempo de lectura. La coreografía sigue la misma curva temporal.
  const scene = {
    index,
    id: `scene-${index + 1}`,
    title: script.title,
    act: script.act,
    start: clock,
    cues: [],
    segments: [],
    paragraphs: script.blocks.map((b) => b[2]),
    nominal: script.seconds,
  };
  let local = 0;
  let nominal = 0;

  for (const [from, to, text] of script.blocks) {
    if (from > nominal) {
      scene.segments.push({
        start: local,
        end: local + (from - nominal) * 1000,
        from: nominal,
        to: from,
      });
      local += (from - nominal) * 1000;
    }

    const duration = Math.max((to - from) * 1000, count(text) * 340);

    scene.segments.push({ start: local, end: local + duration, from, to });

    const parts = split(text);
    const weights = parts.map((s) => count(s) + 1.2);
    const sum = weights.reduce((a, b) => a + b, 0);
    let cursor = clock + local;

    parts.forEach((text, i) => {
      const length = (duration * weights[i]) / sum;
      const cue = {
        index: cues.length,
        scene: index,
        chapter: index,
        text,
        words: text.split(/\s+/),
        start: cursor,
        end: cursor + length,
      };

      cues.push(cue);
      scene.cues.push(cue.index);
      cursor += length;
    });
    local += duration;
    nominal = to;
  }

  if (nominal < script.seconds) {
    scene.segments.push({
      start: local,
      end: local + (script.seconds - nominal) * 1000,
      from: nominal,
      to: script.seconds,
    });
    local += (script.seconds - nominal) * 1000;
  }

  scene.end = clock + local;
  scene.duration = local;
  clock = scene.end;
  scenes.push(scene);
  chapters.push(scene);
}

export const STORY_DURATION = Math.ceil(clock / 10) * 10;

// Localiza la escena y narración correspondientes a la posición actual de la historia.
export function storyAt(elapsed) {
  const time = Math.max(0, Math.min(STORY_DURATION, elapsed));
  const scene = scenes.find((s) => time < s.end) || scenes.at(-1);
  const local = time - scene.start;
  const segment =
    scene.segments.find((s) => local < s.end) || scene.segments.at(-1);
  const t =
    segment.from +
    (segment.to - segment.from) *
      Math.max(
        0,
        Math.min(1, (local - segment.start) / (segment.end - segment.start)),
      );
  const cue =
    cues[scene.cues.find((i) => time < cues[i].end) ?? scene.cues.at(-1)];
  const ratio = Math.max(
    0,
    Math.min(1, (time - cue.start) / (cue.end - cue.start)),
  );

  return {
    time,
    scene,
    local,
    t,
    cue,
    word: Math.min(cue.words.length - 1, Math.floor(ratio * cue.words.length)),
    ratio,
  };
}
