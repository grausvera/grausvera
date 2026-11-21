import {
  clamp,
  mix,
  blend,
  point,
  joint,
  smooth,
  wave,
} from "./doodle-math.js";
import {
  MODEL,
  headShapes,
  shirtShapes,
  armAnchors,
  shirtDetails,
  handPath,
  shoePath,
} from "./character-model.js";

// Redondea las coordenadas SVG para evitar cadenas largas sin una mejora visible.
const f = (n) => Number(n.toFixed(3));

// Convierte un punto a las coordenadas de un segmento SVG con precisión acotada.
const xy = (p) => `${f(p.x)} ${f(p.y)}`;

export const WALK_PERIOD = 1.4;
export const RUN_PERIOD = 0.92;

// Combina la escala de escena y la edad para conservar las proporciones del personaje.
export const characterScale = (spec) =>
  (spec.scale ?? 1) * MODEL.scale * mix(0.82, 1, clamp(spec.age ?? 1));

// Distingue las poses con desplazamiento de las poses estáticas.
const moving = (pose) => pose === "walk" || pose === "run";

// Calcula la pose local del cuerpo, incluida la respiración y el ciclo de paso.
function shape(pose, t, phase) {
  const { leg, torso, arm } = MODEL;
  let hip = point(0, -leg - 6);
  let lean = wave(t, 1.8, 0.16);
  let headTilt = wave(t, 1.5, 0.004);
  let nearFoot = point(11, 0);
  let farFoot = point(-11, 0);
  let near;
  let far;
  let nearTilt = 0;
  let farTilt = 0;
  const walk = moving(pose);
  const run = pose === "run";

  if (walk) {
    // Alterna apoyo y avance del pie según la fase de caminata o carrera.
    const foot = (offset) => {
      const u = (((phase + offset) % 1) + 1) % 1;
      const stance = run ? 0.46 : 0.62;
      const stride = run ? 95 : 72;

      if (u < stance) {
        return {
          p: point((0.5 - u / stance) * stride * 0.65, 0),
          tilt: 0,
          planted: true,
        };
      }

      const q = (u - stance) / (1 - stance);

      return {
        p: point(
          mix(-0.325, 0.325, smooth(q)) * stride,
          -Math.sin(q * Math.PI) * (run ? 26 : 15),
        ),
        tilt: Math.sin(q * Math.PI * 2) * (run ? 0.32 : 0.2),
        planted: false,
      };
    };
    const n = foot(0);
    const a = foot(0.5);

    nearFoot = n.p;
    farFoot = a.p;
    nearTilt = n.tilt;
    farTilt = a.tilt;
    hip.y =
      -leg * (run ? 0.83 : 0.91) -
      7 +
      wave(phase, Math.PI * 4, run ? 1.8 : 0.8);
    lean = run ? 13 : 3;
  }

  const seated = [
    "sit",
    "type",
    "draw",
    "read-sit",
    "laugh",
    "exhausted",
  ].includes(pose);

  if (seated) {
    hip.y = -38;
    lean = ["draw", "type"].includes(pose) ? 14 : pose === "exhausted" ? 12 : 0;
    nearFoot = point(30, 0);
    farFoot = point(12, 0);
  }

  if (["ground", "kneel", "fall", "pet"].includes(pose)) {
    hip.y = pose === "pet" ? -44 : -22;
    lean = pose === "fall" ? -20 : pose === "ground" ? 20 : 12;
    nearFoot = point(40, 0);
    farFoot = point(pose === "kneel" ? 0 : -28, 0);
  }

  if (["pull", "push", "lift", "carry"].includes(pose)) {
    lean = pose === "pull" ? -16 : 10;
    nearFoot.x = 26;
    farFoot.x = -22;
  }

  // El tronco rota con longitud constante; no se alarga al inclinarse.
  const shoulder = point(
    hip.x + lean,
    hip.y - Math.sqrt(torso * torso - lean * lean),
  );

  near = point(shoulder.x + 24, shoulder.y + 22 + arm * 0.94);
  far = point(shoulder.x - 23, shoulder.y + 22 + arm * 0.94);

  if (walk) {
    const swing = wave(phase, Math.PI * 2, run ? 18 : 11);

    near = point(
      shoulder.x - swing,
      shoulder.y + 22 + arm * (run ? 0.62 : 0.87),
    );
    far = point(
      shoulder.x + swing,
      shoulder.y + 22 + arm * (run ? 0.62 : 0.87),
    );
    headTilt = run ? 0.1 : 0;
  }

  if (pose === "impact") {
    lean = -14;
    nearFoot = point(17, 0);
    farFoot = point(-17, 0);
    headTilt = -0.17;
  }

  if (pose === "dizzy") {
    hip.y = -74;
    lean = wave(t, 3, 3);
    headTilt = wave(t, 4, 0.09);
  }

  if (pose === "impact" || pose === "dizzy") {
    shoulder.x = hip.x + lean;
    shoulder.y = hip.y - Math.sqrt(torso * torso - lean * lean);
    near = point(
      shoulder.x + (pose === "impact" ? 27 : 17),
      shoulder.y + (pose === "impact" ? -3 : -9),
    );
    far = point(shoulder.x - 24, shoulder.y + (pose === "impact" ? 6 : 51));
  }

  if (pose === "draw") {
    near = point(
      shoulder.x + 32 + wave(t, 2.2, 7),
      shoulder.y + 29 + wave(t, 4, 2),
    );
    far = point(shoulder.x + 15, shoulder.y + 34);
    headTilt = 0.22;
  }

  if (pose === "sketch") {
    near = point(
      shoulder.x + 43 + wave(t, 2, 3),
      shoulder.y + 8 + wave(t, 3, 4),
    );
    far = point(shoulder.x - 10, hip.y - 8);
    headTilt = -0.05;
  }

  if (pose === "type") {
    near = point(
      shoulder.x + 38,
      shoulder.y + 27 - Math.max(0, wave(t, 11, 2)),
    );
    far = point(shoulder.x + 22, shoulder.y + 29 - Math.max(0, wave(t, 11, 2)));
    headTilt = 0.12;
  }

  if (pose === "read" || pose === "read-sit") {
    near = point(shoulder.x + 30, shoulder.y + 13);
    far = point(shoulder.x + 6, shoulder.y + 15);
    headTilt = 0.18;
  }

  if (pose === "think") {
    near = point(shoulder.x + 15, shoulder.y - 12);
    far = point(shoulder.x - 12, hip.y - 7);
    headTilt = -0.08 + wave(t, 0.8, 0.03);
  }

  if (pose === "wave" || pose === "celebrate") {
    near = point(shoulder.x + 32 + wave(t, 5, 4), shoulder.y - 12);
    far = point(
      shoulder.x + (pose === "celebrate" ? -28 : -12),
      pose === "celebrate" ? shoulder.y - 12 : hip.y - 8,
    );
  }

  if (["touch", "reach", "point", "pet"].includes(pose)) {
    near = point(
      shoulder.x + 42,
      shoulder.y + (pose === "pet" ? 38 : pose === "point" ? 6 : 29),
    );
    far = point(shoulder.x - 12, hip.y - 6);
  }

  if (["pull", "push", "lift", "carry"].includes(pose)) {
    near = point(shoulder.x + 37, shoulder.y + 15);
    far = point(shoulder.x + 22, shoulder.y + 25);
    headTilt = pose === "pull" ? -0.12 : 0.12;
  }

  if (pose === "startle") {
    near = point(shoulder.x + 32, shoulder.y - 9);
    far = point(shoulder.x - 27, shoulder.y - 7);
    nearFoot.x = 21;
    farFoot.x = -21;
    headTilt = -0.1;
  }

  if (pose === "fall") {
    near = point(shoulder.x - 20, shoulder.y + 12);
    far = point(shoulder.x + 30, shoulder.y + 9);
    headTilt = -0.15;
  }

  if (pose === "laugh") {
    near = point(shoulder.x + 7, hip.y - 11);
    far = point(shoulder.x - 11, hip.y - 13);
    headTilt = -0.12 + wave(t, 6, 0.025);
  }

  if (pose === "exhausted") {
    near = point(shoulder.x + 20, hip.y - 5);
    far = point(shoulder.x - 5, hip.y - 6);
    headTilt = 0.22;
  }

  if (pose === "ground") {
    near = point(40, -18 + wave(t, 3, 1));
    far = point(20, -16);
    headTilt = 0.25;
  }

  if (pose === "kneel") {
    near = point(shoulder.x + 37, shoulder.y + 25);
    far = point(shoulder.x + 4, hip.y - 12);
    headTilt = 0.18;
  }

  return {
    hip,
    shoulder,
    nearFoot,
    farFoot,
    near,
    far,
    nearTilt,
    farTilt,
    headTilt,
    leg,
    torso,
    arm,
    walking: walk,
  };
}

