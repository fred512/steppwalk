// StepWalk — formatação de métricas
// ===================================

/** Distância em km com vírgula decimal (pt-BR). Ex.: 3840 → "3,84". */
export function fmtDistanceKm(meters: number, digits = 2): string {
  return (meters / 1000).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Duração em mm:ss ou h:mm:ss. */
export function fmtDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** Ritmo min/km como "mm:ss". 0 ou infinito → "--:--". */
export function fmtPace(minPerKm: number): string {
  if (!isFinite(minPerKm) || minPerKm <= 0) return '--:--';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Número com separador de milhar pt-BR. Ex.: 4902 → "4.902". */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

/** Velocidade km/h com 1 casa. */
export function fmtSpeed(kmh: number): string {
  return kmh.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Data curta pt-BR relativa: "Hoje 09:12", "Ontem 18:40", "12/06 07:55". */
export function fmtWalkDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(d, now)) return `Hoje ${time}`;
  if (sameDay(d, yesterday)) return `Ontem ${time}`;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`;
}
