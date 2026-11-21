import { z } from "astro/zod";
import contacts from "./contact.json";

export const contactGroups = [
  { id: "social", label: "Redes sociales" },
  { id: "code", label: "Perfiles profesionales" },
  { id: "direct", label: "Contacto directo" },
];

const icons = [
  "github",
  "tiktok",
  "youtube",
  "instagram",
  "brand-x",
  "mail",
  "globe",
] as const;

type ContactIcon = (typeof icons)[number];

// Los enlaces se comprueban al compilar y solo admiten correos o HTTPS sin credenciales.
function isContactLink(value: string) {
  if (/^mailto:[^\s@]+@[^\s@]+$/.test(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !/\s/.test(value)
    );
  } catch {
    return false;
  }
}

const contactSchema = z.object({
  label: z.string().min(1),
  description: z.string(),
  href: z.string().refine(isContactLink),
  group: z.enum(["social", "code", "direct"]),
  icon: z.enum(icons).optional(),
});

// Usa el icono indicado y, si falta, recupera la marca a partir del enlace o la etiqueta.
function contactIcon(label: string, href: string): ContactIcon {
  const text = (label + " " + href).toLowerCase();

  for (const brand of ["github", "tiktok", "youtube", "instagram"] as const) {
    if (text.includes(brand)) {
      return brand;
    }
  }

  if (text.includes("youtu.be")) return "youtube";
  if (
    text.includes("x.com") ||
    text.includes("twitter.com") ||
    /\b(x|twitter)\b/.test(text)
  )
    return "brand-x";
  if (href.startsWith("mailto:") || /correo|email|mail/.test(text))
    return "mail";

  return "globe";
}

export const contactLinks = z
  .array(contactSchema)
  .parse(contacts)
  .map((contact) => ({
    ...contact,
    icon: contact.icon ?? contactIcon(contact.label, contact.href),
  }));
