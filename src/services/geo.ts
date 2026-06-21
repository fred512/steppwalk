// StepWalk — geolocalização (watchPosition + Haversine)
// ======================================================
import type { GeoPoint } from 'src/types';

const R = 6371000; // raio da Terra (m)
const toRad = (d: number) => (d * Math.PI) / 180;

/** Distância em metros entre dois pontos (fórmula de Haversine). */
export function haversineM(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Filtros anti-ruído de GPS
export const MAX_ACCURACY_M = 25; // descarta pontos com precisão pior que isso
export const MIN_MOVE_M = 3; // ignora jitter parado

export interface GeoWatchHandlers {
  onPoint: (p: GeoPoint, segmentM: number) => void;
  onError?: (err: GeolocationPositionError) => void;
  onAccuracy?: (accuracy: number) => void;
}

/**
 * Inicia o rastreamento por GPS. Retorna uma função para parar.
 * Aplica os filtros de precisão e jitter da spec.
 */
export function startGeoWatch(handlers: GeoWatchHandlers): () => void {
  let last: GeoPoint | null = null;

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const acc = pos.coords.accuracy;
      handlers.onAccuracy?.(acc);
      if (acc > MAX_ACCURACY_M) return; // sinal fraco: descarta

      const point: GeoPoint = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        alt: pos.coords.altitude,
        acc,
        t: pos.timestamp,
      };

      let segment = 0;
      if (last) {
        segment = haversineM(last, point);
        if (segment < MIN_MOVE_M) return; // jitter parado
      }
      last = point;
      handlers.onPoint(point, segment);
    },
    (err) => handlers.onError?.(err),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
  );

  return () => navigator.geolocation.clearWatch(id);
}

/** Ganho de elevação acumulado (somando apenas subidas). */
export function elevationGain(route: GeoPoint[]): number {
  let gain = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]?.alt;
    const b = route[i]?.alt;
    if (a != null && b != null && b > a) gain += b - a;
  }
  return gain;
}
