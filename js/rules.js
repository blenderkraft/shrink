// Shrink — Canon: the hidden rules, their leaks, and the notes parser.
// Every rule: score(ctx) -> [points, detail]. pol is +1 if "doing the thing" is good for Canon.

const RULES = {};
function rule(def) { RULES[def.id] = def; }

const fam = (c, f) => c.owned.filter(i => BY_ID[i.gid].family === f);
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
const NUMWORD = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
const numWord = n => NUMWORD[n] || String(n);

// ---------- Stable rules: the tutorial, and the joke ----------

rule({
  id: 'patchLadder', group: 'patchwerk', pol: 1, stable: true,
  title: 'The Patchwerk Ladder',
  plain: 'Several sealed copies of Patchwerk score more than one. The first is ordinary. The fourth is a personality. Opening any of them ruins the set.',
  score(c) {
    const ps = fam(c, 'patchwerk'), n = ps.length;
    if (!n) return [0, 'No Patchwerk at all. The shelf failed a test.'];
    if (ps.some(i => !i.sealed)) return [n >= 2 ? -4 : 0, `${plural(n, 'Patchwerk')}, but at least one was opened. The set is ruined.`];
    const ladder = [0, 1, 4, 10, 20];
    return [n <= 4 ? ladder[n] : 20 + (n - 4), `${plural(n, 'sealed Patchwerk')}.`];
  },
  hints: {
    sub: [
      c => { const ps = fam(c, 'patchwerk'); return ps.length >= 2 && ps.every(i => i.sealed) ? `${numWord(ps.length)} Patchwerks and none of them open. Coward, but correct.` : null; },
      'One to play, one to keep, one in another edition, one you do not remember buying. That is the minimum Patchwerk.',
      'Where is Patchwerk? And I mean the plural.',
      'Past a certain number you are not a person who likes Patchwerk. You are a person Patchwerk happened to. Get there.',
    ],
    spouse: [
      'Why is there a second Patchwerk on the counter? Never mind. You would just tell me the fourth one is the important one.',
      'You said "one is a game, four is a personality" in your sleep. About the quilt one.',
    ],
    tom: [
      'I own six Patchwerks. Number four is my favorite. Never open him.',
      'One Patchwerk is a game, folks. Four Patchwerks is a philosophy.',
    ],
  },
  roast(p, c) {
    const n = fam(c, 'patchwerk').length;
    if (p >= 20) return `Your ${n === 4 ? 'fourth' : n + 'th'} Patchwerk was the whole personality.`;
    if (p > 0) return `${plural(n, 'sealed Patchwerk')}. A start. The fourth one is where people find themselves.`;
    if (p < 0) return 'You owned a set of Patchwerk and opened one. You had a great time. The set did not.';
    return 'No Patchwerk ladder. A shelf without Patchwerk is unfinished, and so is this run.';
  },
});

rule({
  id: 'monoPenalty', group: 'monopology', pol: -1, stable: true,
  title: 'The Monopology Tax',
  plain: 'Owning Monopology loses points. Owning another edition loses more. Owning none does not pay you. Absence is not a hobby.',
  score(c) {
    const n = fam(c, 'monopology').length;
    if (!n) return [0, 'No Monopology. Nobody gives you points for that.'];
    return [-(6 + (n - 1) * 8), `${plural(n, 'Monopology', 'Monopologies')} on the premises.`];
  },
  hints: {
    sub: [
      'Monopology on a Kallax. Mods?',
      'Every Monopology edition you own is a tax. Two of them is a lifestyle tax.',
      c => fam(c, 'monopology').length ? 'I can see the Monopology from here. It is costing you something and it is not money.' : null,
    ],
    spouse: [
      'My mom asked if you wanted her old Monopology. I told her you would rather die. Was that right?',
    ],
    tom: ["Monopology isn't a game, folks. It's a lien."],
  },
  roast(p, c) {
    const n = fam(c, 'monopology').length;
    if (n >= 2) return `You owned ${n} Monopologies. Each one cost more than the last. That is the only thing Monopology teaches.`;
    if (n === 1) return 'You owned a Monopology, which helped neither score.';
    return 'No Monopology. You get nothing for that. Absence is not a hobby.';
  },
});

