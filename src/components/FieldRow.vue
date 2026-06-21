<template>
  <div class="field" @click="$emit('edit')">
    <span class="lab">{{ label }}</span>
    <span class="val font-instrument">
      {{ value }}<small v-if="unit"> {{ unit }}</small>
      <q-icon name="chevron_right" size="20px" class="chev" />
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  unit?: string;
}>();
defineEmits<{ edit: [] }>();
</script>

<style scoped lang="scss">
.field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  border-radius: 14px;
  padding: 15px 16px;
  margin-bottom: 11px;
  cursor: pointer;
}
.lab {
  font-size: 14px;
  color: var(--sw-text-2);
}
.val {
  font-weight: 700;
  font-size: 22px;
  color: var(--sw-text);
  display: flex;
  align-items: center;
}
.val small {
  font-size: 13px;
  color: var(--sw-text-2);
  margin-left: 3px;
}
.chev {
  color: var(--sw-text-2);
  margin-left: 4px;
}
</style>
