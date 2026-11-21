// Primitivas SVG dibujadas a mano (lápiz, libro, escritorio, árbol, etc.) para las escenas de la historia.
import { clamp, wave } from "./doodle-math.js";

// Dibuja la línea de suelo que sostiene la escena con las primitivas compartidas del pintor.
export function ground(p, progress = 1) {
  p.path("M35 365Q257 361 455 364T775 363", {
    progress,
    width: 1.5,
    color: p.soft,
  });
}

// Dibuja el lápiz con su longitud y orientación de escena con las primitivas compartidas del pintor.
export function pencil(p, x, y, length = 95, angle = -0.7, progress = 1) {
  p.group(x, y, length / 100, angle, 1, () =>
    p.lines(
      [
        "M0 0L-17-6H-98V6H-17Z",
        "M-17-6V6M-91-6V6",
        "M-17 0H-91",
        "M0 0l-7-3v6Z",
      ],
      progress,
      { fill: true, width: 2 },
    ),
  );
}

// Dibuja la hoja de papel y sus marcas con las primitivas compartidas del pintor.
export function paper(p, x, y, progress = 1) {
  p.group(x, y, 1, 0, 1, () =>
    p.lines(["M-44-8l79-5 17 31-88 6Z", "M-30 5l40-3m-36 10 50-3"], progress, {
      fill: true,
      width: 1.5,
    }),
  );
}

// Dibuja la criatura dibujada que acompaña al personaje con las primitivas compartidas del pintor.
export function creature(
  p,
  x,
  y,
  t,
  {
    scale = 1,
    reveal = 1,
    opacity = 1,
    alive = true,
    pose = "walk",
    turn = 1,
    activation = 1,
  } = {},
) {
  p.group(
    x,
    y,
    scale,
    alive ? wave(t, 2, 0.045) * clamp(activation * 3) : 0,
    opacity,
    () => {
      p.ctx.scale(turn, 1);

      const bounce = alive
        ? Math.abs(wave(t, pose === "run" ? 10 : 4, pose === "run" ? 5 : 2)) *
          clamp((activation - 0.3) * 2)
        : 0;

      p.ctx.translate(0, -bounce);
      p.path(
        "M-22-7q-15-17 0-29l-4-13 16 9q12-8 23 2l13-11-2 18q13 9 4 23Q24 7 9 2q-17 9-31-9Z",
        { progress: clamp(reveal * 1.25), fill: true, width: 2.1 },
      );

      const arm = alive ? wave(t, 4, 7) * clamp((activation - 0.25) * 2) : 0;
      const arms = clamp((reveal - 0.65) / 0.35);

      p.path(
        `M-22-20q-15 ${6 + arm}-17 ${18 + arm}M27-20q15 ${-5 - arm} 18 ${4 - arm}`,
        { progress: arms, dynamic: arms >= 1, width: 1.9 },
      );

      if (reveal > 0.7) {
        const step = alive
          ? wave(t, pose === "run" ? 10 : 5, 6) * clamp((activation - 0.65) * 3)
          : 0;

        p.path(`M-12 2l${-5 + step} 10h-7m36-10 5 ${10 - step / 3}h7`, {
          dynamic: true,
          width: 2,
        });
        p.ellipse(-2 + (alive ? wave(t, 2, 0.8) : 0), -25, 2, 3, {
          fill: p.ink,
        });
        p.ellipse(15 + (alive ? wave(t, 2, 0.8) : 0), -25, 2, 3, {
          fill: p.ink,
        });
        p.path("M1-14q7 6 14-1", { width: 1.8 });
      }
    },
  );
}

// Dibuja el árbol y sus trazos de aparición con las primitivas compartidas del pintor.
export function tree(p, x, y, scale = 1, progress = 1, t = 0) {
  p.group(x, y, scale, wave(t, 1, 0.013), 1, () =>
    p.lines(
      [
        "M-7 0l3-59m11 59L3-60",
        "M-3-57Q-38-43-35-67Q-57-87-24-99Q-22-125 3-113Q26-125 30-100Q61-91 37-68Q42-44 5-57",
        "M-2-31l-14-15m21 12 14-15",
      ],
      progress,
      { width: 1.8 },
    ),
  );
}

// Dibuja las montañas del escenario imaginario con las primitivas compartidas del pintor.
export function mountain(p, x, y, scale = 1, progress = 1) {
  p.group(x, y, scale, 0, 1, () =>
    p.lines(
      ["M-85 0L-7-115 17-76 37-101 103 0", "M-34-75l20 8 10-22 19 27 9-11"],
      progress,
      { width: 1.6 },
    ),
  );
}

