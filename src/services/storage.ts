// StepWalk — persistência local
// ===============================
// Histórico/trajetos em IndexedDB (localforage); perfil/config em localStorage.
import localforage from 'localforage';
import type { Walk, Profile, Goals, AppSettings } from 'src/types';

const walksStore = localforage.createInstance({
  name: 'stepwalk',
  storeName: 'walks',
  description: 'Histórico de caminhadas (IndexedDB)',
});

// --- Caminhadas (IndexedDB) ---

export async function saveWalk(walk: Walk): Promise<void> {
  await walksStore.setItem(walk.id, walk);
}

export async function getAllWalks(): Promise<Walk[]> {
  const walks: Walk[] = [];
  await walksStore.iterate<Walk, void>((value) => {
    if (!value.deletedAt) walks.push(value); // ignora soft-deletados
  });
  return walks.sort((a, b) => b.startedAt - a.startedAt);
}

export async function getWalk(id: string): Promise<Walk | null> {
  return (await walksStore.getItem<Walk>(id)) ?? null;
}

/** Soft-delete: marca deletedAt e atualiza updatedAt (preserva sync futuro). */
export async function softDeleteWalk(id: string): Promise<void> {
  const walk = await walksStore.getItem<Walk>(id);
  if (!walk) return;
  walk.deletedAt = Date.now();
  walk.updatedAt = walk.deletedAt;
  await walksStore.setItem(id, walk);
}

export async function clearAllWalks(): Promise<void> {
  await walksStore.clear();
}

// --- Perfil / Metas / Configurações (localStorage) ---

const PROFILE_KEY = 'stepwalk.profile';
const GOALS_KEY = 'stepwalk.goals';
const SETTINGS_KEY = 'stepwalk.settings';

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const loadProfile = () => readJSON<Profile>(PROFILE_KEY);
export const saveProfile = (p: Profile) => writeJSON(PROFILE_KEY, p);

export const loadGoals = () => readJSON<Goals>(GOALS_KEY);
export const saveGoals = (g: Goals) => writeJSON(GOALS_KEY, g);

export const loadSettings = () => readJSON<AppSettings>(SETTINGS_KEY);
export const saveSettings = (s: AppSettings) => writeJSON(SETTINGS_KEY, s);

/** Apaga absolutamente tudo (botão "limpar dados"). */
export async function wipeAll(): Promise<void> {
  await walksStore.clear();
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(GOALS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
