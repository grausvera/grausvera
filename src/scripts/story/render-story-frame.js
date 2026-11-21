import { storyAt, scenes, STORY_DURATION } from "./story-timeline.js";
import { paintScene } from "./story-stage.js";
import { createPainter } from "./doodle-draw.js";
import { drawActor } from "./doodle-character.js";
import { ramp } from "./doodle-math.js";
import { transitionActor } from "./story-transition.js";
import { paintEnding } from "./story-ending.js";

const WIDTH = 800;
const HEIGHT = 450;

// Proyecta las coordenadas de escena al encuadre de la cámara actual.
function project(spec, camera) {
  return {
    ...spec,
    x: 400 + (spec.x - camera.x) * camera.zoom,
    y: 225 + (spec.y - camera.y) * camera.zoom,
    scale: (spec.scale ?? 1) * camera.zoom,
  };
}

// Dibuja un fotograma determinista compartido por Inicio y la exportación de video.
export function createStoryRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const p = createPainter(ctx);
  const layers = [0, 1].map(() => {
    const surface = document.createElement("canvas");

    surface.width = 1600;
    surface.height = 900;

    const context = surface.getContext("2d");

    return { surface, context, painter: createPainter(context) };
  });

  // Aísla una capa de dibujo para mantener el orden y estado del renderizado.
  function layer(slot, index, t, actors) {
    const l = layers[slot];

    l.context.setTransform(2, 0, 0, 2, 0, 0);
    l.context.clearRect(0, 0, WIDTH, HEIGHT);
    l.context.fillStyle = p.paper;
    l.context.fillRect(0, 0, WIDTH, HEIGHT);
    l.painter.paper = p.paper;
    l.painter.ink = p.ink;
    l.painter.soft = p.soft;

    return paintScene(l.painter, index, t, { actors });
  }

  /** @param {{elapsed: number, endingTime?: number | null, paper: string, ink: string, soft: string}} frame Tiempo y paleta del fotograma. */
  function draw({ elapsed, endingTime = null, paper, ink, soft }) {
    p.paper = paper;
    p.ink = ink;
    p.soft = soft;

    const w = canvas.width;
    const h = canvas.height;

    ctx.setTransform(w / WIDTH, 0, 0, h / HEIGHT, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const state = storyAt(elapsed);
    const { scene, t, local } = state;
    let result;

    if (endingTime !== null) {
      result = paintEnding(p, endingTime);
    } else if (scene.index > 0 && scene.index !== 10 && local < 1500) {
      const q = ramp(local, 0, 1500);
      const previous = scenes[scene.index - 1];
      const old = layer(0, scene.index - 1, previous.nominal, false);
      const current = layer(1, scene.index, t, false);
      const pageTurn = scene.index === 3 || scene.index === 5;

      if (pageTurn) {
        ctx.drawImage(layers[1].surface, 0, 0, 1600, 900, 0, 0, WIDTH, HEIGHT);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, WIDTH * (1 - q), HEIGHT);
        ctx.clip();
        ctx.drawImage(layers[0].surface, 0, 0, 1600, 900, 0, 0, WIDTH, HEIGHT);
        ctx.restore();
        p.path(
          `M${WIDTH * (1 - q)} 0Q${WIDTH * (1 - q) - 70 * Math.sin(q * Math.PI)} 225 ${WIDTH * (1 - q)} 450`,
          { dynamic: true, width: 1.5, color: p.soft },
        );
      } else {
        layers[0].painter.erase(0, 0, WIDTH, HEIGHT, q);
        ctx.drawImage(
          layers[0].surface,
          0,
          0,
          1600,
          900,
          -q * WIDTH,
          0,
          WIDTH,
          HEIGHT,
        );
        ctx.drawImage(
          layers[1].surface,
          0,
          0,
          1600,
          900,
          (1 - q) * WIDTH,
          0,
          WIDTH,
          HEIGHT,
        );
      }

      const a = project(old.main, old.camera);
      const b = project(current.main, current.camera);
      const main = transitionActor(a, b, q, local / 1000, previous.nominal, t);
      const geometry = drawActor(p, main, local / 1000);

      result = { ...current, main, geometry, beat: "scene-travel" };
    } else {
      result = paintScene(p, scene.index, t);
    }

    const g = result.geometry;

    Object.assign(canvas.dataset, {
      time: String(state.time),
      scene: String(scene.index),
      shot: String(scene.index),
      beat: result.beat,
      action: result.main.pose,
      cue: String(state.cue.index),
      actorAge: result.main.age.toFixed(3),
      actorX: result.main.x.toFixed(3),
      camera: JSON.stringify(result.camera),
      contact: result.contact || "",
      handError: String(g?.nearError ?? 0),
      actorHand: JSON.stringify(g?.hand || {}),
      duration: String(STORY_DURATION),
      ending: String(endingTime ?? ""),
      star: JSON.stringify(result.star || {}),
      morph: String(result.morph ?? 0),
      window: JSON.stringify(result.window || {}),
      gaitPhase: String(g?.phase ?? 0),
      rigScale: String(g?.scale ?? 1),
      nearSole: JSON.stringify(g?.nearSole || {}),
      farSole: JSON.stringify(g?.farSole || {}),
    });
  }

  return draw;
}
