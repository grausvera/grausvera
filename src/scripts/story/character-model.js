// Modelo maestro vectorial trazado a partir de las vistas de la hoja del propietario.
// Cabeza, camiseta, manos y calzado se reutilizan sin estiramientos entre poses.
export const MODEL = {
  leg: 70,
  torso: 58,
  arm: 34,
  headOffset: 43,
  ink: "#171a2b",
  scale: 0.9,
};
export const headShapes = {
  front: {
    outline:
      "M-1-38C-20-37-34-20-37-2C-42 18-27 34-9 38C11 44 27 32 34 16C43-3 35-24 21-33C14-37 6-40-1-38Z",
    hair: [
      "M-18-44Q-12-49-5-43",
      "M14-32C21-46 10-61-2-58",
      "M21-32C33-40 24-51 18-49",
    ],
    forelock: "M-7-33l-4 11",
    eyes: [
      [-7, -2, 8.5, 16],
      [10, -2, 8, 15],
    ],
    mouth: [4, 28],
  },
  threeQuarter: {
    outline:
      "M2-39C-19-39-34-22-36-3C-40 17-24 35-5 39C16 43 33 29 38 10C44-9 29-34 10-38Q6-40 2-39Z",
    hair: [
      "M-20-31Q-21-44-12-45",
      "M-1-36C-4-52 8-57 13-52",
      "M12-35Q22-48 29-41",
    ],
    forelock: "M-15-33l-4 13",
    eyes: [
      [11, -2, 8, 16],
      [26, -3, 7, 15],
    ],
    mouth: [23, 28],
  },
  profile: {
    outline:
      "M1-39C-19-40-35-24-37-3C-39 20-23 38-3 39C17 41 34 30 39 10C45-10 31-35 10-39Q6-40 1-39Z",
    hair: ["M-18-31Q-20-46-10-46", "M-4-37Q-1-55 9-53", "M12-36Q24-48 28-42"],
    forelock: "M-20-31l-3 13",
    eyes: [
      [21, -2, 7.5, 15.5],
      [33, -3, 5.2, 14],
    ],
    mouth: [28, 28],
  },
};
const shirtPath = "M-4 1L-18 20L-10 24L-13 55Q-1 60 14 55L10 23L18 19L4 1Z";
export const shirtShapes = {
  front: shirtPath,
  threeQuarter: "M-4 1L-17 20L-9 24L-12 55Q0 60 14 55L10 23L17 19L4 1Z",
  profile: "M-3 1L-14 20L-7 23L-10 55Q0 59 10 55L8 23L12 20L3 1Z",
};
export const armAnchors = {
  front: [15, -14],
  threeQuarter: [12, -9],
  profile: [8, -5],
};
export const shirtDetails = ["M-4 3q4 5 8 0", "M-6 28l-1 8", "M5 43l1 6"];
export const handPath =
  "M-4-6Q-8-2-6 6Q-5 12-1 10L-1 4Q1 12 4 8L3 2Q6 7 8 3Q10-2 5-6Q0-10-4-6Z";
export const shoePath = "M-5 0Q-4-8 4-10Q16-13 25-4L27 0Q13 3-5 2Z";
