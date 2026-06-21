// StepWalk — store do histórico de caminhadas
// ============================================
import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { Walk } from 'src/types';
import {
  getAllWalks,
  getWalk,
  saveWalk,
  softDeleteWalk,
} from 'src/services/storage';

export interface WeekSummary {
  steps: number;
  distanceM: number;
  calories: number;
  perDay: { label: string; steps: number }[]; // últimos 7 dias (seg→dom)
}

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // dom..sáb

export const useHistoryStore = defineStore('history', () => {
  const walks = ref<Walk[]>([]);
  const loaded = ref(false);

  async function load() {
    walks.value = await getAllWalks();
    loaded.value = true;
  }

  async function add(walk: Walk) {
    await saveWalk(walk);
    walks.value = [walk, ...walks.value];
  }

  async function remove(id: string) {
    await softDeleteWalk(id);
    walks.value = walks.value.filter((w) => w.id !== id);
  }

  async function rename(id: string, title: string) {
    const walk = await getWalk(id);
    if (!walk) return;
    walk.title = title;
    walk.updatedAt = Date.now();
    await saveWalk(walk);
    const idx = walks.value.findIndex((w) => w.id === id);
    if (idx >= 0) walks.value[idx] = walk;
  }

  function byId(id: string): Walk | undefined {
    return walks.value.find((w) => w.id === id);
  }

  /** Resumo dos últimos 7 dias. */
  const weekSummary = computed<WeekSummary>(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();

    const perDay = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { label: DAY_LABELS[d.getDay()] ?? '', steps: 0 };
    });

    let steps = 0;
    let distanceM = 0;
    let calories = 0;
    for (const w of walks.value) {
      if (w.startedAt < startMs) continue;
      steps += w.steps;
      distanceM += w.distanceM;
      calories += w.calories;
      const dayIdx = Math.floor((w.startedAt - startMs) / 86400000);
      if (perDay[dayIdx]) perDay[dayIdx].steps += w.steps;
    }
    return { steps, distanceM, calories, perDay };
  });

  /** Progresso de hoje (passos/distância) para o anel de meta. */
  const today = computed(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startMs = start.getTime();
    let steps = 0;
    let distanceM = 0;
    let calories = 0;
    let durationSec = 0;
    for (const w of walks.value) {
      if (w.startedAt < startMs) continue;
      steps += w.steps;
      distanceM += w.distanceM;
      calories += w.calories;
      durationSec += w.durationSec;
    }
    return { steps, distanceM, calories, durationSec };
  });

  return {
    walks,
    loaded,
    load,
    add,
    remove,
    rename,
    byId,
    weekSummary,
    today,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHistoryStore, import.meta.hot));
}
