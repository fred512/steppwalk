<template>
  <div class="app-shell">
    <!-- atmosfera compartilhada -->
    <div class="sw-glow glow-a"></div>
    <div class="sw-glow glow-b"></div>
    <svg class="topo" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" fill="none">
      <g stroke="var(--sw-hairline)" stroke-width="1.2">
        <path d="M-40 120 C 80 60, 180 200, 300 130 S 480 80, 520 180" />
        <path d="M-40 230 C 90 180, 200 310, 320 240 S 470 190, 520 280" />
        <path d="M-40 360 C 100 310, 210 430, 330 360 S 470 310, 520 400" />
        <path d="M-40 500 C 110 450, 220 560, 340 490 S 470 450, 520 530" />
        <path d="M-40 640 C 90 600, 210 700, 330 640 S 470 600, 520 680" />
      </g>
    </svg>

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>

    <nav class="tabbar" v-if="showTabs">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="tab"
        :class="{ on: isActive(tab.name) }"
        @click="go(tab.name)"
      >
        <q-icon :name="tab.icon" size="24px" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tabs = [
  { name: 'track', label: 'Trilha', icon: 'my_location' },
  { name: 'history', label: 'Histórico', icon: 'show_chart' },
  { name: 'profile', label: 'Perfil', icon: 'person' },
];

// esconde as tabs nas telas de detalhe/configurações (foco total)
const showTabs = computed(
  () => !['walk-detail', 'settings'].includes(String(route.name)),
);

function isActive(name: string): boolean {
  if (name === 'history')
    return ['history', 'walk-detail'].includes(String(route.name));
  if (name === 'profile')
    return ['profile', 'settings'].includes(String(route.name));
  return route.name === name;
}
function go(name: string) {
  void router.push({ name });
}
</script>

<style scoped lang="scss">
.app-shell {
  position: relative;
  height: 100dvh;
  background: var(--sw-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.topo {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.5;
  pointer-events: none;
}
.glow-a {
  width: 360px;
  height: 360px;
  background: var(--color-secondary);
  top: -150px;
  right: -120px;
  opacity: 0.18;
}
.glow-b {
  width: 360px;
  height: 360px;
  background: var(--color-primary);
  bottom: 40px;
  left: -150px;
  opacity: 0.16;
}
.app-main {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0; /* permite o scroll interno num filho flex */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;
}
.tabbar {
  flex: 0 0 auto; /* rodapé fixo: nunca encolhe */
  z-index: 5;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 10px 8px calc(var(--safe-bot) + 12px);
  background: color-mix(in srgb, var(--sw-bg) 88%, transparent);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--sw-hairline);
}
.tab {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: 'Hanken Grotesk', sans-serif;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--sw-text-2);
  transition: color 0.2s ease;
  &.on {
    color: var(--color-primary);
  }
}
</style>
