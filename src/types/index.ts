// StepWalk — tipos compartilhados
// =================================

export interface GeoPoint {
  lat: number;
  lng: number;
  alt?: number | null; // altitude (m), se disponível
  acc?: number; // precisão (m)
  t: number; // timestamp (ms)
}

export interface Walk {
  id: string; // uuid
  startedAt: number; // timestamp
  endedAt: number;
  durationSec: number; // tempo em movimento (descontando pausas)
  distanceM: number; // metros
  steps: number;
  calories: number; // kcal
  avgSpeedKmh: number;
  avgPaceMinKm: number; // min/km
  elevationGainM?: number;
  route: GeoPoint[]; // trajeto para redesenhar o mapa
  title?: string; // ex.: "Caminhada matinal"

  // --- ganchos de sincronização (preparados para login/nuvem futuros) ---
  updatedAt: number; // resolução de conflito local↔nuvem
  deletedAt?: number; // soft-delete (em vez de apagar de vez)
  userId: string; // 'local' até existir conta logada
}

export interface Profile {
  weightKg: number;
  heightCm: number;
  sex: 'male' | 'female' | 'other';
  age: number;
  strideM?: number; // comprimento da passada (auto-calculado se vazio)
}

export interface Goals {
  dailySteps: number; // ex.: 8000
  dailyDistanceM: number; // ex.: 5000
}

export interface AppSettings {
  units: 'metric' | 'imperial';
  keepScreenOn: boolean; // Wake Lock API durante a caminhada
  stepSensitivity: number; // limiar do contador de passos (0.5–3.0)
}

// Identificador de usuário local (antes de qualquer login)
export const LOCAL_USER = 'local';
