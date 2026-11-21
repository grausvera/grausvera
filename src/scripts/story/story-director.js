// Coreografía y keyframes del personaje (poses, expresiones e interpolación temporal) por escena.
import { track, ramp, mix, arc, wave } from "./doodle-math.js";
import { DRAWING_COMPLETE_SECONDS } from "./story-playback.js";

const expressions = {
  run: "excited",
  pet: "happy",
  sketch: "happy",
  draw: "happy",
  type: "curious",
  think: "confused",
  startle: "surprised",
  fall: "surprised",
  laugh: "laugh",
  wave: "happy",
  celebrate: "excited",
  pull: "determined",
  push: "worried",
  exhausted: "tired",
  read: "curious",
  kneel: "happy",
};

// Completa fotogramas clave heredando la pose anterior cuando un atributo no cambia.
function keys(age, items) {
  let last = {
    x: 240,
    y: 360,
    scale: 1,
    age,
    turn: 0.7,
    pose: "idle",
    expression: "curious",
  };

  return items.map(([at, x, pose, extra = {}]) => {
    last = {
      ...last,
      at,
      x,
      pose,
      expression: expressions[pose] || "curious",
      ...extra,
    };

    return { ...last };
  });
}

const tracks = [
  keys(0, [
    [0, 360, "idle"],
    [5, 360, "wave"],
    [8, 360, "idle"],
    [9, 365, "fall"],
    [10, 365, "laugh"],
    [12, 375, "idle"],
    [14, 405, "touch"],
    [16, 420, "pull"],
    [18, 415, "ground"],
    [20, 420, "startle"],
    [21, 425, "pet"],
    [23, 425, "ground"],
    [26, 440, "run"],
    [30, 740, "run"],
  ]),
  keys(0, [
    [0, 100, "run"],
    [4, 260, "pull"],
    [7, 265, "startle"],
    [9, 270, "run"],
    [15, 475, "walk", { age: 0.58 }],
    [17, 500, "idle"],
    [19, 505, "wave"],
    [20.5, 510, "walk"],
    [25, 690, "walk"],
  ]),
  keys(0.58, [
    [0, 155, "walk"],
    [3, 265, "fall"],
    [4, 265, "touch"],
    [5.5, 270, "sit"],
    [8, 270, "think"],
    [12, 270, "think"],
    [15, 270, "startle"],
    [17, 270, "reach"],
    [19, 270, "draw"],
    [23, 270, "celebrate"],
    [25, 270, "startle"],
    [27, 270, "read-sit"],
    [30, 270, "read-sit"],
  ]),
  keys(0.68, [
    [0, 255, "sit"],
    [3, 255, "startle"],
    [5, 255, "sit"],
    [9, 270, "reach"],
    [12, 260, "fall"],
    [15, 280, "reach"],
    [18, 365, "walk"],
    [21, 430, "idle"],
    [25, 450, "touch"],
    [27, 465, "ground"],
    [30, 475, "walk"],
    [32, 510, "startle"],
    [33, 505, "ground"],
    [35, 525, "laugh"],
    [37, 540, "walk"],
    [40, 560, "think"],
  ]),
  keys(0.72, [
    [0, 160, "walk"],
    [5, 365, "think"],
    [8, 315, "walk"],
    [10, 310, "think"],
    [12, 345, "think"],
    [14, 390, "walk"],
    [18, 475, "wave"],
    [20, 490, "walk"],
    [23, 525, "idle", { expression: "happy" }],
    [26, 530, "startle"],
    [30, 530, "startle"],
  ]),
  keys(0.76, [
    [0, 265, "fall"],
    [2, 265, "sit"],
    [5, 265, "touch"],
    [7, 265, "draw"],
    [9, 265, "type"],
    [12, 265, "celebrate"],
    [15, 265, "type"],
    [18, 265, "type", { expression: "excited" }],
    [23, 265, "type", { expression: "excited" }],
    [25, 265, "startle"],
    [28, 265, "reach"],
    [30, 265, "reach", { expression: "happy" }],
    [34, 265, "think"],
    [38, 265, "celebrate"],
    [40, 265, "celebrate"],
  ]),
  keys(0.82, [
    [0, 265, "carry"],
    [4, 265, "draw"],
    [8, 265, "touch"],
    [10, 265, "think"],
    [13, 265, "type"],
    [18, 265, "type"],
    [21, 265, "startle"],
    [23, 265, "type"],
    [26, 265, "celebrate"],
    [28, 280, "run"],
    [33, 460, "run"],
    [37, 600, "walk"],
    [40, 700, "walk"],
  ]),
  keys(0.9, [
    [0, 130, "walk"],
    [4, 310, "idle", { expression: "excited" }],
    [7, 370, "sketch"],
    [10, 435, "push"],
    [12, 435, "push"],
    [13, 435, "run"],
    [16, 310, "ground"],
    [19, 470, "run"],
    [22, 510, "push"],
    [24, 430, "run"],
    [27, 380, "exhausted"],
    [30, 380, "exhausted"],
  ]),
  keys(1, [
    [0, 165, "walk"],
    [4, 260, "touch"],
    [7, 310, "walk"],
    [10, 385, "touch"],
    [13, 440, "walk"],
    [16, 485, "touch"],
    [18, 490, "think"],
    [20, 490, "wave"],
    [23, 495, "startle"],
    [25, 500, "walk"],
    [30, 680, "walk"],
  ]),
  keys(1, [
    [0, 165, "walk"],
    [4, 440, "reach"],
    [7, 400, "startle"],
    [9, 380, "read"],
    [12, 440, "reach"],
    [15, 410, "think"],
    [18, 370, "read"],
    [22, 340, "read"],
    [25, 315, "sit", { expression: "sad" }],
    [30, 315, "sit", { expression: "sad" }],
  ]),
  keys(1, [
    [0, 315, "sit", { expression: "sad" }],
    [3, 315, "think"],
    [6, 315, "read-sit"],
    [9, 320, "walk"],
    [15, 430, "reach"],
    [18, 440, "think"],
    [20, 440, "carry"],
    [22, 440, "wave"],
    [25, 460, "walk"],
    [28, 545, "idle", { expression: "determined" }],
    [30, 550, "walk"],
    [35, 705, "walk"],
  ]),
  keys(1, [
    [0, 120, "walk"],
    [4, 285, "idle", { expression: "happy" }],
    [7, 320, "kneel"],
    [10, 325, "kneel"],
    [12, 325, "kneel"],
    [16, 325, "kneel", { expression: "excited" }],
    [19, 325, "kneel"],
    [22, 350, "reach"],
    [25, 380, "point"],
    [28, 430, "walk"],
    [32, 530, "walk"],
    [34, 580, "idle", { expression: "happy" }],
    [37, 600, "carry"],
    [40, 700, "walk"],
  ]),
];
const sceneBeats = [
  [
    [0, "blank-page"],
    [1, "head-draws-itself"],
    [3, "eyes-discover-camera"],
    [5, "body-takes-shape"],
    [9, "first-tumble"],
    [12, "giant-pencil-appears"],
    [14, "touch-pencil"],
    [16, "drag-pencil"],
    [18, "draw-first-creature"],
    [20, "creature-comes-alive"],
    [21, "pet-creature"],
    [23, "grow-childhood-world"],
    [26, "chase-creature"],
  ],
  [
    [0, "chase-through-notebook"],
    [2, "backpack-draws-itself"],
    [4, "backpack-weight"],
    [7, "school-bell"],
    [9, "grow-into-teenager"],
    [16, "drawing-touches-shoulder"],
    [19, "leave-childhood-behind"],
  ],
  [
    [0, "enter-classroom"],
    [3, "unfinished-chair-catches-fall"],
    [6, "bored-in-class"],
    [11, "stain-becomes-creature"],
    [16, "creature-jumps-to-desk"],
    [19, "draw-the-model"],
    [23, "drawing-greets-original"],
    [25, "bell-erases-creature"],
    [27, "close-notebook"],
  ],
  [
    [0, "pages-turn"],
    [3, "television-draws-itself"],
    [7, "fantasy-on-screen"],
    [11, "creature-leaves-screen"],
    [15, "accept-helping-hand"],
    [18, "enter-imagined-world"],
    [25, "find-pencil"],
    [27, "draw-bridge"],
    [31, "bridge-bends"],
    [33, "add-missing-supports"],
    [37, "world-becomes-a-thought"],
  ],
  [
    [0, "fork-in-the-road"],
    [5, "weigh-two-paths"],
    [8, "approach-art"],
    [12, "choose-systems"],
    [18, "wave-goodbye-to-pencil"],
    [23, "books-grow-into-tower"],
    [28, "book-opens-into-classroom"],
  ],
  [
    [0, "land-in-classroom"],
    [3, "computer-draws-itself"],
    [5, "mouse-needs-a-cable"],
    [7, "draw-the-cable"],
    [10, "hello-world"],
    [15, "play-cpp-game"],
    [24, "game-character-leaves-monitor"],
    [28, "touch-the-character"],
    [30, "character-lands-on-hand"],
    [34, "connect-pencil-and-code"],
  ],
  [
    [0, "pencil-and-code-in-each-hand"],
    [4, "draw-a-still-creature"],
    [8, "drawing-does-not-respond"],
    [13, "code-opens-its-eyes"],
    [17, "code-moves-its-arms"],
    [21, "creature-loses-balance"],
    [23, "correct-the-program"],
    [26, "drawing-runs"],
    [29, "follow-its-new-path"],
  ],
  [
    [0, "enter-an-unfinished-world"],
    [7, "build-a-castle"],
    [10, "hold-the-falling-tower"],
    [14, "repair-unravelling-creature"],
    [19, "bridge-breaks"],
    [24, "too-many-repairs"],
    [27, "lower-the-pencil"],
  ],
  [
    [0, "servers-draw-around-him"],
    [4, "connect-cables"],
    [10, "check-equipment"],
    [14, "years-pass"],
    [18, "childhood-creature-hides"],
    [20, "fantasy-window-opens"],
    [23, "work-alarm-closes-window"],
    [25, "return-to-routine"],
  ],
  [
    [0, "approach-dream-door"],
    [5, "need-to-learn-more"],
    [9, "study-first-book"],
    [12, "try-the-door-again"],
    [15, "need-experience"],
    [18, "books-keep-accumulating"],
    [25, "sit-and-watch-the-clock"],
  ],
  [
    [0, "look-up-from-books"],
    [6, "read-and-start-walking"],
    [12, "pick-up-the-pencil"],
    [16, "remove-the-sign"],
    [20, "fold-a-paper-plane"],
    [22, "launch-paper-plane"],
    [25, "open-the-door"],
    [28, "discover-a-blank-page"],
    [30, "draw-a-path-with-each-step"],
  ],
  [
    [0, "meet-the-child"],
    [7, "kneel-beside-the-drawing"],
    [10, "animate-the-childs-creature"],
    [15, "child-chases-the-creature"],
    [20, "child-offers-the-pencil"],
    [24, "look-toward-the-castle"],
    [27, "create-the-world-together"],
    [33, "child-enters-the-world"],
    [36, "keep-pencil-and-computer"],
    [38, "continuara"],
  ],
];

