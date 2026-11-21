import { scenes, STORY_DURATION } from "./story-timeline.js";
import {
  toEndingSeconds,
  toEndingPosition,
  toPresentationTime,
  toStoryTime,
} from "./story-playback.js";
import { directScene } from "./story-director.js";
import { actorGeometry, drawActor } from "./doodle-character.js";
import { mix, ramp, clamp } from "./doodle-math.js";
import { paintScene } from "./story-stage.js";
import { pencil } from "./doodle-props.js";
import { headShapes } from "./character-model.js";

export const ENDING_DURATION = 18;
const ENDING_SCENE_TIME = 31;
const scene = scenes[11];
const segment = scene.segments.find((part) => ENDING_SCENE_TIME < part.to);
const ENDING_START =
  scene.start +
  segment.start +
  ((segment.end - segment.start) * (ENDING_SCENE_TIME - segment.from)) /
    (segment.to - segment.from);
export const ENDING_POSITION = toPresentationTime(ENDING_START);
export const PRESENTATION_DURATION =
  ENDING_POSITION + toEndingPosition(ENDING_DURATION) * 1000;
const seed = directScene(11, ENDING_SCENE_TIME);
const baseCamera = seed.camera;
const SCALE = 0.9;
const RATIO = SCALE / 1.06;
const ENDING_WINDOW = { x: 400, y: 225, radius: 104 * RATIO };
const finalHead = { x: 400 - 12 * RATIO, y: 225 + 9 * RATIO };
const finalStar = { x: 400 + 68 * RATIO, y: 225 - 66 * RATIO };

// Calcular el contacto con el contorno real evita caminar contra el cristal antes del golpe.
function outlinePoints(d) {
  const tokens = d.match(/[MCQZ]|-?(?:\d*\.\d+|\d+)/g);
  const points = [];
  let i = 0;
  let current = { x: 0, y: 0 };
  // Consume el siguiente par de coordenadas del trazado que se está interpretando.
  const point = () => ({ x: Number(tokens[i++]), y: Number(tokens[i++]) });

  while (i < tokens.length) {
    const command = tokens[i++];

    if (command === "M") {
      current = point();
      points.push(current);
    } else if (command === "C") {
      const start = current;
      const a = point();
      const b = point();
      const end = point();

      for (let n = 1; n <= 40; n++) {
        const t = n / 40;
        const u = 1 - t;

        points.push({
          x:
            u * u * u * start.x +
            3 * u * u * t * a.x +
            3 * u * t * t * b.x +
            t * t * t * end.x,
          y:
            u * u * u * start.y +
            3 * u * u * t * a.y +
            3 * u * t * t * b.y +
            t * t * t * end.y,
        });
      }

      current = end;
    } else if (command === "Q") {
      const start = current;
      const a = point();
      const end = point();

      for (let n = 1; n <= 40; n++) {
        const t = n / 40;
        const u = 1 - t;

        points.push({
          x: u * u * start.x + 2 * u * t * a.x + t * t * end.x,
          y: u * u * start.y + 2 * u * t * a.y + t * t * end.y,
        });
      }

      current = end;
    }
  }

  return points;
}

const contactGeometry = actorGeometry(
  {
    ...seed.main,
    x: 0,
    y: 360,
    pose: "walk",
    previous: "walk",
    poseBlend: 1,
    gaitPhase: seed.main.gaitPhase + 6.2 / 1.4,
  },
  ENDING_SCENE_TIME + 6.2,
);
const contactAngle =
  contactGeometry.body.headTilt + contactGeometry.axis * 0.14;
const clearRadius =
  ENDING_WINDOW.radius - (3.6 * RATIO) / 2 - (2.5 * SCALE) / 2;
const CONTACT_X = Math.min(
  ...outlinePoints(headShapes.threeQuarter.outline).map((point) => {
    const x =
      contactGeometry.head.x +
      (point.x * Math.cos(contactAngle) - point.y * Math.sin(contactAngle)) *
        SCALE;
    const y =
      contactGeometry.head.y +
      (point.x * Math.sin(contactAngle) + point.y * Math.cos(contactAngle)) *
        SCALE;

    return (
      ENDING_WINDOW.x +
      Math.sqrt(
        Math.max(0, clearRadius * clearRadius - (y - ENDING_WINDOW.y) ** 2),
      ) -
      x
    );
  }),
);
// Agrupa el dibujo por nombre cuando el pintor permite separar capas.
const scope = (p, name, draw) => (p.scope ? p.scope(name, draw) : draw());
// Traslada un actor al encuadre de la cámara para la composición final.
const project = (spec, camera) => ({
  ...spec,
  x: 400 + (spec.x - camera.x),
  y: 225 + (spec.y - camera.y),
  scale: spec.scale ?? 1,
});