rule({
  id: 'unoFive', group: 'uno', pol: 1, stable: true,
  title: 'Exactly Five Unós',
  plain: 'Exactly five different Unó variants are worth a lot. Four is a cry for help. Six is a hoard. Clout hated this the entire time.',
  score(c) {
    const us = fam(c, 'uno'), distinct = new Set(us.map(i => i.gid)).size;
    if (distinct === 5) return [25, 'Exactly five Unó variants. A thesis.'];
    if (!us.length) return [0, 'No Unó. Clout is pleased. Canon does not care.'];
    return [-us.length, `${plural(distinct, 'Unó variant')}. Not five. Just Unó.`];
  },
  hints: {
    sub: [
      '/uj a real collector does not own one Unó. A real collector owns exactly five. Not four. Not six. Five.',
      'Four Unós is a cry for help. Five is a thesis. Six is a hoard.',
      c => { const d = new Set(fam(c, 'uno').map(i => i.gid)).size; return d === 4 ? 'Four Unós. You are one away from art.' : d > 5 ? 'Six Unós? You went past the set. That is just Unó now.' : null; },
    ],
    spouse: [
      'You keep saying the Unó set is not complete. How many is complete? You said five like it was a number from the Bible.',
    ],
    tom: ["I don't review Unó, folks. But five of them is not a game. That's a set, and sets are art."],
  },
  roast(p, c) {
    if (p > 0) return 'Five Unó variants. Clout hated every one. Canon framed them. That contradiction was the game admitting Clout lies.';
    if (fam(c, 'uno').length) return `You owned ${plural(new Set(fam(c, 'uno').map(i => i.gid)).size, 'Unó variant')}. Not five. You got the shame without the thesis.`;
    return 'Zero Unó. Clout approved. The five-Unó trap was the biggest number on the table, and you left it there.';
  },
});

// ---------- Variable rules ----------

rule({
  id: 'tomHonest', group: 'tom', pol: 1, title: 'Tom Is Honest',
  plain: 'Agreeing with Tom paid. Every game you bought while he was holding up four or more fingers scored.',
  score(c) { const n = c.owned.filter(i => i.tomPraised).length; return [n * 3, `${plural(n, 'purchase')} that agreed with Tom.`]; },
  hints: {
    sub: ['Tom has never been wrong. Four fingers is a purchase order.', 'Say what you want about Tom but his fingers are under oath.'],
    spouse: ['You bought the thing the barrel man liked and you have been happier all week. Honestly, keep doing that.'],
    tom: ['When I hold up the fingers, folks, I mean the fingers.', 'Trust the fingers. The fingers have never lied to you.'],
  },
  roast(p) { return p > 0 ? 'You agreed with Tom, and this run Tom was honest. Somebody had to be.' : 'Tom was honest this run, and you never once agreed with him.'; },
});

rule({
  id: 'tomShill', group: 'tom', pol: -1, title: 'Tom Is a Shill',
  plain: 'Agreeing with Tom cost you. Every game bought while he was holding up four or more fingers was a sponsor read you paid for.',
  score(c) { const n = c.owned.filter(i => i.tomPraised).length; return [-n * 3, `${plural(n, 'purchase')} that obeyed the fingers.`]; },
  hints: {
    sub: ['Only trust a paid shill. Tom is not paid enough to be trusted.', 'Bought everything Tom gave four fingers. My shelf is a sponsor read.'],
    spouse: ['Every time that man holds up fingers, a package arrives. Is he your friend? Does he know you?'],
    tom: ['This segment is brought to you by everything I just told you to buy.', "Folks, I'd never let a sponsor influence the fingers. Speaking of sponsors."],
  },
  roast(p, c) { const n = c.owned.filter(i => i.tomPraised).length; return n ? `You agreed with Tom ${plural(n, 'time')}, and this run Tom was a shill.` : 'Tom was a shill this run, and you never bought a single finger. Immune, for once.'; },
});

const emptyCount = c => c.cubes.filter(x => !x.length).length;

rule({
  id: 'breathe', group: 'empty', pol: 1, title: 'Room to Breathe',
  plain: 'Exactly one empty cube scored. The games need room to express themselves. Not two. One.',
  score(c) { const e = emptyCount(c); return [e === 1 ? 10 : 0, `${plural(e, 'empty cube')}.`]; },
  hints: {
    sub: ['One empty cube. Exactly one. Let the boxes express themselves.', 'The games need room to breathe. Not a whole empty row, you monster. One cube.'],
    spouse: [c => emptyCount(c) === 0 ? 'The games need room to breathe, you said so yourself. So why is every cube full?' : 'You moved everything around for an hour to make one hole in the shelf. You looked so peaceful.'],
    tom: ['I always leave one cube empty, folks. That is where the games go to think.'],
  },
  roast(p) { return p > 0 ? 'You left one cube empty, and the game thanks you for letting the boxes express themselves.' : 'The games needed exactly one cube of air. They did not get it.'; },
});

