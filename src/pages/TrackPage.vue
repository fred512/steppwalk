<template>
  <div class="track-page">
    <!-- ================= ESTADO OCIOSO ================= -->
    <section v-if="session.status === 'idle'" class="idle">
      <header class="head">
        <div>
          <h1 class="font-instrument title">{{ greeting }}, {{ firstName }}</h1>
          <div class="sub">Pronto para a trilha de hoje?</div>
        </div>
        <q-btn flat round icon="settings" color="grey-5" @click="goSettings" />
      </header>

      <div class="ring-area">
        <GoalRing :value="stepProgress" :size="168" :stroke="12">
          <div class="ring-center">
            <div class="font-instrument big">{{ fmtInt(today.steps) }}</div>
            <div class="metric-label small">passos hoje</div>
            <div class="goal-pct">
              {{ Math.round(stepProgress * 100) }}% · meta {{ fmtInt(goals.dailySteps) }}
            </div>
          </div>
        </GoalRing>
      </div>

      <button class="start-btn" @click="onStart">
        Iniciar<small>caminhada</small>
      </button>

      <div class="perm-note">
        <q-icon name="shield" size="16px" />
        <span
          >Ao iniciar, pediremos <b>localização</b> e <b>movimento</b>. Tudo fica só no
          seu aparelho.</span
        >
      </div>

      <div class="today-grid">
        <MetricCard label="Distância" :value="fmtDistanceKm(today.distanceM)" unit="km" />
        <MetricCard label="Calorias" :value="Math.round(today.calories)" unit="kcal" />
        <MetricCard label="Tempo" :value="Math.round(today.durationSec / 60)" unit="min" />
      </div>

      <q-banner v-if="errorMsg" class="error-banner" dense rounded>
        {{ errorMsg }}
      </q-banner>
    </section>

    <!-- ================= ESTADO ATIVO ================= -->
    <section v-else class="active">
      <div class="active-top">
        <div class="rec">
          <span class="dot" :class="{ paused: session.status === 'paused' }"></span>
          {{ session.status === 'paused' ? 'Pausado' : 'Gravando' }}
        </div>
        <div class="gps" :class="gpsClass">
          <q-icon :name="gpsIcon" size="16px" />
          {{ gpsLabel }}
        </div>
      </div>

      <q-banner v-if="session.gpsError" class="gps-error-banner" dense rounded>
        <template #avatar><q-icon name="gps_off" color="white" /></template>
        {{ session.gpsError }}
      </q-banner>

      <div class="map-wrap">
        <RouteMap :route="session.route" follow />
        <div v-if="session.route.length === 0" class="map-hint">
          {{ session.gpsError ? 'GPS indisponível' : 'Buscando sinal de GPS…' }}
        </div>
      </div>

      <div class="hero">
        <div class="metric-label">Distância</div>
        <div class="font-instrument hero-val">
          {{ fmtDistanceKm(session.distanceM) }}<span class="u">km</span>
        </div>
      </div>

      <LiveStats class="live" />

      <div class="estimate-note">
        <q-icon name="info" size="14px" />
        Passos e calorias são estimativas (acelerômetro · MET).
      </div>

      <div class="controls">
        <button
          class="ctrl icon"
          @click="session.status === 'paused' ? session.resume() : session.pause()"
        >
          <q-icon
            :name="session.status === 'paused' ? 'play_arrow' : 'pause'"
            size="26px"
          />
        </button>
        <button class="ctrl finish" @click="onFinish">Finalizar</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import GoalRing from 'components/GoalRing.vue';
import MetricCard from 'components/MetricCard.vue';
import LiveStats from 'components/LiveStats.vue';
import RouteMap from 'components/RouteMap.vue';
import { useSessionStore } from 'src/stores/session';
import { useHistoryStore } from 'src/stores/history';
import { useProfileStore } from 'src/stores/profile';
import { fmtInt, fmtDistanceKm } from 'src/utils/format';

const router = useRouter();
const $q = useQuasar();
const session = useSessionStore();
const history = useHistoryStore();
const profile = useProfileStore();

const errorMsg = ref('');

const today = computed(() => history.today);
const goals = computed(() => profile.goals);
const stepProgress = computed(() =>
  goals.value.dailySteps > 0 ? today.value.steps / goals.value.dailySteps : 0,
);

const firstName = computed(() => 'Fred');
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
});

// --- GPS status ---
const gpsClass = computed(() => {
  const acc = session.gpsAccuracy;
  if (acc == null) return 'gps-search';
  if (acc <= 12) return 'gps-strong';
  if (acc <= 25) return 'gps-ok';
  return 'gps-weak';
});
const gpsIcon = computed(() =>
  gpsClass.value === 'gps-weak' ? 'gps_off' : 'gps_fixed',
);
const gpsLabel = computed(() => {
  switch (gpsClass.value) {
    case 'gps-strong':
      return 'GPS forte';
    case 'gps-ok':
      return 'GPS ok';
    case 'gps-weak':
      return 'GPS fraco';
    default:
      return 'Buscando…';
  }
});

