// Shrink — state, actions, month flow, comments, tests, ending.

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function weightedPick(items, w) { const tot = items.reduce((s, x) => s + w(x), 0); let r = Math.random() * tot; for (const x of items) { r -= w(x); if (r <= 0) return x; } return items[items.length - 1]; }
const money = n => (n < 0 ? '-$' + (-n) : '$' + n);

const SAVE_KEY = 'shrink.save.v1';
const BEST_KEY = 'shrink.best.v1';

let S = null;
const listeners = { clout: [], toast: [] };
const emit = (k, ...a) => listeners[k].forEach(f => f(...a));

const Game = {
  get S() { return S; },
  on(k, f) { listeners[k].push(f); },

  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } },
  load() { try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false; S = JSON.parse(raw); return !!S && !S.ended; } catch (e) { return false; } },
  hasSave() { try { const raw = localStorage.getItem(SAVE_KEY); return !!raw && !JSON.parse(raw).ended; } catch (e) { return false; } },
  best() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || 'null'); } catch (e) { return null; } },

  newGame(name) {
    S = {
      name: (name || 'Shelf Talk').slice(0, 24), month: 1, attention: ATTENTION, money: START_MONEY, clout: 100, testsLeft: TESTS,
      items: {}, nextUid: 1, placeCounter: 1, orders: [], nextOrder: 1, lastOrderId: null, removed: [],
      lights: Array(CUBES).fill(false), films: [], spouse: { complied: 0, ignored: 0 }, posts: [], messages: [], nextMsg: 1,
      hints: [], notes: [], album: [], tests: [], canon: rollCanon(), months: {}, debtWarned: false, ended: false,
      senderPlan: null, runNo: ((Game.best() || {}).runs || 0) + 1,
    };
    const start = [['catman', false, 12], ['pandemonium', false, 13], ['ticket', true, 8], ['wingspam', false, 9]];
    start.forEach(([gid, sealed, cube]) => addItem(gid, { sealed, loc: { type: 'cube', cube }, starter: true, price: BY_ID[gid].price, month: 0 }));
    const plan = shuffle(['sub', 'tom']);
    S.senderPlan = [plan[0], 'spouse', plan[1], pick(['spouse', 'sub', 'tom'])];
    setupMonth();
    Game.save();
  },

  // ---------- derived ----------
  M() { return S.months[S.month]; },
  cube(i) { return Object.values(S.items).filter(it => it.loc.type === 'cube' && it.loc.cube === i).sort((a, b) => a.placedAt - b.placedAt); },
  cubeLoad(i) { return Game.cube(i).reduce((s, it) => s + SIZE_UNITS[BY_ID[it.gid].size], 0); },
  pile() { return Object.values(S.items).filter(it => it.loc.type === 'pile').sort((a, b) => a.placedAt - b.placedAt); },
  inMail() { return Object.values(S.items).filter(it => it.loc.type === 'mail'); },
  atTom() { return Object.values(S.items).filter(it => it.loc.type === 'tom'); },
  home() { return Object.values(S.items).filter(it => it.loc.type === 'cube' || it.loc.type === 'pile'); },
  ownedCount(gid) { return Object.values(S.items).filter(it => it.gid === gid).length; },
  emptyCubes() { let n = 0; for (let i = 0; i < CUBES; i++) if (!Game.cube(i).length) n++; return n; },
  review(gid) { return (Game.M().reviews || []).find(r => r.gid === gid); },
  isPraised(gid) { const r = Game.review(gid); return !!r && r.fingers >= 4; },
  isHot(gid) { return Game.M().hot.includes(gid); },
  priceOf(gid) { const sale = Game.M().sale[gid]; const p = BY_ID[gid].price; return sale ? Math.round(p * (1 - sale)) : p; },
  sellPrice(it) {
    const g = BY_ID[it.gid];
    if (!it.sealed) return Math.round(it.price * 0.45);
    if (g.ks || it.allIn) return Math.round((it.price) * 1.5);
    return Math.round(it.price * 0.8);
  },
  unread() { return S.messages.filter(m => !m.read).length; },
  pending() { return S.messages.filter(m => m.request && !m.resolved); },
  lastOrder() { return S.orders.find(o => o.id === S.lastOrderId) || null; },
  canAct(cost = 1) { return S.attention >= cost; },

  // ---------- actions ----------
  checkout(gids) {
    if (!gids.length) return fail('Your cart is empty.');
    if (Game.M().purchaseLock) return fail(`You told ${SPOUSE} you would not buy anything else this month.`);
    if (!Game.canAct(1)) return fail('No attention left this month.');
    const order = { id: S.nextOrder++, kind: 'shop', month: S.month, uids: [], total: 0, gids: gids.slice() };
    let clout = 0; const why = [];
    gids.forEach(gid => {
      const price = Game.priceOf(gid);
      const it = addItem(gid, { sealed: true, loc: { type: 'pile' }, price, orderId: order.id, month: S.month, tomPraised: Game.isPraised(gid), hot: Game.isHot(gid) });
      order.uids.push(it.uid); order.total += price;
      const [c, w] = buyClout(gid, it); clout += c; why.push([c, w]);
    });
    S.money -= order.total; S.attention -= 1;
    S.orders.push(order); S.lastOrderId = order.id;
    sfx('register');
    toast(`Order placed: ${gids.length === 1 ? BY_ID[gids[0]].name : gids.length + ' games'}. ${money(order.total)}. It arrived sealed.`);
    const lead = why.filter(([c]) => Math.sign(c) === Math.sign(clout)).sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]))[0];
    addClout(clout, lead ? lead[1] : 'Respectable purchase');
    afterSpend();
    return true;
  },

  pledge(gid, allIn) {
    if (Game.M().purchaseLock) return fail(`You told ${SPOUSE} you would not buy anything else this month.`);
    if (!Game.canAct(1)) return fail('No attention left this month.');
    const price = BY_ID[gid].price + (allIn ? ALL_IN_COST : 0);
    const order = { id: S.nextOrder++, kind: 'ks', month: S.month, uids: [], total: price, gids: [gid], allIn };
    const it = addItem(gid, { sealed: true, loc: { type: 'mail', arrives: S.month + 1 }, price, orderId: order.id, month: S.month, allIn, tomPraised: false, hot: false });
    order.uids.push(it.uid);
    S.money -= price; S.attention -= 1; S.orders.push(order); S.lastOrderId = order.id;
    sfx('register');
    toast(S.month >= 4 ? `Pledged. Estimated delivery: Q3 2027.` : `Pledged ${money(price)}. Your box ships next month. Probably.`);
    addClout(allIn ? 4 : 2, allIn ? 'All-in. Supporting creators.' : 'Supporting creators');
    afterSpend();
    return true;
  },

  open(uid) {
    const it = S.items[uid];
    if (!it || !it.sealed) return false;
    if (!Game.canAct(1)) return fail('No attention left this month.');
    it.sealed = false; it.bagged = false; it.openedMonth = S.month;
    S.attention -= 1;
    addClout(2, 'You had a great time');
    Game.save();
    return true;
  },

  sleeve(uid) {
    const it = S.items[uid]; if (!it || it.sleeved) return false;
    it.sleeved = true; S.money -= 4; sfx('crinkle'); toast(`Sleeved ${BY_ID[it.gid].name}. $4.`); Game.save(); return true;
  },

  bag(uid) {
    const it = S.items[uid]; if (!it || it.bagged || !it.sealed) return false;
    it.bagged = true; S.money -= 3; sfx('crinkle'); toast(`Archival bag over the shrink. $3.`); Game.save(); return true;
  },

  mailTom(uid, free) {
    const it = S.items[uid]; if (!it || !it.sealed) return fail('Tom only reviews sealed copies. He has standards, folks.');
    if (!free && !Game.canAct(1)) return fail('No attention left this month.');
    if (!free) S.attention -= 1;
    it.loc = { type: 'tom', returns: S.month + 1 };
    it.tomFingers = weightedPick([2, 3, 4, 5], f => ({ 2: 1, 3: 3, 4: 4, 5: 2 })[f]);
    toast(`${BY_ID[it.gid].name} is on its way to Tom. Back next month.`);
    addClout(1, 'Tom might notice you');
    Game.save(); return true;
  },

  sell(uid, opts = {}) {
    const it = S.items[uid]; if (!it) return false;
    if (!opts.free && !Game.canAct(1)) return fail('No attention left this month.');
    if (!opts.free) S.attention -= 1;
    const got = opts.price != null ? opts.price : Game.sellPrice(it);
    S.removed.push({ uid, gid: it.gid, how: 'sold', paid: it.price, got, sealed: it.sealed, orderId: it.orderId, month: S.month });
    delete S.items[uid];
    S.money += got; sfx('register');
    toast(`Sold ${BY_ID[it.gid].name} for ${money(got)}.`);
    if (it.sealed && got > it.price) addClout(1, 'Shrewd flip');
    Game.save(); return true;
  },

  give(uid, opts = {}) {
    const it = S.items[uid]; if (!it) return false;
    if (!opts.free && !Game.canAct(1)) return fail('No attention left this month.');
    if (!opts.free) S.attention -= 1;
    S.removed.push({ uid, gid: it.gid, how: 'gift', paid: it.price, got: 0, sealed: it.sealed, orderId: it.orderId, month: S.month });
    delete S.items[uid];
    toast(`Gave away ${BY_ID[it.gid].name}.`);
    addClout(2, 'Generous culling');
    Game.save(); return true;
  },

  move(uid, dest) {
    const it = S.items[uid]; if (!it) return false;
    if (dest === 'pile') { if (it.loc.type === 'pile') return false; it.loc = { type: 'pile' }; it.placedAt = S.placeCounter++; sfx('thunk'); Game.save(); return true; }
    const cube = +dest;
    if (it.loc.type === 'cube' && it.loc.cube === cube) return false;
    const units = SIZE_UNITS[BY_ID[it.gid].size];
    if (Game.cubeLoad(cube) + units > CUBE_CAP) return fail('That cube is full.');
    it.loc = { type: 'cube', cube }; it.placedAt = S.placeCounter++; it.placedMonth = S.month;
    sfx('thunk'); Game.save(); return true;
  },

  toggleLight(i) { S.lights[i] = !S.lights[i]; sfx('click'); Game.save(); },

  post() {
    const m = Game.M();
    if (m.posted) return fail('You can post once a month. The sub has rules. Not many.');
    if (!Game.canAct(1)) return fail('No attention left this month.');
    S.attention -= 1; m.posted = true;
    const c = buildCtx(S);
    const comments = [];
    for (let k = 0; k < 2; k++) { const h = takeHint('sub', c); if (h) comments.push({ user: pick(USERS), text: h.text, hint: true }); }
    shuffle(reactiveComments(c)).slice(0, 2).forEach(t => comments.push({ user: pick(USERS), text: t }));
    comments.push({ user: pick(USERS), text: pick(NOISE_COMMENTS) });
    const resp = respectability(c);
    const upvotes = Math.max(2, 60 + resp * 14 + rand(0, 40));
    const out = shuffle(comments).map(x => ({ ...x, score: rand(-3, 40) + (x.hint ? rand(5, 30) : 0) }));
    const post = { month: S.month, title: pick(['COMC, be gentle', 'Shelfie, month ' + S.month, 'Finally organized the Kallax', 'Haul + shelf update', 'Rate my wall (be honest)']), snapshot: snapshot(), comments: out, upvotes };
    S.posts.push(post);
    addClout(Math.max(-15, Math.min(25, resp)), resp >= 0 ? `${upvotes} upvotes` : 'The comments are not kind');
    Game.save();
    return post;
  },

  film(format, uid) {
    if (!Game.canAct(2)) return fail('Filming takes 2 attention. You do not have it.');
    const it = S.items[uid]; if (!it) return fail('Pick a game to feature.');
    S.attention -= 2;
    const f = CHANNEL_FORMATS[format];
    const live = S.canon.live;
    const comments = [];
    if (live.includes('channelHobby')) comments.push(pick(['Subbed. This is the hobby now.', 'You are the content. Finally.', 'Better than Tom, honestly. More fingers.']));
    else if (live.includes('channelHiding')) comments.push(pick(['Do you ever play these? Like, with people?', 'Bro has a ring light and zero game nights.', 'The camera is between you and a table. Just saying.']));
    else comments.push(pick(['nice video', 'audio is a little quiet', 'first']));
    if (format === 'runthrough') comments.push(`Just bought ${BY_ID[it.gid].name} because of this. Thanks I hate it.`);
    if (format === 'stylish') comments.push('Ok but the editing? Brutal. Not buying it now.');
    if (format === 'fingers') comments.push('Love the sponsor read. Very authentic.');
    if (!it.sealed) comments.push('You opened it on camera. Brave.'); else comments.push('Reviewing it sealed is so pure.');
    S.films.push({ month: S.month, format, gid: it.gid, comments });
    addClout(f.clout, 'New upload on your channel');
    Game.save();
    return S.films[S.films.length - 1];
  },

  runTest(method) {
    if (S.testsLeft <= 0) return fail('No tests left this run.');
    const o = Game.lastOrder(); if (!o) return fail('You have not bought anything yet. There is nothing to test.');
    if (S.tests.some(t => t.orderId === o.id)) return fail('You already tested that purchase.');
    const full = scoreCanon(S, { includePending: true }).total;
    const soldBack = S.removed.filter(r => o.uids.includes(r.uid)).reduce((s, r) => s + r.got, 0);
    const without = scoreCanon(S, { includePending: true, exclude: new Set(o.uids), moneyAdjust: o.total - soldBack }).total;
    const d = full - without;
    const result = d >= 8 ? 'up a lot' : d > 0 ? 'up a little' : d === 0 ? 'nothing' : 'down';
    S.testsLeft -= 1;
    const t = { month: S.month, method, orderId: o.id, gids: o.gids, result, flavor: testFlavor(method, result) };
    S.tests.push(t);
    sfx('ping');
    Game.save();
    return t;
  },

  respond(msgId, comply, targetUid) {
    const m = S.messages.find(x => x.id === msgId); if (!m || m.resolved) return false;
    m.resolved = true; m.complied = !!comply;
    const r = m.request;
    if (m.from === 'spouse' && r.type !== 'none') { if (comply) S.spouse.complied++; else S.spouse.ignored++; }
    if (comply) {
      if (r.type === 'skipPurchase') { Game.M().purchaseLock = true; toast(`No more buying this month. ${SPOUSE} noticed.`); }
      if (r.type === 'freeCube' && targetUid) Game.give(targetUid, { free: true });
      if (r.type === 'offer' && S.items[r.uid]) Game.sell(r.uid, { free: true, price: r.price });
      if (r.type === 'mailTom' && targetUid) Game.mailTom(targetUid, true);
      if (r.type === 'allIn' && S.items[r.uid]) { const it = S.items[r.uid]; it.allIn = true; it.price += 35; S.money -= 35; const o = S.orders.find(x => x.id === it.orderId); if (o) o.total += 35; toast('All-in. Metal coins. A promo you will not open. $35.'); addClout(2, 'All-in'); }
    }
    Game.save(); return true;
  },

  addNote(text) {
    text = text.trim(); if (!text) return null;
    if (S.notes.length >= MAX_NOTES) return fail(`The notes app holds ${MAX_NOTES} theories. Unpin one.`);
    const n = parseTheory(text.slice(0, 80)); n.month = S.month;
    S.notes.push(n); Game.save(); return n;
  },
  removeNote(i) { S.notes.splice(i, 1); Game.save(); },

  watch() { Game.M().watched = true; Game.save(); },

  endMonth() {
    // Ignoring is always allowed. It is not always free.
    S.messages.filter(m => m.month === S.month && m.request && !m.resolved).forEach(m => {
      m.resolved = true; m.complied = false; m.autoIgnored = true;
      if (m.from === 'spouse') S.spouse.ignored++;
    });
    S.album.push({ month: S.month, snapshot: snapshot() });
    if (S.month >= 4) { S.ended = true; const e = Game.ending(); recordBest(e); Game.save(); return { ended: true }; }
    S.month += 1;
    S.attention = ATTENTION;
    S.money += INCOME;
    const report = [`${MONTHS[S.month - 1]}. +${money(INCOME)} hobby budget.`];
    let arrived = 0, back = 0;
    Object.values(S.items).forEach(it => {
      if (it.loc.type === 'mail' && it.loc.arrives <= S.month) { it.loc = { type: 'pile' }; it.placedAt = S.placeCounter++; arrived++; }
      if (it.loc.type === 'tom' && it.loc.returns <= S.month) { it.loc = { type: 'pile' }; it.placedAt = S.placeCounter++; it.bagged = true; it.sticker = it.tomFingers; back++; }
    });
    if (arrived) report.push(`${arrived === 1 ? 'A Kickstarter' : arrived + ' Kickstarters'} arrived. Admired. On the floor.`);
    if (back) report.push(`${back === 1 ? 'A box' : back + ' boxes'} came back from Tom, sealed, bagged, fingers on the plastic.`);
    setupMonth();
    Game.save();
    return { ended: false, report };
  },

  // ---------- ending ----------
  ending() {
    const final = scoreCanon(S);
    const theories = scoreTheories(S);
    const theoryPts = theories.reduce((s, t) => s + t.pts, 0);
    const total = final.total + theoryPts;
    // Each order's marginal contribution, by counterfactual removal.
    const marg = S.orders.map(o => {
      const soldBack = S.removed.filter(r => o.uids.includes(r.uid)).reduce((s, r) => s + r.got, 0);
      const w = scoreCanon(S, { exclude: new Set(o.uids), moneyAdjust: o.total - soldBack });
      const deltas = {};
      S.canon.live.forEach(id => { deltas[id] = final.byRule[id].pts - w.byRule[id].pts; });
      return { order: o, delta: final.total - w.total, deltas };
    });
    const best = marg.length ? marg.reduce((a, b) => (b.delta > a.delta ? b : a)) : null;
    const worst = marg.length ? marg.reduce((a, b) => (b.delta < a.delta ? b : a)) : null;
    const quoteFor = (m, sign) => {
      if (!m) return null;
      const ids = Object.keys(m.deltas).filter(id => Math.sign(m.deltas[id]) === sign).sort((a, b) => Math.abs(m.deltas[b]) - Math.abs(m.deltas[a]));
      const id = ids[0]; if (!id) return null;
      const h = S.hints.filter(x => x.ruleId === id).pop();
      return { ruleId: id, hint: h || null };
    };
    const roasts = S.canon.live.map(id => RULES[id].roast(final.byRule[id].pts, final.ctx));
    const rank = total >= 70 ? 'Outjerked' : total >= 45 ? 'One of Us' : total >= 25 ? 'Collector' : total >= 5 ? 'Shelf of Shame' : 'Normie With a Kallax';
    const pendingPledges = S.orders.filter(o => o.kind === 'ks' && o.uids.some(u => S.items[u] && S.items[u].loc.type === 'mail'));
    return {
      final, theories, theoryPts, total, best: best && best.delta > 0 ? best : null, worst: worst && worst.delta < 0 ? worst : null,
      bestQuote: best && best.delta > 0 ? quoteFor(best, 1) : null, worstQuote: worst && worst.delta < 0 ? quoteFor(worst, -1) : null,
      roasts, rank, clout: S.clout, pendingPledges,
    };
  },
};

