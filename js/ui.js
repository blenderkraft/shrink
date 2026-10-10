// Shrink — UI: one room, one laptop, one TV, four months.

const UI = { view: 'title', app: 'shop', cart: [], selected: null, tv: { mode: 'menu' }, endPage: 0, muted: false, picker: null, modalLock: false, lastPost: null };
const $ = s => document.querySelector(s);
const stage = $('#stage'), viewEl = $('#view'), hudEl = $('#hud'), modalEl = $('#modal'), toastEl = $('#toasts');
let scale = 1;

try { UI.muted = localStorage.getItem('shrink.muted') === '1'; } catch (e) { /* no storage */ }

// ---------- layout ----------
function fit() {
  scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fit);
function toStage(cx, cy) { const r = stage.getBoundingClientRect(); return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }; }

// ---------- sound ----------
let actx = null;
function ac() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; } } return actx; }
function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slide) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.08, when = 0, freq = 3000) {
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.2);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'highpass'; f.frequency.value = freq; src.buffer = buf; g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination); src.start(a.currentTime + when);
}
sfx = function (name) {
  if (UI.muted) return;
  const a = ac(); if (!a) return; if (a.state === 'suspended') a.resume();
  switch (name) {
    case 'chime': tone(988, 0.18, 'sine', 0.1); tone(1480, 0.3, 'sine', 0.08, 0.08); break;
    case 'down': tone(392, 0.2, 'triangle', 0.1); tone(294, 0.3, 'triangle', 0.08, 0.1); break;
    case 'register': noise(0.05, 0.06); tone(1760, 0.25, 'sine', 0.07, 0.04); tone(2637, 0.35, 'sine', 0.05, 0.08); break;
    case 'crinkle': for (let i = 0; i < 5; i++) noise(0.03, 0.05, i * 0.05, 4000); break;
    case 'peel': for (let i = 0; i < 26; i++) noise(0.03 + Math.random() * 0.04, 0.05, i * 0.09 + Math.random() * 0.04, 3500); break;
    case 'thunk': tone(140, 0.12, 'sine', 0.18, 0, 70); break;
    case 'click': tone(1200, 0.04, 'square', 0.03); break;
    case 'ping': tone(1320, 0.4, 'sine', 0.08); tone(1980, 0.5, 'sine', 0.04, 0.05); break;
    case 'nope': tone(180, 0.15, 'square', 0.04); break;
    case 'notify': tone(1046, 0.1, 'sine', 0.07); tone(1318, 0.16, 'sine', 0.07, 0.1); break;
  }
};

// ---------- toasts ----------
function showToast(html, cls = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls; el.innerHTML = html;
  toastEl.prepend(el);
  while (toastEl.children.length > 4) toastEl.lastChild.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3700);
}
Game.on('toast', (msg, kind) => showToast(esc(msg), kind || ''));
Game.on('clout', (n, why) => {
  sfx(n > 0 ? 'chime' : 'down');
  showToast(`<b>${n > 0 ? '+' : ''}${n} Clout</b> <span>${esc(why || '')}</span>`, 'clout ' + (n > 0 ? 'up' : 'dn'));
  renderHUD(true);
});

// ---------- modal ----------
function openModal(html, opts = {}) {
  modalEl.innerHTML = `<div class="modal-back" ${opts.lock ? '' : 'data-act="closeModal"'}></div><div class="modal-card ${opts.cls || ''}">${html}</div>`;
  modalEl.classList.add('on'); UI.modalLock = !!opts.lock; UI.onClose = opts.onClose || null;
}
function closeModal(force) {
  if (UI.modalLock && !force) return;
  modalEl.classList.remove('on'); modalEl.innerHTML = ''; UI.modalLock = false;
  const f = UI.onClose; UI.onClose = null; if (f) f();
}
const modalOpen = () => modalEl.classList.contains('on');

function openPicker(title, items, cb, note) {
  UI.picker = cb;
  openModal(`<h2>${esc(title)}</h2>${note ? `<p class="muted">${esc(note)}</p>` : ''}
    <div class="picker">${items.length ? items.map(it => `<button class="pick" data-act="pick" data-uid="${it.uid}">${coverSVG(it.gid, 'thumb')}<span>${esc(BY_ID[it.gid].name)}<small>${it.sealed ? 'sealed' : 'opened'}</small></span></button>`).join('') : '<p class="muted">Nothing eligible.</p>'}</div>
    <div class="row end"><button class="btn ghost" data-act="closeModal">Never mind</button></div>`);
}

// ---------- HUD (the phone) ----------
function renderHUD(bump) {
  if (!S || !['room', 'shelf', 'laptop', 'tv'].includes(UI.view)) { hudEl.innerHTML = ''; return; }
  const pips = Array.from({ length: ATTENTION }, (_, i) => `<i class="${i < S.attention ? 'on' : ''}"></i>`).join('');
  hudEl.innerHTML = `<div class="phone">
    <div class="ph-cell month"><small>Month ${S.month}/4</small><b>${MONTHS[S.month - 1]}</b></div>
    <div class="ph-cell"><small>Budget</small><b class="${S.money < 0 ? 'in-debt' : ''}">${money(S.money)}</b></div>
    <div class="ph-cell"><small>Attention</small><span class="pips">${pips}</span></div>
    <div class="ph-cell clout ${bump ? 'bump' : ''}"><small>Clout</small><b>✦ ${S.clout}</b></div>
    <div class="ph-cell"><small>Tests</small><b>${'◆'.repeat(S.testsLeft)}${'◇'.repeat(TESTS - S.testsLeft)}</b></div>
    <button class="btn end" data-act="endMonth">${S.month < 4 ? 'End month →' : 'Finish run →'}</button>
    <button class="btn icon" data-act="mute" title="Sound">${UI.muted ? '🔇' : '🔊'}</button>
  </div>`;
}

// ---------- views ----------
function render() {
  renderHUD();
  const v = VIEWS[UI.view];
  viewEl.className = 'view view-' + UI.view;
  viewEl.innerHTML = v ? v() : '';
}

