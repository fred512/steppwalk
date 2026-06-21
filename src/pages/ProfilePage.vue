<template>
  <div class="profile-page">
    <header class="head">
      <div>
        <h1 class="font-instrument title">Perfil</h1>
        <div class="sub">Usado nos cálculos de calorias</div>
      </div>
      <q-btn flat round icon="settings" color="grey-5" @click="goSettings" />
    </header>

    <!-- meta -->
    <div class="goalcard">
      <GoalRing :value="stepProgress" :size="74" :stroke="8">
        <span class="font-instrument pct">{{ Math.round(stepProgress * 100) }}%</span>
      </GoalRing>
      <div class="txt">
        <div class="metric-label">Meta diária</div>
        <div class="font-instrument v">
          {{ fmtInt(goals.dailySteps) }} <small>passos</small>
        </div>
        <div class="hint">{{ fmtInt(today.steps) }} hoje · faltam {{ remaining }}</div>
      </div>
    </div>

    <!-- campos -->
    <FieldRow label="Peso" :value="profile.weightKg" unit="kg" @edit="editNum('weightKg', 'Peso (kg)', 30, 250)" />
    <FieldRow label="Altura" :value="profile.heightCm" unit="cm" @edit="editNum('heightCm', 'Altura (cm)', 100, 230)" />
    <FieldRow label="Idade" :value="profile.age" unit="anos" @edit="editNum('age', 'Idade', 5, 120)" />

    <div class="seg">
      <span :class="{ on: profile.sex === 'male' }" @click="setSex('male')">Masculino</span>
      <span :class="{ on: profile.sex === 'female' }" @click="setSex('female')">Feminino</span>
      <span :class="{ on: profile.sex === 'other' }" @click="setSex('other')">Outro</span>
    </div>

    <FieldRow
      label="Meta de passos"
      :value="goals.dailySteps"
      @edit="editGoal('dailySteps', 'Meta de passos', 1000, 30000)"
    />
    <FieldRow
      label="Meta de distância"
      :value="fmtDistanceKm(goals.dailyDistanceM)"
      unit="km"
      @edit="editDistanceGoal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import GoalRing from 'components/GoalRing.vue';
import FieldRow from 'components/FieldRow.vue';
import { useProfileStore } from 'src/stores/profile';
import { useHistoryStore } from 'src/stores/history';
import { fmtInt, fmtDistanceKm } from 'src/utils/format';
import type { Profile } from 'src/types';

const router = useRouter();
const $q = useQuasar();
const profileStore = useProfileStore();
const historyStore = useHistoryStore();

const profile = computed(() => profileStore.profile);
const goals = computed(() => profileStore.goals);
const today = computed(() => historyStore.today);

const stepProgress = computed(() =>
  goals.value.dailySteps > 0 ? today.value.steps / goals.value.dailySteps : 0,
);
const remaining = computed(() =>
  fmtInt(Math.max(0, goals.value.dailySteps - today.value.steps)),
);

function setSex(sex: Profile['sex']) {
  profileStore.updateProfile({ sex });
}
function goSettings() {
  void router.push({ name: 'settings' });
}

function editNum(
  key: 'weightKg' | 'heightCm' | 'age',
  label: string,
  min: number,
  max: number,
) {
  promptNumber(label, profile.value[key], min, max, (v) =>
    profileStore.updateProfile({ [key]: v }),
  );
}
function editGoal(key: 'dailySteps', label: string, min: number, max: number) {
  promptNumber(label, goals.value[key], min, max, (v) =>
    profileStore.updateGoals({ [key]: v }),
  );
}
function editDistanceGoal() {
  promptNumber(
    'Meta de distância (km)',
    +(goals.value.dailyDistanceM / 1000).toFixed(1),
    0.5,
    50,
    (v) => profileStore.updateGoals({ dailyDistanceM: Math.round(v * 1000) }),
  );
}

function promptNumber(
  title: string,
  model: number,
  min: number,
  max: number,
  apply: (v: number) => void,
) {
  $q.dialog({
    title,
    prompt: { model: String(model), type: 'number' },
    cancel: true,
    dark: true,
  }).onOk((val: string) => {
    const n = Number(val);
    if (!isNaN(n)) apply(Math.min(max, Math.max(min, n)));
  });
}
</script>

<style scoped lang="scss">
.profile-page {
  padding: calc(var(--safe-top) + 14px) 22px 8px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.title {
  font-weight: 800;
  font-size: 30px;
  line-height: 1;
}
.sub {
  color: var(--sw-text-2);
  font-size: 13.5px;
  margin-top: 4px;
}
.goalcard {
  background: linear-gradient(160deg, var(--sw-surface), var(--sw-bg));
  border: 1px solid var(--sw-hairline);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 18px;
}
.pct {
  font-weight: 800;
  font-size: 18px;
  color: var(--sw-text);
}
.txt .v {
  font-weight: 800;
  font-size: 30px;
  line-height: 1;
  margin-top: 4px;
}
.txt .v small {
  font-size: 14px;
  color: var(--sw-live);
}
.hint {
  color: var(--sw-text-2);
  font-size: 12.5px;
  margin-top: 4px;
}
.seg {
  display: flex;
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
  margin-bottom: 11px;
}
.seg span {
  flex: 1;
  text-align: center;
  padding: 9px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sw-text-2);
  cursor: pointer;
  transition: all 0.15s ease;
}
.seg span.on {
  background: var(--color-primary);
  color: #02110f;
}
</style>
