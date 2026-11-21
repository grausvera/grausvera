export const PLAYBACK_SPEED = 3;
const DRAWING_SPEED = 2;
export const DRAWING_COMPLETE_SECONDS = 8.3;
const DRAWING_COMPLETE_TIME = DRAWING_COMPLETE_SECONDS * 1000;
const DRAWING_PRESENTATION_TIME = DRAWING_COMPLETE_TIME / DRAWING_SPEED;

// Las dos conversiones comparten el mismo punto de cambio, sin saltos en el dibujo ni al arrastrar.
export function toPresentationTime(storyTime) {
  return storyTime <= DRAWING_COMPLETE_TIME
    ? storyTime / DRAWING_SPEED
    : DRAWING_PRESENTATION_TIME +
        (storyTime - DRAWING_COMPLETE_TIME) / PLAYBACK_SPEED;
}

// Convierte la posición del reproductor al tiempo usado por las escenas de la historia.
export function toStoryTime(position) {
  return position <= DRAWING_PRESENTATION_TIME
    ? position * DRAWING_SPEED
    : DRAWING_COMPLETE_TIME +
        (position - DRAWING_PRESENTATION_TIME) * PLAYBACK_SPEED;
}

const ENDING_SPEED = 4;
const STAR_TRANSFORM_SECONDS = 1.55;
const STAR_TRANSFORM_POSITION = STAR_TRANSFORM_SECONDS / PLAYBACK_SPEED;

// El cierre conserva el ritmo general hasta el primer trazo de la transformación.
export function toEndingSeconds(position) {
  return position <= STAR_TRANSFORM_POSITION
    ? position * PLAYBACK_SPEED
    : STAR_TRANSFORM_SECONDS +
        (position - STAR_TRANSFORM_POSITION) * ENDING_SPEED;
}

// Convierte el tiempo del cierre a su posición dentro de la reproducción completa.
export function toEndingPosition(seconds) {
  return seconds <= STAR_TRANSFORM_SECONDS
    ? seconds / PLAYBACK_SPEED
    : STAR_TRANSFORM_POSITION +
        (seconds - STAR_TRANSFORM_SECONDS) / ENDING_SPEED;
}
