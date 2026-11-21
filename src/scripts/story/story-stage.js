// Composición visual completa de las doce escenas de la historia animada en la pizarra.
import { mix, ramp, arc, wave } from "./doodle-math.js";
import { directScene } from "./story-director.js";
import { drawActor, actorGeometry } from "./doodle-character.js";
import {
  ground,
  pencil,
  paper,
  creature,
  tree,
  mountain,
  castle,
  bridge,
  desk,
  monitor,
  laptop,
  book,
  books,
  door,
  bell,
  clock,
  server,
  plane,
  bird,
  world,
} from "./doodle-props.js";

// Calcula el progreso de aparición de un elemento a partir del tiempo de escena.
const reveal = (t, start, length = 1.7) => ramp(t, start, start + length);

// Sitúa el lápiz en la mano resuelta del personaje y devuelve la posición de su punta.
function heldPencil(p, g, { length = 80, angle = -0.6 } = {}) {
  const hand = g.hand;
  const tip = {
    x: hand.x + Math.cos(angle) * length * 0.74,
    y: hand.y + Math.sin(angle) * length * 0.74,
  };

  pencil(p, tip.x, tip.y, length, angle);

  return tip;
}

// Dibuja un cartel y muestra su texto cuando el contorno ya está formado.
function sign(p, text, x, y, progress = 1) {
  p.group(x, y, 1, 0, 1, () => {
    p.path("M-109-22l217 2-3 40-212-3Z", { fill: true, progress, width: 1.7 });

    if (progress > 0.95) {
      p.text(text, 0, 5, 13);
    }
  });
}

// Dibuja el cuaderno y sus renglones dentro del espacio de trabajo.
function notebook(p, progress = 1) {
  p.lines(
    ["M50 30q350-12 700 0l-8 370q-346 12-696 0Z", "M93 36v357"],
    progress,
    { width: 1.3, color: p.soft },
  );

  for (let i = 0; i < 6; i++) {
    p.path(`M104 ${101 + i * 44}H730`, {
      progress,
      width: 1,
      color: p.soft,
      opacity: 0.22,
    });
  }
}

// Revela la pizarra con sus marcos y soporte.
function board(p, t) {
  p.lines(
    ["M370 67h311v166H370Z", "M382 78h287v140H382Z", "M362 238h328"],
    reveal(t, 4, 3),
    { width: 1.8 },
  );
}

// Compone la ventana imaginaria y sus elementos con una escala compartida.
function fantasyWindow(p, x, y, progress = 1) {
  p.group(x, y, 0.5, 0, progress, () => {
    p.path(
      "M-125 5q-47-44 0-69q-12-51 40-46q29-39 67-9q45-28 65 16q49-6 51 38q27 34-14 57Z",
      { fill: true, width: 2 },
    );
    castle(p, 0, -5, 0.5, progress);
  });
}

