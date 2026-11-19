// Načte veškerý obsah z src/content (ten upravuješ v /admin).
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const load = (glob) => Object.entries(glob).map(([path, mod]) => ({
  slug: path.split('/').pop().replace(/\.json$/, ''),
  ...(mod.default ?? mod),
}));

export const site = (await import('../content/settings/site.json')).default;
export const services = load(import.meta.glob('../content/services/*.json', { eager: true })).sort(byOrder).map(s => s.name);
export const sectors = load(import.meta.glob('../content/sectors/*.json', { eager: true })).sort(byOrder).map(s => s.name);

export const projects = load(import.meta.glob('../content/projects/*.json', { eager: true }))
  .filter(p => p.published !== false)
  .sort(byOrder)
  .map(p => ({
    ...p,
    services: p.komplet ? [...services] : (p.services || []),
    sectors: p.sectors || [],
    label: p.komplet ? site.kompletLabel : (p.services || []).join(', '),
  }));

// cesty k obrázkům / stránkám s ohledem na base (GitHub Pages podsložka)
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (p = '') => (!p || /^(https?:|mailto:|tel:|#)/.test(p)) ? p : BASE + (p.startsWith('/') ? p : '/' + p);
