# SteppWalk — guia do projeto

PWA + app Android nativo de **caminhadas/trekking**: rastreia a rota por GPS, estima
passos (acelerômetro) e calcula distância, calorias, tempo e ritmo. Offline-first,
dados ficam no dispositivo (IndexedDB/localStorage). Nome de exibição: **SteppWalk**
(dois "p"); repo/pacote internos usam `stepwalk`.

## Stack
- **Quasar Framework** (Vue 3 `<script setup>` + TypeScript), **Pinia**, **Leaflet + OpenStreetMap**, **localforage** (IndexedDB).
- Modos: **PWA** (deploy Vercel) e **Capacitor/Android** (APK).
- Engine: **`@quasar/app-vite` v2 (vite-2)** — ver gotcha do SAC abaixo.

## Estrutura
- `src/services/` — `geo` (Haversine + watch web/nativo), `pedometer` (DeviceMotion), `calories` (MET), `storage`.
- `src/stores/` — `session` (caminhada ativa), `history`, `profile` (Pinia setup-style).
- `src/pages/` — Track, History, WalkDetail, Profile, Settings. `src/components/` — RouteMap, GoalRing, MetricCard, LiveStats, RoutePreview, FieldRow.
- `src/types/index.ts` — `Walk` tem ganchos de sync (`updatedAt`, `deletedAt`, `userId='local'`) para login/nuvem futuros (Supabase Auth planejado, ainda não feito).
- `src-capacitor/` — projeto Capacitor; `android/` é commitado (build/cache no `.gitignore`).
- `design/` — protótipos, paleta, geradores de ícones (na pasta-pai, fora do repo… na verdade dentro de `stepwalk/design/`).

## Comandos
```bash
quasar dev -m pwa            # dev (sensores precisam de HTTPS no celular)
quasar build -m pwa          # build web (Vercel: ver vercel.json)
# APK Android é buildado no CI (não há Android SDK local) — ver .github/workflows/android.yml
```

## ⚠️ Gotchas críticas (não reverter sem entender)
- **Windows Smart App Control (SAC) ON e irreversível**: bloqueia o binário nativo do **rolldown**, então a engine **vite-3 NÃO funciona**. Use **vite-2**. Para rasterizar imagens (ícones), use Playwright (browser), não libs nativas (sharp) localmente — rode no CI (Linux).
- **CI usa Node 22 + `npm install` (NÃO `npm ci`)**: o lock diverge entre Windows↔Linux por optional-deps (`@emnapi/*`, sharp, etc.).
- **`.gitattributes` força `gradlew` em LF**: senão o build quebra no Linux do CI.

## Android nativo (Capacitor)
- GPS em segundo plano via **`@capacitor-community/background-geolocation`** (foreground service; roda com tela apagada/app em background). O plugin **não tem JS** — registrado via `registerPlugin('BackgroundGeolocation')` em `geo.ts`; tipos vêm de `definitions.d.ts`.
- `geo.ts` ramifica por `Capacitor.isNativePlatform()`: nativo=`addWatcher`, web=`watchPosition`.
- Permissões/serviço são mesclados pelo manifesto do **próprio plugin** — não duplicar.
- Permissão correta no celular: **"Durante o uso do app"** + permitir **notificações** (a notificação fixa do serviço é o que mantém o GPS vivo).

## Build do APK (nuvem, sem SDK local)
- `.github/workflows/android.yml`: GitHub Actions builda **APK de debug assinado** (JDK 21, setup-android, `quasar build -m capacitor -T android --skip-pkg` → `cap sync` → `@capacitor/assets generate --android` → `gradlew assembleDebug`). Artifact: `stepwalk-debug-apk`.
- Ícones/splash Android gerados de `src-capacitor/assets/` (teal+coral) no CI.
- ⚠️ Cada build usa keystore de debug diferente → **não atualiza por cima**; precisa **desinstalar** a versão anterior antes de instalar. (TODO: commitar keystore de debug fixa para updates sem desinstalar.)

## Versionamento (padrão ProPelada)
- Inteiro simples em `package.json` `version`, injetado via `build.rawDefine.__APP_VERSION__`, exibido como **"vN"** (canto sup. esquerdo, `MainLayout.vue`). Bump manual antes de cada deploy; citar `+ vN` no commit. Serve para confirmar no celular se o PWA/app atualizou.

## Design — "Trail Instrument"
- Paleta teal `#0D968B` + coral (secundária) + gold; fontes **Saira Condensed** (números) + **Hanken Grotesk** (corpo). Dark-first, alto contraste para sol. Coral = "ao vivo/ativo".

## Limitação honesta
- **Tracking em background só existe no app nativo (Capacitor)**, não no PWA — navegadores suspendem GPS/timer fora de foco. O usuário é Android-only e não quer lojas (sideload do APK).