// Compone escenario, objetos y actores respetando el orden de las capas de la escena.
export function paintScene(
  p,
  index,
  t,
  { actors = true, direction, endingBackdrop = false } = {},
) {
  const d = direction || directScene(index, t);
  const a = { ...d.main };
  const others = d.secondary.map((s) => ({ ...s }));
  // Consulta la geometría actual antes de modificar la pose del protagonista.
  const before = () => actorGeometry(a, t);
  // Dibuja al protagonista o devuelve solo su geometría cuando la capa de actores está desactivada.
  const drawMain = () => (actors ? drawActor(p, a, t) : actorGeometry(a, t));
  let g;
  let contact = null;
  const camera = d.camera;

  p.ctx.save();
  p.ctx.translate(400, 225);
  p.ctx.scale(camera.zoom, camera.zoom);
  p.ctx.translate(-camera.x, -camera.y);

  switch (index) {
    case 0: {
      if (t > 0.65 && t < 1.3) {
        p.ellipse(360, 221, 1.6, 1.6, {
          fill: p.ink,
          opacity: ramp(t, 0.65, 0.9),
        });
      }

      if (t > 8) {
        ground(p, reveal(t, 8, 2));
      }

      if (t > 23) {
        tree(p, 155, 361, 0.8, reveal(t, 23, 2), t);
        tree(p, 660, 365, 0.6, reveal(t, 24, 2), t);
        mountain(p, 620, 305, 0.65, reveal(t, 24, 2));

        for (let i = 0; i < 3; i++) {
          p.path(
            `M${160 + i * 120} ${100 + (i % 2) * 30}l4-10 4 10 11 1-8 7 2 10-9-5-9 5 2-10-8-7Z`,
            { progress: reveal(t, 24 + i * 0.5, 1.2), width: 1.4 },
          );
        }
      }

      if (t > 26) {
        notebook(p, reveal(t, 26, 3));
      }

      if (t > 20 && t < 24) {
        a.x += 25 * ramp(t, 20, 21) * (1 - ramp(t, 23, 24));
      }

      g = before();

      if (t > 12 && t < 20) {
        if (t < 16) {
          pencil(p, 535, 353, 155, -0.2, reveal(t, 12, 1.6));
        } else {
          const tip = {
            x: mix(535, 495, ramp(t, 16, 19)),
            y: mix(353, 354, ramp(t, 16, 19)),
          };
          const angle = Math.atan2(tip.y - g.hand.y, tip.x - g.hand.x);

          a.far = {
            x: g.hand.x - 18 * Math.cos(angle),
            y: g.hand.y - 18 * Math.sin(angle),
          };
          pencil(
            p,
            tip.x,
            tip.y,
            Math.hypot(tip.x - g.hand.x, tip.y - g.hand.y) + 15,
            angle,
          );
          contact = "pencil";
        }
      }

      if (t > 18) {
        const cx =
          t < 26
            ? 518 - 18 * ramp(t, 20, 21) * (1 - ramp(t, 23, 26))
            : mix(518, 790, ramp(t, 26, 30));
        const cy = 350 - arc(t, 20, 21, 15);

        creature(p, cx, cy, t, {
          scale: 0.62,
          reveal: reveal(t, 18, 2),
          alive: t > 20,
          pose: t > 26 ? "run" : "walk",
        });

        if (t > 21 && t < 23) {
          a.near = { x: 490, y: 322 };
          contact = "creature";
        }
      }

      if (t > 23 && t < 26) {
        g = before();
        heldPencil(p, g, { length: 56, angle: 0.35 });
        paper(p, 475, 355, reveal(t, 23, 0.7));
      }

      drawMain();

      break;
    }
    case 1: {
      ground(p);
      p.lines(
        [
          "M20 90H780M20 90l25 35h710l25-35",
          "M90 125v236m145-236v236m145-236v236m145-236v236m145-236v236",
        ],
        reveal(t, 0, 4),
        { width: 1.4, color: p.soft },
      );

      const cx = mix(180, 720, ramp(t, 0, 7));

      creature(p, cx, 353, t, {
        scale: 0.55,
        pose: "run",
        opacity: 1 - ramp(t, 7, 11),
      });
      bell(
        p,
        440,
        63,
        t,
        reveal(t, 6, 1),
        (t > 7 && t < 9) || (t > 20 && t < 21) ? 1 : 0,
      );

      const ghostX = mix(120, 470, ramp(t, 10, 17));
      const ghostY = mix(315, 230, ramp(t, 15, 17));

      creature(p, ghostX, ghostY, t, {
        scale: 0.48,
        opacity: 1 - ramp(t, 19, 25),
        pose: "run",
      });
      bird(
        p,
        mix(70, 340, ramp(t, 9, 18)),
        145,
        t,
        0.6 * (1 - ramp(t, 20, 25)),
      );

      if (t > 16 && t < 18) {
        const h = before();

        p.path(
          `M${ghostX + 15} ${ghostY - 10}Q${h.head.x - 45} ${h.head.y + 25} ${h.head.x - 20} ${h.head.y + 40}`,
          { dynamic: true, width: 1.5 },
        );
        contact = "childhood-drawing";
      }

      drawMain();

      break;
    }
    case 2: {
      ground(p);
      board(p, t);
      desk(p, 345, 300, reveal(t, 1, 2), { chair: reveal(t, 3.15, 0.6) });

      if (t > 7 && t < 25) {
        p.text("2 + 2 = 4", 458, 110, 18, { opacity: reveal(t, 7, 1) });
        p.text("x + y = ?", 560, 145, 16, { opacity: reveal(t, 8, 1) });
        p.path("M409 175q25-9 47 3m-48 8 71-4", {
          progress: reveal(t, 8, 1),
          width: 1.4,
          color: p.soft,
        });
      }

      if (t > 10 && t < 26) {
        const transform = ramp(t, 11, 15);
        const jump = ramp(t, 16, 18);
        const cx = mix(582, 444, jump);
        const cy = mix(195, 296, jump) - arc(t, 16, 18, 90);

        p.path("M568 166q-21-12-8-24q18-10 29 8q25 17 3 27Z", {
          progress: reveal(t, 10, 0.8),
          opacity: 1 - transform,
          width: 4,
          color: p.soft,
        });
        creature(p, cx, cy, t, {
          scale: 0.65,
          reveal: transform,
          alive: t > 14,
          opacity: 1 - ramp(t, 25, 26),
        });

        if (t > 19) {
          if (t < 23) {
            a.near = { x: 322 + wave(t, 2, 4), y: 288 };
          }

          paper(p, 367, 294);

          const drawn = reveal(t, 19, 3);

          creature(p, 358, 292, t + 0.8, {
            scale: 0.27,
            reveal: drawn,
            alive: t > 22,
          });
          g = before();
          heldPencil(p, g, { length: 45, angle: 0.25 });
          contact = "notebook";
        }
      }

      bell(p, 688, 45, t, reveal(t, 24, 0.6), t > 25 && t < 26 ? 1 : 0);

      if (t > 27) {
        g = before();
        book(p, g.hand.x - 12, g.hand.y, 0.65, 1, t < 28.4);
        contact = "notebook";
      }

      drawMain();

      break;
    }
    case 3: {
      ground(p);

      const portal = ramp(t, 17, 21);
      const imagination = 1 - ramp(t, 37, 40);

      if (t < 21) {
        monitor(p, 505, 240, reveal(t, 1, 3), { television: true });

        if (t > 5) {
          p.ctx.save();
          p.ctx.beginPath();
          p.ctx.rect(427, 185, 154, 97);
          p.ctx.clip();
          mountain(p, 510, 275, 0.7, reveal(t, 5, 2));
          creature(
            p,
            440 + (((t - 5) * 27) % 132),
            270 - Math.abs(wave(t, 3, 15)),
            t,
            { scale: 0.28, opacity: 1 - portal, pose: "run" },
          );
          p.ctx.restore();
        }

        if (t > 11) {
          const emergence = ramp(t, 11, 15);
          const x = mix(510, 360, emergence);
          const y = mix(260, 360, emergence) - arc(t, 11, 15, 35);

          creature(p, x, y, t, {
            scale: mix(0.3, 1.8, emergence),
            reveal: reveal(t, 11, 1),
            opacity: 1 - ramp(t, 18, 21),
          });

          if (t > 15 && t < 18) {
            g = before();
            p.path(
              `M${x - 60} ${y - 32}Q${g.hand.x + 10} ${g.hand.y - 12} ${g.hand.x} ${g.hand.y}`,
              { dynamic: true, width: 3 },
            );
            contact = "helping-hand";
          }
        }
      }

      if (t > 18) {
        p.ctx.save();
        p.ctx.globalAlpha *= imagination;
        world(p, t, reveal(t, 18, 6));

        if (t > 26) {
          const progress = reveal(t, 27, 2);

          bridge(p, 495, 355, progress, arc(t, 31, 34, 1), reveal(t, 33, 1.7));
        }

        if (t > 25 && t < 35) {
          g = before();
          heldPencil(p, g, { length: 62, angle: 0.4 });
          contact = "bridge";
        }

        p.ctx.restore();
      }

      if (t > 37) {
        fantasyWindow(p, 570, 160, ramp(t, 37, 40));
      }

      if (t < 1.6) {
        for (let i = 0; i < 3; i++) {
          p.path(
            `M${60 + i * 22} 35Q${400 + wave(t, 10, 220)} 210 ${60 + i * 22} 405`,
            { dynamic: true, width: 1.2, opacity: 1 - ramp(t, 0.5, 1.6) },
          );
        }
      }

      drawMain();

      break;
    }
    case 4: {
      p.lines(
        [
          "M85 381Q295 376 388 273",
          "M85 403Q306 400 407 295",
          "M392 286Q493 230 680 250",
          "M392 286Q460 360 705 365",
        ],
        reveal(t, 0, 3),
        { width: 1.7 },
      );
      pencil(p, 272, 190, 95, -1.05, reveal(t, 2, 2));
      p.path("M198 213l77-12 14 47-80 10Z", {
        progress: reveal(t, 3, 2),
        width: 1.7,
      });
      laptop(p, 653, 320, reveal(t, 2, 2));
      p.text("Diseño Gráfico", 254, 278, 14, { opacity: reveal(t, 3, 1) });
      p.text("Ingeniería de Sistemas", 642, 405, 14, {
        opacity: reveal(t, 3, 1),
      });

      if (t > 18 && t < 21) {
        pencil(p, 272, 190, 95, -1.05 + wave(t, 5, 0.09));
      }

      if (t > 23) {
        books(
          p,
          640,
          355,
          Math.floor(mix(2, 18, ramp(t, 23, 27))),
          reveal(t, 23, 2),
        );
      }

      if (t > 28) {
        book(p, 600, 200 + arc(t, 28, 30, 70), 1.4, reveal(t, 28, 0.5), true);
      }

      drawMain();

      break;
    }
    case 5: {
      if (a.pose === "type") {
        a.near = { x: 320, y: 284 };
        a.far = { x: 309, y: 287 };
      }

      ground(p);
      desk(p, 340, 290, reveal(t, 0, 2));
      monitor(p, 480, 210, reveal(t, 2, 3));
      p.path("M314 285h117l10 7H301Z", {
        progress: reveal(t, 4, 1),
        fill: true,
        width: 1.6,
      });
      p.ellipse(355, 278, 8, 6, {
        fill: true,
        progress: reveal(t, 4, 1),
        width: 1.5,
      });
      p.path("M356 273q-14-44 30-54t15-53", {
        progress: reveal(t, 7, 2),
        pen: t < 9,
        width: 1.5,
      });

      if (t > 7 && t < 9) {
        g = before();
        heldPencil(p, g, { length: 51, angle: -0.45 });
        contact = "mouse-cable";
      }

      if (t > 9) {
        p.text("C++", 421, 164, 12, {
          align: "left",
          hand: false,
          opacity: reveal(t, 9, 0.5),
        });

        if (t < 16) {
          p.text(
            "Hola, mundo".slice(0, Math.floor((t - 10) * 7)),
            480,
            209,
            17,
            { hand: false },
          );
          p.path("M415 233h52m-52 10h80", {
            progress: reveal(t, 10, 2),
            color: p.soft,
            width: 1.3,
          });
        } else if (t < 25) {
          p.path("M409 248h143m-120 0v-16h18v16m40 0v-28h18v28", {
            width: 1.6,
          });
          creature(
            p,
            415 + (((t - 16) * 22) % 120),
            232 - Math.abs(wave(t, 4, 25)),
            t,
            { scale: 0.25, pose: "run" },
          );
        }
      }

      g = before();

      if (t > 24) {
        const jump = ramp(t, 24, 27);
        const toHand = ramp(t, 28, 30);
        const cx = mix(mix(492, 396, jump), g.hand.x + 4, toHand);
        const cy = mix(278 - arc(t, 24, 27, 155), g.hand.y - 3, toHand);

        creature(p, cx, cy, t, { scale: 0.38, reveal: 1 });
        contact = t > 29 ? "hand" : "desktop";
      }

      if (t > 34) {
        pencil(p, 325, 285, 58, -0.1);
      }

      drawMain();

      if (actors) {
        others.forEach((s) => drawActor(p, s, t));
      }

      break;
    }
    case 6: {
      ground(p);

      const fade = 1 - ramp(t, 28, 33);

      if (a.pose === "type") {
        a.near = { x: 320, y: 288 };
        a.far = { x: 309, y: 288 };
      }

      p.ctx.save();
      p.ctx.globalAlpha *= fade;
      desk(p, 340, 290);
      laptop(p, 371, 276);
      paper(p, 390, 284);
      g = before();

      if (t < 4) {
        heldPencil(p, { ...g, hand: g.farHand }, { length: 72, angle: -1 });
        creature(p, g.hand.x, g.hand.y - 2, t, { scale: 0.33 });
        contact = "pencil-and-character";
      }

      if (t > 4 && t < 27) {
        const revealBody = reveal(t, 4, 3);
        const alive = t >= 13;

        creature(p, 399, 280, t, {
          scale: 0.62,
          reveal: revealBody,
          alive,
          activation: ramp(t, 13, 24),
        });

        if (t >= 13 && t < 18) {
          p.ellipse(399, 264, 2, 3, { fill: p.ink, opacity: reveal(t, 13, 1) });
          p.path(`M420 266q12 ${wave(t, 5, 5)} 20-7`, {
            dynamic: true,
            width: 1.5,
            opacity: reveal(t, 16, 1),
          });
        }

        if (t > 20 && t < 23) {
          p.group(399, 280, 1, arc(t, 20, 23, 0.6), 1, () =>
            creature(p, 0, 0, t, { scale: 0.62 }),
          );
        }

        if (t < 8) {
          heldPencil(p, g, { length: 52, angle: -0.25 });
        }

        if (t > 13) {
          p.path(`M455 240h${18 + (((t - 13) * 12) % 38)}m-35 9h27`, {
            dynamic: true,
            width: 1.2,
          });
          contact = "keyboard";
        }
      }

      p.ctx.restore();

      if (t > 26) {
        const cx = mix(405, 770, ramp(t, 26, 40));
        const cy = mix(280, 357, ramp(t, 27, 30)) - arc(t, 27, 30, 65);

        creature(p, cx, cy, t, { scale: 0.62, pose: "run" });
        p.path("M405 357q95-2 170 4t190-1", {
          progress: reveal(t, 28, 10),
          width: 1.6,
        });
        world(p, t, reveal(t, 31, 9));
      }

      drawMain();

      break;
    }
    case 7: {
      ground(p);

      const dissolve = 1 - ramp(t, 27, 30);

      p.ctx.save();
      p.ctx.globalAlpha *= dissolve;
      world(p, t, reveal(t, 0, 6));
      castle(p, 487, 360, 0.72, reveal(t, 7, 3), { broken: arc(t, 10, 14, 1) });
      bridge(
        p,
        575,
        355,
        reveal(t, 5, 2),
        ramp(t, 18, 21),
        1 - ramp(t, 18, 21),
      );

      if (t > 12) {
        creature(p, 330, 352, t, {
          scale: 0.65,
          reveal: t < 16 ? 1 - ramp(t, 12, 16) : reveal(t, 16, 3),
          alive: t < 13 || t > 18,
        });
      }

      g = before();

      if (t > 7 && t < 27) {
        heldPencil(p, g, { length: 70, angle: -0.4 });
      }

      if (t > 10.7 && t < 12.8) {
        a.near = { x: 470, y: 244 };
        contact = "falling-tower";
      }

      p.ctx.restore();
      drawMain();

      break;
    }
    case 8: {
      ground(p);

      for (let i = 0; i < 5; i++) {
        server(p, 155 + i * 128, 362, reveal(t, i * 0.7, 2.3), t + i);
      }

      if (t > 3) {
        p.path("M202 350q42-40 76-1t59 0m86 0q56-36 76 0", {
          progress: reveal(t, 3, 3),
          width: 1.6,
        });
      }

      clock(p, 400, 65, t * 2, reveal(t, 10, 2));

      if (t > 14 && t < 23) {
        const peek = arc(t, 14, 23, 1);

        creature(p, 385 - peek * 38, 330, t, { scale: 0.48, opacity: peek });
        server(p, 411, 362, 1, t);
      }

      if (t > 19 && t < 25) {
        fantasyWindow(
          p,
          610,
          128,
          Math.min(reveal(t, 19, 2), 1 - ramp(t, 23, 25)),
        );
      }

      if (t > 23 && t < 25) {
        bell(p, 659, 92, t, 1, 1);
      }

      g = before();

      if (["touch"].includes(a.pose)) {
        p.path(`M${g.hand.x} ${g.hand.y}q-26 24 3 47t36 33`, {
          dynamic: true,
          width: 1.6,
        });
        contact = "server-cable";
      }

      drawMain();

      break;
    }
    case 9: {
      ground(p);
      door(p, 577, 363, reveal(t, 0, 3));
      castle(p, 576, 212, 0.29, reveal(t, 1, 2));

      if (t > 5 && t < 12) {
        sign(p, "Necesitas aprender más", 577, 281, reveal(t, 5, 1));
      }

      if (t >= 15) {
        sign(p, "Todavía te falta experiencia", 577, 281, reveal(t, 15, 1));
      }

      if (t > 8) {
        g = before();
        book(p, g.hand.x - 12, g.hand.y, 0.7, 1, true);
      }

      for (let i = 0; i < 5; i++) {
        if (t > 16 + i * 1.2) {
          books(
            p,
            220 + i * 67,
            365,
            3 + (i % 3) * 3,
            reveal(t, 16 + i * 1.2, 2),
          );
        }
      }

      if (t > 25) {
        a.y = 329;
        clock(p, 450, 91, t * 0.35, reveal(t, 25, 1));
      }

      drawMain();

      break;
    }
    case 10: {
      ground(p);

      for (let i = 0; i < 5; i++) {
        books(p, 220 + i * 67, 365, 3 + (i % 3) * 3);
      }

      door(p, 577, 363, 1, ramp(t, 24, 28));

      if (t < 19) {
        sign(p, "Todavía no estás preparado", 577, 281, 1 - ramp(t, 16, 19));
      }

      if (t < 9) {
        a.y = mix(329, 360, ramp(t, 7, 9));
      }

      g = before();

      if (t > 6 && t < 16) {
        book(p, g.farHand.x, g.farHand.y, 0.6, 1, true);
      }

      if (t > 12 && t < 16) {
        heldPencil(p, g, { length: 60, angle: -0.8 });
      }

      if (t > 17 && t < 22) {
        p.group(g.hand.x, g.hand.y, 1, 0, 1, () => {
          const fold = ramp(t, 19, 22);

          if (fold < 0.5) {
            p.path("M-22-15h44v29h-44Z", { fill: true, width: 1.7 });
          } else {
            plane(p, 0, 0, -0.15, 0.75);
          }
        });
        contact = "paper-sign";
      }

      if (t >= 22) {
        const q = ramp(t, 22, 27);

        plane(
          p,
          mix(g.hand.x, 760, q),
          mix(g.hand.y, 220, q) - arc(t, 22, 27, 60),
          -0.12 + q * 0.3,
          0.75,
        );
      }

      if (t > 28) {
        p.path("M547 363Q633 360 760 363", {
          progress: reveal(t, 30, 5),
          width: 2,
        });
      }

      drawMain();

      break;
    }
    case 11: {
      ground(p);

      const child = others[0];

      g = before();

      let childGeometry = actorGeometry(child, t);

      if (t < 27) {
        paper(p, 466, 359);
        creature(p, 471, 350, t, {
          scale: 0.36,
          reveal: reveal(t, 0, 4),
          alive: t > 13,
          opacity: 1 - ramp(t, 17, 19),
        });
      }

      if (t > 8 && t < 20) {
        laptop(p, 379, 350, reveal(t, 8, 1.4));
        a.near = { x: 347 + wave(t, 11, 2), y: 349 };
        a.far = { x: 332, y: 346 };
        contact = "laptop";

        if (t > 12) {
          const cx = mix(471, 600, ramp(t, 14, 18));
          const cy = 350 - arc(t, 14, 16, 45);

          creature(p, cx, cy, t, {
            scale: 0.5,
            pose: "run",
            opacity: 1 - ramp(t, 18, 20),
          });
        }
      }

      if (t > 20 && t < 24) {
        child.turn = -0.7;
        child.look = 1;
        child.near = { x: 416, y: 293 };
        a.pose = "kneel";
        a.previous = "kneel";
        a.poseBlend = 1;
        a.near = { x: 384, y: 293 };
        childGeometry = actorGeometry(child, t);
        g = before();

        const hand = {
          x: mix(childGeometry.hand.x, g.hand.x, ramp(t, 21, 23)),
          y: mix(childGeometry.hand.y, g.hand.y, ramp(t, 21, 23)),
        };

        pencil(p, hand.x + 12, hand.y, 70, 0);
        contact = "shared-pencil";
      }

      if (t > 24) {
        p.ctx.save();
        p.ctx.globalAlpha *= 0.28 + 0.72 * ramp(t, 27, 34);
        world(p, t, reveal(t, 24, 16));
        p.ctx.restore();
      }

      if (t > 27) {
        tree(p, 675, 365, 0.65, reveal(t, 27, 4), t);
        bird(
          p,
          mix(510, 790, ramp(t, 28, 35)),
          155 - arc(t, 28, 35, 45),
          t,
          0.8,
        );
        bridge(p, 575, 355, reveal(t, 29, 5), 0, 1);
        creature(p, 630 + wave(t, 1, 45), 330 - arc(t, 32, 36, 55), t, {
          scale: 0.6,
          opacity: reveal(t, 31, 2),
        });
      }

      if (t > 24 && !endingBackdrop) {
        g = before();
        heldPencil(p, g, { length: 64, angle: t > 36 ? 0.5 : -0.5 });

        if (t > 36) {
          p.group(g.farHand.x, g.farHand.y, 1, 0, 1, () => {
            p.path("M-22-12h44v32h-44Z", { fill: true, width: 1.8 });
            p.ellipse(0, 4, 3, 3, { width: 1.3 });
          });
        }
      }

      if (actors) {
        drawActor(p, child, t);
      }

      drawMain();

      break;
    }
  }

  p.ctx.restore();

  return {
    ...d,
    main: a,
    secondary: others,
    geometry: actorGeometry(a, t),
    contact,
  };
}