// Interpola posiciones entre los fotogramas clave correspondientes al tiempo actual.
function key(time, points) {
  let i = 0;

  while (i < points.length - 1 && time >= points[i + 1][0]) {
    i++;
  }

  const a = points[i];
  const b = points[Math.min(i + 1, points.length - 1)];
  const q = a === b ? 0 : ramp(time, a[0], b[0]);

  return { x: mix(a[1], b[1], q), y: mix(a[2], b[2], q) };
}

// Ajusta la posición del cuerpo para mantener la cabeza anclada durante la transición.
function anchorHead(spec, head, time) {
  const offset = actorGeometry({ ...spec, x: 0, y: 0 }, time).head;

  return { ...spec, x: head.x - offset.x, y: head.y - offset.y };
}

// Construye una estrella de cinco puntas alternando radios exteriores e interiores.
function starPath(radius) {
  return (
    Array.from({ length: 10 }, (_, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? radius * 0.43 : radius;

      return `${i ? "L" : "M"}${Math.cos(angle) * r} ${Math.sin(angle) * r}`;
    }).join("") + "Z"
  );
}

// Calcula el estado de personajes, estrella y cámara de la secuencia de cierre.
function endingState(seconds) {
  const t = clamp(seconds, 0, ENDING_DURATION);
  const motion = Math.min(t, 17);
  const modelTime = ENDING_SCENE_TIME + motion;
  const camera = {
    x: mix(baseCamera.x, 620, ramp(t, 0, 6.2)),
    y: baseCamera.y,
    zoom: 1,
  };
  const adultWorld = key(t, [
    [0, seed.main.x, 360],
    [1.6, 540, 360],
    [3.3, 585, 360],
    [5.7, CONTACT_X + 212, 360],
    [6.2, CONTACT_X + 220, 360],
  ]);
  let adult = project(
    {
      ...seed.main,
      ...adultWorld,
      pose: "walk",
      previous: "walk",
      poseBlend: 1,
      gaitPhase: seed.main.gaitPhase + Math.min(t, 6.2) / 1.4,
      blink: false,
    },
    camera,
  );

  adult.poseTime = modelTime;
  adult.previousPoseTime = modelTime;
  adult.expression = "happy";
  adult.look = 1;

  const morph = ramp(t, 1.55, 3.3);
  const childWorldX = mix(seed.secondary[0].x, 650, ramp(t, 0, 2.9));
  const childBase = project(
    {
      ...seed.secondary[0],
      x: childWorldX,
      pose: "walk",
      previous: "walk",
      poseBlend: 1,
      opacity: 1,
      blink: false,
      gaitPhase: seed.secondary[0].gaitPhase + Math.min(t, 1.55) / 1.4,
    },
    camera,
  );
  const childHead = actorGeometry(childBase, modelTime).head;
  const star = key(t, [
    [0, childHead.x, childHead.y],
    [1.55, childHead.x, childHead.y],
    [3.3, 650 - camera.x + 400, 207],
    [4.7, 713 - camera.x + 400, 181],
    [6.2, 502, 193],
    [7.1, 496, 157],
    [8.1, finalStar.x, finalStar.y],
    [18, finalStar.x, finalStar.y],
  ]);
  const child = anchorHead(
    {
      ...childBase,
      scale: childBase.scale * mix(1, 0.015, morph),
      pose: t > 1.55 ? "celebrate" : "walk",
      previous: "walk",
      poseBlend: ramp(t, 1.55, 1.9),
      opacity: morph < 1 ? 1 : 0,
    },
    star,
    modelTime,
  );

  if (t >= 6.2) {
    const recoil = key(t, [
      [6.2, CONTACT_X, 360],
      [6.31, CONTACT_X - 11, 361],
      [6.55, CONTACT_X - 29, 363],
      [6.8, CONTACT_X - 35, 363],
      [9.5, CONTACT_X - 35, 363],
    ]);
    const dizzy = t >= 6.85 && t < 9.55;

    // El paso termina en el contacto: las poses posteriores nunca mezclan otra caminata.
    adult = {
      ...adult,
      ...recoil,
      pose: dizzy ? "dizzy" : "impact",
      previous: "impact",
      poseBlend: dizzy ? ramp(t, 6.85, 7.1) : 1,
      expression: dizzy ? "dizzy" : "surprised",
      eyesClosed: t < 6.4,
      headTilt: 0,
      look: 0,
      lookY: 0,
    };

    if (t >= 9.55) {
      const settle = ramp(t, 9.55, 10.75);
      const greet = t >= 11 && t < 13.7;
      const notice = ramp(t, 13.7, 15.3);
      const target = {
        ...adult,
        pose: greet ? "wave" : "idle",
        previous: "idle",
        poseBlend: greet ? ramp(t, 11, 11.35) : 1,
        turn: notice,
        expression: greet ? "happy" : "curious",
        eyesClosed: false,
        headTilt: ((-7 * Math.PI) / 180) * notice,
        look: notice,
        lookY: -3 * notice,
      };
      const placed = anchorHead(target, finalHead, modelTime);

      adult = {
        ...target,
        x: mix(recoil.x, placed.x, settle),
        y: mix(recoil.y, placed.y, settle),
        previous: "dizzy",
        poseBlend: settle,
        turn: mix(0.7, target.turn, settle),
      };

      if (t >= 10.75) {
        adult = {
          ...placed,
          previous: greet ? "idle" : t >= 13.7 ? "wave" : "idle",
          poseBlend: greet
            ? ramp(t, 11, 11.35)
            : t >= 13.7
              ? ramp(t, 13.7, 14.2)
              : 1,
        };
      }
    }
  }

  const dizzyAmount = ramp(t, 6.5, 6.85) * (1 - ramp(t, 9.15, 9.55));
  const shake =
    t >= 6.2 && t < 6.8
      ? Math.sin((t - 6.2) * 58) * 4 * Math.exp(-(t - 6.2) * 7)
      : 0;
  const starAngle =
    t < 8.1
      ? 0.3 * Math.sin(t * 2)
      : t < 10.5
        ? 0.3 *
          Math.sin(16.2) *
          Math.exp(-(t - 8.1) * 2) *
          Math.cos((t - 8.1) * 5)
        : 0;
  const frame = ramp(t, 4.2, 6.1);
  const background = 1 - ramp(t, 3.8, 6.4);
  const impact = ramp(t, 6.16, 6.21) * (1 - ramp(t, 6.35, 6.75));
  const beat =
    t < 1.55
      ? "walk-together"
      : t < 3.3
        ? "child-becomes-star"
        : t < 6.2
          ? "follow-child-star"
          : t < 6.85
            ? "hard-window-collision"
            : t < 9.55
              ? "dizzy-recovery"
              : t < 11
                ? "notice-visitor"
                : t < 13.7
                  ? "greet-visitor"
                  : t < 15.3
                    ? "notice-hanging-star"
                    : "watch-child-star";

  return {
    t,
    modelTime,
    camera,
    adult,
    child,
    star,
    morph,
    frame,
    background,
    impact,
    dizzyAmount,
    shake,
    starAngle,
    beat,
    window: ENDING_WINDOW,
  };
}

