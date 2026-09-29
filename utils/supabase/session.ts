// Política de persistencia de la sesión, compartida por proxy, servidor y navegador.
//
// @supabase/ssr siempre escribe las cookies de sesión con maxAge = 400 días.
// Si el usuario desmarca "Mantener sesión iniciada" (cookie ml_remember=0),
// quitamos maxAge/expires para que sean cookies de sesión del navegador:
// se borran al cerrarlo. Útil en equipos compartidos (consultorios, colegios).

type CookieOptions = Record<string, any> | undefined;

export const REMEMBER_COOKIE = "ml_remember";
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60;

export function isRemembered(value: string | undefined) {
  return value !== "0";
}

export function withPersistence(options: CookieOptions, remember: boolean): CookieOptions {
  // maxAge 0 = borrar la cookie; eso hay que respetarlo siempre.
  if (remember || !options || options.maxAge === 0) return options;
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}
