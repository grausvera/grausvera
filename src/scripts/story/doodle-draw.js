import { clamp } from "./doodle-math.js";

// Agrupa las primitivas de dibujo y reutiliza geometrías para renderizar la historia en canvas.
export function createPainter(ctx) {
  const cache = new Map();

  // Mide y guarda la geometría de un trazado para no recalcularla en cada cuadro.
  function geometry(d) {
    let entry = cache.get(d);

    if (entry) {
      return entry;
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "path");

    svg.setAttribute("d", d);

    const length = svg.getTotalLength();
    const count = Math.max(2, Math.ceil(length / 2));
    const points = Array.from({ length: count + 1 }, (_, i) => {
      const p = svg.getPointAtLength((i / count) * length);

      return { x: p.x, y: p.y };
    });

    entry = { path: new Path2D(d), points };
    cache.set(d, entry);

    return entry;
  }

  const api = {
    ctx,
    ink: "#22242a",
    paper: "#fffefa",
    soft: "#90918d",
    // Aísla transformaciones y opacidad para que un elemento no altere los siguientes.
    group(x, y, scale, angle, opacity, draw) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.rotate(angle);
      ctx.globalAlpha *= opacity;
      draw();
      ctx.restore();
    },
    // Pinta un trazado completo o parcial con el estilo y progreso indicados.
    path(
      d,
      {
        progress = 1,
        fill = false,
        width = 2.2,
        opacity = 1,
        color,
        pen = false,
        dynamic = false,
      } = {},
    ) {
      if (progress <= 0 || opacity <= 0) {
        return;
      }

      ctx.save();
      ctx.globalAlpha *= opacity;
      ctx.strokeStyle = color || api.ink;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const entry = dynamic ? { path: new Path2D(d) } : geometry(d);

      if (fill && progress >= 1) {
        ctx.fillStyle = typeof fill === "string" ? fill : api.paper;
        ctx.fill(entry.path);
      }

      if (progress >= 1) {
        ctx.stroke(entry.path);
      } else {
        const value = clamp(progress) * (entry.points.length - 1);
        const last = Math.floor(value);

        ctx.beginPath();

        for (let i = 0; i <= last; i++) {
          const a = entry.points[i];
          const b = entry.points[i - 1];

          if (!b || Math.hypot(a.x - b.x, a.y - b.y) > 7) {
            ctx.moveTo(a.x, a.y);
          } else {
            ctx.lineTo(a.x, a.y);
          }
        }

        const a = entry.points[last];
        const b = entry.points[Math.min(last + 1, entry.points.length - 1)];
        const tip = {
          x: a.x + (b.x - a.x) * (value - last),
          y: a.y + (b.y - a.y) * (value - last),
        };

        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        if (pen) {
          ctx.translate(tip.x, tip.y);
          ctx.rotate(0.55);
          ctx.fillStyle = api.paper;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-3, -12);
          ctx.lineTo(-3, -39);
          ctx.lineTo(3, -39);
          ctx.lineTo(3, -12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.restore();
    },
    // Distribuye el progreso total entre varios trazados para revelarlos en secuencia.
    lines(items, progress = 1, options = {}) {
      items.forEach((d, i) =>
        api.path(d, {
          ...options,
          progress: clamp(progress * items.length - i),
        }),
      );
    },
    // Dibuja una elipse respetando progreso, relleno y opacidad.
    ellipse(
      x,
      y,
      rx,
      ry,
      { fill = false, width = 2.2, progress = 1, color, opacity = 1 } = {},
    ) {
      if (progress <= 0) {
        return;
      }

      ctx.save();
      ctx.globalAlpha *= opacity;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        Math.max(0.1, rx),
        Math.max(0.1, ry),
        0,
        0,
        Math.PI * 2 * clamp(progress),
      );

      if (fill && progress >= 1) {
        ctx.fillStyle = typeof fill === "string" ? fill : api.paper;
        ctx.fill();
      }

      ctx.lineWidth = width;
      ctx.strokeStyle = color || api.ink;
      ctx.stroke();
      ctx.restore();
    },
    // Dibuja el texto de escena con alineación y tipografía consistentes.
    text(
      text,
      x,
      y,
      size = 16,
      { opacity = 1, align = "center", color, hand = true } = {},
    ) {
      ctx.save();
      ctx.globalAlpha *= opacity;
      ctx.fillStyle = color || api.ink;
      ctx.font = `${size}px ${hand ? '"Trebuchet MS", sans-serif' : "monospace"}`;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
      ctx.restore();
    },
    // Simula un borrado por filas en lugar de retirar todo el dibujo de golpe.
    erase(x, y, w, h, progress) {
      const t = clamp(progress);
      const rows = 6;
      const row = Math.floor(t * rows);
      const part = t * rows - row;

      ctx.save();
      ctx.fillStyle = api.paper;
      ctx.fillRect(x - 8, y - 8, w + 16, (h / rows) * row + 8);

      if (row < rows) {
        ctx.fillRect(
          x - 8,
          y + (h / rows) * row,
          (w + 16) * part,
          h / rows + 12,
        );
      }

      ctx.restore();

      if (t > 0 && t < 1) {
        api.group(x + w * part, y + (h / rows) * (row + 0.5), 1, -0.12, 1, () =>
          api.path("M-17-9h34v18h-34Z", { fill: "#ebe9e2", width: 1.5 }),
        );
      }
    },
  };

  return api;
}