const VIEWS = {
  title() {
    const best = Game.best();
    return `<div class="title-screen">
      <div class="title-box"><h1>SHRINK</h1><div class="title-shine"></div></div>
      <p class="tag">A short comedy about board-game collecting.<br>You do not play the board games.</p>
      <label class="name">Your channel name <input id="chan" maxlength="24" value="${esc((S && S.name) || 'Shelf Talk')}" /></label>
      <div class="row center">
        ${Game.hasSave() ? '<button class="btn" data-act="continue">Continue</button>' : ''}
        <button class="btn primary" data-act="newGame">New run</button>
      </div>
      ${best && best.score != null ? `<p class="best">Best Canon: <b>${best.score}</b> — ${esc(best.rank)} · ${best.runs} run${best.runs === 1 ? '' : 's'}</p>` : ''}
      <p class="fine">Four months. One wall. The score is hidden. Headphones optional.</p>
    </div>`;
  },

  room() { return roomSVG(); },

  shelf() {
    const cubes = Array.from({ length: CUBES }, (_, i) => {
      const items = Game.cube(i);
      return `<div class="cube ${S.lights[i] ? 'lit' : ''}" data-drop="${i}">
        <div class="stack">${items.map((it, k) => boxHTML(it, k)).join('')}</div>
        <button class="bulb ${S.lights[i] ? 'on' : ''}" data-act="light" data-i="${i}" title="Cube light"></button>
      </div>`;
    }).join('');
    const pile = Game.pile();
    const mail = Game.inMail(), tom = Game.atTom();
    return `<div class="backdrop" data-act="toRoom"></div>
      <div class="shelf-area">
        <div class="kallax">${cubes}</div>
        <div class="kallax-foot"></div>
      </div>
      <div class="pile-panel" data-drop="pile">
        <h3>The Pile <small>the floor · ${pile.length} box${pile.length === 1 ? '' : 'es'}</small></h3>
        <div class="pile">${pile.map(it => boxHTML(it, 0)).join('') || '<p class="muted">Nothing on the floor. New boxes land here, sealed.</p>'}</div>
        ${mail.length || tom.length ? `<div class="away">${mail.map(it => `<span class="chip">📦 ${esc(BY_ID[it.gid].name)} · ${it.loc.arrives > 4 ? 'Q3 2027' : MONTHS[it.loc.arrives - 1]}</span>`).join('')}${tom.map(it => `<span class="chip">✋ ${esc(BY_ID[it.gid].name)} · at Tom's</span>`).join('')}</div>` : ''}
      </div>
      <div class="inspector">${inspectorHTML()}</div>
      <button class="btn back" data-act="toRoom">← Desk <kbd>Esc</kbd></button>`;
  },

  laptop() {
    const apps = [
      ['shop', '🛒', 'Shoppe'], ['ks', '🚀', 'Kickstartle'], ['sub', '👽', 'r/cardboardcj'],
      ['inbox', '✉️', 'Inbox'], ['notes', '📝', 'Notes'], ['test', '🕵️', 'Investigate'],
    ];
    const unread = Game.unread();
    return `<div class="backdrop" data-act="toRoom"></div>
      <div class="laptop"><div class="screen">
        <div class="os-bar"><span>●●●</span><span>${MONTHS[S.month - 1]} · ${esc(S.name)}'s laptop</span><button class="btn mini" data-act="toRoom">Close <kbd>Esc</kbd></button></div>
        <div class="os">
          <nav class="apps">${apps.map(([id, ic, nm]) => `<button class="app ${UI.app === id ? 'on' : ''}" data-act="app" data-v="${id}"><span class="ic">${ic}</span>${nm}${id === 'inbox' && unread ? `<i class="badge">${unread}</i>` : ''}</button>`).join('')}</nav>
          <section class="app-body" id="appBody">${APPS[UI.app]()}</section>
        </div>
      </div></div>`;
  },

  tv() {
    return `<div class="backdrop" data-act="toRoom"></div>
      <div class="tv-wrap">
        <div class="tv"><div class="tv-screen" id="tvScreen">${tvScreenHTML()}</div></div>
        <div class="tv-stand"></div>
      </div>
      <button class="btn back" data-act="toRoom">← Desk <kbd>Esc</kbd></button>`;
  },

  ending() { return endingHTML(); },
};

