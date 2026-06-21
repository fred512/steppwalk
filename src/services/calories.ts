// StepWalk — estimativa de calorias (MET ajustado pela velocidade)
// ================================================================
// kcal = MET × peso_kg × tempo_horas, acumulado por trechos.

/** Retorna o MET aproximado para uma velocidade de caminhada (km/h). */
export function metForSpeed(speedKmh: number): number {
  if (speedKmh < 3.2) return 2.0;
  if (speedKmh < 4.0) return 2.8;
  if (speedKmh < 4.8) return 3.3;
  if (speedKmh < 5.6) return 3.8;
  if (speedKmh < 6.4) return 5.0;
  if (speedKmh < 7.2) return 6.3;
  return 7.0; // trote
}

/**
 * Calorias (kcal) gastas num trecho.
 * @param speedKmh velocidade média do trecho
 * @param weightKg peso do usuário
 * @param seconds  duração do trecho em segundos
 */
export function segmentCalories(
  speedKmh: number,
  weightKg: number,
  seconds: number,
): number {
  const met = metForSpeed(speedKmh);
  const hours = seconds / 3600;
  return met * weightKg * hours;
}
