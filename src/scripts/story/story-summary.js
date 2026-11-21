import { scenes, STORY_DURATION } from "./story-timeline.js";
import { PLAYBACK_SPEED } from "./story-playback.js";

// Los tiempos son los de la coreografía; se convierten usando los mismos segmentos que el dibujo.
/** @type {[number, number, string][]} Escena, segundo de coreografía y frase. */
const lines = [
  [0, 0, "Todo empezó con un niño y un lápiz."],
  [0, 12, "Dibujaba por gusto. Y perdía la noción del tiempo."],
  [0, 23, "Mi imaginación no sabía quedarse quieta."],
  [1, 0, "Después crecí. Y la mochila se llenó de cosas."],
  [1, 15, "Dibujar fue quedándose atrás. Pero no del todo."],
  [2, 0, "En clase, mi cabeza se iba de paseo."],
  [2, 11, "¿Una mancha? Yo veía una criatura."],
  [2, 19, "Y claro… tenía que dibujarla."],
  [3, 0, "Las series animadas me abrieron otra puerta."],
  [3, 18, "¿Y si inventaba mi propio mundo?"],
  [3, 27, "Con aventuras, criaturas… y algún puente mal hecho."],
  [4, 0, "Llegó la gran pregunta: ¿qué iba a estudiar?"],
  [4, 12, "Elegí Sistemas. Sonaba fácil y divertido."],
  [4, 23, "Bueno… fácil era mucho decir."],
  [5, 0, "Y entonces llegó mi primera clase de programación."],
  [5, 10, "Un «Hola, mundo». Un juego en C++."],
  [5, 24, "¡Podía hacer que mis ideas se movieran!"],
  [6, 0, "El lápiz imaginaba. El código podía darle vida."],
  [6, 13, "Probé, corregí… y algo empezó a moverse."],
  [6, 26, "Ahí lo vi: quería unir mis dos pasiones."],
  [7, 0, "Pero mi mundo era enorme. Enorme de verdad."],
  [7, 14, "Arreglaba una cosa… y se rompía otra."],
  [7, 27, "Me faltaba mucho por aprender."],
  [8, 0, "El trabajo me llevó por otro camino: infraestructura."],
  [8, 14, "Entre equipos y cables, pasaron los años."],
  [8, 20, "Mi mundo seguía ahí. Asomándose de vez en cuando."],
  [9, 0, "Siempre pensaba: «Todavía no estoy preparado»."],
  [9, 15, "Más experiencia. Más libros. ¿Y cuándo empezaba?"],
  [10, 0, "Hasta que entendí: podía aprender mientras avanzaba."],
  [10, 16, "Ese «todavía no» ya había durado demasiado."],
  [10, 25, "Así que aquí estoy. Empezando."],
  [11, 0, "Sin saberlo todo. Pero con ganas de crear."],
  [11, 10, "Aquel niño y yo aún queremos lo mismo."],
  [11, 22, "grausvera nació para darle vida a ese sueño."],
  [11, 32, "Y todavía me queda mucho por descubrir."],
  [11, 39, "Continuará…"],
];

// Obtiene el punto de inicio que corresponde al tramo resumido de la historia.
function startAt(index, time) {
  const scene = scenes[index];
  const segment =
    scene.segments.find((part) => time < part.to) || scene.segments.at(-1);
  const ratio = Math.max(
    0,
    Math.min(1, (time - segment.from) / (segment.to - segment.from)),
  );

  return scene.start + segment.start + (segment.end - segment.start) * ratio;
}

export const summaryCues = lines.map(([scene, time, text], index) => ({
  index,
  scene,
  text,
  start: startAt(scene, time),
  end: STORY_DURATION,
}));

summaryCues.forEach((cue, index) => {
  cue.end = summaryCues[index + 1]?.start ?? STORY_DURATION;
});

// Resuelve la escena y el tiempo local dentro de la reproducción resumida.
export function summaryAt(elapsed) {
  const cue =
    summaryCues.find((part) => elapsed < part.end) || summaryCues.at(-1);
  // Reservar al menos el 40 % de cada frase para leerla completa, incluso durante el cierre acelerado.
  const duration = Math.min(
    cue.text.length * 32 * PLAYBACK_SPEED,
    (cue.end - cue.start) * 0.6,
  );
  const count = Math.min(
    cue.text.length,
    Math.max(
      0,
      Math.floor(((elapsed - cue.start) / duration) * cue.text.length),
    ),
  );

  return {
    ...cue,
    visible: cue.text.slice(0, count),
    typing: count < cue.text.length,
  };
}