// ---------- room ----------
function roomSVG() {
  const K = { x: 70, y: 140, cube: 100, gap: 10 };
  const slabH = { tiny: 22, std: 44, big: 88 }, slabW = { tiny: 54, std: 84, big: 88 };
  let shelf = '';
  for (let i = 0; i < CUBES; i++) {
    const cx = K.x + K.gap + (i % 4) * (K.cube + K.gap), cy = K.y + K.gap + Math.floor(i / 4) * (K.cube + K.gap);
    shelf += `<rect x="${cx}" y="${cy}" width="${K.cube}" height="${K.cube}" fill="${S.lights[i] ? 'url(#litGlow)' : '#3a3029'}"/>`;
    let y = cy + K.cube - 4;
    Game.cube(i).forEach((it, k) => {
      const g = BY_ID[it.gid], h = slabH[g.size], w = slabW[g.size];
      const drift = k ? Math.min(10, 2 + (S.month - (it.placedMonth || 1)) * 3) : 0;
      y -= h;
      shelf += `<rect x="${cx + (K.cube - w) / 2 + drift}" y="${y}" width="${w}" height="${h - 2}" rx="2" fill="${g.color}" stroke="rgba(0,0,0,.35)"/>`;
      if (it.sealed) shelf += `<path d="M${cx + (K.cube - w) / 2 + drift + 6} ${y + h - 6} l${Math.min(18, w / 4)} -${h - 10}" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>`;
    });
  }
  const pile = Game.pile();
  let pileSvg = '';
  pile.slice(0, 7).forEach((it, k) => {
    const g = BY_ID[it.gid];
    pileSvg += `<rect x="${532 + (k % 2) * 6}" y="${676 - (k + 1) * 18}" width="${g.size === 'tiny' ? 40 : 62}" height="16" rx="2" fill="${g.color}" stroke="rgba(0,0,0,.4)" transform="rotate(${(k % 3 - 1) * 3} 560 ${670 - k * 18})"/>`;
  });
  const unread = Game.unread();
  const m = Game.M();
  const notes = S.notes.slice(0, 4).map((n, i) => `<g transform="translate(${1096 + (i % 2) * 74} ${306 + Math.floor(i / 2) * 64}) rotate(${(i % 2 ? 4 : -3)})"><rect width="64" height="56" fill="${['#ffe873', '#ffb8d1', '#b5f0c7', '#ffd59e'][i]}"/><text x="6" y="18" font-family="Patrick Hand, cursive" font-size="10" fill="#333">${esc(n.text.slice(0, 13))}</text><text x="6" y="32" font-family="Patrick Hand, cursive" font-size="10" fill="#333">${esc(n.text.slice(13, 26))}</text></g>`).join('');
  return `<svg class="room" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="litGlow" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".6" stop-color="#b58a4a"/><stop offset="1" stop-color="#4a3a2a"/></radialGradient>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d4a5c"/><stop offset="1" stop-color="#55627a"/></linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a33"/><stop offset="1" stop-color="#4a3222"/></linearGradient>
      <radialGradient id="lampWall"><stop offset="0" stop-color="#ffd98a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
      <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd3ff"/><stop offset="1" stop-color="#5b8fd6"/></linearGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#wall)"/>
    <rect y="604" width="1280" height="116" fill="url(#floor)"/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 160}" y1="604" x2="${i * 160 - 80}" y2="720" stroke="#3a2618" stroke-width="2" opacity=".5"/>`).join('')}
    <rect y="596" width="1280" height="10" fill="#2e3846"/>

    <!-- window -->
    <g><rect x="620" y="70" width="230" height="170" fill="#141c33" stroke="#e8e2d6" stroke-width="10"/>
      <circle cx="800" cy="112" r="18" fill="#f5f0d8"/><circle cx="792" cy="106" r="18" fill="#141c33"/>
      ${[[650, 100], [700, 140], [760, 190], [680, 200], [830, 200], [725, 95]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join('')}
      <line x1="735" y1="70" x2="735" y2="240" stroke="#e8e2d6" stroke-width="6"/><line x1="620" y1="155" x2="850" y2="155" stroke="#e8e2d6" stroke-width="6"/>
    </g>

    <!-- the wall -->
    <g class="hs" data-act="go" data-v="shelf">
      <rect class="hs-glow" x="${K.x - 8}" y="${K.y - 8}" width="${4 * K.cube + 5 * K.gap + 16}" height="${4 * K.cube + 5 * K.gap + 16}" rx="8"/>
      <rect x="${K.x}" y="${K.y}" width="${4 * K.cube + 5 * K.gap}" height="${4 * K.cube + 5 * K.gap}" fill="#f2efe8" stroke="#c9c3b6" stroke-width="2"/>
      ${shelf}
      <rect x="${K.x + 6}" y="${K.y + 4 * K.cube + 5 * K.gap}" width="14" height="10" fill="#c9c3b6"/><rect x="${K.x + 4 * K.cube + 5 * K.gap - 20}" y="${K.y + 4 * K.cube + 5 * K.gap}" width="14" height="10" fill="#c9c3b6"/>
      ${pileSvg}
      <text class="hs-label" x="${K.x + 225}" y="${K.y - 18}" text-anchor="middle">The Wall — arrange, open, cull</text>
    </g>

    <!-- the dog knows -->
    <g transform="translate(610 640)">
      <ellipse cx="40" cy="30" rx="44" ry="20" fill="#c98b4a"/>
      <circle cx="-2" cy="14" r="20" fill="#c98b4a"/>
      <ellipse cx="-12" cy="2" rx="8" ry="14" fill="#8a5a2a" transform="rotate(20 -12 2)"/>
      <circle cx="-10" cy="12" r="3" fill="#222"/><circle cx="-11" cy="11" r="1" fill="#fff"/>
      <ellipse cx="-20" cy="22" rx="6" ry="4" fill="#3a2a1a"/>
      <path d="M-14 8 l8 -2" stroke="#3a2a1a" stroke-width="2"/>
      <path d="M84 26 q14 -6 10 -18" stroke="#c98b4a" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>

    <!-- TV -->
    <g class="hs" data-act="go" data-v="tv">
      <rect class="hs-glow" x="892" y="72" width="346" height="206" rx="10"/>
      <rect x="900" y="80" width="330" height="190" rx="6" fill="#111"/>
      <rect x="910" y="90" width="310" height="170" fill="${m.watched ? '#1d2433' : '#25375a'}"/>
      <text x="1065" y="168" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="30" fill="#ffcf4a">THE DICE PILE</text>
      <text x="1065" y="194" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="14" fill="#cfd8ea">with Tom Barrel</text>
      ${m.watched ? '' : '<g><rect x="1160" y="98" width="52" height="22" rx="4" fill="#e23b2e"/><text x="1186" y="114" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="13" font-weight="700" fill="#fff">NEW</text></g>'}
      <text class="hs-label" x="1065" y="300" text-anchor="middle">TV — watch Tom, film your channel</text>
    </g>

    ${notes ? `<g class="hs" data-act="goNotes">${notes}</g>` : ''}

    <circle cx="715" cy="430" r="150" fill="url(#lampWall)"/>
    <!-- desk -->
    <rect x="640" y="520" width="620" height="20" fill="#8a5a36"/>
    <rect x="660" y="540" width="16" height="100" fill="#6b4428"/><rect x="1224" y="540" width="16" height="100" fill="#6b4428"/>
    <rect x="980" y="540" width="240" height="70" fill="#7a4e30"/><rect x="1086" y="570" width="28" height="5" rx="2" fill="#caa070"/>
    <!-- lamp -->
    
    <rect x="712" y="440" width="6" height="80" fill="#333"/><rect x="694" y="514" width="42" height="8" rx="3" fill="#333"/>
    <path d="M684 440 L746 440 L734 404 L696 404 Z" fill="#e6b85c"/>
    <!-- mug -->
    <rect x="1150" y="488" width="30" height="32" rx="4" fill="#e9e2d0"/><path d="M1180 496 q12 0 12 10 q0 10 -12 10" stroke="#e9e2d0" stroke-width="5" fill="none"/>
    <text x="1165" y="510" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="9" fill="#6b2c22">NIS</text>

    <!-- laptop -->
    <g class="hs" data-act="go" data-v="laptop">
      <rect class="hs-glow" x="812" y="362" width="236" height="166" rx="10"/>
      <rect x="830" y="370" width="200" height="136" rx="6" fill="#222"/>
      <rect x="838" y="378" width="184" height="118" fill="url(#screenGlow)"/>
      <rect x="846" y="388" width="50" height="98" fill="#ffffff" opacity=".35"/>
      ${[0, 1, 2].map(i => `<rect x="904" y="${390 + i * 32}" width="108" height="26" fill="#fff" opacity=".5"/>`).join('')}
      <path d="M810 520 L1050 520 L1030 506 L830 506 Z" fill="#9aa0a8"/>
      ${unread ? `<circle cx="1022" cy="380" r="13" fill="#e23b2e"/><text x="1022" y="385" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="14" font-weight="700" fill="#fff">${unread}</text>` : ''}
      <text class="hs-label" x="930" y="352" text-anchor="middle">Laptop — shop, pledge, post, notes</text>
    </g>
  </svg>`;
}

// ---------- shelf pieces ----------
function boxHTML(it, k) {
  const g = BY_ID[it.gid];
  const drift = k ? Math.min(14, 3 + (S.month - (it.placedMonth || 1)) * 4) : 0;
  const cls = ['box', 's-' + g.size, it.sealed ? 'sealed' : 'opened', it.bagged ? 'bagged' : '', UI.selected === it.uid ? 'sel' : '', drift ? 'drift' : ''].join(' ');
  return `<div class="${cls}" data-uid="${it.uid}" style="--c:${g.color};--k:${g.ink};--drift:${drift}px" title="${esc(g.name)}">
    <span class="lbl">${esc(g.name)}</span>
    ${it.sticker ? `<i class="stk">✋${it.sticker}</i>` : ''}${it.allIn ? '<i class="dlx">ALL-IN</i>' : ''}${it.sleeved ? '<i class="slv">S</i>' : ''}
  </div>`;
}

function inspectorHTML() {
  const it = UI.selected && S.items[UI.selected];
  if (!it) {
    const occ = Array.from({ length: CUBES }, (_, i) => Game.cube(i).length).filter(Boolean).length;
    const lit = S.lights.filter((l, i) => l && Game.cube(i).length).length;
    return `<h3>The Kallax</h3>
      <p>Drag boxes between cubes and the floor. <b>Dragging is free.</b> Click a box for options. Click the little bulb to light a cube.</p>
      <ul class="facts"><li>${occ} of 16 cubes occupied · ${16 - occ} empty</li><li>${lit} occupied cube${lit === 1 ? '' : 's'} lit</li><li>${Game.pile().length} on the floor</li></ul>
      <p class="muted">Two boxes in one cube will drift. Big boxes take a whole cube. Card games fit four to a cube.</p>`;
  }
  const g = BY_ID[it.gid];
  const where = it.loc.type === 'cube' ? `Cube ${it.loc.cube + 1} (row ${Math.floor(it.loc.cube / 4) + 1})` : 'On the floor';
  const status = [it.sealed ? 'Sealed (NIS)' : 'Opened, scuffed', it.bagged && 'archival bag', it.sleeved && 'sleeved', it.allIn && 'all-in', it.sticker && `Tom: ✋${it.sticker}`].filter(Boolean).join(' · ');
  const sp = Game.sellPrice(it);
  return `<div class="insp">
    <div class="insp-cover ${it.sealed ? 'sealed' : 'opened'} ${it.bagged ? 'bagged' : ''}">${coverSVG(it.gid)}${it.sticker ? `<i class="stk big">✋${it.sticker}</i>` : ''}</div>
    <div class="insp-body">
      <h3>${esc(g.name)}</h3>
      <p class="status">${status}</p>
      <p class="muted">${esc(g.blurb)}</p>
      <p class="small">${where} · paid ${money(it.price)}${it.starter ? ' (years ago)' : ` in ${MONTHS[(it.month || 1) - 1]}`}</p>
      <div class="acts">
        ${it.sealed ? `<button class="btn primary" data-act="peel" data-uid="${it.uid}">Peel the shrink <span class="cost">1◉</span></button>` : ''}
        ${it.sealed && !it.bagged ? `<button class="btn" data-act="bag" data-uid="${it.uid}">Archival bag <span class="cost">$3</span></button>` : ''}
        ${!it.sleeved ? `<button class="btn" data-act="sleeve" data-uid="${it.uid}">Sleeve it <span class="cost">$4</span></button>` : ''}
        ${it.sealed ? `<button class="btn" data-act="mailTom" data-uid="${it.uid}">Mail to Tom <span class="cost">1◉</span></button>` : ''}
        <button class="btn" data-act="sell" data-uid="${it.uid}">Sell for ${money(sp)} <span class="cost">1◉</span></button>
        <button class="btn" data-act="give" data-uid="${it.uid}">Give away <span class="cost">1◉</span></button>
        ${it.loc.type === 'cube' ? `<button class="btn ghost" data-act="toFloor" data-uid="${it.uid}">Put on floor</button>` : ''}
        <button class="btn ghost" data-act="deselect">Done</button>
      </div>
    </div>
  </div>`;
}

// ---------- laptop apps ----------
const APPS = {
  shop() {
    const m = Game.M();
    const order = RETAIL.slice().sort((a, b) => (Game.isHot(b) - Game.isHot(a)) || (!!Game.review(b) - !!Game.review(a)));
    const cards = order.map(gid => {
      const g = BY_ID[gid], p = Game.priceOf(gid), rv = Game.review(gid), hotIdx = m.hot.indexOf(gid), own = Game.ownedCount(gid);
      return `<div class="card ${UI.cart.includes(gid) ? 'incart' : ''}">
        <div class="thumb">${coverSVG(gid)}</div>
        <div class="nm">${esc(g.name)}</div>
        <div class="badges">${hotIdx >= 0 ? `<span class="b hot">HOT #${hotIdx + 1}</span>` : ''}${rv ? `<span class="b tom">✋${rv.fingers} Dice Pile</span>` : ''}${m.sale[gid] ? `<span class="b sale">-${Math.round(m.sale[gid] * 100)}%</span>` : ''}</div>
        <div class="price">${m.sale[gid] ? `<s>$${g.price}</s> ` : ''}<b>$${p}</b>${own ? `<span class="own">You own ${own}</span>` : ''}</div>
        <button class="btn mini" data-act="cart" data-gid="${gid}">Add to cart</button>
      </div>`;
    }).join('');
    const total = UI.cart.reduce((s, g) => s + Game.priceOf(g), 0);
    return `<div class="shop">
      <div class="shop-main"><header class="app-head"><h2>BoardGameShoppe</h2><span class="muted">Hotness refreshed hourly. Buy what the Geek is talking about.</span></header>
        ${m.purchaseLock ? `<div class="banner">You promised ${SPOUSE} no more purchases this month.</div>` : ''}
        <div class="grid">${cards}</div></div>
      <aside class="cart"><h3>Cart</h3>
        ${UI.cart.length ? UI.cart.map((g, i) => `<div class="cart-row"><span>${esc(BY_ID[g].name)}</span><b>$${Game.priceOf(g)}</b><button class="x" data-act="uncart" data-i="${i}">×</button></div>`).join('') : '<p class="muted">Empty. Like a cube.</p>'}
        <div class="cart-total">Total <b>$${total}</b></div>
        <button class="btn primary wide" data-act="checkout" ${UI.cart.length ? '' : 'disabled'}>Check out <span class="cost">1◉</span></button>
        <p class="muted small">One checkout costs one attention, however much is in the cart. Boxes arrive sealed, on the floor. You can buy a fourth copy. The shop will not stop you.</p>
        <p class="muted small">Budget after: <b class="${S.money - total < 0 ? 'in-debt' : ''}">${money(S.money - total)}</b>. Debt is allowed.</p>
      </aside></div>`;
  },

  ks() {
    const m = Game.M();
    return `<header class="app-head"><h2>Kickstartle</h2><span class="muted">Your money now. Your box next month. That is the point.</span></header>
      ${m.purchaseLock ? `<div class="banner">You promised ${SPOUSE} no more purchases this month.</div>` : ''}
      <div class="ks-list">${m.ks.map((gid, i) => {
        const g = BY_ID[gid], p = KS_PITCH[gid], pct = 400 + ((gid.length * 997 + S.month * 331) % 3000), own = Game.ownedCount(gid);
        return `<div class="ks">
          <div class="ks-cover">${coverSVG(gid)}</div>
          <div class="ks-body">
            <h3>${esc(g.name)}</h3><p class="muted">by ${esc(p.creator)} — ${esc(p.goal)}</p>
            <div class="bar"><i style="width:100%"></i></div>
            <p class="small"><b>${pct.toLocaleString()}% funded</b> · ${(pct * 13).toLocaleString()} backers · ${3 + i * 5} days left${own ? ` · <b>you own ${own}</b>` : ''}</p>
            <ul class="stretch">${p.stretch.map(s => `<li>✓ ${esc(s)}</li>`).join('')}</ul>
            <p class="small">Estimated delivery: <b>${S.month >= 4 ? 'Q3 2027' : MONTHS[S.month]}</b></p>
            <div class="row"><button class="btn" data-act="pledge" data-gid="${gid}">Pledge $${g.price} <span class="cost">1◉</span></button>
            <button class="btn primary" data-act="pledge" data-gid="${gid}" data-allin="1">All-in $${g.price + ALL_IN_COST} <span class="cost">1◉</span></button></div>
            <p class="muted small">All-in: metal coins, a bigger box, a promo you will not open. Adds a deluxe sticker.</p>
          </div></div>`;
      }).join('')}</div>`;
  },

  sub() {
    const m = Game.M();
    const posts = S.posts.slice().reverse();
    return `<header class="app-head sub-head"><h2>r/cardboardcirclejerk</h2><span class="muted">/uj be nice · /rj never</span></header>
      <div class="compose">${miniShelf(snapshot(), 'sm')}
        <div><p>Photograph the wall and post it. Comments arrive in the voice of the Hobby. Some of it is noise. Some of it is a rule, said sideways.</p>
        <button class="btn primary" data-act="post" ${m.posted ? 'disabled' : ''}>${m.posted ? 'Posted this month' : 'Post a shelfie'} <span class="cost">1◉</span></button></div></div>
      ${posts.map((p, idx) => `<article class="post ${idx === 0 && UI.lastPost === p ? 'fresh' : ''}">
        <div class="votes">▲<b>${p.upvotes}</b>▼</div>
        <div class="post-body"><h4>COMC: ${esc(p.title)} <small>· ${MONTHS[p.month - 1]} · u/${esc(S.name.replace(/\s+/g, ''))}</small></h4>
          ${miniShelf(p.snapshot, 'md')}
          <div class="comments">${p.comments.map((c, i) => `<div class="cmt" style="animation-delay:${idx === 0 && UI.lastPost === p ? i * 0.5 : 0}s"><span class="u">u/${esc(c.user)}</span> <span class="sc">${c.score}</span><p>${esc(c.text)}</p></div>`).join('')}</div>
        </div></article>`).join('') || '<p class="muted pad">You have not posted. The sub does not know you exist. Yet.</p>'}`;
  },

  inbox() {
    const msgs = S.messages.slice().reverse();
    const icon = { spouse: '💬', sub: '👽', tom: '📧', pm: '📦' };
    const fromName = m => (m.from === 'spouse' ? SPOUSE : m.from === 'sub' ? 'u/' + m.user : m.from === 'tom' ? 'Tom Barrel' : 'Pledge Manager');
    return `<header class="app-head"><h2>Messages</h2><span class="muted">Once a month someone writes. Doing what they ask is optional. Ignoring them is not always free.</span></header>
      <div class="msgs">${msgs.map(m => `<div class="msg ${m.from}">
        <div class="msg-h"><span class="ic">${icon[m.from]}</span><b>${esc(fromName(m))}</b><small>${MONTHS[m.month - 1]}</small></div>
        ${m.body ? `<p>${esc(m.body)}</p>` : ''}
        ${m.request ? `<p class="ask">${esc(m.request.ask)}</p>` : ''}
        ${m.request && !m.resolved ? `<div class="row"><button class="btn primary" data-act="respond" data-id="${m.id}" data-yes="1">${respondLabel(m)}</button><button class="btn ghost" data-act="respond" data-id="${m.id}">Ignore</button></div>`
          : m.request ? `<p class="small muted">${m.complied ? 'You did it.' : m.autoIgnored ? 'You never answered.' : 'You ignored it.'}</p>` : ''}
      </div>`).join('') || '<p class="muted pad">No messages.</p>'}</div>`;
  },

  notes() {
    return `<header class="app-head"><h2>Notes</h2><span class="muted">Pin theories in your own words. Short ones.</span></header>
      <div class="notes-app">
        <div class="note-input"><input id="noteText" maxlength="80" placeholder="e.g. second Patchwerk matters · Tom is a trap · empty cube is the point" />
          <button class="btn primary" data-act="notePin">Pin</button></div>
        <p class="muted small">At the end, a theory that matches a live rule pays extra. One that is the opposite of a live rule costs you. Writing nothing is safer than being confidently normal, and worse than being right. ${S.notes.length}/${MAX_NOTES} pinned.</p>
        <div class="stickies">${S.notes.map((n, i) => `<div class="sticky c${i % 4}"><button class="x" data-act="noteDel" data-i="${i}">×</button><p>${esc(n.text)}</p>
          <small>${n.group ? `reads as: <b>${esc(n.label)}</b> → ${n.pol > 0 ? 'good' : 'bad'}` : 'reads as: …no idea what this is about'}</small></div>`).join('')}</div>
      </div>`;
  },

  test() {
    const o = Game.lastOrder();
    const tested = o && S.tests.some(t => t.orderId === o.id);
    return `<header class="app-head"><h2>Investigate</h2><span class="muted">A few times a run, force a narrow answer: what did the last purchase do to the hidden score?</span></header>
      <div class="test-app">
        <div class="last"><small>Last purchase</small>${o ? `<b>${o.gids.map(g => esc(BY_ID[g].name)).join(' + ')}</b> <span class="muted">(${MONTHS[o.month - 1]}${o.allIn ? ', all-in' : ''})</span>` : '<b>Nothing yet.</b>'}</div>
        <p class="muted small">Tests left: <b>${S.testsLeft}</b>. The answer is up a lot, up a little, nothing, or down. It never shows the rule. Spend these on the weird buys. A cart of six things tests all six at once.</p>
        <div class="methods">${Object.entries(TEST_METHODS).map(([k, t]) => `<button class="method" data-act="test" data-v="${k}" ${!o || tested || S.testsLeft <= 0 ? 'disabled' : ''}><b>${t.name}</b><small>${t.desc}</small></button>`).join('')}</div>
        <div class="results">${S.tests.slice().reverse().map(t => `<div class="result r-${t.result.replace(/ /g, '-')}"><div><b>${t.gids.map(g => esc(BY_ID[g].name)).join(' + ')}</b> <small>${MONTHS[t.month - 1]} · ${TEST_METHODS[t.method].name}</small></div><div class="verdict">${t.result.toUpperCase()}</div><p>${esc(t.flavor)}</p></div>`).join('')}</div>
      </div>`;
  },
};

function respondLabel(m) {
  return { freeCube: 'Give one away', skipPurchase: 'Okay. No more this month.', offer: `Sell it for ${money(m.request.price)}`, mailTom: 'Mail him one', allIn: 'Upgrade ($35)' }[m.request.type] || 'Okay';
}

// ---------- mini shelf (photos) ----------
function miniShelf(snap, size) {
  return `<div class="minishelf ${size}">${snap.cubes.map((items, i) => `<div class="mc ${snap.lights[i] ? 'lit' : ''}">${items.map(x => { const g = BY_ID[x.gid]; return `<i class="ms s-${g.size} ${x.sealed ? 'sealed' : ''}" style="--c:${g.color}"></i>`; }).join('')}</div>`).join('')}</div>`;
}

// ---------- TV ----------
function tomSVG(fingers, pose) {
  let hand = '';
  if (fingers) {
    const fs = Array.from({ length: fingers }, (_, i) => `<rect x="${-22 + i * 11}" y="-44" width="9" height="36" rx="4.5" fill="#f2c9a0" stroke="#8a5a3a" stroke-width="1.5"/>`).join('');
    hand = `<g transform="translate(150 70)">${fs}<rect x="-24" y="-14" width="${Math.max(30, fingers * 11 + 4)}" height="34" rx="10" fill="#f2c9a0" stroke="#8a5a3a" stroke-width="1.5"/></g>`;
  }
  return `<svg class="tom" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="90" cy="160" rx="70" ry="62" fill="#9a6232"/>
    ${[120, 150, 180].map(y => `<path d="M24 ${y} Q90 ${y + 14} 156 ${y}" stroke="#5a3a1c" stroke-width="6" fill="none"/>`).join('')}
    <circle cx="90" cy="66" r="40" fill="#f2c9a0"/>
    <path d="M52 76 Q90 132 128 76 Q120 104 90 108 Q60 104 52 76Z" fill="#6b4a2a"/>
    <circle cx="76" cy="60" r="5" fill="#222"/><circle cx="104" cy="60" r="5" fill="#222"/>
    <rect x="64" y="54" width="22" height="14" rx="4" fill="none" stroke="#222" stroke-width="2"/><rect x="94" y="54" width="22" height="14" rx="4" fill="none" stroke="#222" stroke-width="2"/>
    <path d="M78 86 Q90 ${pose === 'sponsor' ? 90 : 96} 102 86" stroke="#3a2010" stroke-width="3" fill="none"/>
    <path d="M52 50 Q90 14 128 50" fill="#6b4a2a"/>
    ${hand}
  </svg>`;
}

function episodeLines() {
  const m = Game.M(), L = [];
  L.push({ t: "Hi, I'm Tom Barrel, and this is The Dice Pile." });
  m.reviews.forEach(r => {
    const g = BY_ID[r.gid];
    L.push({ t: `Today we're looking at ${g.name}.`, gid: r.gid });
    L.push({ t: g.components, gid: r.gid });
    L.push({ t: "You'll like it if you like games.", gid: r.gid });
    L.push({ t: `I'm giving it ${r.fingers} finger${r.fingers > 1 ? 's' : ''}.`, gid: r.gid, fingers: r.fingers });
  });
  if (m.aside) L.push({ t: 'One more thing, folks. ' + m.aside.text, pose: 'lean' });
  L.push({ t: 'This episode is brought to you by ' + m.sponsor, pose: 'sponsor' });
  L.push({ t: 'See you next time on The Dice Pile.' });
  return L;
}

