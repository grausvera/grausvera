// Limita un valor al intervalo indicado para evitar progresos fuera de rango.
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// Interpola linealmente entre dos valores según el progreso recibido.
export const mix = (a, b, t) => a + (b - a) * t;

// Suaviza el inicio y final de una transición sin cambiar sus extremos.
export const smooth = (t) => {
  t = clamp(t);

  return t * t * (3 - 2 * t);
};

// Convierte un intervalo temporal en un progreso limitado y suavizado.
export const ramp = (t, a, b) => smooth((t - a) / (b - a));

// Construye un punto con coordenadas x e y para los cálculos de geometría.
export const point = (x, y) => ({ x, y });

// Interpola las coordenadas de dos puntos con un mismo progreso.
export const blend = (a, b, t) => point(mix(a.x, b.x, t), mix(a.y, b.y, t));

// Produce una oscilación periódica para movimientos suaves como la respiración.
export const wave = (t, speed = 1, amount = 1) => Math.sin(t * speed) * amount;

// Calcula la altura de un arco durante el intervalo; devuelve cero en sus extremos.
export const arc = (t, a, b, height) =>
  Math.sin(clamp((t - a) / (b - a)) * Math.PI) * height;

// Las claves representan acciones, no fotogramas aislados; todos los valores geométricos se interpolan.
export function track(keys, time) {
  let i = 0;

  while (i < keys.length - 1 && time >= keys[i + 1].at) {
    i++;
  }

  const a = keys[i];
  const b = keys[Math.min(i + 1, keys.length - 1)];
  const u = a === b ? 0 : ramp(time, a.at, b.at);
  const out = { ...a };

  for (const key of [
    "x",
    "y",
    "age",
    "scale",
    "turn",
    "lean",
    "headTilt",
    "opacity",
    "jump",
    "rotation",
  ]) {
    if (typeof a[key] === "number") {
      out[key] = mix(a[key], b[key] ?? a[key], u);
    }
  }

  let gaitPhase = 0;

  for (let j = 0; j <= i; j++) {
    const key = keys[j];
    const end = keys[j + 1]?.at ?? time;

    if (key.pose === "walk" || key.pose === "run") {
      gaitPhase +=
        Math.max(0, Math.min(time, end) - key.at) /
        (key.pose === "run" ? 0.92 : 1.4);
    }
  }

  out.gaitPhase = gaitPhase;
  out.previous = keys[Math.max(0, i - 1)].pose || a.pose;
  out.pose = a.pose || "idle";
  out.poseBlend = ramp(time, a.at, a.at + 0.7);
  out.phase = time - a.at;

  return out;
}

// Resuelve una articulación de dos segmentos respetando sus longitudes y sentido de flexión.
export function joint(a, b, l1, l2, bend = 1) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const raw = Math.hypot(dx, dy) || 0.001;
  const d = clamp(raw, Math.abs(l1 - l2) + 0.1, l1 + l2 - 0.01);
  const ux = raw <= 0.001 ? 0 : dx / raw;
  const uy = raw <= 0.001 ? 1 : dy / raw;
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));

  return {
    knee: point(
      a.x + ux * along - uy * h * bend,
      a.y + uy * along + ux * h * bend,
    ),
    end: point(a.x + ux * d, a.y + uy * d),
  };
}
