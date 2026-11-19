const D = JSON.parse(document.getElementById('data').textContent);
const $ = (id) => document.getElementById(id);
const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const track = $('track'), rail = $('rail');

/* ---------------- karty ---------------- */
const meta = (a, b) => `<div class="meta"><span>${esc(a) || '&nbsp;'}</span><span>${esc(b) || '&nbsp;'}</span></div>`;
function cardHTML(x) {
  if (x.special) return `<div class="item">${meta(x.line1, x.line2)}<a class="card note" href="${esc(x.link)}"><div class="art"><div class="t">${esc(x.title)}</div><div class="d">${esc(x.text)}</div></div>${x.tag ? `<span class="pill">${esc(x.tag)}</span>` : ''}</a></div>`;
  const c = x.card || {};
  const art = c.cover
    ? `<img src="${esc(c.cover)}" alt="${esc(x.title)}" loading="lazy">`
    : `<span class="sub">${esc(c.eyebrow)}</span><span class="big">${esc(c.bigText)}</span>`;
  return `<div class="item">${meta(x.label, x.sectors.join(', '))}<a class="card" href="${esc(x.href)}" style="background:${esc(c.bg)};color:${esc(c.ink)}" aria-label="${esc(x.title)} — ${esc(x.label)}, ${esc(x.sectors.join(', '))}"><div class="art">${art}</div>${x.tag ? `<span class="pill">${esc(x.tag)}</span>` : ''}</a></div>`;
}

/* všechno = projekty + speciální karty na svých pozicích */
function fullList() {
  const out = [...D.projects];
  [...D.specials].sort((a, b) => a.position - b.position)
    .forEach(s => out.splice(Math.min(Math.max(0, s.position), out.length), 0, { ...s, special: true }));
  return out;
}

/* ---------------- pás: nekonečný (vše) / statický (filtr) ---------------- */
let list = fullList(), n = list.length, COPIES = 5, loop = true, idx = 0, step = 0;
const gapPx = () => parseFloat(getComputedStyle(track).gap) || 0;

function build(isFull) {
  loop = isFull; n = list.length;
  if (!n) {
    COPIES = 1; idx = 0;
    track.innerHTML = `<div class="empty">${esc(D.site.emptyText)} <a href="mailto:${esc(D.site.email)}">napiš mi</a>.</div>`;
    return;
  }
  COPIES = loop ? (Math.max(5, Math.ceil(30 / n)) | 1) : 1;
  const one = list.map(cardHTML).join('');
  track.innerHTML = Array.from({ length: COPIES }, () => one).join('');
  idx = loop ? n * Math.floor(COPIES / 2) : (n - 1) / 2;
}
function measure() { const c = track.children[0]; if (c) step = c.getBoundingClientRect().width + gapPx(); }
function pos(animate = true) {
  const w = step - gapPx();
  const off = rail.clientWidth / 2 - w / 2 - idx * step;
  track.classList.toggle('nojs', !animate);
  track.style.transform = n ? `translateX(${off}px)` : `translateX(${rail.clientWidth / 2 - track.offsetWidth / 2}px)`;
  $('count').textContent = n ? `${String((Math.round(idx) % n) + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}` : '';
}
function go(d) {
  if (!n) return;
  idx += d;
  if (!loop) idx = Math.max(0, Math.min(n - 1, Math.round(idx)));
  pos();
}
track.addEventListener('transitionend', e => {
  if (e.target !== track || e.propertyName !== 'transform' || !loop) return;
  if (idx < n || idx >= n * (COPIES - 1)) { idx = n * Math.floor(COPIES / 2) + ((idx % n) + n) % n; pos(false); }
});