function channelLines(format, uid) {
  const it = S.items[uid], g = BY_ID[it.gid], you = S.name;
  const L = [{ t: `Hi, I'm you, and this is ${you}.`, me: true }, { t: `Today: ${g.name}.`, gid: it.gid, me: true }];
  const fingers = rand(3, 5);
  if (format === 'fingers') L.push({ t: g.components, gid: it.gid, me: true }, { t: `I'm giving it ${fingers} fingers.`, gid: it.gid, me: true, fingers }, { t: 'This video is brought to you by ' + pick(SPONSORS), me: true });
  if (format === 'runthrough') L.push({ t: 'Let me just set this up, nice and slowly, with both hands.', gid: it.gid, me: true }, { t: it.sealed ? 'I will not be opening it. You can imagine the components.' : 'Here are the components. Look at them.', gid: it.gid, me: true }, { t: "If this sounds like your kind of thing, you should buy it.", gid: it.gid, me: true });
  if (format === 'stylish') L.push({ t: '[slow dolly shot of the box, cello music]', gid: it.gid, me: true }, { t: 'It is, in a word, fine. In two words: do not.', gid: it.gid, me: true }, { t: '[cut to black]', me: true });
  return L;
}

function tvScreenHTML() {
  const T = UI.tv, m = Game.M();
  if (T.mode === 'menu') {
    const home = Game.home();
    return `<div class="tv-menu">
      <div class="tv-logo">THE DICE PILE <small>with Tom Barrel</small></div>
      <div class="tv-opts">
        <button class="tv-btn" data-act="tvWatch">▶ ${m.watched ? 'Rewatch' : 'Watch'} this month's upload ${m.watched ? '' : '<i class="new">NEW</i>'}<small>Twenty-ish seconds. Three reviews and a sponsor read. Free.</small></button>
        <button class="tv-btn" data-act="tvChannel" ${home.length ? '' : 'disabled'}>● Film your channel: <b>${esc(S.name)}</b><small>Costs 2 attention. ${S.films.length} episode${S.films.length === 1 ? '' : 's'} so far.</small></button>
      </div>
      <div class="tv-reviews">${m.reviews.map(r => `<span>${esc(BY_ID[r.gid].name)} ✋${m.watched ? r.fingers : '?'}</span>`).join('')}</div>
    </div>`;
  }
  if (T.mode === 'setup') {
    const home = Game.home();
    return `<div class="tv-setup"><h3>Film an episode of <b>${esc(S.name)}</b></h3>
      <div class="formats">${Object.entries(CHANNEL_FORMATS).map(([k, f]) => `<button class="fmt ${T.format === k ? 'on' : ''}" data-act="tvFormat" data-v="${k}"><b>${f.name}</b><small>${f.desc}</small></button>`).join('')}</div>
      <label>Feature: <select id="filmGame">${home.map(it => `<option value="${it.uid}" ${T.uid === it.uid ? 'selected' : ''}>${esc(BY_ID[it.gid].name)}${it.sealed ? ' (sealed)' : ''}</option>`).join('')}</select></label>
      <div class="row"><button class="btn ghost" data-act="tvMenu">Back</button><button class="btn primary" data-act="tvFilm" ${T.format ? '' : 'disabled'}>Roll camera <span class="cost">2◉</span></button></div></div>`;
  }
  if (T.mode === 'play') {
    const line = T.lines[T.i] || T.lines[T.lines.length - 1];
    return `<div class="tv-play ${T.channel ? 'mine' : ''}" data-act="tvNext">
      <div class="tv-bug">${T.channel ? '● REC · ' + esc(S.name) : 'THE DICE PILE'}</div>
      <div class="tv-host">${T.channel ? youSVG(line.fingers) : tomSVG(line.fingers, line.pose)}</div>
      <div class="tv-prop">${line.gid ? coverSVG(line.gid) : ''}${line.fingers ? `<div class="fingers">✋ ${line.fingers}</div>` : ''}</div>
      <div class="caption">${esc(line.t)}</div>
      <div class="tv-progress"><i style="width:${((T.i + 1) / T.lines.length) * 100}%"></i></div>
      <button class="btn mini skip" data-act="tvSkip">Skip ▸▸</button>
    </div>`;
  }
  if (T.mode === 'filmDone') {
    const f = S.films[S.films.length - 1];
    return `<div class="tv-setup"><h3>Uploaded: ${esc(S.name)} — ${esc(BY_ID[f.gid].name)}</h3>
      <div class="comments">${f.comments.map(c => `<div class="cmt"><span class="u">u/${esc(pick(USERS))}</span><p>${esc(c)}</p></div>`).join('')}</div>
      <div class="row"><button class="btn primary" data-act="tvMenu">Back to the TV</button></div></div>`;
  }
  return '';
}

