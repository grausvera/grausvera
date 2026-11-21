// Las compilaciones de Preview conservan las URLs canónicas del sitio publicado.
export const noIndex =
  import.meta.env.SITE_NOINDEX === "true" ||
  import.meta.env.VERCEL_ENV === "preview";