// ---------- internals ----------

function addItem(gid, o) {
  const uid = 'u' + S.nextUid++;
  S.items[uid] = { uid, gid, sealed: true, sleeved: false, bagged: false, allIn: false, sticker: null, tomPraised: false, hot: false, orderId: null, month: S.month, price: BY_ID[gid].price, placedAt: S.placeCounter++, placedMonth: S.month, ...o };
  return S.items[uid];
}

function fail(msg) { toast(msg, 'warn'); sfx('nope'); return false; }
function toast(msg, kind) { emit('toast', msg, kind); }

function addClout(n, why) {
  if (!n) return;
  S.clout += n;
  emit('clout', n, why);
}

function buyClout(gid, it) {
  const g = BY_ID[gid];
  let c = 0, why = null;
  if (it.hot) { c += 2; why = 'BGG Hotness'; }
  if (it.tomPraised) { c += 3; why = 'Tom approves'; }
  if (gid === 'brass') { c += 4; why = 'Finally, Brass'; }
  if (g.family === 'uno') { c -= 3; why = 'Unó? Are you okay?'; }
  if (g.family === 'monopology') { c -= 4; why = 'Monopology. Mods?'; }
  if (g.mass && g.family !== 'uno' && g.family !== 'monopology') { c -= 2; why = 'Mass-market contamination'; }
  if (g.gateway) { c -= 1; why = 'Gateway game, in this economy'; }
  if (!why) { c += 1; why = 'A respectable purchase'; }
  return [c, why];
}