function youSVG(fingers) {
  let hand = '';
  if (fingers) hand = `<g transform="translate(150 70)">${Array.from({ length: fingers }, (_, i) => `<rect x="${-22 + i * 11}" y="-44" width="9" height="36" rx="4.5" fill="#e8b88f"/>`).join('')}<rect x="-24" y="-14" width="${fingers * 11 + 4}" height="34" rx="10" fill="#e8b88f"/></g>`;
  return `<svg class="tom" viewBox="0 0 200 220"><rect x="30" y="110" width="120" height="110" rx="40" fill="#4a6fa5"/><circle cx="90" cy="70" r="38" fill="#e8b88f"/><path d="M52 60 Q90 20 128 60 L128 46 Q90 10 52 46Z" fill="#3a2a1a"/><circle cx="76" cy="70" r="4" fill="#222"/><circle cx="104" cy="70" r="4" fill="#222"/><path d="M78 90 Q90 98 102 90" stroke="#3a2010" stroke-width="3" fill="none"/>${hand}</svg>`;
}

function startPlayback(lines, onDone, channel) {
  stopPlayback();
  UI.tv = { ...UI.tv, mode: 'play', lines, i: 0, onDone, channel };
  const tick = () => {
    UI.tv.i++;
    if (UI.tv.i >= UI.tv.lines.length) { finishPlayback(); return; }
    drawTV();
  };
  UI.tv.timer = setInterval(tick, 2300);
  drawTV();
}
function stopPlayback() { if (UI.tv.timer) clearInterval(UI.tv.timer); UI.tv.timer = null; }
function finishPlayback() { stopPlayback(); const f = UI.tv.onDone; UI.tv.mode = 'menu'; if (f) f(); if (UI.view === 'tv') drawTV(); }
function drawTV() { const el = $('#tvScreen'); if (el) el.innerHTML = tvScreenHTML(); }