// Obtiene la inclinación del torso a partir de hombros y cadera.
function torsoAxis(body) {
  return (
    Math.atan2(body.hip.y - body.shoulder.y, body.hip.x - body.shoulder.x) -
    Math.PI / 2
  );
}

// Resuelve articulaciones y puntos de referencia antes de dibujar al personaje.
export function actorGeometry(spec, t) {
  const age = clamp(spec.age ?? 1);
  const scale = characterScale(spec);
  const dir = (spec.turn ?? 0.7) < 0 ? -1 : 1;
  const view = selectView(spec.turn);
  const [nearAnchor, farAnchor] = armAnchors[view];
  const phase =
    spec.gaitPhase ?? t / (spec.pose === "run" ? RUN_PERIOD : WALK_PERIOD);
  const current = shape(spec.pose || "idle", spec.poseTime ?? t, phase);
  const previous = shape(
    spec.previous || spec.pose || "idle",
    spec.previousPoseTime ?? t,
    spec.previousGaitPhase ?? phase,
  );
  const u = spec.poseBlend ?? 1;
  const body = { ...current };

  for (const key of ["hip", "shoulder", "nearFoot", "farFoot", "near", "far"]) {
    body[key] = blend(previous[key], current[key], u);
  }

  for (const key of ["headTilt", "nearTilt", "farTilt"]) {
    body[key] = mix(previous[key], current[key], u);
  }

  body.headTilt += spec.headTilt || 0;

  if (spec.pose === "idle" && view !== "front") {
    body.near.x = body.shoulder.x + nearAnchor + 8;
    body.far.x = body.shoulder.x + farAnchor - 7;
  }

  const raw = { ...body.shoulder };
  let angle =
    Math.atan2(raw.x - body.hip.x, body.hip.y - raw.y) +
    (spec.lean || 0) / MODEL.torso;
  // Lleva una coordenada de escena al espacio local del personaje.
  const toLocal = (p) =>
    point(
      ((p.x - spec.x) / scale) * dir,
      (p.y - (spec.y ?? 360) + (spec.jump || 0)) / scale,
    );

  // Al alcanzar un objeto se inclina el cuerpo; las longitudes del dibujo permanecen iguales.
  if (spec.near) {
    const target = toLocal(spec.near);
    let best = Infinity;
    let bestAngle = angle;

    for (let i = -18; i <= 18; i++) {
      const a = clamp(angle + i * 0.018, -0.65, 0.65);
      const sx = body.hip.x + Math.sin(a) * MODEL.torso + nearAnchor;
      const sy = body.hip.y - Math.cos(a) * MODEL.torso + 22;
      const excess = Math.max(
        0,
        Math.hypot(target.x - sx, target.y - sy) - MODEL.arm + 0.5,
      );
      const score = excess * excess + Math.abs(a - angle) * 8;

      if (score < best) {
        best = score;
        bestAngle = a;
      }
    }

    angle = bestAngle;
  }

  body.shoulder = point(
    body.hip.x + Math.sin(angle) * MODEL.torso,
    body.hip.y - Math.cos(angle) * MODEL.torso,
  );

  const delta = point(body.shoulder.x - raw.x, body.shoulder.y - raw.y);

  body.near = spec.near
    ? toLocal(spec.near)
    : point(body.near.x + delta.x, body.near.y + delta.y);
  body.far = spec.far
    ? toLocal(spec.far)
    : point(body.far.x + delta.x, body.far.y + delta.y);

  const axis = torsoAxis(body);

  // Rota un desplazamiento alrededor de los hombros según la inclinación del torso.
  const local = (x, y) =>
    point(
      body.shoulder.x + x * Math.cos(axis) - y * Math.sin(axis),
      body.shoulder.y + x * Math.sin(axis) + y * Math.cos(axis),
    );
  let nearShoulder = local(nearAnchor, 22);
  let farShoulder = local(farAnchor, 22);

  if (spec.near) {
    const dx = body.near.x - nearShoulder.x;
    const dy = body.near.y - nearShoulder.y;
    const distance = Math.hypot(dx, dy);
    const extra = Math.min(18, Math.max(0, distance - MODEL.arm + 0.2));

    if (extra > 0) {
      const shift = point(
        (dx / distance) * extra,
        Math.max(0, (dy / distance) * extra),
      );

      body.hip = point(body.hip.x + shift.x, body.hip.y + shift.y);
      body.shoulder = point(
        body.shoulder.x + shift.x,
        body.shoulder.y + shift.y,
      );

      if (!spec.far) {
        body.far = point(body.far.x + shift.x, body.far.y + shift.y);
      }

      nearShoulder = local(nearAnchor, 22);
      farShoulder = local(farAnchor, 22);
    }
  }

  // El torso baja si hace falta flexionar las rodillas; los pies no flotan para alcanzar una mano.
  let minimumHip = -Infinity;

  for (const [foot, offset] of [
    [body.nearFoot, 7],
    [body.farFoot, -7],
  ]) {
    const dx = foot.x - (body.hip.x + offset);
    const height = Math.sqrt(Math.max(1, MODEL.leg * MODEL.leg - dx * dx));

    minimumHip = Math.max(minimumHip, foot.y - 6 - height + 0.02);
  }

  const lower = Math.max(0, minimumHip - body.hip.y);

  if (lower > 0) {
    body.hip.y += lower;
    body.shoulder.y += lower;

    if (!spec.near) {
      body.near.y += lower;
    }

    if (!spec.far) {
      body.far.y += lower;
    }

    nearShoulder = local(nearAnchor, 22);
    farShoulder = local(farAnchor, 22);
  }

  const nearArm = joint(
    nearShoulder,
    body.near,
    MODEL.arm * 0.49,
    MODEL.arm * 0.51,
    1,
  );
  const farArm = joint(
    farShoulder,
    body.far,
    MODEL.arm * 0.49,
    MODEL.arm * 0.51,
    1,
  );
  const nearHip = point(body.hip.x + 7, body.hip.y - 2);
  const farHip = point(body.hip.x - 7, body.hip.y - 2);
  const nearLeg = joint(
    nearHip,
    point(body.nearFoot.x, body.nearFoot.y - 8),
    MODEL.leg * 0.51,
    MODEL.leg * 0.49,
    -1,
  );
  const farLeg = joint(
    farHip,
    point(body.farFoot.x, body.farFoot.y - 8),
    MODEL.leg * 0.51,
    MODEL.leg * 0.49,
    -1,
  );
  // Lleva un punto local a la escena aplicando escala, orientación y salto.
  const world = (p) =>
    point(
      spec.x + p.x * scale * dir,
      (spec.y ?? 360) + p.y * scale - (spec.jump || 0),
    );
  const headLocal = local(0, -MODEL.headOffset);

  return {
    body,
    age,
    scale,
    dir,
    phase,
    axis,
    nearArm,
    farArm,
    nearLeg,
    farLeg,
    nearHip,
    farHip,
    nearShoulder,
    farShoulder,
    headLocal,
    hand: world(nearArm.end),
    farHand: world(farArm.end),
    head: world(headLocal),
    nearError: Math.hypot(
      nearArm.end.x - body.near.x,
      nearArm.end.y - body.near.y,
    ),
    farError: Math.hypot(farArm.end.x - body.far.x, farArm.end.y - body.far.y),
    nearSole: world(point(nearLeg.end.x, nearLeg.end.y + 8)),
    farSole: world(point(farLeg.end.x, farLeg.end.y + 8)),
  };
}

