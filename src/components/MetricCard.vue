<template>
  <div class="metric-card" :class="{ accent }">
    <div class="metric-label k">{{ label }}</div>
    <div class="font-instrument v">
      {{ value }}<small v-if="unit">{{ unit }}</small>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  unit?: string;
  accent?: boolean;
}>();
</script>

<style scoped lang="scss">
.metric-card {
  background: var(--sw-bg);
  padding: 15px 14px 16px;
}
.k {
  font-size: 11.5px;
  margin-bottom: 5px;
}
.v {
  font-weight: 700;
  font-size: 33px;
  line-height: 1;
  color: var(--sw-text);
}
.v small {
  font-size: 15px;
  color: var(--sw-text-2);
  font-weight: 600;
  margin-left: 3px;
}
.accent .v {
  color: var(--sw-live);
}
</style>
