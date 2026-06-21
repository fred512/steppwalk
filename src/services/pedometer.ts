// StepWalk — contador de passos via acelerômetro (DeviceMotion)
// =============================================================
// Filtro passa-baixa + detecção de picos com debounce.
// Fallback por comprimento de passada fica no store quando não há sensor.

const MIN_STEP_INTERVAL_MS = 300; // debounce (~300ms) p/ evitar dupla contagem

interface DeviceMotionEventiOS {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export interface PedometerHandlers {
  onStep: (total: number) => void;
}

export interface PedometerOptions {
  /** sensibilidade: limiar de pico acima da gravidade (m/s²). Menor = mais sensível. */
  sensitivity?: number;
}

/** iOS 13+ exige permissão explícita dentro de um gesto do usuário. */
export async function requestMotionPermission(): Promise<boolean> {
  const DME = (window as unknown as { DeviceMotionEvent?: DeviceMotionEventiOS })
    .DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') {
    try {
      const res = await DME.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }
  // Plataformas sem o gate de permissão (Android/desktop)
  return true;
}

export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/**
 * Inicia a contagem de passos. Retorna função para parar.
 * Algoritmo: magnitude do vetor de aceleração → passa-baixa → detecção de
 * cruzamento de pico acima do limiar, respeitando o intervalo mínimo.
 */
export function startPedometer(
  handlers: PedometerHandlers,
  opts: PedometerOptions = {},
): () => void {
  const threshold = opts.sensitivity ?? 1.2;
  let steps = 0;
  let filtered = 9.81; // estimativa inicial da gravidade
  let lastStepTs = 0;
  let rising = false;
  const alpha = 0.8; // coeficiente do passa-baixa

  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;

    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    filtered = alpha * filtered + (1 - alpha) * mag; // suavização
    const delta = mag - filtered; // componente dinâmica (sem gravidade)

    const now = Date.now();
    if (delta > threshold && !rising) {
      rising = true;
      if (now - lastStepTs > MIN_STEP_INTERVAL_MS) {
        steps++;
        lastStepTs = now;
        handlers.onStep(steps);
      }
    } else if (delta < threshold * 0.5) {
      rising = false; // pronto para o próximo pico
    }
  };

  window.addEventListener('devicemotion', onMotion);
  return () => window.removeEventListener('devicemotion', onMotion);
}

/** Estima o comprimento da passada (m) a partir da altura. */
export function estimateStride(heightCm: number): number {
  return 0.414 * (heightCm / 100);
}
