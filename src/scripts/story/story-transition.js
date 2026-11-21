import { mix, ramp } from "./doodle-math.js";
import { WALK_PERIOD, RUN_PERIOD } from "./doodle-character.js";

// El paso depende del tiempo local; el zoom y el tiempo acumulado del relato no cambian su cadencia.
export function transitionActor(a, b, q, seconds, previousTime, currentTime) {
  const arriving = q >= 0.8;
  const locomotion = b.pose === "walk" || b.pose === "run";
  const incomingRate =
    (seconds > 0.0001 ? currentTime / seconds : 1) /
    (b.pose === "run" ? RUN_PERIOD : WALK_PERIOD);
  const gaitPhase = locomotion
    ? b.gaitPhase + (1.5 - seconds) * (incomingRate - 1 / WALK_PERIOD)
    : seconds / WALK_PERIOD;

  return {
    ...b,
    x: mix(a.x, b.x, q),
    y: mix(a.y, b.y, q),
    scale: mix(a.scale, b.scale, q),
    age: mix(a.age, b.age, q),
    pose: arriving ? b.pose : "walk",
    previous: arriving ? "walk" : a.pose,
    poseBlend: arriving ? ramp(q, 0.8, 1) : ramp(q, 0, 0.2),
    gaitPhase,
    previousGaitPhase: arriving ? gaitPhase : (a.gaitPhase ?? gaitPhase),
    poseTime: currentTime,
    previousPoseTime: arriving ? currentTime : previousTime,
    expression: "curious",
    near: undefined,
    far: undefined,
  };
}