// Limita el dibujo al interior o exterior de la ventana circular del emblema.
function clipWindow(ctx, outside) {
  const { x, y, radius } = ENDING_WINDOW;

  ctx.beginPath();

  if (outside) {
    ctx.rect(-100, -100, 1000, 650);
  }

  ctx.moveTo(x + radius - 1, y);
  ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
  ctx.clip(outside ? "evenodd" : "nonzero");
}

// Dibuja las capas del cierre desde su estado temporal sin avanzar el reloj por su cuenta.
export function paintEnding(p, seconds, { backdrop = true } = {}) {
  const s = endingState(seconds);
  const {
    t,
    modelTime,
    adult,
    child,
    star,
    morph,
    frame,
    background,
    impact,
    dizzyAmount,
    shake,
    starAngle,
  } = s;

  if (background > 0) {
    scope(p, "background", () => {
      p.ctx.save();
      p.ctx.globalAlpha *= background;

      if (backdrop) {
        paintScene(p, 11, ENDING_SCENE_TIME + t, {
          actors: false,
          endingBackdrop: true,
          direction: { ...seed, camera: s.camera },
        });
      } else {
        p.path("M20 360Q400 357 780 360", { width: 1.3, color: p.soft });
      }

      p.ctx.restore();
    });
  }

  if (morph < 1) {
    scope(p, "child", () => drawActor(p, child, modelTime));
  }

  // La parte del adulto que queda dentro del círculo conserva toda su opacidad.
  scope(p, "adult-inside", () => {
    p.ctx.save();
    clipWindow(p.ctx, false);
    drawActor(p, adult, modelTime);
    p.ctx.restore();
  });
  scope(p, "adult-outside", () => {
    p.ctx.save();
    clipWindow(p.ctx, true);
    p.ctx.globalAlpha *= 1 - frame;
    drawActor(p, adult, modelTime);
    p.ctx.restore();
  });
  scope(p, "pencil", () => {
    const hand = actorGeometry(adult, modelTime).hand;

    p.ctx.save();
    p.ctx.globalAlpha *= 1 - ramp(t, 1.55, 3.3);
    pencil(
      p,
      hand.x + Math.cos(-0.5) * 64 * 0.74,
      hand.y + Math.sin(-0.5) * 64 * 0.74,
      64,
      -0.5,
    );
    p.ctx.restore();
  });
  scope(p, "window", () => {
    const { x, y, radius } = ENDING_WINDOW;

    p.group(x + shake, y, 1, 0, frame, () =>
      p.ellipse(0, 0, radius, radius, { width: 3.6 * RATIO }),
    );
    p.group(x + radius, y - 20, 1, 0, impact, () =>
      p.path("M-3-17l5-7m-2 23 9-1m-8 17 7 6", { width: 2.2 }),
    );
  });
  scope(p, "dizzy-halo", () => {
    if (dizzyAmount <= 0) {
      return;
    }

    const head = actorGeometry(adult, modelTime).head;

    for (let i = 0; i < 3; i++) {
      const angle = (t - 6.5) * 3 + (i * Math.PI * 2) / 3;

      p.group(
        head.x + Math.cos(angle) * 27,
        head.y - 54 + Math.sin(angle) * 7,
        1,
        angle,
        dizzyAmount,
        () =>
          p.path(starPath(3.5), {
            fill: "#fbbf24",
            color: "#fbbf24",
            width: 0.7,
            dynamic: true,
          }),
      );
    }
  });
  scope(p, "star", () => {
    const size = mix(8, 19 * RATIO, ramp(t, 3.3, 8.1));

    p.group(star.x, star.y, 1, starAngle, ramp(t, 1.55, 1.8), () => {
      p.path(starPath(size), {
        color: "#fbbf24",
        fill: morph === 1 ? "#fbbf24" : false,
        width: 2.2,
        progress: ramp(morph, 0, 0.95),
        dynamic: morph >= 0.95,
      });
      p.path(`M${size + 4} -${size + 5}l3-5m-${size * 2 + 9} 8-2-4`, {
        color: "#fbbf24",
        width: 1.5,
        opacity: ramp(t, 7.7, 8.3),
      });
    });

    if (morph > 0 && morph < 1) {
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 0.4 + t * 1.2;
        const radius = 35 * Math.sin(morph * Math.PI);

        p.ellipse(
          star.x + Math.cos(angle) * radius,
          star.y + Math.sin(angle) * radius,
          1.2,
          1.2,
          {
            color: "#fbbf24",
            fill: "#fbbf24",
            opacity: Math.sin(morph * Math.PI),
            width: 0.6,
          },
        );
      }
    }
  });

  return {
    main: adult,
    geometry: actorGeometry(adult, modelTime),
    camera: s.camera,
    beat: s.beat,
    star: { ...star, source: "child" },
    morph,
    frame,
    background,
    window: ENDING_WINDOW,
  };
}

// Relaciona la posición de reproducción del cierre con el tiempo usado por la narración.
export function endingNarrationTime(position) {
  if (position < ENDING_POSITION) {
    return toStoryTime(position);
  }

  return mix(
    ENDING_START,
    STORY_DURATION,
    clamp(
      toEndingSeconds((position - ENDING_POSITION) / 1000) / ENDING_DURATION,
    ),
  );
}