// ---------- peel ----------
function openPeel(uid) {
  const it = S.items[uid]; if (!it || !it.sealed) return;
  if (S.attention < 1) { showToast('No attention left this month.', 'warn'); sfx('nope'); return; }
  const g = BY_ID[it.gid];
  openModal(`<div class="peel"><div class="peel-box" id="peelBox">${coverSVG(it.gid)}<div class="wrap"></div><div class="curl"></div></div>
    <div class="peel-side"><h2>${esc(g.name)}</h2>
      <p>New in shrink. ${it.bagged ? 'In an archival bag, even. ' : ''}${g.family === 'patchwerk' && Object.values(S.items).filter(x => BY_ID[x.gid].family === 'patchwerk').length > 1 ? 'It is part of a set. ' : ''}The plastic comes off, the box scuffs, and you will tell everyone you had a great time.</p>
      <p class="muted">You never play a board game inside Shrink. Opening is a confession you can make for Clout.</p>
      <div class="row" id="peelBtns"><button class="btn ghost" data-act="closeModal">Keep it sealed</button><button class="btn primary" data-act="peelGo" data-uid="${uid}">Peel <span class="cost">1◉</span></button></div>
    </div></div>`, { cls: 'wide' });
}
function peelGo(uid) {
  UI.modalLock = true;
  $('#peelBtns').innerHTML = '<p class="muted">Peeling…</p>';
  $('#peelBox').classList.add('peeling');
  sfx('peel');
  setTimeout(() => {
    const it = S.items[uid];
    Game.open(uid);
    $('#peelBox').classList.add('done');
    const line = pick(['It was a great night. Everyone had a great time.', 'You had a great time. You will say so in the comments.', 'Everyone loved it. Nobody remembers the rules.', 'Game night was great. The box is scuffed now. That is what great looks like.']);
    $('#peelBtns').innerHTML = `<p class="great">${line}</p><button class="btn primary" data-act="closeModal">Back to the shelf</button>`;
    UI.modalLock = false;
    UI.onClose = () => render();
    if (it) renderHUD();
  }, 2600);
}