function afterSpend() {
  if (S.money < -250 && !S.debtWarned) {
    S.debtWarned = true;
    const c = buildCtx(S);
    const h = takeHint('spouse', c);
    pushMessage({ from: 'spouse', subject: 'The card', body: `I saw the statement. ${money(S.money)}. ${h ? h.text : ''}`, request: { type: 'skipPurchase', ask: 'Can you stop buying things this month? Please.' } });
    toast(`${SPOUSE} texted you.`);
  }
  Game.save();
}

function respectability(c) {
  let r = 4;
  r += c.owned.some(i => i.gid === 'brass') ? 6 : -4;
  r -= 5 * c.owned.filter(i => BY_ID[i.gid].family === 'monopology').length;
  r -= 3 * c.owned.filter(i => BY_ID[i.gid].family === 'uno').length;
  r += Math.min(5, c.owned.filter(i => !i.sealed).length);
  r -= Math.min(6, c.cubes.filter(x => !x.length).length);
  r += Math.min(4, c.cubes.filter((x, i) => x.length && S.lights[i]).length);
  r += c.owned.filter(i => i.tomPraised).length;
  r += c.owned.filter(i => i.hot).length;
  return r;
}

function reactiveComments(c) {
  const out = [];
  const has = f => c.owned.some(i => BY_ID[i.gid].family === f);
  if (!c.owned.some(i => i.gid === 'brass')) out.push(pick(['Where is Brass?', 'No Brass? Is this a confession?', 'Nice shelf. Where is Brass though.']));
  if (has('uno')) out.push(pick(['are you okay', 'Is that Unó. In the Kallax. Are you okay.', 'This is a space for Real Hobby Gamers™.']));
  if (has('monopology')) out.push(pick(['Monopology on display. Bold. Wrong, but bold.', 'This is a space for Real Hobby Gamers™.']));
  const e = c.cubes.filter(x => !x.length).length;
  if (e) out.push(e === 1 ? 'Why is that cube empty?' : `Why are ${e} cubes empty? Is this a shelf or a waiting room?`);
  else out.push('Not one empty cube. Do the games get to breathe or');
  if (c.owned.filter(i => !i.sealed).length >= 2) out.push(pick(['Played copies on display. Damaged goods.', 'Is that... punched? On camera?']));
  if (c.shelved.length >= 6 && c.shelved.every(i => i.sealed)) out.push('One of us. One of us. One of us.');
  if (!c.owned.some(i => i.gid === 'mage_knave')) out.push('Where is Mage Knave? I am hurt.');
  if (c.owned.some(i => BY_ID[i.gid].gateway)) out.push(pick(['Is that Catman? In this economy?', 'Ticket to Riot spotted. Calling the authorities.']));
  if (!c.cubes.some((x, i) => x.length && S.lights[i])) out.push('Lights off. Moody. Or a closet.');
  if (c.pile.length >= 3) out.push("What's on the floor? Is that a pile? Mods.");
  if (c.cubes.some(x => x.length >= 2)) out.push('That top lid is drifting. I can see it from here.');
  if (c.owned.some(i => i.bagged)) out.push('Bag over shrink. Respect.');
  if (c.owned.some(i => i.sticker)) out.push("Is that Tom's handwriting on the bag? Provenance.");
  out.push('The dog in the corner is unconvinced. I side with the dog.');
  return out;
}

