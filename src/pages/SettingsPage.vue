<template>
  <div class="settings-page">
    <header class="head">
      <q-btn flat round icon="arrow_back_ios" size="13px" color="grey-5" @click="back" />
      <h1 class="font-instrument title">Configurações</h1>
    </header>

    <div class="group">
      <div class="metric-label group-label">Unidades</div>
      <div class="seg">
        <span :class="{ on: settings.units === 'metric' }" @click="setUnits('metric')">
          Métrico (km)
        </span>
        <span :class="{ on: settings.units === 'imperial' }" @click="setUnits('imperial')">
          Imperial (mi)
        </span>
      </div>
    </div>

    <div class="group">
      <div class="metric-label group-label">Contador de passos</div>
      <div class="slider-card">
        <div class="slider-top">
          <span>Sensibilidade</span>
          <span class="font-instrument val">{{ settings.stepSensitivity.toFixed(1) }}</span>
        </div>
        <q-slider
          :model-value="settings.stepSensitivity"
          @update:model-value="setSensitivity"
          :min="0.5"
          :max="3"
          :step="0.1"
          color="primary"
          label
        />
        <div class="slider-hint">Menor = conta mais passos · Maior = mais rigoroso</div>
      </div>
    </div>

    <div class="group">
      <div class="metric-label group-label">Durante a caminhada</div>
      <div class="toggle-row">
        <div>
          <div class="t-label">Manter tela ligada</div>
          <div class="t-hint">Usa Wake Lock para não apagar a tela</div>
        </div>
        <q-toggle
          :model-value="settings.keepScreenOn"
          @update:model-value="setKeepScreen"
          color="primary"
        />
      </div>
      <div class="toggle-row">
        <div>
          <div class="t-label">Tema escuro</div>
          <div class="t-hint">Ideal para leitura sob sol forte</div>
        </div>
        <q-toggle :model-value="isDark" @update:model-value="setDark" color="primary" />
      </div>
    </div>

    <div class="group">
      <div class="metric-label group-label">Dados</div>
      <button class="danger" @click="confirmWipe">
        <q-icon name="delete_forever" size="20px" />
        Limpar todos os dados
      </button>
    </div>

    <div class="about">
      <p>
        <b>StepWalk</b> — caminhadas &amp; trekking. Todos os dados ficam no seu
        aparelho.
      </p>
      <p class="estimate">
        ⚠️ A contagem de passos via navegador é uma <b>estimativa</b> (acelerômetro);
        a distância por GPS é confiável em ambiente aberto.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useProfileStore } from 'src/stores/profile';
import { useHistoryStore } from 'src/stores/history';
import { wipeAll } from 'src/services/storage';
import type { AppSettings } from 'src/types';

const router = useRouter();
const $q = useQuasar();
const profileStore = useProfileStore();
const historyStore = useHistoryStore();

const settings = profileStore.settings;
const isDark = ref($q.dark.isActive);

function back() {
  void router.back();
}
function setUnits(units: AppSettings['units']) {
  profileStore.updateSettings({ units });
}
function setSensitivity(v: number | null) {
  if (v != null) profileStore.updateSettings({ stepSensitivity: v });
}
function setKeepScreen(v: boolean) {
  profileStore.updateSettings({ keepScreenOn: v });
}
function setDark(v: boolean) {
  isDark.value = v;
  $q.dark.set(v);
}

function confirmWipe() {
  $q.dialog({
    title: 'Limpar todos os dados',
    message:
      'Isso apaga histórico, perfil e configurações deste aparelho. Não dá para desfazer.',
    cancel: true,
    ok: { label: 'Apagar tudo', color: 'negative' },
    dark: true,
  }).onOk(() => {
    void wipeAll().then(() => {
      historyStore.walks = [];
      $q.notify({ message: 'Dados apagados.', color: 'dark' });
    });
  });
}
</script>

<style scoped lang="scss">
.settings-page {
  padding: calc(var(--safe-top) + 10px) 22px calc(var(--safe-bot) + 30px);
}
.head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}
.title {
  font-weight: 800;
  font-size: 26px;
}
.group {
  margin-bottom: 22px;
}
.group-label {
  font-size: 12px;
  margin-bottom: 10px;
}
.seg {
  display: flex;
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
}
.seg span {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sw-text-2);
  cursor: pointer;
}
.seg span.on {
  background: var(--color-primary);
  color: #02110f;
}
.slider-card,
.toggle-row {
  background: var(--sw-surface);
  border: 1px solid var(--sw-hairline);
  border-radius: 14px;
  padding: 14px 16px;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.slider-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--sw-text-2);
  margin-bottom: 4px;
}
.slider-top .val {
  font-size: 20px;
  font-weight: 700;
  color: var(--sw-text);
}
.slider-hint,
.t-hint {
  font-size: 11.5px;
  color: var(--sw-text-2);
  margin-top: 4px;
}
.t-label {
  font-size: 14px;
  color: var(--sw-text);
  font-weight: 500;
}
.danger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: color-mix(in srgb, var(--color-error) 14%, transparent);
  color: var(--color-error);
  border: 1px solid color-mix(in srgb, var(--color-error) 40%, transparent);
  border-radius: 14px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.about {
  margin-top: 14px;
  font-size: 12.5px;
  color: var(--sw-text-2);
  line-height: 1.5;
}
.about b {
  color: var(--sw-text);
}
.about .estimate {
  margin-top: 8px;
}
</style>
