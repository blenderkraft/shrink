// Shrink — box art. Eight covers are drawn so the jokes are recognizable. The rest are a colored box with a title.

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function wrapTitle(name, max) {
  const words = name.split(' '); const lines = []; let cur = '';
  words.forEach(w => { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) lines.push(cur);
  return lines;
}

const COVER_ART = {
  patchwerk: () => {
    const cols = ['#c0392b', '#2e86ab', '#f2c14e', '#5b8e3e', '#8e44ad', '#e67e22', '#16a085', '#d35400', '#34495e'];
    let patches = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const c = cols[(x * 3 + y * 7) % cols.length];
      patches += `<rect x="${22 + x * 31}" y="${48 + y * 26}" width="29" height="24" rx="3" fill="${c}" stroke="#3b2410" stroke-width="1.5" stroke-dasharray="3 2"/>`;
    }
    return `<rect width="200" height="200" fill="#e9c46a"/>
      <rect x="14" y="40" width="172" height="146" rx="8" fill="#f4e1b0" stroke="#3b2410" stroke-width="3"/>
      ${patches}
      <circle cx="40" cy="176" r="7" fill="#2e86ab" stroke="#3b2410" stroke-width="2"/><circle cx="37" cy="174" r="1.4" fill="#3b2410"/><circle cx="43" cy="178" r="1.4" fill="#3b2410"/>
      <circle cx="160" cy="176" r="7" fill="#c0392b" stroke="#3b2410" stroke-width="2"/><circle cx="157" cy="174" r="1.4" fill="#3b2410"/><circle cx="163" cy="178" r="1.4" fill="#3b2410"/>
      <rect x="20" y="8" width="160" height="30" rx="15" fill="#3b2410"/>
      <text x="100" y="30" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#f4e1b0" letter-spacing="1">PATCHWERK</text>`;
  },
  monopology: () => `<rect width="200" height="200" fill="#f3efe4"/>
      <rect x="0" y="0" width="200" height="200" fill="none" stroke="#1b6b3a" stroke-width="10"/>
      ${['#8b4513', '#9fd5ef', '#d63384', '#f39c12', '#e74c3c', '#f1c40f', '#27ae60', '#2c3e9e'].map((c, i) => `<rect x="${10 + i * 22.5}" y="150" width="22.5" height="14" fill="${c}"/>`).join('')}
      <rect x="20" y="52" width="160" height="44" fill="#d23a2c" transform="rotate(-12 100 74)"/>
      <text x="100" y="84" text-anchor="middle" transform="rotate(-12 100 74)" font-family="Georgia, serif" font-weight="700" font-size="21" fill="#fff">MONOPOLOGY</text>
      <circle cx="150" cy="122" r="14" fill="#222"/><rect x="138" y="104" width="24" height="14" fill="#222"/><rect x="132" y="116" width="36" height="4" fill="#222"/>
      <path d="M140 128 q10 8 20 0" stroke="#fff" stroke-width="2" fill="none"/>
      <text x="100" y="184" text-anchor="middle" font-family="Georgia, serif" font-size="8.5" fill="#1b6b3a">THE FAST-DEALING PROPERTY ARGUMENT</text>`,
  uno: () => `<rect width="200" height="200" fill="#111"/>
      <rect x="34" y="40" width="80" height="120" rx="10" fill="#1f7a3d" transform="rotate(-14 74 100)"/>
      <rect x="62" y="36" width="80" height="120" rx="10" fill="#2e6fd1" transform="rotate(4 102 96)"/>
      <rect x="88" y="44" width="80" height="120" rx="10" fill="#e23b2e" transform="rotate(16 128 104)"/>
      <ellipse cx="100" cy="100" rx="80" ry="44" fill="#e23b2e" stroke="#fff" stroke-width="6" transform="rotate(-18 100 100)"/>
      <text x="100" y="116" text-anchor="middle" transform="rotate(-18 100 100)" font-family="Fredoka, sans-serif" font-weight="700" font-size="50" fill="#ffd400" stroke="#111" stroke-width="3" paint-order="stroke">UNÓ</text>`,
  brass: () => `<rect width="200" height="200" fill="#2a1d14"/>
      <rect y="120" width="200" height="80" fill="#3d2b1e"/>
      <path d="M0 140 H200" stroke="#5d7a7a" stroke-width="10"/>
      <rect x="20" y="70" width="14" height="70" fill="#1a120c"/><rect x="44" y="50" width="16" height="90" fill="#1a120c"/><rect x="150" y="60" width="14" height="80" fill="#1a120c"/>
      <rect x="70" y="96" width="70" height="44" fill="#1a120c"/>
      ${[0, 1, 2, 3].map(i => `<rect x="${76 + i * 16}" y="104" width="8" height="10" fill="#e6b85c" opacity=".8"/>`).join('')}
      <circle cx="30" cy="54" r="12" fill="#6b5a4a" opacity=".5"/><circle cx="54" cy="34" r="16" fill="#6b5a4a" opacity=".4"/><circle cx="160" cy="42" r="12" fill="#6b5a4a" opacity=".45"/>
      <text x="100" y="40" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="40" fill="#e6b85c" letter-spacing="3">BRASS</text>
      <text x="100" y="62" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="14" fill="#e6b85c">Birminghammer</text>
      <g transform="translate(118 150) rotate(-30)"><rect x="-3" y="0" width="6" height="34" fill="#8a6a3b"/><rect x="-14" y="-8" width="28" height="12" rx="2" fill="#b0b6bb"/></g>`,
  arks: () => {
    let stars = '';
    for (let i = 0; i < 40; i++) stars += `<circle cx="${(i * 47) % 200}" cy="${(i * 83) % 200}" r="${(i % 3) * 0.5 + 0.5}" fill="#fff" opacity=".7"/>`;
    return `<rect width="200" height="200" fill="#0d1124"/>${stars}
      ${[90, 70, 50, 30].map((r, i) => `<path d="M ${100 - r} 150 A ${r} ${r} 0 0 1 ${100 + r} 150" fill="none" stroke="${['#ff8a3d', '#ffb26b', '#e0503a', '#ffd9a8'][i]}" stroke-width="${8 - i}"/>`).join('')}
      <circle cx="100" cy="150" r="10" fill="#ffd9a8"/>
      <path d="M60 70 l10 -6 l10 6 l-10 4z" fill="#ffb26b"/>
      <text x="100" y="44" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="38" fill="#ff8a3d" letter-spacing="10">ARKS</text>
      <text x="100" y="188" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="9" fill="#ffd9a8" letter-spacing="2">HAVE YOU HEARD OF IT</text>`;
  },
  gloomhavent: () => `<rect width="200" height="200" fill="#26282c"/>
      <path d="M0 200 L40 120 L70 150 L100 90 L130 140 L160 110 L200 200Z" fill="#1a1b1e"/>
      <circle cx="100" cy="110" r="38" fill="#3b3f45"/>
      <ellipse cx="86" cy="104" rx="7" ry="5" fill="#c9b37e"/><ellipse cx="114" cy="104" rx="7" ry="5" fill="#c9b37e"/>
      <path d="M82 126 q18 12 36 0" stroke="#c9b37e" stroke-width="3" fill="none"/>
      <path d="M70 86 l-14 -24 M130 86 l14 -24" stroke="#3b3f45" stroke-width="8" stroke-linecap="round"/>
      <text x="100" y="40" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="26" fill="#c9b37e">GLOOMHAVEN'T</text>
      <rect x="40" y="166" width="120" height="18" fill="#c9b37e"/><text x="100" y="179" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#26282c">22 LBS • 95 SCENARIOS • 0 FINISHED</text>`,
  mage_knave: () => `<rect width="200" height="200" fill="#2b2050"/>
      <circle cx="100" cy="100" r="80" fill="#3c2d6b"/>
      <path d="M100 48 C70 48 62 80 64 110 L76 150 H124 L136 110 C138 80 130 48 100 48Z" fill="#9aa3b5" stroke="#1d1738" stroke-width="3"/>
      <rect x="74" y="92" width="52" height="8" fill="#1d1738"/><rect x="96" y="100" width="8" height="40" fill="#1d1738"/>
      <path d="M100 48 l-6 -18 l12 0z" fill="#e8d27a"/>
      <g transform="translate(150 60) rotate(30)"><rect x="-3" y="0" width="6" height="90" fill="#cfd6e3"/><rect x="-12" y="84" width="24" height="5" fill="#e8d27a"/></g>
      <text x="100" y="30" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="24" fill="#e8d27a" letter-spacing="2">MAGE KNAVE</text>
      <text x="100" y="186" text-anchor="middle" font-family="Georgia, serif" font-size="10" fill="#e8d27a">THE RELIC • REQUIRED</text>`,
  marvelous: () => {
    const hero = (x, c) => `<g transform="translate(${x} 110)"><circle cy="-10" r="13" fill="#f2c9a0"/><rect x="-14" y="2" width="28" height="34" rx="6" fill="${c}"/><rect x="-14" y="-24" width="28" height="9" fill="${c}"/>
      <rect x="-12" y="36" width="9" height="16" fill="#333"/><rect x="3" y="36" width="9" height="16" fill="#333"/>
      <path d="M-8 52 q-10 6 -14 2 M8 52 q10 8 14 0" stroke="#fff" stroke-width="2" fill="none"/></g>`;
    return `<rect width="200" height="200" fill="#ffe04a"/>
      <polygon points="100,20 118,70 172,60 132,98 168,140 116,126 100,180 84,126 32,140 68,98 28,60 82,70" fill="#e5352b"/>
      ${hero(56, '#1f4fbf')}${hero(100, '#2e9e4a')}${hero(144, '#7b2fbf')}
      <text x="100" y="38" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="22" fill="#1f4fbf" stroke="#fff" stroke-width="3" paint-order="stroke">MARVELOUS</text>
      <text x="100" y="190" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="26" fill="#fff" stroke="#1f4fbf" stroke-width="4" paint-order="stroke">UNTIED</text>`;
  },
};

function genericCover(g) {
  const lines = wrapTitle(g.name, g.size === 'tiny' ? 12 : 14).slice(0, 4);
  const y0 = 100 - (lines.length - 1) * 13;
  return `<rect width="200" height="200" fill="${g.color}"/>
    <rect x="10" y="10" width="180" height="180" fill="none" stroke="${g.ink}" stroke-opacity=".35" stroke-width="2"/>
    <path d="M0 160 L200 130 L200 200 L0 200Z" fill="${g.ink}" opacity=".12"/>
    ${lines.map((l, i) => `<text x="100" y="${y0 + i * 26}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="22" fill="${g.ink}">${esc(l)}</text>`).join('')}
    <text x="100" y="182" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="9" fill="${g.ink}" opacity=".7" letter-spacing="2">${g.ks ? 'KICKSTARTER EXCLUSIVE' : g.mass ? 'AGES 7 AND UP' : g.heavy ? 'WEIGHT 4.2 / 5' : 'A BOARD GAME'}</text>`;
}

function coverSVG(gid, cls = '') {
  const g = BY_ID[gid];
  const art = COVER_ART[gid] ? COVER_ART[gid]() : genericCover(g);
  return `<svg class="cover ${cls}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(g.name)}">${art}</svg>`;
}