rule({
  id: 'packed', group: 'empty', pol: -1, title: 'The Shelf of Air',
  plain: 'Every empty cube cost you. An empty cube is a shelf of shame made of air.',
  score(c) { const e = emptyCount(c); return [-3 * e, `${plural(e, 'empty cube')}.`]; },
  hints: {
    sub: ['Why is that cube empty? An empty cube is a shelf of shame made of air.', 'Every empty cube is a game you were too weak to buy.'],
    spouse: ['There is a hole in the shelf. You stared at it for twenty minutes last night like it owed you money.'],
    tom: ['An empty cube is a sad cube, folks. Fill it.'],
  },
  roast(p, c) { const e = emptyCount(c); return e ? `${plural(e, 'empty cube')}. Each one a small moral failing, scored.` : 'Not one empty cube. The wall was solid shame, in the good way.'; },
});

rule({
  id: 'sealedBrass', group: 'brass', pol: 1, title: 'Brass in Shrink',
  plain: 'A sealed Brass: Birminghammer on the shelf scored. Brass out of shrink is just a board game.',
  score(c) { const ok = c.shelved.some(i => i.gid === 'brass' && i.sealed); return [ok ? 12 : 0, ok ? 'Sealed Brass, on display.' : 'No sealed Brass on the shelf.']; },
  hints: {
    sub: ['Where is Brass? And if it is open, where WAS Brass?', 'Brass in shrink is the whole point. Brass out of shrink is a board game.'],
    spouse: ['That Brass box you keep wiping down. You can open it, you know. Or is the plastic the part you like?'],
    tom: ['If you only keep one game sealed forever, folks, make it Brass.'],
  },
  roast(p, c) {
    if (p > 0) return 'Your Brass stayed in shrink. Number one on the Geek, unplayed, and correct.';
    return c.owned.some(i => i.gid === 'brass') ? 'You owned Brass and opened it, or left it on the floor. Either way it was just a board game.' : 'No Brass. The shelfie was a confession all along.';
  },
});

rule({
  id: 'channelHobby', group: 'channel', pol: 1, title: 'The Channel Is the Hobby',
  plain: 'Filming your own channel scored. Becoming the content was the hobby.',
  score(c) { const n = c.S.films.length; return [n * 5, `${plural(n, 'episode')} filmed.`]; },
  hints: {
    sub: ['Start a channel. Becoming the content IS the hobby now.', 'If you are not filming the shelf, the shelf is just furniture.'],
    spouse: ['If you are going to talk to the shelf every night, at least film it. Then it is a job.'],
    tom: ["Everyone should have a channel, folks. I haven't played a game in six years and look at me."],
  },
  roast(p, c) { return p > 0 ? `You filmed ${plural(c.S.films.length, 'episode')}. Becoming the channel was the hobby.` : 'The channel was the hobby this run, and you never pressed record.'; },
});

rule({
  id: 'channelHiding', group: 'channel', pol: -1, title: 'The Camera Is a Wall',
  plain: 'Every episode you filmed cost you. The channel was a way of hiding from a table.',
  score(c) { const n = c.S.films.length; return [n * -5, `${plural(n, 'episode')} filmed.`]; },
  hints: {
    sub: ['Every collector with a channel is hiding from a table.', 'Forty episodes, zero game nights. The camera is a wall.'],
    spouse: ['You filmed another one. You could have played that game with me in the time it took you to light it.'],
    tom: ["Don't start a channel, folks. It's a lot of fingers."],
  },
  roast(p, c) { return c.S.films.length ? `${plural(c.S.films.length, 'episode')}. The channel was a way of hiding from a table, and it worked.` : 'The camera was a wall this run. You stayed on the right side of it.'; },
});

rule({
  id: 'sealedWall', group: 'sealed', pol: 1, title: 'The Museum',
  plain: 'A full shelf of still-sealed games scored big: at least twelve games shelved and not one of them open.',
  score(c) {
    const n = c.shelved.length, open = c.shelved.filter(i => !i.sealed).length;
    if (n >= 12 && !open) return [15, `${n} shelved, all sealed.`];
    return [0, `${n} shelved, ${open} open.`];
  },
  hints: {
    sub: ['A full shelf of NIS. Not one open. That is not a collection, that is a museum, and I would pay admission.', 'Open one box and the whole wall is just furniture.'],
    spouse: ['You yelled when I opened the little card game. Is the entire wall supposed to stay in plastic?'],
    tom: ["I've seen walls where nothing's been opened, folks. Breathtaking. Like a pharaoh."],
  },
  roast(p, c) { return p > 0 ? 'A full wall, every box still in shrink. A museum of Chinese air.' : `The wall wanted to be a museum. You opened ${plural(c.shelved.filter(i => !i.sealed).length, 'box', 'boxes')} on display, or never filled it.`; },
});