function takeHint(oracle, c) {
  const live = S.canon.live;
  const honest = S.canon.honest[oracle];
  let pool = honest ? live.slice() : Object.keys(RULES).filter(id => !live.includes(id) && !RULES[id].stable);
  pool = pool.filter(id => resolveHintLines(RULES[id].hints[oracle] || [], c).length);
  if (!pool.length) return null;
  const used = new Set(S.hints.filter(h => h.oracle === oracle).map(h => h.ruleId));
  const fresh = pool.filter(id => !used.has(id));
  if (fresh.length) pool = fresh;
  const id = weightedPick(pool, x => (RULES[x].stable ? 1 : 2));
  const text = pick(resolveHintLines(RULES[id].hints[oracle], c));
  const h = { ruleId: id, oracle, text, month: S.month, honest };
  S.hints.push(h);
  return h;
}

function pushMessage(m) {
  S.messages.push({ id: S.nextMsg++, month: S.month, read: false, resolved: !m.request, ...m });
}

function setupMonth() {
  const m = S.month;
  const hot = shuffle(RETAIL.filter(g => BY_ID[g].family !== 'uno' || Math.random() < 0.2)).slice(0, 5);
  const saleIds = shuffle(RETAIL).slice(0, 3);
  const sale = {}; saleIds.forEach(g => { sale[g] = pick([0.15, 0.25, 0.3]); });
  const reviewPool = shuffle(hot.concat(shuffle(RETAIL).slice(0, 4))).filter((g, i, a) => a.indexOf(g) === i);
  const reviews = reviewPool.slice(0, 3).map(gid => ({ gid, fingers: weightedPick([1, 2, 3, 4, 5], f => ({ 1: 1, 2: 2, 3: 4, 4: 4, 5: 2 })[f]) }));
  if (!reviews.some(r => r.fingers >= 4)) reviews[0].fingers = 4;
  const ks = shuffle(KS_GAMES).slice(0, 2);
  if (m === 2 && !ks.includes('gloomhavent') && !(S.months[1] || { ks: [] }).ks.includes('gloomhavent')) ks[0] = 'gloomhavent';
  S.months[m] = { hot, sale, reviews, sponsor: pick(SPONSORS), ks, watched: false, posted: false, purchaseLock: false, aside: null };
  const c = buildCtx(S, { includePending: true });
  S.months[m].aside = takeHint('tom', c);
  monthMessage(c);
}

