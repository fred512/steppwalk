// StepWalk — store da caminhada ativa
// ====================================
import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { GeoPoint, Walk } from 'src/types';
import { LOCAL_USER } from 'src/types';
import { startGeoWatch, elevationGain } from 'src/services/geo';
import {
  startPedometer,
  requestMotionPermission,
  isMotionSupported,
} from 'src/services/pedometer';
import { segmentCalories } from 'src/services/calories';
import { useProfileStore } from './profile';
import { useHistoryStore } from './history';

const AUTO_PAUSE_SEC = 8; // sem movimento por N s → auto-pausa
const MIN_MOVING_KMH = 0.5; // abaixo disso não conta como movimento (parado)
const MAX_REALISTIC_KMH = 25; // acima disso é "salto" de GPS — descarta

export type SessionStatus = 'idle' | 'active' | 'paused';

/** Resultado de finalizar uma caminhada (nunca falha em silêncio). */
export type FinishResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'not-running' | 'empty-no-gps' | 'empty-too-short' };

export const useSessionStore = defineStore('session', () => {
  const profileStore = useProfileStore();
  const historyStore = useHistoryStore();

  // estado bruto
  const running = ref(false);
  const manualPaused = ref(false);
  const autoPaused = ref(false);

  const route = ref<GeoPoint[]>([]);
  const distanceM = ref(0);
  const sensorSteps = ref(0);
  const durationSec = ref(0);
  const calories = ref(0);
  const gpsAccuracy = ref<number | null>(null);
  const gpsError = ref<string | null>(null); // permissão negada / sinal indisponível
  const motionAvailable = ref(false);
  const startedAt = ref(0);

  let stopGeo: (() => void) | null = null;
  let stopPed: (() => void) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastMoveTs = 0;
  let lastTickTs = 0; // p/ medir tempo pelo relógio real (não assume 1s fixo)
  let wakeLock: WakeLockSentinel | null = null;

  // --- derivados ---
  const status = computed<SessionStatus>(() => {
    if (!running.value) return 'idle';
    return manualPaused.value || autoPaused.value ? 'paused' : 'active';
  });
  const isMoving = computed(
    () => running.value && !manualPaused.value && !autoPaused.value,
  );

  const avgSpeedKmh = computed(() =>
    durationSec.value > 0
      ? distanceM.value / 1000 / (durationSec.value / 3600)
      : 0,
  );
  const avgPaceMinKm = computed(() =>
    distanceM.value > 0
      ? durationSec.value / 60 / (distanceM.value / 1000)
      : 0,
  );

  /** Passos: sensor quando disponível, senão estimados pela passada. */
  const steps = computed(() =>
    motionAvailable.value
      ? sensorSteps.value
      : Math.round(distanceM.value / profileStore.strideM),
  );

  // --- ciclo de vida ---
  async function start(): Promise<void> {
    if (running.value) return;
    reset();
    running.value = true;
    startedAt.value = Date.now();
    lastMoveTs = Date.now();

    // Permissão de movimento (gate iOS exige gesto do usuário — chamado no clique)
    if (isMotionSupported()) {
      const granted = await requestMotionPermission();
      motionAvailable.value = granted;
      if (granted) {
        stopPed = startPedometer(
          { onStep: (total) => (sensorSteps.value = total) },
          { sensitivity: profileStore.settings.stepSensitivity },
        );
      }
    }

    // GPS
    stopGeo = startGeoWatch({
      onPoint: (p, seg) => {
        gpsError.value = null; // chegou ponto → sinal ok
        handlePoint(p, seg);
      },
      onAccuracy: (acc) => (gpsAccuracy.value = acc),
      onError: (kind) => {
        gpsError.value =
          kind === 'permission'
            ? 'Permissão de localização negada. Libere o GPS nas configurações do aparelho.'
            : 'Sinal de GPS indisponível. Vá para um local aberto e tente novamente.';
      },
    });

    // cronômetro: conta só tempo em movimento + auto-pause
    lastTickTs = Date.now();
    timer = setInterval(tick, 1000);

    void requestWakeLock();
  }

  function handlePoint(point: GeoPoint, segmentM: number) {
    route.value.push(point);
    if (route.value.length < 2) return;

    const prev = route.value[route.value.length - 2]!;
    const dtSec = Math.max((point.t - prev.t) / 1000, 0.001);
    const speedKmh = segmentM / 1000 / (dtSec / 3600);

    // movimento real (velocidade plausível e não pausado manualmente)
    // → soma distância/calorias e retoma de auto-pause
    const realMove =
      speedKmh >= MIN_MOVING_KMH &&
      speedKmh <= MAX_REALISTIC_KMH &&
      !manualPaused.value;
    if (realMove) {
      distanceM.value += segmentM;
      calories.value += segmentCalories(
        speedKmh,
        profileStore.profile.weightKg,
        dtSec,
      );
      lastMoveTs = Date.now();
      if (autoPaused.value) autoPaused.value = false;
    }
  }

  function tick() {
    const now = Date.now();
    const deltaSec = Math.max(0, (now - lastTickTs) / 1000); // tempo real decorrido
    lastTickTs = now;
    if (!running.value) return;
    // auto-pause por inatividade
    if (!manualPaused.value && now - lastMoveTs > AUTO_PAUSE_SEC * 1000) {
      autoPaused.value = true;
    }
    // soma o tempo REAL decorrido (corrige velocidade quando o app é suspenso)
    if (isMoving.value) durationSec.value += deltaSec;
  }

  function pause() {
    manualPaused.value = true;
  }
  function resume() {
    manualPaused.value = false;
    autoPaused.value = false;
    lastMoveTs = Date.now();
    lastTickTs = Date.now(); // não conta o tempo que ficou pausado
  }

  async function finish(): Promise<FinishResult> {
    if (!running.value) return { ok: false, reason: 'not-running' };
    teardown();

    // caminhada sem deslocamento → não salva, mas avisa o porquê
    if (distanceM.value < 1 && steps.value < 1) {
      const noGps = route.value.length === 0 || gpsError.value !== null;
      reset();
      return {
        ok: false,
        reason: noGps ? 'empty-no-gps' : 'empty-too-short',
      };
    }

    const now = Date.now();
    const walk: Walk = {
      id: crypto.randomUUID(),
      startedAt: startedAt.value,
      endedAt: now,
      durationSec: durationSec.value,
      distanceM: Math.round(distanceM.value),
      steps: steps.value,
      calories: Math.round(calories.value),
      avgSpeedKmh: +avgSpeedKmh.value.toFixed(2),
      avgPaceMinKm: +avgPaceMinKm.value.toFixed(2),
      elevationGainM: Math.round(elevationGain(route.value)),
      route: [...route.value],
      updatedAt: now,
      userId: LOCAL_USER,
    };
    await historyStore.add(walk);
    reset();
    return { ok: true, id: walk.id };
  }

  function cancel() {
    teardown();
    reset();
  }

  // --- internos ---
  function teardown() {
    stopGeo?.();
    stopPed?.();
    if (timer) clearInterval(timer);
    stopGeo = stopPed = timer = null;
    void releaseWakeLock();
  }
  function reset() {
    running.value = false;
    manualPaused.value = false;
    autoPaused.value = false;
    route.value = [];
    distanceM.value = 0;
    sensorSteps.value = 0;
    durationSec.value = 0;
    calories.value = 0;
    gpsAccuracy.value = null;
    gpsError.value = null;
    motionAvailable.value = false;
    startedAt.value = 0;
  }

  // Re-adquire o Wake Lock quando o app volta ao primeiro plano
  // (o navegador o libera automaticamente ao trocar de aba/bloquear a tela).
  function onVisibility() {
    if (document.visibilityState === 'visible' && running.value) {
      void requestWakeLock();
    }
  }

  async function requestWakeLock() {
    if (!profileStore.settings.keepScreenOn) return;
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
      document.addEventListener('visibilitychange', onVisibility);
    } catch {
      wakeLock = null;
    }
  }
  async function releaseWakeLock() {
    document.removeEventListener('visibilitychange', onVisibility);
    try {
      await wakeLock?.release();
    } catch {
      /* noop */
    }
    wakeLock = null;
  }

  return {
    // estado
    status,
    route,
    distanceM,
    steps,
    durationSec,
    calories,
    avgSpeedKmh,
    avgPaceMinKm,
    gpsAccuracy,
    gpsError,
    motionAvailable,
    isMoving,
    // ações
    start,
    pause,
    resume,
    finish,
    cancel,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSessionStore, import.meta.hot));
}