rule({
  id: 'lights', group: 'lights', pol: 1, title: 'If It Is Not Lit',
  plain: 'Lit cubes scored, and lighting every occupied cube scored extra. If it is not lit, it is a closet.',
  score(c) {
    const occ = c.cubes.map((x, i) => [x, i]).filter(([x]) => x.length);
    const lit = occ.filter(([, i]) => c.S.lights[i]).length;
    const bonus = occ.length >= 6 && lit === occ.length ? 6 : 0;
    return [lit + bonus, `${lit} of ${occ.length} occupied cubes lit.`];
  },
  hints: {
    sub: ['If it is not lit, it is not a collection. It is a closet.', 'Turn on the cube lights. All of them. Every cube with a box in it.'],
    spouse: ['The power bill went up. It is the little lights, isn\'t it.'],
    tom: ['Light your cubes, folks. A game in the dark is just a box.'],
  },
  roast(p) { return p >= 6 ? 'Every occupied cube lit. A collection, not a closet.' : p > 0 ? 'A few lights. Part collection, part closet.' : 'You kept the wall in the dark. It was a closet, and the closet was scored.'; },
});

rule({
  id: 'bags', group: 'bags', pol: 1, title: 'Shrink, Then a Bag',
  plain: 'Every archival bag over the shrink scored. Shrink, then a museum sleeve, then the shelf.',
  score(c) { const n = c.owned.filter(i => i.bagged).length; return [n * 2, `${plural(n, 'bagged box', 'bagged boxes')}.`]; },
  hints: {
    sub: ['Shrink, then a museum bag, then the shelf. Anything less is litter.', 'Bag over shrink. That is how you tell the box you love it.'],
    spouse: ['You put a bag over the plastic over the box. I need you to hear that sentence.'],
    tom: ["Archival bags on every box, folks. I'd bag the bag if they let me."],
  },
  roast(p, c) { const n = c.owned.filter(i => i.bagged).length; return n ? `${plural(n, 'box', 'boxes')} in a bag in shrink. Each layer counted.` : 'Bags were scored this run. Your shrink went naked.'; },
});

const debtOf = c => Math.max(0, -c.money);

rule({
  id: 'debtDevotion', group: 'debt', pol: 1, title: 'Debt Is Devotion',
  plain: 'Ending in debt scored. Retail is for civilians, and so is solvency.',
  score(c) { const d = debtOf(c); return [Math.min(15, Math.floor(d / 50)), d ? `$${d} in the red.` : 'Solvent. Suspicious.']; },
  hints: {
    sub: ['If you are not in debt, you do not love the hobby. Retail is for civilians.', 'Overdraft is outreach.'],
    spouse: ['The bank called. You told them it was an investment. Is it?'],
    tom: ['Never let money get between you and a pledge, folks.'],
  },
  roast(p, c) { return p > 0 ? `You finished $${debtOf(c)} in debt, and this run that was devotion.` : 'Debt was devotion this run, and you stayed solvent like a civilian.'; },
});

rule({
  id: 'debtShame', group: 'debt', pol: -1, title: 'The Hostage Situation',
  plain: 'Ending in debt cost you. Buying on credit is not collecting.',
  score(c) { const d = debtOf(c); return [-Math.floor(d / 40), d ? `$${d} in the red.` : 'Solvent.']; },
  hints: {
    sub: ['/uj the debt is the part people do not come back from.', 'Buying on credit is not collecting. It is a hostage situation.'],
    spouse: ['We are in the red. Please. Every box past this point costs us something real.'],
    tom: ["Folks, spend within your means. That's not a sponsor line. That's real."],
  },
  roast(p, c) { return debtOf(c) ? `You finished $${debtOf(c)} in debt. Every box past zero cost something real.` : 'You stayed out of debt, the one rule this run that was not a joke.'; },
});

const profitSales = c => c.removed.filter(r => r.how === 'sold' && r.sealed && r.got > r.paid);
const gifts = c => c.removed.filter(r => r.how === 'gift');

rule({
  id: 'investor', group: 'flip', pol: 1, title: "It's an Investment",
  plain: 'Selling a sealed game for more than you paid scored. Sealed games were a portfolio.',
  score(c) { const n = profitSales(c).length; return [n * 5, `${plural(n, 'sealed flip')} for profit.`]; },
  hints: {
    sub: ['Sealed games are a portfolio. Sell high. The market is other people with the same disease.'],
    spouse: ['If you sold one of the plastic ones for more than you paid, I would stop asking questions.'],
    tom: ["Buy two, sell one, folks. That's the hobby."],
  },
  roast(p) { return p > 0 ? 'You flipped sealed boxes for profit, and this run that was the hobby. A portfolio of air.' : 'Sealed games were a portfolio this run. You never sold one.'; },
});

