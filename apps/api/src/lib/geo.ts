const RAIO_TERRA_KM = 6371;
const emRadianos = (graus: number) => (graus * Math.PI) / 180;

export interface Coordenada {
  latitude: number;
  longitude: number;
}

/** Distância em linha reta entre dois pontos (fórmula de Haversine), em km. */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = emRadianos(b.latitude - a.latitude);
  const dLng = emRadianos(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(emRadianos(a.latitude)) * Math.cos(emRadianos(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Retângulo que contém o círculo de raio `raioKm` em torno de `centro`.
 * Serve como pré-filtro barato no banco antes do cálculo exato.
 */
export function caixaDelimitadora(centro: Coordenada, raioKm: number) {
  const deltaLat = raioKm / 111.32;
  const cosLat = Math.max(0.01, Math.cos(emRadianos(centro.latitude)));
  const deltaLng = raioKm / (111.32 * cosLat);
  return {
    latMin: centro.latitude - deltaLat,
    latMax: centro.latitude + deltaLat,
    lngMin: centro.longitude - deltaLng,
    lngMax: centro.longitude + deltaLng,
  };
}
