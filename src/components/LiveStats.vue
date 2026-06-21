<template>
  <div class="live-stats">
    <MetricCard label="Tempo" :value="fmtDuration(session.durationSec)" />
    <MetricCard
      label="Ritmo"
      :value="fmtPace(session.avgPaceMinKm)"
      unit="/km"
      accent
    />
    <MetricCard label="Passos" :value="fmtInt(session.steps)" />
    <MetricCard label="Calorias" :value="Math.round(session.calories)" unit="kcal" />
    <MetricCard label="Veloc." :value="fmtSpeed(session.avgSpeedKmh)" unit="km/h" />
    <MetricCard label="Subida" :value="elevation" unit="m" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MetricCard from './MetricCard.vue';
import { useSessionStore } from 'src/stores/session';
import { elevationGain } from 'src/services/geo';
import { fmtDuration, fmtPace, fmtInt, fmtSpeed } from 'src/utils/format';

const session = useSessionStore();
const elevation = computed(() => Math.round(elevationGain(session.route)));
</script>

<style scoped lang="scss">
.live-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--sw-hairline);
  border: 1px solid var(--sw-hairline);
  border-radius: 20px;
  overflow: hidden;
}
</style>