function monthMessage(c) {
  const from = S.senderPlan[S.month - 1];
  const h = takeHint(from, c);
  const hint = h ? h.text : '';
  const home = Game.home();
  if (from === 'spouse') {
    const req = pick([
      { type: 'freeCube', ask: `My nephew's birthday is this week. Could you give him one of the games? Any one. It would free up a cube.` },
      { type: 'skipPurchase', ask: 'Could you skip buying anything else this month? Just one month.' },
    ]);
    if (req.type === 'freeCube' && !home.length) req.type = 'skipPurchase';
    pushMessage({ from: 'spouse', subject: SPOUSE, body: hint, request: req });
  } else if (from === 'sub') {
    const sealed = home.filter(i => i.sealed);
    const user = pick(USERS);
    let req = { type: 'none' };
    if (sealed.length) {
      const it = pick(sealed);
      const price = Math.round(it.price * 1.4) + 5;
      req = { type: 'offer', uid: it.uid, price, ask: `Also, I'll give you ${money(price)} for your sealed ${BY_ID[it.gid].name}. Cash. Today.` };
    }
    pushMessage({ from: 'sub', user, subject: `DM from u/${user}`, body: hint, request: req.type === 'none' ? null : req });
  } else {
    pushMessage({ from: 'tom', subject: 'Re: Re: Re: your shelf', body: hint, request: { type: 'mailTom', ask: "Mail me a sealed copy of something and I'll give it the fingers. Right on the bag." } });
  }
  // The pledge manager is not a witness. It is weather.
  const pend = Object.values(S.items).filter(i => i.loc.type === 'mail' && !i.allIn);
  if (pend.length) {
    const it = pend[0];
    pushMessage({ from: 'pm', subject: `Pledge manager: ${BY_ID[it.gid].name}`, body: 'Your pledge manager is open! Lock in your add-ons before the window closes forever (until the late pledge).', request: { type: 'allIn', uid: it.uid, ask: 'Upgrade to all-in for $35? Metal coins. A bigger box. A promo you will not open.' } });
  }
}