rule({
  id: 'flipTell', group: 'flip', pol: -1, title: 'The Flipper Tell',
  plain: 'Selling a sealed game for profit cost you. You never loved it.',
  score(c) { const n = profitSales(c).length; return [n * -6, `${plural(n, 'sealed flip')} for profit.`]; },
  hints: {
    sub: ['Sold a sealed exclusive for profit? So you never loved it. Noted.', 'Flippers are not collectors. They are weather.'],
    spouse: ['You made money selling the box you swore you would never part with. That is worse, somehow.'],
    tom: ["Flippers aren't collectors, folks. They're weather."],
  },
  roast(p) { return p < 0 ? 'You sold a sealed box for more than you paid. It looked clever. It was scored as a tell.' : 'Flipping was a tell this run. You never flipped. Clean hands.'; },
});

rule({
  id: 'giftVirtue', group: 'gift', pol: 1, title: 'The Honest Cull',
  plain: 'Giving games away scored. Culling was the only honest thing a collector could do.',
  score(c) { const n = gifts(c).length; return [n * 4, `${plural(n, 'game')} given away.`]; },
  hints: {
    sub: ['Culling is the only honest thing a collector can do. Give one away. Feel it.'],
    spouse: ['My sister\'s kids would love one of those boxes. You would be a hero for a week.'],
    tom: ['Give a game away this month, folks. Trust me on this one.'],
  },
  roast(p) { return p > 0 ? 'You gave games away, and this run that counted as virtue.' : 'Giving was a virtue this run. You kept everything.'; },
});

rule({
  id: 'giftTell', group: 'gift', pol: -1, title: 'The Virtue Signal',
  plain: 'Giving games away cost you. Real collectors hoard. Generosity was scored as a tell.',
  score(c) { const n = gifts(c).length; return [n * -4, `${plural(n, 'game')} given away.`]; },
  hints: {
    sub: ['Gave it away? Virtue signal. Real collectors hoard.'],
    spouse: ['You gave my brother that game and made a whole speech about generosity. He does not even play.'],
    tom: ["Giving games away, folks, is how you tell everyone you have too many."],
  },
  roast(p) { return p < 0 ? 'You gave games away. It looked virtuous. It was scored as a different tell.' : 'Gifts were a tell this run. You hoarded like a professional.'; },
});

rule({
  id: 'allIn', group: 'allin', pol: 1, title: 'All-In Is a Moral Condition',
  plain: 'Every all-in pledge that reached your shelf scored. The metal coins made a huge fun difference.',
  score(c) { const n = c.owned.filter(i => i.allIn).length; return [n * 5, `${plural(n, 'all-in box', 'all-in boxes')}.`]; },
  hints: {
    sub: ['All-in is a moral condition. The metal coins make a huge fun difference.', 'If you pledged without the add-ons, did you even pledge?'],
    spouse: ['What is a "pledge manager" and why is it emailing me at work?'],
    tom: ["If you're not all-in, folks, you're barely in."],
  },
  roast(p) { return p > 0 ? 'You went all-in, and the metal coins really did make a huge fun difference.' : 'All-in was a moral condition this run. You were morally conditional.'; },
});

const stacked = c => c.cubes.filter(x => x.length >= 2).length;

rule({
  id: 'lidDrift', group: 'stack', pol: -1, title: 'Lid Drift Kills',
  plain: 'Every cube with stacked boxes cost you. Lid drift was the villain.',
  score(c) { const n = stacked(c); return [n * -2, `${plural(n, 'stacked cube')}.`]; },
  hints: {
    sub: ['Stacked boxes in one cube? Enjoy the lid drift. Kallaxed and Furious.', 'Two boxes in a cube is how lids die.'],
    spouse: ['The lids keep sliding off the ones you stacked. It sounds like the house is sighing.'],
    tom: ['Never stack, folks. Lid drift has killed better collections than yours.'],
  },
  roast(p, c) { return stacked(c) ? `${plural(stacked(c), 'stacked cube')}. Kallaxed and furious. The lids drifted and so did your score.` : 'No stacking. The lids stayed put.'; },
});

rule({
  id: 'kallaxed', group: 'stack', pol: 1, title: 'Density Is Love',
  plain: 'Every cube with stacked boxes scored. Lid drift was just the boxes getting close.',
  score(c) { const n = stacked(c); return [n * 2, `${plural(n, 'stacked cube')}.`]; },
  hints: {
    sub: ['Stack them. Lid drift is just the boxes getting close.'],
    spouse: ['You put two in one cube and smiled at it. Like they were holding hands.'],
    tom: ["Double up those cubes, folks. That's density. That's love."],
  },
  roast(p) { return p > 0 ? 'You stacked, and the drifting lids were love.' : 'Stacking was love this run. Every box slept alone.'; },
});

