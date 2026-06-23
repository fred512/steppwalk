// StepWalk — geolocalização (Haversine + watch unificado web/nativo)
// ===================================================================
// Web (PWA): navigator.geolocation.watchPosition (só foreground).
// Nativo (Capacitor/Android): @capacitor-community/background-geolocation,
// que roda um foreground service e entrega posições em segundo plano.
import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  Location as BgLocation,
} from '@capacitor-community/background-geolocation';
import type { GeoPoint } from 'src/types';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation',
);

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

export type GeoErrorKind = 'permission' | 'unavailable' | 'timeout';

export interface GeoWatchHandlers {
  onPoint: (p: GeoPoint, segmentM: number) => void;
  onError?: (kind: GeoErrorKind, message: string) => void;
  onAccuracy?: (accuracy: number) => void;
}

/** Aplica filtros e dispara onPoint com o segmento percorrido. */
function makePointSink(handlers: GeoWatchHandlers) {
  let last: GeoPoint | null = null;
  return (point: GeoPoint) => {
    handlers.onAccuracy?.(point.acc ?? 999);
    if ((point.acc ?? 999) > MAX_ACCURACY_M) return; // sinal fraco
    let segment = 0;
    if (last) {
      segment = haversineM(last, point);
      if (segment < MIN_MOVE_M) return; // jitter parado
    }
    last = point;
    handlers.onPoint(point, segment);
  };
}

/** Inicia o rastreamento adequado à plataforma. Retorna função para parar. */
export function startGeoWatch(handlers: GeoWatchHandlers): () => void {
  return Capacitor.isNativePlatform()
    ? startNativeWatch(handlers)
    : startWebWatch(handlers);
}

// --- Web (PWA) ---
function startWebWatch(handlers: GeoWatchHandlers): () => void {
  const sink = makePointSink(handlers);
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      sink({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        alt: pos.coords.altitude,
        acc: pos.coords.accuracy,
        t: pos.timestamp,
      });
    },
    (err) => {
      const kind: GeoErrorKind =
        err.code === err.PERMISSION_DENIED
          ? 'permission'
          : err.code === err.TIMEOUT
            ? 'timeout'
            : 'unavailable';
      handlers.onError?.(kind, err.message);
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

// --- Nativo (Capacitor + foreground service) ---
function startNativeWatch(handlers: GeoWatchHandlers): () => void {
  const sink = makePointSink(handlers);
  let watcherId: string | null = null;
  let stopped = false;

  void BackgroundGeolocation.addWatcher(
    {
      // backgroundMessage definido = entrega posições em segundo plano
      backgroundMessage: 'Rastreando sua caminhada…',
      backgroundTitle: 'StepWalk — caminhada em andamento',
      requestPermissions: true,
      stale: false,
      distanceFilter: 0,
    },
    (location?: BgLocation, error?: { code?: string; message: string }) => {
      if (error) {
        const kind: GeoErrorKind =
          error.code === 'NOT_AUTHORIZED' ? 'permission' : 'unavailable';
        handlers.onError?.(kind, error.message);
        return;
      }
      if (!location) return;
      sink({
        lat: location.latitude,
        lng: location.longitude,
        alt: location.altitude,
        acc: location.accuracy,
        t: location.time ?? Date.now(),
      });
    },
  ).then((id) => {
    watcherId = id;
    if (stopped) void BackgroundGeolocation.removeWatcher({ id });
  });

  return () => {
    stopped = true;
    if (watcherId) void BackgroundGeolocation.removeWatcher({ id: watcherId });
  };
}

/** Abre as configurações do app (para reconceder permissão no nativo). */
export async function openNativeSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) await BackgroundGeolocation.openSettings();
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
