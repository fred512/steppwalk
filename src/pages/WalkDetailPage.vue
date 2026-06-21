<template>
  <div class="detail-page">
    <header class="head">
      <q-btn flat round icon="arrow_back_ios" size="13px" color="grey-5" @click="back" />
      <div class="titlewrap" @click="startRename">
        <h1 class="font-instrument title">{{ walk?.title || 'Caminhada' }}</h1>
        <div class="sub">{{ subtitle }}</div>
      </div>
      <q-btn flat round icon="more_vert" color="grey-5">
        <q-menu>
          <q-list style="min-width: 150px">
            <q-item clickable v-close-popup @click="startRename">
              <q-item-section avatar><q-icon name="edit" /></q-item-section>
              <q-item-section>Renomear</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="confirmDelete">
              <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
              <q-item-section>Excluir</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </header>

    <div v-if="walk" class="map-wrap">
      <RouteMap :route="walk.route" :interactive="true" />
    </div>

    <div v-if="walk" class="detgrid">
      <MetricCard label="Distância" :value="fmtDistanceKm(walk.distanceM)" unit="km" />
      <MetricCard label="Duração" :value="fmtDuration(walk.durationSec)" />
      <MetricCard label="Ritmo médio" :value="fmtPace(walk.avgPaceMinKm)" unit="/km" accent />
      <MetricCard label="Passos" :value="fmtInt(walk.steps)" />
      <MetricCard label="Calorias" :value="walk.calories" unit="kcal" />
      <MetricCard label="Subida" :value="walk.elevationGainM ?? 0" unit="m" />
    </div>

    <div v-else class="missing">Caminhada não encontrada.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import RouteMap from 'components/RouteMap.vue';
import MetricCard from 'components/MetricCard.vue';
import { useHistoryStore } from 'src/stores/history';
import {
  fmtDistanceKm,
  fmtDuration,
  fmtPace,
  fmtInt,
  fmtWalkDate,
} from 'src/utils/format';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const history = useHistoryStore();

const id = computed(() => String(route.params.id));
const walk = computed(() => history.byId(id.value));
const subtitle = computed(() =>
  walk.value ? fmtWalkDate(walk.value.startedAt) : '',
);

function back() {
  void router.push({ name: 'history' });
}

function startRename() {
  if (!walk.value) return;
  $q.dialog({
    title: 'Renomear caminhada',
    prompt: { model: walk.value.title || '', type: 'text' },
    cancel: true,
    dark: true,
  }).onOk((val: string) => {
    void history.rename(id.value, val.trim() || 'Caminhada');
  });
}

function confirmDelete() {
  $q.dialog({
    title: 'Excluir caminhada',
    message: 'Tem certeza? Esta ação não pode ser desfeita.',
    cancel: true,
    ok: { label: 'Excluir', color: 'negative' },
    dark: true,
  }).onOk(() => {
    void history.remove(id.value).then(back);
  });
}

onMounted(async () => {
  if (!history.loaded) await history.load();
});
</script>

<style scoped lang="scss">
.detail-page {
  padding: calc(var(--safe-top) + 10px) 22px calc(var(--safe-bot) + 22px);
}
.head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}
.titlewrap {
  flex: 1;
  cursor: pointer;
}
.title {
  font-weight: 800;
  font-size: 26px;
  line-height: 1;
}
.sub {
  color: var(--sw-text-2);
  font-size: 13px;
  margin-top: 3px;
}
.map-wrap {
  border-radius: 24px;
  overflow: hidden;
  height: 300px;
  margin-bottom: 18px;
  border: 1px solid var(--sw-hairline);
}
.detgrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--sw-hairline);
  border: 1px solid var(--sw-hairline);
  border-radius: 20px;
  overflow: hidden;
}
.missing {
  text-align: center;
  color: var(--sw-text-2);
  padding: 40px;
}
</style>