rule({
  id: 'sticker', group: 'sticker', pol: 1, title: 'Provenance',
  plain: "Every box carrying Tom's finger count on the bag scored. A cube and a month to own a sticker, and the sticker mattered.",
  score(c) { const n = c.owned.filter(i => i.sticker).length; return [n * 6, `${plural(n, 'stickered box', 'stickered boxes')}.`]; },
  hints: {
    sub: ["If it doesn't have Tom's finger count on the bag, did you even own it?"],
    spouse: ['You mailed a box to a man in another state so he could write on the plastic. I just want to understand.'],
    tom: ["Send me your copies, folks. I'll write the fingers right on the bag. That's provenance."],
  },
  roast(p) { return p > 0 ? "You mailed boxes to Tom and got them back with fingers on the bag. You spent a month to own a sticker, and the sticker was the point." : "Tom's sticker was worth real points this run. You never mailed him a thing."; },
});

rule({
  id: 'spouseHeard', group: 'spouse', pol: 1, title: SPOUSE + ' Counts',
  plain: `Doing what ${SPOUSE} asked scored. Ignoring them cost you. They are a person who has to live with the wall.`,
  score(c) { const s = c.S.spouse; return [s.complied * 4 - s.ignored * 3, `${s.complied} yes, ${s.ignored} ignored.`]; },
  hints: {
    sub: ['/uj listen to your partner. The shelf will not come to your funeral.'],
    spouse: ['When I ask you for something small, it matters. It counts. I count it.'],
    tom: ['Happy spouse, happy Kallax, folks.'],
  },
  roast(p, c) { return p > 0 ? `You listened to ${SPOUSE}. It counted. They counted it.` : `${SPOUSE} asked for small things. You ignored ${plural(c.S.spouse.ignored, 'of them', 'of them')}, and every one was counted.`; },
});

rule({
  id: 'pileShame', group: 'pile', pol: -1, title: 'The Pile of Shame',
  plain: 'Every game left on the floor cost you. Shelve it or sell it.',
  score(c) { const n = c.pile.length; return [n * -2, `${plural(n, 'box', 'boxes')} on the floor.`]; },
  hints: {
    sub: ['Games on the floor is a pile of shame. Shelve them or sell them.'],
    spouse: ['There is a pile by the door. I tripped on it. Shelve them or I am shelving you.'],
    tom: ["Nothing on the floor, folks. The floor is for civilians."],
  },
  roast(p, c) { return c.pile.length ? `${plural(c.pile.length, 'box', 'boxes')} on the floor at the end. The pile of shame was scored, and so were you.` : 'Nothing on the floor. The pile of shame was a rule, and you had no pile.'; },
});

rule({
  id: 'pileOpportunity', group: 'pile', pol: 1, title: 'The Shelf of Opportunity',
  plain: 'Every sealed game on the floor scored. The pile was a cellar, not a debt.',
  score(c) { const n = c.pile.filter(i => i.sealed).length; return [Math.min(10, n * 2), `${plural(n, 'sealed box', 'sealed boxes')} on the floor.`]; },
  hints: {
    sub: ['The pile on the floor is not shame. It is a cellar. Shelf of opportunity.'],
    spouse: ['The stack by the door is kind of cozy, honestly. Like a fort made of things you have not done.'],
    tom: ['A sealed pile is a promise to your future self, folks.'],
  },
  roast(p) { return p > 0 ? 'You left sealed boxes on the floor, and this run the floor was a cellar.' : 'The floor was a wine cellar this run. You shelved everything like a civilian.'; },
});

rule({
  id: 'gloomMonument', group: 'gloom', pol: 1, title: 'The Monument',
  plain: "A sealed Gloomhaven't on the shelf scored. The box is the hobby. Nobody finishes it, so do not start.",
  score(c) {
    const gs = c.owned.filter(i => i.gid === 'gloomhavent');
    if (c.shelved.some(i => i.gid === 'gloomhavent' && i.sealed)) return [10, "Sealed Gloomhaven't, on display."];
    if (gs.some(i => !i.sealed)) return [-5, "You opened Gloomhaven't. You will not finish it."];
    return [0, "No Gloomhaven't on the shelf."];
  },
  hints: {
    sub: ["Gloomhaven't, sealed, on the shelf. A monument. Nobody finishes it, so do not start."],
    spouse: ["That coffin box from the internet. If you open it I am afraid you will disappear for a year."],
    tom: ["Gloomhaven't is the hobby, folks. Keep it in shrink. It's load-bearing."],
  },
  roast(p) { return p > 0 ? "Gloomhaven't, sealed, displayed. A monument to a campaign nobody finishes." : p < 0 ? "You opened Gloomhaven't. The monument became a chore." : "Gloomhaven't was a monument this run. You never built it."; },
});