// Dibuja el castillo dentro del mundo dibujado con las primitivas compartidas del pintor.
export function castle(p, x, y, scale = 1, progress = 1, { broken = 0 } = {}) {
  p.group(x, y, scale, 0, 1, () => {
    p.lines(
      [
        "M-64 0V-102h-9l23-30 22 30h-10V0",
        "M32 0V-133h-10l24-31 25 31H60V0",
        "M-38-67h70V0H-38Z",
        "M-9 0v-35q11-24 23 0V0",
        "M-50-83v14M46-111v14",
        "M-24-54h8v11h-8Zm40 0h8v11h-8Z",
      ],
      progress,
      { fill: true, width: 1.9 },
    );

    if (broken > 0) {
      p.group(45, -132, 1, broken * 0.55, 1, () =>
        p.lines(
          ["M-13 0v-43l13-20 13 20V0", "M-18-43h36"],
          clamp(progress * 1.8),
          { fill: true, width: 1.8 },
        ),
      );
    }
  });
}

// Dibuja el puente del escenario con las primitivas compartidas del pintor.
export function bridge(p, x, y, progress = 1, sag = 0, support = 1) {
  p.group(x, y, 1, 0, 1, () => {
    p.path(`M-105 0Q0 ${sag * 65 - 15} 105 0M-105 12Q0 ${sag * 65} 105 12`, {
      progress,
      dynamic: progress >= 1,
      width: 2,
    });
    p.path("M-90 13v38m180-38v38M-64 11l-26 40M64 11l26 40", {
      progress: progress * support,
      width: 2,
    });
    p.path(
      "M-105-22Q0-42 105-22M-105-22V0m42-29V-5m42-31V-8m42-28V-8m42-21V-5m42-17V0",
      { progress, width: 1.4 },
    );
  });
}

// Dibuja el escritorio del espacio de trabajo con las primitivas compartidas del pintor.
export function desk(p, x, y, reveal = 1, { chair = 1 } = {}) {
  p.group(x, y, 1, 0, 1, () => {
    const feet = 365 - y;
    const seat = 326 - y;

    p.lines(
      [
        "M-45 0H163l12 10H-55Z",
        `M-42 10l-7 ${feet - 10}m208 ${-feet + 10} 6 ${feet - 10}`,
      ],
      reveal,
      { fill: true, width: 2 },
    );
    p.lines(
      [
        `M-99 ${seat}h65m-59 0v${feet - seat}m53 ${seat - feet}v${feet - seat}M-99 ${seat}V${seat - 47}h-11v47`,
      ],
      chair,
      { width: 2 },
    );
  });
}

// Dibuja el monitor con su contenido de pantalla con las primitivas compartidas del pintor.
export function monitor(p, x, y, reveal = 1, { television = false } = {}) {
  p.group(x, y, 1, 0, 1, () => {
    p.lines(
      ["M-88-65h174v118H-88Z", "M-78-55H76V42H-78Z", "M-8 53v21m-25 3h53"],
      reveal,
      { fill: true, width: 2.2 },
    );

    if (television) {
      p.path("M-7-65l-26-24m26 24 27-26", {
        progress: clamp(reveal * 2 - 1),
        width: 2,
      });
    }
  });
}

// Dibuja la computadora portátil de la escena con las primitivas compartidas del pintor.
export function laptop(p, x, y, progress = 1) {
  p.group(x, y, 1, 0, 1, () =>
    p.lines(
      [
        "M-42 0l9-55h73l5 55Z",
        "M-35-7l7-41h61l5 41Z",
        "M-42 0l-22 13H63L45 0",
        "M-24 5H30",
      ],
      progress,
      { fill: true, width: 2 },
    ),
  );
}

// Dibuja un libro con su cubierta y detalles con las primitivas compartidas del pintor.
export function book(p, x, y, scale = 1, progress = 1, open = false) {
  p.group(x, y, scale, 0, 1, () =>
    p.lines(
      open
        ? [
            "M-35-30q20-10 35 0q19-12 36-3v45q-17-8-36 3q-20-8-35-1Z",
            "M0-30v45",
            "M-27-18h17m-17 8h20m19-10h18m-18 10h18",
          ]
        : ["M-31-42h61v48h-61Z", "M-23-42V6", "M-14-25h30m-30 8h19"],
      progress,
      { fill: true, width: 1.8 },
    ),
  );
}

// Dibuja el conjunto de libros del escenario con las primitivas compartidas del pintor.
export function books(p, x, y, count = 5, progress = 1) {
  for (let i = 0; i < count; i++) {
    p.group(
      x + (i % 2 ? 4 : -4),
      y - i * 13,
      1,
      (i % 2 ? 1 : -1) * 0.025,
      1,
      () =>
        p.lines(
          ["M-35-10h70V2h-70Z", "M-27-10V2m8-6h38"],
          clamp(progress * count - i),
          { fill: true, width: 1.7 },
        ),
    );
  }
}