async function onStart() {
  errorMsg.value = '';
  try {
    await session.start();
  } catch {
    errorMsg.value =
      'Não foi possível acessar localização/movimento. Verifique as permissões e tente de novo.';
  }
}

async function onFinish() {
  const result = await session.finish();
  if (result.ok) {
    void router.push({ name: 'walk-detail', params: { id: result.id } });
    return;
  }
  // nunca termina em silêncio: explica por que não salvou
  if (result.reason === 'empty-no-gps') {
    $q.dialog({
      title: 'Caminhada não registrada',
      message:
        'Não captamos sinal de GPS. Verifique se a permissão de localização está liberada e tente em um local aberto. Dica: mantenha o app aberto com a tela ligada durante a caminhada.',
      dark: true,
      ok: { label: 'Entendi', color: 'primary' },
    });
  } else if (result.reason === 'empty-too-short') {
    $q.notify({
      message: 'Caminhada muito curta para registrar.',
      color: 'dark',
      icon: 'directions_walk',
    });
  }
}

function goSettings() {
  void router.push({ name: 'settings' });
}

onMounted(() => {
  if (!history.loaded) void history.load();
});
</script>

<style scoped lang="scss">
.track-page {
  padding: calc(var(--safe-top) + 14px) 22px 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

/* ---- ocioso ---- */
.idle {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
.ring-area {
  display: grid;
  place-items: center;
  margin: 10px 0 2px;
}
.ring-center .big {
  font-weight: 800;
  font-size: 38px;
  line-height: 0.9;
}
.ring-center .small {
  font-size: 11px;
}
.goal-pct {
  color: var(--sw-live);
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}
.start-btn {
  margin: auto auto 12px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: radial-gradient(circle at 50% 35%, #ff9a4d, #f3751b);
  color: #160a00;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 26px;
  box-shadow:
    0 16px 40px -12px rgba(243, 117, 27, 0.6),
    0 0 0 8px rgba(250, 143, 66, 0.1),
    0 0 0 16px rgba(250, 143, 66, 0.05);
  transition: transform 0.12s ease;
  &:active {
    transform: scale(0.96);
  }
  small {
    display: block;
    font-size: 12px;
    letter-spacing: 0.18em;
    opacity: 0.7;
    margin-top: 2px;
  }
}
.perm-note {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 12px;
  color: var(--sw-text-2);
  line-height: 1.4;
  margin-bottom: 12px;
  b {
    color: var(--sw-text);
    font-weight: 600;
  }
}
.today-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--sw-hairline);
  border: 1px solid var(--sw-hairline);
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 12px;
}
.error-banner {
  background: var(--color-error);
  color: #fff;
  margin-bottom: 14px;
}

/* ---- ativo ---- */
.active {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.active-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.rec {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 15px;
  color: var(--sw-live);
}
.rec .dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--sw-live);
  animation: pulse 1.8s ease-out infinite;
}
.rec .dot.paused {
  animation: none;
  opacity: 0.5;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(250, 143, 66, 0.55);
  }
  70% {
    box-shadow: 0 0 0 12px rgba(250, 143, 66, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(250, 143, 66, 0);
  }
}
.gps {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sw-text-2);
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  padding: 6px 11px;
  border-radius: 999px;
}
.gps-strong {
  color: var(--color-primary);
}
.gps-weak {
  color: var(--color-warning);
}
.gps-error-banner {
  background: var(--color-warning);
  color: #fff;
  font-size: 13px;
  margin-bottom: 12px;
}
.map-wrap {
  position: relative;
  border-radius: 26px;
  overflow: hidden;
  height: 230px;
  margin: 6px 0 18px;
  border: 1px solid var(--sw-hairline);
}
.map-hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--sw-text-2);
  font-size: 13px;
  background: rgba(11, 17, 16, 0.4);
  z-index: 1;
}
.hero {
  margin-bottom: 4px;
}
.hero-val {
  font-weight: 800;
  font-size: 90px;
  line-height: 0.92;
  letter-spacing: -0.02em;
  color: var(--sw-text);
}
.hero-val .u {
  font-size: 30px;
  color: var(--sw-live);
  margin-left: 8px;
}
.live {
  margin-top: 14px;
}
.estimate-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 2px 0;
  font-size: 11.5px;
  color: var(--sw-text-2);
}
.controls {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0 16px;
}
.ctrl {
  border: none;
  cursor: pointer;
  font-family: 'Saira Condensed', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: transform 0.12s ease;
  &:active {
    transform: scale(0.96);
  }
}
.ctrl.icon {
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: var(--sw-surface-hi);
  color: var(--sw-text);
  display: grid;
  place-items: center;
}
.ctrl.finish {
  flex: 1;
  height: 62px;
  border-radius: 20px;
  font-size: 19px;
  background: linear-gradient(180deg, #ff9a4d, #f3751b);
  color: #1a0d00;
  box-shadow: 0 12px 28px -8px rgba(243, 117, 27, 0.6);
}
</style>