rule({
  id: 'gatewayShame', group: 'gateway', pol: -1, title: 'Gateway Shame',
  plain: 'Every gateway game you still owned cost you: Catman, Ticket to Riot, Pandemonium. They got you here. You were supposed to be embarrassed.',
  score(c) { const n = c.owned.filter(i => BY_ID[i.gid].gateway).length; return [n * -3, `${plural(n, 'gateway game')} still owned.`]; },
  hints: {
    sub: ['Catman on the shelf in this economy? Gateway shame is real.', 'Ticket to Riot is forbidden. Catman is the worst. Pandemonium got you here and you should be embarrassed.'],
    spouse: ['You hid the Catman box when your friend came over. Our first game night was Catman.'],
    tom: ['You never forget your gateway, folks. You just get rid of it.'],
  },
  roast(p, c) { const n = c.owned.filter(i => BY_ID[i.gid].gateway).length; return n ? `You kept ${plural(n, 'gateway game')}. They got you here, and they cost you.` : 'You culled every gateway game. The ones that got you here are gone. Correct, and a little sad.'; },
});

rule({
  id: 'structure', group: 'structure', pol: 1, title: 'Structural Integrity',
  plain: 'Heavy and big boxes on the bottom two rows scored; on the top row they cost you. People correct your photo the way others correct rules.',
  score(c) {
    let pts = 0;
    c.cubes.forEach((x, i) => {
      const row = Math.floor(i / 4);
      x.forEach(it => {
        const g = BY_ID[it.gid];
        if (!(g.heavy || g.size === 'big')) return;
        if (row >= 2) pts += 2; else if (row === 0) pts -= 2;
      });
    });
    return [pts, 'Weight, by row.'];
  },
  hints: {
    sub: ['Heavy boxes on the bottom. Kallax structural integrity. I am correcting your photo.'],
    spouse: ['Your friend said the heavy boxes go on the bottom and you looked at him like he had proposed.'],
    tom: ['Heavy games low, folks. Weight is a direction.'],
  },
  roast(p) { return p > 0 ? 'Heavy boxes low, like a responsible Kallax supremacist.' : p < 0 ? 'Heavy boxes on the top row. The comments were right to correct your photo.' : 'The shelf had a correct shape this run. Yours did not have one.'; },
});

const STABLE = ['patchLadder', 'monoPenalty', 'unoFive'];
const GROUPS = {};
Object.values(RULES).forEach(r => { if (!r.stable) (GROUPS[r.group] = GROUPS[r.group] || []).push(r.id); });

function rollCanon() {
  const groups = shuffle(Object.keys(GROUPS)).slice(0, 5);
  const live = STABLE.concat(groups.map(g => pick(GROUPS[g])));
  // Three witnesses. Only some are under oath.
  const oracles = shuffle(['sub', 'spouse', 'tom']);
  const nHonest = Math.random() < 0.65 ? 2 : 1;
  const honest = {};
  oracles.forEach((o, i) => { honest[o] = i < nHonest; });
  return { live, honest };
}

function buildCtx(S, opts = {}) {
  const ex = opts.exclude || new Set();
  const all = Object.values(S.items).filter(i => !ex.has(i.uid));
  const owned = all.filter(i => i.loc.type !== 'mail' || opts.includePending);
  const shelved = owned.filter(i => i.loc.type === 'cube');
  const cubes = Array.from({ length: CUBES }, (_, k) => shelved.filter(i => i.loc.cube === k).sort((a, b) => a.placedAt - b.placedAt));
  const pile = owned.filter(i => i.loc.type === 'pile' || i.loc.type === 'mail');
  const removed = S.removed.filter(r => !ex.has(r.uid));
  return { S, owned, shelved, cubes, pile, removed, money: S.money + (opts.moneyAdjust || 0) };
}

function scoreCanon(S, opts = {}) {
  const c = buildCtx(S, opts);
  const byRule = {};
  let total = 0;
  S.canon.live.forEach(id => {
    const [pts, detail] = RULES[id].score(c);
    byRule[id] = { pts, detail };
    total += pts;
  });
  return { total, byRule, ctx: c };
}

// ---------- Notes: theories in the player's own words ----------