// Dibuja la puerta del ambiente con las primitivas compartidas del pintor.
export function door(p, x, y, reveal = 1, open = 0) {
  p.group(x, y, 1, 0, 1, () => {
    p.lines(["M-60 0V-184q60-74 120 0V0", "M-48 0V-181q48-52 96 0V0"], reveal, {
      width: 2.4,
    });
    p.path(`M-47 0V-178L${47 - 73 * open} ${-178 + 22 * open}V${-12 * open}Z`, {
      fill: true,
      progress: reveal,
      dynamic: reveal >= 1,
      width: 2.1,
    });
    p.ellipse(31 - 63 * open, -91, 2.5, 3, { fill: p.ink, opacity: reveal });
  });
}

// Dibuja la campana de la escena con las primitivas compartidas del pintor.
export function bell(p, x, y, t, progress = 1, ring = 0) {
  p.group(x, y, 1, Math.sin(t * 24) * 0.25 * ring, 1, () =>
    p.lines(
      [
        "M-25 14q8-8 8-25q0-27 18-27q20 1 19 27q0 17 8 25Z",
        "M-25 14q26 11 53 0",
        "M-6 21q7 11 14 0",
        "M-3-39v-8h9v8",
      ],
      progress,
      { fill: true, width: 2 },
    ),
  );

  if (ring > 0) {
    p.path(`M${x - 40} ${y - 23}q-10 12 0 24m80-24q10 12 0 24`, {
      dynamic: true,
      opacity: ring,
      width: 1.5,
    });
  }
}

// Dibuja el reloj y sus agujas con las primitivas compartidas del pintor.
export function clock(p, x, y, t, progress = 1) {
  p.ellipse(x, y, 25, 25, { progress, fill: true, width: 1.6 });

  if (progress > 0.8) {
    p.group(x, y, 1, t * 2.2, 1, () => p.path("M0-19V0l12 7", { width: 1.6 }));
  }
}

// Dibuja el servidor representado en la historia con las primitivas compartidas del pintor.
export function server(p, x, y, reveal = 1, t = 0) {
  p.group(x, y, 1, 0, 1, () => {
    p.lines(
      [
        "M-34 0V-185h68V0Z",
        "M-26-174h52v38h-52Zm0 49h52v38h-52Zm0 49h52v38h-52Z",
        "M-15-157h26m-26 49h26m-26 49h26",
        "M-23-23h46",
      ],
      reveal,
      { fill: true, width: 1.8 },
    );

    if (reveal > 0.9) {
      for (let i = 0; i < 3; i++) {
        p.ellipse(-17, -145 + i * 49, 2, 2, {
          fill: p.ink,
          opacity: 0.25 + (0.75 * (Math.sin(t * 6 + i) + 1)) / 2,
          width: 1,
        });
      }
    }
  });
}

// Dibuja el avión de papel de la escena con las primitivas compartidas del pintor.
export function plane(p, x, y, angle = 0, scale = 1) {
  p.group(x, y, scale, angle, 1, () =>
    p.lines(["M-25-13L28 0-25 16-13 1Z", "M-13 1L28 0M-13 1l3 13 9-10"], 1, {
      fill: true,
      width: 1.8,
    }),
  );
}

// Dibuja el ave con su postura de vuelo con las primitivas compartidas del pintor.
export function bird(p, x, y, t, scale = 1) {
  p.group(x, y, scale, 0, 1, () =>
    p.path(`M-18 ${wave(t, 7, 12)}Q-8-10 0 0Q8-10 18 ${wave(t, 7, 12)}`, {
      dynamic: true,
      width: 2,
    }),
  );
}

// Dibuja el mundo dibujado que reúne los elementos de la historia con las primitivas compartidas del pintor.
export function world(p, t, progress = 1, { broken = 0 } = {}) {
  mountain(p, 135, 305, 0.85, clamp(progress * 3));
  mountain(p, 650, 270, 1.2, clamp(progress * 3 - 0.3));
  castle(p, 575, 310, 0.8, clamp(progress * 2 - 0.4), { broken });
  tree(p, 87, 361, 0.85, clamp(progress * 3 - 1), t);
  tree(p, 705, 366, 0.65, clamp(progress * 3 - 1.4), t);
  p.path("M322 275q-70 51-8 86t-31 63M342 275q-42 46 4 79t-28 70", {
    progress: clamp(progress * 2 - 0.4),
    width: 1.4,
    color: p.soft,
  });
  p.path("M210 395Q363 362 454 321T571 308", {
    progress: clamp(progress * 2 - 0.3),
    width: 1.3,
    color: p.soft,
  });
}