// Resuelve protagonista, personajes secundarios y cámara para el instante de una escena.
export function directScene(index, t) {
  const main = track(tracks[index], t);

  main.id = "protagonist";
  main.look = 1;
  main.lookY = 0;

  let camera = { x: 400, y: 225, zoom: 1 };
  let secondary = [];

  if (index === 0) {
    main.reveal = ramp(t, 1, 2.7);
    main.faceReveal = ramp(t, 2.8, 3.4);
    main.bodyReveal = ramp(t, 5, DRAWING_COMPLETE_SECONDS);
    main.opacity = t < 0.65 ? 0 : 1;
    main.look = t < 3.8 ? -1 : t < 4.4 ? 1 : 0;
    main.turn = t < 5 ? 0.2 : 0.7;
    main.headTilt = t > 4.4 && t < 5.5 ? 0.2 : 0;
    main.jump = arc(t, 8, 9, 10);
    camera.zoom = mix(1.12, 0.9, ramp(t, 25, 30));
  }

  if (index === 1) {
    main.backpack = ramp(t, 2, 5);
    main.lean = t > 4 && t < 7 ? wave(t, 4, 3) + 10 : 0;
    main.look = t > 16 && t < 20 ? -1 : 1;
    main.headTilt = t > 16 && t < 20 ? -0.15 : 0;
    main.jump = arc(t, 7, 8.2, 17);
    camera.x = mix(400, 490, ramp(t, 20, 25));
  }

  if (index === 2) {
    main.jump = -arc(t, 2.6, 4, 12);
    main.headTilt = t > 10 && t < 16 ? wave(t - 10, 2, 0.18) : 0;
    main.look = t > 15 && t < 17 ? -1 : 1;
    camera.zoom = 1 + arc(t, 10, 18, 0.13);
  }

  if (index === 3) {
    main.jump = arc(t, 11.2, 13, 9);
    camera.zoom = mix(1, 0.86, ramp(t, 20, 29));
    camera.x = mix(400, 460, ramp(t, 20, 29));
  }

  if (index === 4) {
    main.look = t > 8 && t < 14 ? -1 : 1;
    main.lookY = t > 24 ? -5 : 0;
    camera.zoom = mix(1, 0.78, ramp(t, 24, 28));
  }

  if (index === 5) {
    main.jump = arc(t, 0, 2, 42);
    main.headTilt = t > 26 && t < 30 ? wave(t, 2, 0.18) : 0;
    secondary = [
      {
        id: "teacher",
        x: 625,
        y: 360,
        age: 1,
        scale: 0.96,
        turn: -0.75,
        pose: t % 8 < 4 ? "point" : "think",
        expression: "happy",
        look: 1,
      },
    ];
  }

  if (index === 6) {
    camera.x = mix(400, 500, ramp(t, 29, 40));
    main.jump = arc(t, 26, 27.5, 20);
  }

  if (index === 7) {
    main.lean = t > 27 ? 8 : 0;
    camera.zoom = mix(0.9, 1, ramp(t, 26, 30));
  }

  if (index === 8) {
    main.look = t > 18 && t < 21 ? -1 : 1;
    camera.x = mix(400, 500, ramp(t, 24, 30));
    main.backpack = 0.6;
  }

  if (index === 9) {
    main.lookY = -3;
    camera.zoom = mix(1, 0.82, ramp(t, 22, 28));
  }

  if (index === 10) {
    camera.zoom = mix(0.82, 1, ramp(t, 0, 3));
    main.lookY = t < 6 ? -4 : 0;
    main.expression = t > 15 ? "determined" : main.expression;
  }

  if (index === 11) {
    const child = track(
      keys(0, [
        [0, 425, "ground"],
        [5, 425, "ground"],
        [7, 425, "wave"],
        [10, 425, "ground"],
        [13, 425, "startle"],
        [15, 445, "run"],
        [18, 555, "run"],
        [20, 430, "reach"],
        [23, 430, "point"],
        [27, 485, "walk"],
        [31, 610, "walk"],
        [35, 755, "walk"],
        [40, 850, "walk"],
      ]),
      t,
    );

    child.id = "child";
    child.look = t > 7 && t < 14 ? -1 : 1;
    child.opacity = 1;
    secondary = [child];
    camera.x = mix(400, 545, ramp(t, 27, 40));
    camera.y = mix(225, 205, ramp(t, 34, 40));
  }

  const beat =
    sceneBeats[index].filter(([at]) => at <= t).at(-1)?.[1] || "enter";

  return { main, secondary, camera, beat, index, t };
}
