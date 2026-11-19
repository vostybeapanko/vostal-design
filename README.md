# vostal.design

Portfolio Jakuba Vostala. Statický web v [Astro](https://astro.build), hostovaný na GitHub Pages, obsah se spravuje v administraci na `/admin`.

## Úpravy obsahu
Jdi na **https://vostaldesign.run.place/admin/** → *Sign In with Token* → vlož GitHub token.
Každé uložení = commit do `main` → web se za ~1 minutu sám znovu nasadí.

Token: GitHub → Settings → Developer settings → Fine-grained tokens → *Generate new token* →
Repository access: jen `vostal-design` → Permissions: **Contents: Read and write**.

## Kde co je
| Co | Kde |
|---|---|
| Projekty | `src/content/projects/*.json` |
| Služby / obory (filtry) | `src/content/services`, `src/content/sectors` |
| Texty, e-mail, chat, speciální karty | `src/content/settings/site.json` |
| Vzhled | `src/styles/global.css` |
| Úvod / stránka projektu | `src/pages/index.astro`, `src/pages/projekty/[slug].astro` |
| Chování pásu, filtrů a chatu | `src/scripts/home.js` |
| Obrázky | `public/uploads/` |

## Lokálně
```
npm install
npm run dev
```