// Elige frente, tres cuartos o perfil según el giro horizontal del personaje.
function selectView(turn) {
  const v = Math.abs(turn ?? 0.7);

  return v < 0.28 ? "front" : v < 0.83 ? "threeQuarter" : "profile";
}

// Dibuja la geometría resuelta respetando capas, expresión y progreso de aparición.
export function drawActor(p, spec, t) {
  const g = actorGeometry(spec, t);
  const { body: b, dir, scale, nearArm, farArm, nearShoulder, farShoulder } = g;
  const reveal = spec.reveal ?? 1;
  const bodyReveal = spec.bodyReveal ?? 1;
  const faceReveal = spec.faceReveal ?? 1;
  const opacity = spec.opacity ?? 1;
  const ink = p.ink;

  // Aplica el grosor y tinta comunes a los trazos del personaje.
  const path = (d, o = {}) =>
    p.path(d, {
      width: 2.3,
      color: ink,
      dynamic: o.progress === undefined || o.progress >= 1,
      ...o,
    });

  p.group(spec.x, spec.y ?? 360, scale, spec.rotation || 0, opacity, () => {
    p.ctx.translate(0, -(spec.jump || 0) / scale);
    p.ctx.scale(dir, 1);

    // Dibuja una extremidad articulada con contorno y relleno de la misma identidad visual.
    function limb(a, k, e, width = 2.8, progress = 1) {
      // La línea atraviesa la articulación; una curva cuadrática acortaba y arqueaba las extremidades.
      path(`M${xy(a)}L${xy(k)}L${xy(e)}`, { width: width + 2.8, progress });
      path(`M${xy(a)}L${xy(k)}L${xy(e)}`, {
        width: Math.max(1, width - 1),
        color: p.paper,
        progress,
      });
    }

    // Sitúa y gira la mano en el extremo resuelto del brazo.
    function hand(pt, angle = 0) {
      p.group(pt.x, pt.y, 0.85, clamp(angle, -0.8, 0.8), 1, () =>
        p.path(handPath, { fill: true, width: 2, color: ink }),
      );
    }

    // Dibuja la pierna y orienta el zapato según su posición y la pose actual.
    function leg(solved, hip, near, progress) {
      limb(hip, solved.knee, solved.end, near ? 3.1 : 2.7, progress);

      const turn = !moving(spec.pose) && !near ? -1 : 1;

      p.group(
        solved.end.x,
        solved.end.y + 8,
        1,
        near ? b.nearTilt : b.farTilt,
        1,
        () => {
          p.ctx.scale(turn, 1);
          p.path(shoePath, {
            fill: true,
            width: 2.4,
            color: ink,
            progress: clamp((progress - 0.8) * 5),
          });
          p.path("M-4 0Q12 2 26 0", {
            width: 1,
            color: ink,
            progress: clamp((progress - 0.9) * 10),
          });
        },
      );
    }

    if (bodyReveal > 0.65) {
      leg(g.farLeg, g.farHip, false, clamp((bodyReveal - 0.65) / 0.2));
      leg(g.nearLeg, g.nearHip, true, clamp((bodyReveal - 0.75) / 0.25));
    }

    if (bodyReveal > 0.35) {
      limb(
        farShoulder,
        farArm.knee,
        farArm.end,
        2.7,
        clamp((bodyReveal - 0.35) / 0.2),
      );

      if (bodyReveal > 0.55) {
        hand(farArm.end);
      }
    }

    if (spec.backpack) {
      p.group(
        b.shoulder.x - 24,
        b.shoulder.y + 18,
        1,
        g.axis,
        spec.backpack,
        () => {
          p.path("M-8-7q-15-2-15 17v23q4 8 21 4l3-32q0-10-9-12Z", {
            fill: true,
            width: 2.2,
            color: ink,
          });
          p.path("M-4-5q14 12 7 32M-19 14h11v14h-11", {
            width: 1.7,
            color: ink,
          });
        },
      );
    }

    if (bodyReveal > 0) {
      p.group(b.shoulder.x, b.shoulder.y, 1, g.axis, 1, () => {
        p.path("M-4-8v10m8-10v10", {
          width: 2,
          color: ink,
          progress: clamp(bodyReveal * 5),
        });
        p.path(shirtShapes[selectView(spec.turn)], {
          fill: true,
          width: 2.3,
          color: ink,
          progress: clamp(bodyReveal * 4),
        });
        p.lines(shirtDetails, clamp((bodyReveal - 0.2) * 4), {
          width: 1.5,
          color: ink,
        });
      });
    }

    const h = headShapes[selectView(spec.turn)];
    const head = g.headLocal;

    p.group(head.x, head.y, 1, b.headTilt + g.axis * 0.14, 1, () => {
      p.path(h.outline, {
        progress: reveal,
        fill: reveal >= 1,
        width: 2.5,
        color: ink,
      });

      if (reveal > 0.7) {
        p.lines(h.hair, clamp((reveal - 0.7) / 0.3), {
          width: 2.3,
          color: ink,
        });
        p.path(h.forelock, {
          progress: clamp((reveal - 0.85) / 0.15),
          width: 1.7,
          color: ink,
        });
      }

      if (faceReveal > 0 && reveal > 0.85) {
        const expression = spec.expression || "curious";
        const blink =
          spec.blink !== false &&
          Math.sin(t * 1.43 + spec.x * 0.002) > 0.994 &&
          expression !== "surprised";
        const look = clamp(spec.look ?? 1, -1, 1);
        const pupilY =
          expression === "sad" || expression === "worried"
            ? 3
            : spec.lookY || 0;

        p.ctx.save();
        p.ctx.globalAlpha *= faceReveal;

        for (const [i, [x, y, rx, ry]] of h.eyes.entries()) {
          if (spec.eyesClosed) {
            p.ellipse(x, y + 2, rx, 0.4, {
              fill: true,
              width: 1.8,
              color: ink,
            });
            p.ellipse(x, y, 1.7, 4, { opacity: 0, color: ink });
          } else if (expression === "dizzy") {
            p.ellipse(x, y, rx, ry, { fill: true, width: 1.9, color: ink });
            p.group(x, y, 1, t * 2.8 + i * 0.6, 1, () =>
              path("M-5 0C-5-7 6-7 6 0C6 6-3 6-3 1C-3-3 3-3 3 0Q3 3 0 1", {
                width: 1.25,
              }),
            );
          } else if (blink) {
            path(`M${x - rx} ${y + 2}q${rx} 4 ${rx * 2} 0`, { width: 1.8 });
          } else {
            const height = expression === "tired" ? ry * 0.7 : ry;

            p.ellipse(x, y, rx, height, { fill: true, width: 1.9, color: ink });
            p.ellipse(
              x +
                (selectView(spec.turn) === "front"
                  ? i === 0
                    ? 2.3
                    : -2.3
                  : 1) +
                clamp(look * 1.5, -rx / 3, rx / 3),
              y + 1 + clamp(pupilY, -5, 5),
              1.7,
              4,
              { fill: ink, width: 0.8, color: ink },
            );
          }
        }

        const [mx, my] = h.mouth;

        if (["happy", "laugh", "excited"].includes(expression)) {
          path(`M${mx - 8} ${my - 4}q8 4 17-3q-4 17-14 10Z`, {
            fill: expression === "laugh" ? ink : true,
            width: 1.7,
          });
        } else if (expression === "dizzy") {
          path(`M${mx - 7} ${my}q3-3 6 0t6 0`, { width: 1.5 });
        } else if (expression === "surprised") {
          p.ellipse(mx, my, 3.5, 5, { fill: ink, width: 1.6, color: ink });
        } else if (["sad", "worried", "tired"].includes(expression)) {
          path(`M${mx - 6} ${my + 2}q6-7 13-1`, { width: 1.6 });
        } else {
          path(`M${mx - 4} ${my}q4-3 8 0`, { width: 1.5 });
        }

        if (["worried", "sad", "confused"].includes(expression)) {
          path(`M${h.eyes[0][0] - 7}-23l7-5m8 0 8 6`, { width: 1.6 });
        }

        if (expression === "determined") {
          path(`M${h.eyes[0][0] - 7}-24l9 3m7 0 8-3`, { width: 1.7 });
        }

        p.ctx.restore();
      }
    });

    if (bodyReveal > 0.2) {
      limb(
        nearShoulder,
        nearArm.knee,
        nearArm.end,
        2.9,
        clamp((bodyReveal - 0.2) / 0.2),
      );

      if (bodyReveal > 0.4) {
        hand(nearArm.end);
      }
    }
  });

  return g;
}