// ---------- month flow ----------
function confirmEndMonth() {
  const left = S.attention;
  const unresolved = S.messages.filter(m => m.month === S.month && m.request && !m.resolved).length;
  openModal(`<h2>${S.month < 4 ? `End ${MONTHS[S.month - 1]}?` : 'End the run?'}</h2>
    <p>The wall will be photographed for the album.${left ? ` You still have <b>${left}</b> attention.` : ''}${unresolved ? ` <b>${unresolved}</b> message${unresolved > 1 ? 's' : ''} will go unanswered.` : ''}${!Game.M().posted ? ' You have not posted this month.' : ''}</p>
    ${S.month === 4 ? '<p class="muted">After this, the game shows you the rules it was using and scores the shelf you built.</p>' : ''}
    <div class="row end"><button class="btn ghost" data-act="closeModal">Not yet</button><button class="btn primary" data-act="endMonthGo">${S.month < 4 ? 'End the month' : 'Show me the rules'}</button></div>`);
}
function doEndMonth() {
  closeModal(true);
  stopPlayback(); UI.tv = { mode: 'menu' };
  const r = Game.endMonth();
  UI.selected = null; UI.cart = [];
  if (r.ended) { toastEl.innerHTML = ''; UI.view = 'ending'; UI.endPage = 0; UI.endData = Game.ending(); render(); sfx('ping'); return; }
  UI.view = 'room'; render();
  const m = Game.M();
  openModal(`<div class="month-card"><small>Month ${S.month} of 4</small><h2>${MONTHS[S.month - 1]}</h2>
    <p class="muted">The wall was photographed for the album.</p>
    <ul>${r.report.map(x => `<li>${esc(x)}</li>`).join('')}<li>The Dice Pile has a new upload. The shop highlights whatever Tom talked about.</li><li>${Game.unread()} new message${Game.unread() === 1 ? '' : 's'} on the laptop.</li>${S.month === 4 ? '<li>Last month. Make it on purpose.</li>' : ''}</ul>
    <div class="row end"><button class="btn primary" data-act="closeModal">Back to the desk</button></div></div>`);
  sfx('notify');
}

// ---------- ending ----------
function endingHTML() {
  const E = UI.endData || Game.ending();
  const pages = [endAlbum, endRules, endNotes, endDefined, endTotal];
  const p = Math.min(UI.endPage, pages.length - 1);
  return `<div class="ending"><div class="album-book">${pages[p](E)}</div>
    <div class="end-nav">${p > 0 ? '<button class="btn ghost" data-act="endPrev">← Back</button>' : '<span></span>'}
      <span class="dots">${pages.map((_, i) => `<i class="${i === p ? 'on' : ''}"></i>`).join('')}</span>
      ${p < pages.length - 1 ? '<button class="btn primary" data-act="endNext">Turn the page →</button>' : '<button class="btn primary" data-act="playAgain">New Game</button>'}</div></div>`;
}
function endAlbum() {
  return `<h2>The Album</h2><p class="muted">Four shelfies, one per month. Every photo was saved, whether the comments were kind or not.</p>
    <div class="album">${S.album.map(a => { const post = S.posts.find(p => p.month === a.month); return `<figure>${miniShelf(a.snapshot, 'md')}<figcaption>${MONTHS[a.month - 1]}${post ? ` · ▲${post.upvotes}` : ' · not posted'}</figcaption></figure>`; }).join('')}</div>`;
}
function endRules(E) {
  const who = { sub: 'the sub', spouse: SPOUSE, tom: 'Tom' };
  const honest = Object.keys(S.canon.honest).filter(k => S.canon.honest[k]).map(k => who[k]);
  const liars = Object.keys(S.canon.honest).filter(k => !S.canon.honest[k]).map(k => who[k]);
  return `<h2>The Rules It Was Using</h2>
    <p class="muted">Under oath this run: <b>${honest.join(' and ')}</b>. Lying: <b>${liars.join(' and ')}</b>.</p>
    <div class="rules">${S.canon.live.map((id, i) => { const r = RULES[id], s = E.final.byRule[id]; return `<div class="rule ${s.pts > 0 ? 'pos' : s.pts < 0 ? 'neg' : ''}" style="animation-delay:${i * 0.25}s">
      <div class="pts">${s.pts > 0 ? '+' : ''}${s.pts}</div><div><h4>${esc(r.title)} ${r.stable ? '<small>always</small>' : ''}</h4><p>${esc(r.plain)}</p><p class="small muted">${esc(s.detail)}</p></div></div>`; }).join('')}</div>`;
}
function endNotes(E) {
  return `<h2>Your Notes</h2>
    ${E.theories.length ? `<div class="stickies">${E.theories.map((t, i) => `<div class="sticky c${i % 4} ${t.pts > 0 ? 'right' : t.pts < 0 ? 'wrong' : ''}"><p>${esc(t.text)}</p><small>${esc(t.verdict)}</small><b class="tp">${t.pts > 0 ? '+' : ''}${t.pts}</b></div>`).join('')}</div>
      <p class="muted">Theories: <b>${E.theoryPts > 0 ? '+' : ''}${E.theoryPts}</b></p>`
    : '<p>You wrote nothing down. Safer than being confidently normal. Worse than being right.</p>'}`;
}
function endDefined(E) {
  const q = (Q, empty) => {
    if (!Q) return `<p class="muted">${empty}</p>`;
    if (Q.hint) { const who = Q.hint.oracle === 'spouse' ? SPOUSE : Q.hint.oracle === 'tom' ? 'Tom Barrel' : 'a commenter'; return `<blockquote>“${esc(Q.hint.text)}” <cite>— ${who}, ${MONTHS[Q.hint.month - 1]}</cite></blockquote>`; }
    return '<p class="muted">Nobody told you. You did this on your own.</p>';
  };
  const ord = o => o.gids.map(g => esc(BY_ID[g].name)).join(' + ');
  return `<h2>The Purchase That Defined You</h2>
    <div class="defined">
      <div class="dcard good"><small>Scored the most</small>${E.best ? `<h3>${ord(E.best.order)}</h3><p class="small muted">${MONTHS[E.best.order.month - 1]} · ${money(E.best.order.total)}</p>${q(E.bestQuote, '')}` : '<h3>Nothing you bought helped.</h3>'}</div>
      <div class="dcard bad"><small>Cost the most</small>${E.worst ? `<h3>${ord(E.worst.order)}</h3><p class="small muted">${MONTHS[E.worst.order.month - 1]} · ${money(E.worst.order.total)}</p>${q(E.worstQuote, '')}` : '<h3>Nothing you bought hurt. Suspicious.</h3>'}</div>
    </div>
    <ul class="roast">${E.roasts.map(r => `<li>${esc(r)}</li>`).join('')}
      ${E.pendingPledges.length ? `<li>${E.pendingPledges.length === 1 ? 'One Kickstarter is' : E.pendingPledges.length + ' Kickstarters are'} still in the mail. Any day now.</li>` : ''}</ul>`;
}
function endTotal(E) {
  const best = Game.best();
  const bad = E.total < 5;
  return `<div class="total ${bad ? 'bad' : ''}">
    ${bad ? `<div class="stay">${miniShelf(S.album[S.album.length - 1].snapshot, 'md')}<p class="muted">The camera stays on the shelf.</p></div>` : ''}
    <small>Canon</small><div class="big">${E.total}</div><h2>${esc(E.rank)}</h2>
    <p>Rules ${E.final.total >= 0 ? '+' : ''}${E.final.total} · Theories ${E.theoryPts >= 0 ? '+' : ''}${E.theoryPts}</p>
    <p class="clout-final">Clout: ✦ ${E.clout}. <span class="muted">It was never the score.</span></p>
    ${best && best.score != null ? `<p class="muted">Best: ${best.score} (${esc(best.rank)}) across ${best.runs} run${best.runs === 1 ? '' : 's'}.</p>` : ''}
    <p class="muted small">New Game keeps the Patchwerk ladder, the Monopology tax, and the five-Unó trap, and reshuffles the rest. The joke is the same. The law is not.</p>
  </div>`;
}

// ---------- intro ----------
function showIntro() {
  openModal(`<div class="intro"><h2>You are trying to win at collecting.</h2>
    <p>Your phone shows <b>Clout</b>. It goes up when you do what a respectable hobbyist does: buy the hot game, open it, agree with the reviewer, keep Monopology off the shelf. It feels like the score. <b>It is not the score.</b></p>
    <p>The real score is hidden. A handful of rules, rolled at the start of the run. Three of them never change:</p>
    <ul><li>Several copies of <b>Patchwerk</b> score more than one. Opening any of them ruins the set.</li><li>Owning <b>Monopology</b> loses points. More editions lose more.</li><li>Exactly <b>five Unó variants</b> can be worth a lot. Clout will hate it the entire time.</li></ul>
    <p>The rest you have to figure out from the comments, ${SPOUSE}, and Tom Barrel. Only some of them are telling the truth. Write your theories in the notes app. Spend your tests on the weird buys.</p>
    <p class="muted">Click the wall, the laptop, or the TV. <kbd>Esc</kbd> brings you back to the desk. Four months.</p>
    <div class="row end"><button class="btn primary" data-act="closeModal">Start September</button></div></div>`, { cls: 'wide' });
}

