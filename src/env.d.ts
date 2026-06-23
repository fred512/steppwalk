declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

// Versão do app, injetada em build a partir do package.json (ver quasar.config.ts)
declare const __APP_VERSION__: string;
