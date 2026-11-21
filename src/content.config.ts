import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { creationTypes } from "./data/creation-types";

const coverPath = z
  .string()
  .regex(/^\/creations\/covers\/[\w.-]+\.(svg|webp|avif|png|jpe?g)$/i);
const galleryPath = z
  .string()
  .regex(
    /^\/creations\/gallery\/[\w.-]+\.(gif|svg|webp|avif|png|jpe?g|webm|mp4)$/i,
  );
const galleryItem = z.object({
  id: z.string().min(1),
  kind: z.enum(["image", "video"]),
  hasAudio: z.boolean().optional(),
  stillLight: galleryPath.optional(),
  stillDark: galleryPath.optional(),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  light: galleryPath,
  dark: galleryPath.optional(),
});
const journalCoverPath = z
  .string()
  .regex(
    /^\/bitacora\/covers\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\.(svg|webp|avif|png|jpe?g)$/i,
  );
const creations = defineCollection({
  loader: glob({ base: "./src/content/creations", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    type: z.enum(Object.keys(creationTypes) as (keyof typeof creationTypes)[]),
    status: z.enum([
      "En desarrollo",
      "En evolución",
      "Completado",
      "En pausa",
      "Archivado",
    ]),
    tools: z.array(z.string()),
    featured: z.boolean(),
    createdAt: z.coerce.date(),
    role: z.string().optional(),
    relatedProjectIds: z.array(z.string()).default([]),
    gallery: z.array(galleryItem).default([]),
    highlights: z
      .object({
        title: z.string().min(1),
        items: z
          .array(
            z.object({ title: z.string().min(1), text: z.string().min(1) }),
          )
          .min(1)
          .max(3),
      })
      .optional(),
    website: z
      .object({
        path: z.literal("/"),
        repository: z.url({ protocol: /^https$/ }).optional(),
        responsive: z.boolean().default(false),
      })
      .optional(),
    cover: z.object({
      light: coverPath,
      dark: coverPath.optional(),
      alt: z.string().min(1),
    }),
  }),
});

const bitacora = defineCollection({
  loader: glob({
    base: "./src/content/bitacora",
    pattern: "*.{md,mdx}",
    generateId: ({ entry }) => z.uuid().parse(entry.replace(/\.mdx?$/, "")),
  }),
  schema: z.object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    date: z.iso.date(),
    category: z.string().trim().min(1).optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    creation: reference("creations").optional(),
    cover: z
      .object({
        light: z.union([journalCoverPath, coverPath]),
        dark: z.union([journalCoverPath, coverPath]).optional(),
        alt: z.string().trim().min(1),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { creations, bitacora };