// ---------- input ----------
const ACTIONS = {
  newGame() { const n = ($('#chan') || {}).value; Game.newGame(n); UI.view = 'room'; UI.app = 'shop'; UI.cart = []; UI.selected = null; UI.tv = { mode: 'menu' }; render(); showIntro(); },
  continue() { if (Game.load()) { UI.view = 'room'; render(); } },
  go(d) { UI.view = d.v; if (d.v === 'laptop' && UI.app === 'inbox') markRead(); render(); },
  goNotes() { UI.view = 'laptop'; UI.app = 'notes'; render(); },
  toRoom() { leaveView(); },
  endMonth() { confirmEndMonth(); },
  endMonthGo() { doEndMonth(); },
  mute() { UI.muted = !UI.muted; try { localStorage.setItem('shrink.muted', UI.muted ? '1' : '0'); } catch (e) { /* */ } renderHUD(); },
  closeModal() { closeModal(); },

  light(d) { Game.toggleLight(+d.i); render(); },
  deselect() { UI.selected = null; render(); },
  peel(d) { openPeel(d.uid); },
  peelGo(d) { peelGo(d.uid); },
  sleeve(d) { Game.sleeve(d.uid); render(); },
  bag(d) { Game.bag(d.uid); render(); },
  mailTom(d) { if (Game.mailTom(d.uid)) UI.selected = null; render(); },
  sell(d) { if (Game.sell(d.uid)) UI.selected = null; render(); },
  give(d) { if (Game.give(d.uid)) UI.selected = null; render(); },
  toFloor(d) { Game.move(d.uid, 'pile'); render(); },

  app(d) { UI.app = d.v; if (d.v === 'inbox') markRead(); render(); },
  cart(d) { UI.cart.push(d.gid); sfx('click'); render(); },
  uncart(d) { UI.cart.splice(+d.i, 1); render(); },
  checkout() { if (Game.checkout(UI.cart)) UI.cart = []; render(); },
  pledge(d) { Game.pledge(d.gid, !!d.allin); render(); },
  post() { const p = Game.post(); if (p) { UI.lastPost = p; sfx('notify'); } render(); },
  respond(d) {
    const m = S.messages.find(x => x.id === +d.id); if (!m) return;
    if (!d.yes) { Game.respond(m.id, false); render(); return; }
    const t = m.request.type;
    if (t === 'freeCube') return openPicker('Give one away', Game.home(), uid => { Game.respond(m.id, true, uid); render(); }, 'It leaves the house for good. It counts as a gift.');
    if (t === 'mailTom') return openPicker('Mail Tom a sealed copy', Game.home().filter(i => i.sealed), uid => { Game.respond(m.id, true, uid); render(); }, 'It comes back next month, sealed, bagged, fingers written on the plastic.');
    if (t === 'offer' && !S.items[m.request.uid]) { showToast('You do not have that one any more.', 'warn'); Game.respond(m.id, false); render(); return; }
    Game.respond(m.id, true); render();
  },
  pick(d) { const cb = UI.picker; UI.picker = null; closeModal(true); if (cb) cb(d.uid); },
  notePin() { const el = $('#noteText'); if (!el) return; const n = Game.addNote(el.value); if (n) sfx('click'); render(); const ni = $('#noteText'); if (ni) ni.focus(); },
  noteDel(d) { Game.removeNote(+d.i); render(); },
  test(d) { const t = Game.runTest(d.v); render(); if (t) openModal(`<div class="test-result r-${t.result.replace(/ /g, '-')}"><small>${TEST_METHODS[t.method].name}</small><h2>${t.result.toUpperCase()}</h2><p>${esc(t.flavor)}</p><p class="muted small">That is what ${t.gids.map(g => esc(BY_ID[g].name)).join(' + ')} did to the hidden score. It does not tell you why.</p><div class="row end"><button class="btn primary" data-act="closeModal">Write that down</button></div></div>`); },

  tvWatch() { startPlayback(episodeLines(), () => { Game.watch(); renderHUD(); }); },
  tvChannel() { UI.tv = { mode: 'setup', format: UI.tv.format || null }; drawTV(); },
  tvFormat(d) { const sel = $('#filmGame'); UI.tv.uid = sel ? sel.value : null; UI.tv.format = d.v; drawTV(); },
  tvMenu() { stopPlayback(); UI.tv = { mode: 'menu' }; drawTV(); },
  tvFilm() {
    const sel = $('#filmGame'); const uid = sel && sel.value; const fmt = UI.tv.format;
    if (!fmt || !uid) return;
    if (S.attention < 2) { showToast('Filming takes 2 attention. You do not have it.', 'warn'); sfx('nope'); return; }
    const lines = channelLines(fmt, uid);
    startPlayback(lines, () => { Game.film(fmt, uid); UI.tv.mode = 'filmDone'; renderHUD(); }, true);
  },
  tvSkip() { finishPlayback(); },
  tvNext() { if (UI.tv.mode !== 'play') return; UI.tv.i++; if (UI.tv.i >= UI.tv.lines.length) finishPlayback(); else drawTV(); },

  endNext() { UI.endPage++; render(); sfx('click'); },
  endPrev() { UI.endPage = Math.max(0, UI.endPage - 1); render(); },
  playAgain() { UI.view = 'title'; render(); },
};

function markRead() { S.messages.forEach(m => { m.read = true; }); Game.save(); }

function leaveView() {
  if (UI.view === 'tv') { stopPlayback(); UI.tv = { mode: 'menu' }; }
  if (['shelf', 'laptop', 'tv'].includes(UI.view)) { UI.view = 'room'; UI.selected = null; render(); }
}

stage.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  // Clicks inside the TV player advance it, except for its own buttons.
  if (el.dataset.act === 'tvNext' && e.target.closest('button')) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.stopPropagation(); fn(el.dataset, el); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalOpen()) closeModal();
    else leaveView();
  }
  if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'noteText') ACTIONS.notePin();
  if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'chan') ACTIONS.newGame();
});

// Drag boxes between cubes and the floor.
stage.addEventListener('pointerdown', e => {
  if (UI.view !== 'shelf' || modalOpen()) return;
  const box = e.target.closest('.box[data-uid]');
  if (!box || box.classList.contains('ghost')) return;
  e.preventDefault();
  const uid = box.dataset.uid, sx = e.clientX, sy = e.clientY;
  let ghost = null, over = null;
  const target = ev => { const el = document.elementFromPoint(ev.clientX, ev.clientY); return el ? el.closest('[data-drop]') : null; };
  const mv = ev => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
      ghost = box.cloneNode(true); ghost.classList.add('ghost'); ghost.classList.remove('drift');
      stage.appendChild(ghost); box.classList.add('dragging');
    }
    const p = toStage(ev.clientX, ev.clientY);
    ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
    const t = target(ev);
    if (t !== over) { if (over) over.classList.remove('over'); over = t; if (over) over.classList.add('over'); }
  };
  const up = ev => {
    window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
    if (ghost) {
      ghost.remove(); if (over) over.classList.remove('over');
      const t = target(ev);
      if (t) Game.move(uid, t.dataset.drop);
      render();
    } else { UI.selected = UI.selected === uid ? null : uid; sfx('click'); render(); }
  };
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
});

// ---------- boot ----------
fit();
render();
