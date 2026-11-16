/**
 * Destino pós-login vindo de `?proximo=`. Só aceita caminhos internos,
 * para que o link de login não possa redirecionar a outro site.
 */
export function destinoSeguro(proximo: string | null, padrao = "/painel"): string {
  if (!proximo || !proximo.startsWith("/") || proximo.startsWith("//") || proximo.includes("\\")) return padrao;
  return proximo;
}
