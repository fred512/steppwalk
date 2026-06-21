<template>
  <svg class="route-preview" viewBox="0 0 54 54" preserveAspectRatio="xMidYMid meet">
    <polyline
      v-if="points"
      :points="points"
      fill="none"
      stroke="var(--color-secondary)"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle v-else cx="27" cy="27" r="3" fill="var(--sw-text-2)" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GeoPoint } from 'src/types';

const props = defineProps<{ route: GeoPoint[] }>();

// Normaliza o trajeto para um SVG 54×54 com margem.
const points = computed(() => {
  const r = props.route;
  if (r.length < 2) return '';
  const lats = r.map((p) => p.lat);
  const lngs = r.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLng = maxLng - minLng || 1e-6;
  const span = Math.max(spanLat, spanLng);
  const pad = 8;
  const size = 54 - pad * 2;

  return r
    .map((p) => {
      const x = pad + ((p.lng - minLng) / span) * size;
      const y = pad + (1 - (p.lat - minLat) / span) * size; // y invertido
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
});
</script>

<style scoped lang="scss">
.route-preview {
  width: 100%;
  height: 100%;
}
</style>
