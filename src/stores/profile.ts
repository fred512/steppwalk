// StepWalk — store de perfil, metas e configurações
// ==================================================
import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { Profile, Goals, AppSettings } from 'src/types';
import {
  loadProfile,
  saveProfile,
  loadGoals,
  saveGoals,
  loadSettings,
  saveSettings,
} from 'src/services/storage';
import { estimateStride } from 'src/services/pedometer';

const DEFAULT_PROFILE: Profile = {
  weightKg: 70,
  heightCm: 170,
  sex: 'other',
  age: 30,
};
const DEFAULT_GOALS: Goals = { dailySteps: 8000, dailyDistanceM: 5000 };
const DEFAULT_SETTINGS: AppSettings = {
  units: 'metric',
  keepScreenOn: true,
  stepSensitivity: 1.2,
};

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<Profile>(loadProfile() ?? { ...DEFAULT_PROFILE });
  const goals = ref<Goals>(loadGoals() ?? { ...DEFAULT_GOALS });
  const settings = ref<AppSettings>(loadSettings() ?? { ...DEFAULT_SETTINGS });

  /** Comprimento da passada (informado ou estimado pela altura). */
  const strideM = computed(
    () => profile.value.strideM ?? estimateStride(profile.value.heightCm),
  );

  function updateProfile(patch: Partial<Profile>) {
    profile.value = { ...profile.value, ...patch };
    saveProfile(profile.value);
  }
  function updateGoals(patch: Partial<Goals>) {
    goals.value = { ...goals.value, ...patch };
    saveGoals(goals.value);
  }
  function updateSettings(patch: Partial<AppSettings>) {
    settings.value = { ...settings.value, ...patch };
    saveSettings(settings.value);
  }

  return {
    profile,
    goals,
    settings,
    strideM,
    updateProfile,
    updateGoals,
    updateSettings,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot));
}
