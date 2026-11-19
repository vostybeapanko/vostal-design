import { defineConfig } from 'astro/config';

// Dokud nemáš doménu, web běží na https://vostybeapanko.github.io/vostal-design/
// Až připojíš vostal.design: SITE=https://vostal.design a BASE=/ (nastavuje se v .github/workflows/deploy.yml)
export default defineConfig({
  site: process.env.SITE || 'https://vostybeapanko.github.io',
  base: process.env.BASE || '/vostal-design',
  trailingSlash: 'always',
});