function snapshot() {
  return {
    cubes: Array.from({ length: CUBES }, (_, i) => Game.cube(i).map(it => ({ gid: it.gid, sealed: it.sealed, bagged: it.bagged }))),
    lights: S.lights.slice(), pile: Game.pile().length,
  };
}

function testFlavor(method, result) {
  const lines = {
    sub: {
      'up a lot': 'u/burner_9931: "ok I didn\'t want to say it but that one ABSOLUTELY counted. like a lot."',
      'up a little': 'u/quietly_culling: "honestly? it helped. a little. don\'t let it go to your head."',
      nothing: 'u/APisIntelligence: "I have analyzed this for an hour. It did nothing."',
      down: 'u/RealHobbyGamer_TM: "That one cost you, friend. You can feel it from here."',
    },
    burner: {
      'up a lot': 'Your burner account gets 40 DMs in an hour. Something about that purchase really landed.',
      'up a little': 'Your burner gets a couple of nods. Small, but in the right direction.',
      nothing: 'Your burner account gets no reaction at all. Not even a downvote.',
      down: 'Your burner account gets blocked by two people. That purchase hurt.',
    },
    reviewer: {
      'up a lot': 'Tom: "FOLKS. That was a five-finger move. Sending from my phone."',
      'up a little': 'Tom: "Solid three fingers. Maybe three and a half. Sent from my phone."',
      nothing: 'Tom: "That one is a zero-finger purchase. Not bad. Not anything. Sent from my phone."',
      down: 'Tom: "Folks... that one is one finger. And it is not the finger you want."',
    },
  };
  return lines[method][result];
}

function recordBest(e) {
  try {
    const b = Game.best() || { score: null, runs: 0 };
    b.runs = (b.runs || 0) + 1;
    if (b.score == null || e.total > b.score) { b.score = e.total; b.rank = e.rank; }
    localStorage.setItem(BEST_KEY, JSON.stringify(b));
  } catch (err) { /* storage unavailable */ }
}

// Sound is optional; ui.js replaces this.
let sfx = () => {};