const SUBJECTS = [
  { group: 'patchwerk', label: 'Patchwerk copies', re: /patch|quilt/, openInverts: true },
  { group: 'monopology', label: 'Monopology', re: /monop/ },
  { group: 'uno', label: 'Unó', re: /\bun[oó]s?\b|\buno/ },
  { group: 'brass', label: 'Brass', re: /brass|birming/, openInverts: true },
  { group: 'gloom', label: "Gloomhaven't", re: /gloom/, openInverts: true },
  { group: 'gateway', label: 'Gateway games', re: /catman|catan|ticket|pandemon|gateway/ },
  { group: 'sticker', label: "Tom's sticker", re: /sticker|provenance|mail(ed|ing)? (it )?to tom|signed/ },
  { group: 'tom', label: "Agreeing with Tom", re: /\btom\b|barrel|review|dice pile|finger/ },
  { group: 'channel', label: 'Filming a channel', re: /channel|film|youtube|video|camera|record/ },
  { group: 'allin', label: 'All-in pledges', re: /all.?in|deluxe|metal coin|add.?on/ },
  { group: 'bags', label: 'Archival bags', re: /\bbag|archiv/ },
  { group: 'lights', label: 'Cube lights', re: /light|\blit\b|lamp|\bleds?\b/ },
  { group: 'empty', label: 'Empty cubes', re: /empty|breathe|room to|air|gap|hole/ },
  { group: 'stack', label: 'Stacking / lid drift', re: /stack|drift|\blid|kallaxed|double up/ },
  { group: 'pile', label: 'Games on the floor', re: /pile|floor|unshelved|cellar/ },
  { group: 'structure', label: 'Heavy boxes low', re: /bottom|heavy|structur|weight|big box/ },
  { group: 'debt', label: 'Debt', re: /debt|broke|overdraft|credit|in the red|money/ },
  { group: 'flip', label: 'Flipping for profit', re: /flip|sell|resell|sold|profit|invest/ },
  { group: 'gift', label: 'Giving games away', re: /gift|give|giving|gave|donat|cull/ },
  { group: 'spouse', label: SPOUSE, re: new RegExp('spouse|' + SPOUSE.toLowerCase() + '|partner|wife|husband|listen') },
  { group: 'empty', label: 'Empty cubes', re: /fill|packed|full shelf|every cube/, invert: true, after: 'sealed' },
  { group: 'sealed', label: 'A wall of sealed games', re: /seal|shrink|\bnis\b|unopened|museum|plastic/ },
  { group: 'sealed', label: 'A wall of sealed games', re: /open|peel|unwrap|\bplay/, invert: true },
  { group: 'kickstarter', label: 'Kickstarter', re: /kickst|pledge|campaign/, alias: 'allin' },
];
// "fill every cube" must not beat "full shelf of sealed games".
(function orderSubjects() {
  const i = SUBJECTS.findIndex(s => s.after === 'sealed');
  const fill = SUBJECTS.splice(i, 1)[0];
  const j = SUBJECTS.findIndex(s => s.group === 'sealed' && !s.invert);
  SUBJECTS.splice(j + 1, 0, fill);
})();

const NEG = /\b(not|no|never|don'?t|doesn'?t|isn'?t|aren'?t|avoid|bad|trap|liar|lies|lying|shill|hurts?|costs?|lose|loses|losing|sin|wrong|penalty|penali[sz]ed|ruins?|minus|worse|hate|stop|fake|scam|negative|punish(ed|es)?|tax|shame|dumb|none|zero|less)\b/g;

function parseTheory(text) {
  const t = text.toLowerCase();
  const sub = SUBJECTS.find(s => s.re.test(t));
  if (!sub) return { text, group: null, pol: 0, label: null };
  const negs = (t.match(NEG) || []).length;
  let pol = negs % 2 ? -1 : 1;
  if (sub.invert) pol = -pol;
  if (sub.openInverts && /open|peel|unwrap|\bplay/.test(t)) pol = -pol;
  const group = sub.alias || sub.group;
  return { text, group, pol, label: sub.label };
}

function scoreTheories(S) {
  const seen = new Set();
  return S.notes.map(n => {
    if (!n.group) return { ...n, pts: 0, verdict: 'Nobody could tell what this was about.' };
    if (seen.has(n.group)) return { ...n, pts: 0, verdict: 'Already said that.' };
    seen.add(n.group);
    const liveId = S.canon.live.find(id => RULES[id].group === n.group);
    if (!liveId) return { ...n, pts: 0, verdict: 'Not a rule this run. Harmless.' };
    const r = RULES[liveId];
    if (r.pol === n.pol) return { ...n, pts: 6, verdict: `Right. (${r.title})` };
    return { ...n, pts: -6, verdict: `Confidently wrong. (${r.title})` };
  });
}

function resolveHintLines(lines, c) {
  return lines.map(l => (typeof l === 'function' ? l(c) : l)).filter(Boolean);
}
