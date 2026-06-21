<template>
  <div class="history-page">
    <header class="head">
      <h1 class="font-instrument title">Histórico</h1>
      <div class="sub">Sua semana em movimento</div>
    </header>

    <!-- resumo semanal -->
    <div class="week">
      <div class="row">
        <div>
          <div class="metric-label">Passos · 7 dias</div>
          <div class="font-instrument v">{{ fmtInt(week.steps) }}</div>
        </div>
        <div class="text-right">
          <div class="metric-label">Distância</div>
          <div class="font-instrument v small">
            {{ fmtDistanceKm(week.distanceM) }}<small>km</small>
          </div>
        </div>
      </div>
      <div class="bars">
        <div
          v-for="(d, i) in week.perDay"
          :key="i"
          class="bar"
          :class="{ on: i === 6 }"
          :style="{ height: barHeight(d.steps) }"
        >
          <span class="d">{{ d.label }}</span>
        </div>
      </div>
    </div>

    <!-- lista -->
    <div v-if="history.walks.length === 0" class="empty">
      <q-icon name="hiking" size="42px" color="grey-7" />
      <p>Nenhuma caminhada ainda.<br />Toque em <b>Iniciar</b> para registrar a primeira.</p>
    </div>

    <q-list v-else class="walks">
      <div
        v-for="w in history.walks"
        :key="w.id"
        class="walk"
        @click="open(w.id)"
      >
        <div class="mini">
          <RoutePreview :route="w.route" />
        </div>
        <div class="info">
          <div class="ttl">{{ w.title || 'Caminhada' }}</div>
          <div class="meta">{{ fmtWalkDate(w.startedAt) }} · {{ fmtInt(w.steps) }} passos</div>
        </div>
        <div class="font-instrument dist">
          {{ fmtDistanceKm(w.distanceM) }}<small>km</small>
        </div>
      </div>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHistoryStore } from 'src/stores/history';
import { fmtInt, fmtDistanceKm, fmtWalkDate } from 'src/utils/format';
import RoutePreview from 'components/RoutePreview.vue';

const router = useRouter();
const history = useHistoryStore();

const week = computed(() => history.weekSummary);
const maxSteps = computed(() =>
  Math.max(1, ...week.value.perDay.map((d) => d.steps)),
);
function barHeight(steps: number): string {
  return `${Math.max(8, (steps / maxSteps.value) * 100)}%`;
}
function open(id: string) {
  void router.push({ name: 'walk-detail', params: { id } });
}

onMounted(() => {
  if (!history.loaded) void history.load();
});
</script>

<style scoped lang="scss">
.history-page {
  padding: calc(var(--safe-top) + 14px) 22px 8px;
}
.head {
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
.week {
  background: linear-gradient(160deg, var(--sw-surface), var(--sw-bg));
  border: 1px solid var(--sw-hairline);
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 18px;
}
.week .row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}
.week .v {
  font-weight: 800;
  font-size: 40px;
  line-height: 0.9;
}
.week .v.small {
  font-size: 30px;
}
.week .v small {
  font-size: 16px;
  color: var(--sw-live);
}
.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 66px;
}
.bar {
  flex: 1;
  border-radius: 5px 5px 2px 2px;
  background: linear-gradient(180deg, var(--color-primary), #0c6b63);
  position: relative;
  transition: height 0.4s ease;
}
.bar.on {
  background: linear-gradient(180deg, #ff9a4d, var(--color-secondary));
}
.bar .d {
  position: absolute;
  bottom: -18px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: var(--sw-text-2);
  font-weight: 600;
}
.walks {
  background: none;
}
.walk {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--sw-hairline);
  cursor: pointer;
}
.mini {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: #0e1817;
  border: 1px solid var(--sw-hairline);
  flex: none;
  overflow: hidden;
}
.info {
  flex: 1;
}
.info .ttl {
  font-weight: 700;
  font-size: 15px;
}
.info .meta {
  color: var(--sw-text-2);
  font-size: 12px;
  margin-top: 2px;
}
.dist {
  font-weight: 700;
  font-size: 26px;
  line-height: 1;
}
.dist small {
  font-size: 13px;
  color: var(--sw-text-2);
}
.empty {
  text-align: center;
  color: var(--sw-text-2);
  padding: 40px 20px;
  font-size: 14px;
  line-height: 1.5;
}
</style>
