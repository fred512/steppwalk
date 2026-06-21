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
const MIN_MOVING_KMH = 0.5; // abaixo disso não conta como movimento

export type SessionStatus = 'idle' | 'active' | 'paused';

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
  const motionAvailable = ref(false);
  const startedAt = ref(0);

  let stopGeo: (() => void) | null = null;
  let stopPed: (() => void) | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let lastMoveTs = 0;
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
      onPoint: handlePoint,
      onAccuracy: (acc) => (gpsAccuracy.value = acc),
    });

    // cronômetro: conta só tempo em movimento + auto-pause
    timer = setInterval(tick, 1000);

    void requestWakeLock();
  }

  function handlePoint(point: GeoPoint, segmentM: number) {
    route.value.push(point);
    if (route.value.length < 2) return;

    const prev = route.value[route.value.length - 2]!;
    const dtSec = Math.max((point.t - prev.t) / 1000, 0.001);
    const speedKmh = segmentM / 1000 / (dtSec / 3600);

    // movimento real → soma distância/calorias e retoma de auto-pause
    if (speedKmh >= MIN_MOVING_KMH) {
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
    if (!running.value) return;
    // auto-pause por inatividade
    if (!manualPaused.value && Date.now() - lastMoveTs > AUTO_PAUSE_SEC * 1000) {
      autoPaused.value = true;
    }
    if (isMoving.value) durationSec.value++;
  }

  function pause() {
    manualPaused.value = true;
  }
  function resume() {
    manualPaused.value = false;
    autoPaused.value = false;
    lastMoveTs = Date.now();
  }

  async function finish(): Promise<string | null> {
    if (!running.value) return null;
    teardown();

    // descarta caminhadas sem deslocamento
    if (distanceM.value < 1 && steps.value < 1) {
      reset();
      return null;
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
    return walk.id;
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
    motionAvailable.value = false;
    startedAt.value = 0;
  }

  async function requestWakeLock() {
    if (!profileStore.settings.keepScreenOn) return;
    try {
      wakeLock = await navigator.wakeLock?.request('screen');
    } catch {
      wakeLock = null;
    }
  }
  async function releaseWakeLock() {
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