let wheelLock = 0, acc = 0;
rail.addEventListener('wheel', e => {
  e.preventDefault();
  acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const now = Date.now();
  if (Math.abs(acc) > 30 && now > wheelLock) { go(Math.sign(acc)); acc = 0; wheelLock = now + 280; }
}, { passive: false });
addEventListener('keydown', e => {
  if (document.activeElement?.id === 'q') return;
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft') go(-1);
});
let sx = 0, dx = 0, down = false, moved = false, base = 0;
rail.addEventListener('pointerdown', e => { down = true; moved = false; sx = e.clientX; dx = 0; base = new DOMMatrix(getComputedStyle(track).transform).m41; });
addEventListener('pointermove', e => {
  if (!down) return; dx = e.clientX - sx;
  if (Math.abs(dx) > 6) { moved = true; rail.classList.add('drag'); track.classList.add('nojs'); track.style.transform = `translateX(${base + dx}px)`; }
});
addEventListener('pointerup', () => {
  if (!down) return; down = false; rail.classList.remove('drag');
  if (moved) go(Math.round(-dx / step) || (Math.abs(dx) > 40 ? -Math.sign(dx) : 0));
});
rail.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
addEventListener('resize', () => { measure(); pos(false); });

/* ---------------- filtry: služba × obor (kombinují se) ---------------- */
const sel = { service: null, sector: null };
const match = (p, s = sel) => (!s.service || p.services.includes(s.service)) && (!s.sector || p.sectors.includes(s.sector));

function syncButtons() {
  document.querySelectorAll('.frow').forEach(row => {
    const g = row.dataset.group;
    row.querySelectorAll('button').forEach(b => {
      const v = b.dataset.v, on = sel[g] === v;
      // je v kombinaci s druhým výběrem aspoň jeden projekt?
      const has = D.projects.some(p => match(p, { ...sel, [g]: v }));
      b.classList.toggle('on', on);
      b.classList.toggle('off', !on && !has);
      b.setAttribute('aria-pressed', on);
    });
  });
  $('reset').classList.toggle('show', !!(sel.service || sel.sector));
}
function apply() {
  syncButtons();
  track.classList.add('swap');
  setTimeout(() => {
    const isFull = !sel.service && !sel.sector;
    list = isFull ? fullList() : D.projects.filter(p => match(p));
    build(isFull); measure(); pos(false);
    requestAnimationFrame(() => track.classList.remove('swap'));
  }, 230);
}
function setSel(g, v, toggle = true) {
  sel[g] = toggle && sel[g] === v ? null : v;
  apply();
}
document.querySelectorAll('.frow').forEach(row => row.addEventListener('click', e => {
  const b = e.target.closest('button'); if (b) setSel(row.dataset.group, b.dataset.v);
}));
$('reset').addEventListener('click', () => { sel.service = sel.sector = null; apply(); });

/* patička */
$('tog').addEventListener('click', () => $('foot').classList.toggle('open'));

/* ---------------- chat ---------------- */
const q = $('q'), send = $('send'), chat = $('chat');
q.addEventListener('input', () => { send.disabled = !q.value.trim(); });
const stem = w => { w = w.toLowerCase(); return w.length <= 4 ? w.slice(0, 3) : w.slice(0, 4); };
const linkify = t => esc(t)
  .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>')
  .replace(/@([\w.]+[\w])(?![\w@])/g, (m, h, i, s) => s[i - 1] === '>' || /\w/.test(s[i - 1] || '') ? m : `<a href="https://www.instagram.com/${h}/">@${h}</a>`);
function reply(t) {
  const low = t.toLowerCase();
  const sv = D.services.find(c => low.includes(stem(c)));
  const sc = D.sectors.find(c => low.includes(stem(c)));
  if (sv || sc) {
    sel.service = sv || null; sel.sector = sc || null; apply();
    const name = [sv, sc].filter(Boolean).join(' × ');
    return esc(D.site.chat.categoryReply).replace('{kategorie}', `<b>${esc(name)}</b>`);
  }
  for (const a of D.site.chat.answers || []) {
    const keys = a.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keys.some(k => low.includes(k))) return linkify(a.answer);
  }
  return `${esc(D.site.chat.fallback)} <a href="mailto:${esc(D.site.email)}?body=${encodeURIComponent(t)}">${esc(D.site.email)}</a>`;
}
function add(cls, html) { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; }
$('ask').addEventListener('submit', e => {
  e.preventDefault(); const t = q.value.trim(); if (!t) return;
  add('me', esc(t)); q.value = ''; send.disabled = true;
  setTimeout(() => add('bot', reply(t)), 420);
});

/* start */
build(true); syncButtons();
requestAnimationFrame(() => { measure(); pos(false); });
