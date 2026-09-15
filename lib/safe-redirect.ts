// Aceita apenas caminhos internos relativos (ex.: "/mentoria/diagnostico",
// "/dashboard"). Rejeita qualquer coisa que possa resultar em open redirect:
// URLs absolutas ("https://...", "http://..."), protocolo-relativas
// ("//evil.com"), esquemas arbitrários ("javascript:...") e variações com
// barra invertida (ex.: "/\evil.com", que alguns navegadores normalizam
// como "//evil.com"). O caractere ":" nunca é permitido, o que já bloqueia
// qualquer esquema de URL.
const SAFE_INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-_/]*$/;

export function getSafeInternalPath(value: string | string[] | null | undefined, fallback: string): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (typeof candidate !== "string" || candidate.length === 0) {
    return fallback;
  }

  return SAFE_INTERNAL_PATH.test(candidate) ? candidate : fallback;
}
