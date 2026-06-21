<template>
  <div class="goal-ring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <circle
        :cx="c"
        :cy="c"
        :r="r"
        fill="none"
        :stroke-width="stroke"
        class="track"
      />
      <circle
        :cx="c"
        :cy="c"
        :r="r"
        fill="none"
        :stroke-width="stroke"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        :transform="`rotate(-90 ${c} ${c})`"
        :stroke="`url(#goal-grad-${uid})`"
        class="progress"
      />
      <defs>
        <linearGradient :id="`goal-grad-${uid}`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-tertiary)" />
          <stop offset="1" stop-color="var(--color-secondary)" />
        </linearGradient>
      </defs>
    </svg>
    <div class="center">
      <slot>
        <div class="font-instrument big">{{ Math.round(percent * 100) }}%</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: number; // 0..1
    size?: number;
    stroke?: number;
  }>(),
  { size: 210, stroke: 14 },
);

const uid = Math.random().toString(36).slice(2, 8);
const percent = computed(() => Math.min(Math.max(props.value, 0), 1));
const c = computed(() => props.size / 2);
const r = computed(() => props.size / 2 - props.stroke);
const circumference = computed(() => 2 * Math.PI * r.value);
const dashOffset = computed(() => circumference.value * (1 - percent.value));
</script>

<style scoped lang="scss">
.goal-ring {
  position: relative;
  display: grid;
  place-items: center;
}
.track {
  stroke: var(--sw-surface-hi);
}
.progress {
  transition: stroke-dashoffset 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.center {
  position: absolute;
  text-align: center;
}
.big {
  font-weight: 800;
  font-size: 52px;
  line-height: 0.9;
  color: var(--sw-text);
}
</style>
