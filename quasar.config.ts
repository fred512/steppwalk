// Configuration for your app
// https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file

import { defineConfig } from '#q-app/wrappers';
import { readFileSync } from 'node:fs';

const { version: appVersion } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

export default defineConfig((/* ctx */) => {
  return {
    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/boot-files
    boot: [],

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v7',
      // 'fontawesome-v7',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file#build
    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22',
      },

      typescript: {
        strict: true,
        vueShim: true,
        // extendTsConfig (tsConfig) {}
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,

      // publicPath: '/',
      // analyze: true,
      // env: {},
      rawDefine: {
        __APP_VERSION__: JSON.stringify(appVersion),
      },
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      // extendViteConf (viteConf) {},
      // viteVuePluginOptions: {},

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            vueTsc: true,
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file#devserver
    devServer: {
      // https: true, // habilite p/ testar GPS/acelerômetro no celular
      open: false,
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file#framework
    framework: {
      config: {
        dark: true, // app dark-first (alto contraste para uso sob sol)
      },

      // iconSet: 'material-icons', // Quasar icon set
      lang: 'pt-BR',

      // Quasar plugins
      plugins: ['Dialog', 'Notify'],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-service-worker',
    //   pwaServiceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-ssr/configuring-ssr
    ssr: {
      prodPort: 3000, // The default port that the production server should use
      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        'render', // keep this as last one
      ],

      // extendPackageJson (json) {},
      // extendSSRWebserverConf (esbuildConf) {},

      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      pwa: false,
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!

      // pwaExtendGenerateSWOptions (cfg) {},
      // pwaExtendInjectManifestOptions (cfg) {}
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'GenerateSW', // 'GenerateSW' or 'InjectManifest'
      extendManifestJson(json) {
        json.name = 'StepWalk';
        json.short_name = 'StepWalk';
        json.description = 'Caminhadas & trekking — rota por GPS, passos e calorias.';
        json.display = 'standalone';
        json.orientation = 'portrait';
        json.background_color = '#0B1110';
        json.theme_color = '#0D968B';
      },
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf) {},
      // extendElectronPreloadConf (esbuildConf) {},

      // extendPackageJson (json) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration

        appId: 'stepwalk',
      },
    },

    // https://legacy-app.quasar.dev/quasar-cli-vite-v2/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (esbuildConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: [],
    },
  };
});
