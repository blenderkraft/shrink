// Shrink — static data: catalog, constants, flavor text.

const MONTHS = ['September', 'October', 'November', 'December'];
const START_MONEY = 400;
const INCOME = 200;
const ATTENTION = 5;
const TESTS = 3;
const CUBES = 16;
const CUBE_CAP = 2;
const SIZE_UNITS = { tiny: 0.5, std: 1, big: 2 };
const MAX_NOTES = 6;

// Thirty-odd games. Eight have drawn covers; the rest are a colored box with a title.
const CATALOG = [
  { id: 'patchwerk', name: 'Patchwerk', family: 'patchwerk', price: 25, size: 'std', color: '#d9a441', ink: '#3b2410', cover: true,
    blurb: 'A two-player quilt game. Fifteen minutes. The most important box you will ever not open.',
    components: 'A quilt board for each player, a fistful of wooden buttons, and patches. The patches are patches.' },
  { id: 'patchwerk_doodle', name: 'Patchwerk Doodle', family: 'patchwerk', price: 18, size: 'tiny', color: '#f0d36b', ink: '#3b2410',
    blurb: 'Patchwerk as a roll-and-write. Still counts. Everything counts.',
    components: 'A pad of paper and some dice. The paper is very paper.' },
  { id: 'patchwerk_holiday', name: 'Patchwerk: Holiday Ed.', family: 'patchwerk', price: 34, size: 'std', color: '#b8322f', ink: '#fff4e0',
    blurb: 'Patchwerk, but festive. The buttons are tiny ornaments.',
    components: "It's Patchwerk, but the buttons are ornaments. I counted them. There are enough." },
  { id: 'patch_legacy', name: 'Patchwerk Legacy: The Quilting', family: 'patchwerk', price: 55, size: 'std', color: '#6b4c9a', ink: '#f6e7ff', ks: true,
    blurb: 'You cut the patches with real scissors. Permanently. Nobody has done this.',
    components: 'Scissors. Real ones. And a quilt you will never finish.' },

  { id: 'monopology', name: 'Monopology', family: 'monopology', price: 22, size: 'std', color: '#d23a2c', ink: '#ffffff', cover: true, mass: true,
    blurb: 'The game your family fights over. Not a hobby game. Everyone says so, loudly, in your comments.',
    components: "The money is the box. The box is the money. There's a little dog." },
  { id: 'monopology_cats', name: 'Monopology: Cat People Ed.', family: 'monopology', price: 28, size: 'std', color: '#e88ab0', ink: '#3a0f22', mass: true,
    blurb: 'Every property is a cat bed. You go to jail for knocking things off the counter.',
    components: 'Cat-shaped tokens. A cat-shaped jail. The cat is also the bank.' },
  { id: 'monopology_gamer', name: 'Monopology: Board Gamer Ed.', family: 'monopology', price: 35, size: 'std', color: '#3d4a8a', ink: '#fff2c4', mass: true,
    blurb: 'The properties are game stores that closed. The board is a eulogy.',
    components: 'Hotels shaped like meeples. It is the worst thing I have held.' },

  { id: 'uno', name: 'Unó', family: 'uno', price: 8, size: 'tiny', color: '#e23b2e', ink: '#ffd400', cover: true, mass: true,
    blurb: 'A deck of cards. Mass-market contamination. Your comments will ask if you are okay.',
    components: 'A deck of cards. They are colors. Some of them yell.' },
  { id: 'uno_flip', name: 'Unó Flip!', family: 'uno', price: 10, size: 'tiny', color: '#1d1d1d', ink: '#f2c400', mass: true,
    blurb: 'The cards have a dark side. So do you.', components: 'Double-sided cards. The dark side is darker.' },
  { id: 'uno_attack', name: 'Unó Attack!', family: 'uno', price: 26, size: 'std', color: '#ff6b1a', ink: '#1b1b1b', mass: true,
    blurb: 'A machine shoots cards at you. The machine is the best player at your table.', components: 'A launcher. Batteries not included. Feelings not included.' },
  { id: 'uno_mercy', name: "Unó: Show 'Em No Mercy", family: 'uno', price: 12, size: 'tiny', color: '#5a0f0f', ink: '#ffcf4a', mass: true,
    blurb: 'There is no mercy in the box. Somebody checked the insert.', components: 'A plus-ten card. That is the review.' },
  { id: 'uno_wild', name: 'Unó All Wild', family: 'uno', price: 9, size: 'tiny', color: '#7a3fd1', ink: '#ffffff', mass: true,
    blurb: 'Every card is wild. It is chaos. It is still Unó.', components: 'Every card is the same card. Bold.' },
  { id: 'uno_dos', name: 'Unó Dos', family: 'uno', price: 9, size: 'tiny', color: '#1f7a3d', ink: '#ffffff', mass: true,
    blurb: "Unó, but two. It's in the name.", components: "It's Unó but two, folks. It's in the name." },
  { id: 'uno_mini', name: 'Unó Minimalista', family: 'uno', price: 11, size: 'tiny', color: '#efefef', ink: '#222222', mass: true,
    blurb: 'Unó in Swiss typography. A design agency won an award for this.', components: 'Helvetica. Just Helvetica.' },

  { id: 'brass', name: 'Brass: Birminghammer', family: 'brass', price: 75, size: 'std', color: '#3a2a1e', ink: '#e6b85c', cover: true, heavy: true,
    blurb: 'Number one on the Geek. If it is not on your shelf, your shelfie is a confession.',
    components: 'Canals, rails, and beer. Both sides of the board are brown. Brown is the color of seriousness.' },
  { id: 'brass_lanky', name: 'Brass: Lankyshire', family: 'brass2', price: 65, size: 'std', color: '#4a5a3a', ink: '#e8d9a0', heavy: true,
    blurb: 'The other Brass. The one people own so they can say they prefer it.',
    components: "It's Brass, but the cotton is more cotton." },
  { id: 'arks', name: 'Arks', family: 'arks', price: 70, size: 'std', color: '#151a2e', ink: '#ff8a3d', cover: true,
    blurb: 'Have you heard of Arks? You will. From everyone. Constantly.',
    components: 'Cards, ships, and little resources that are little cubes. Have you heard of it?' },
  { id: 'arks_reach', name: 'Arks: The Blighted Reach', family: 'arks', price: 90, size: 'big', color: '#2b1630', ink: '#ff8a3d', ks: true,
    blurb: 'The campaign. A world that changes. A box that weighs as much as a world.',
    components: 'A campaign box. It has its own campaign box inside.' },
  { id: 'gloomhavent', name: "Gloomhaven't", family: 'gloom', price: 140, size: 'big', color: '#2d2f33', ink: '#c9b37e', cover: true, heavy: true, ks: true,
    blurb: 'A monument. The box is the hobby. Nobody finishes it, so nobody has to start.',
    components: 'Twenty-two pounds of cardboard. A dungeon. A box you will move apartments with.' },
  { id: 'gloom_jaws', name: "Gloomhaven't: Jaws of the Lyin'", family: 'gloom2', price: 45, size: 'std', color: '#6b2c22', ink: '#f3d9a4',
    blurb: "The starter Gloomhaven't, for people who want to not finish it faster.",
    components: "A book that is also the board. Folks, it's a book." },
  { id: 'mage_knave', name: 'Mage Knave', family: 'mage', price: 80, size: 'std', color: '#3c2d6b', ink: '#e8d27a', cover: true, heavy: true,
    blurb: 'The relic. If your shelf tour skips it, somebody will ask where it is, hurt.',
    components: 'The rulebook is a grimoire. You will watch a video about the video.' },
  { id: 'marvelous', name: 'Marvelous Untied', family: 'marvel', price: 40, size: 'std', color: '#e5352b', ink: '#ffe04a', cover: true,
    blurb: 'Little heroes with untied shoelaces. A line that will never end.',
    components: "Little heroes, little villains, and their shoelaces are untied. That's the hook, folks." },
  { id: 'marvel480', name: 'Marvelous Untied: Box 480', family: 'marvel', price: 60, size: 'big', color: '#1f4fbf', ink: '#ffe04a', ks: true,
    blurb: 'The four hundred and eightieth box. Mostly a box for the other boxes.',
    components: 'It is a box for the other boxes, and a promo hero nobody asked for.' },

  { id: 'catman', name: 'Settlers of Catman', family: 'catman', price: 45, size: 'std', color: '#c97b2a', ink: '#fff6dc', gateway: true,
    blurb: 'Hexes, sheep, a robber, and cats. It got you here. You must now be embarrassed in front of it.',
    components: 'Hexes, sheep, and a robber who is a cat.' },
  { id: 'ticket', name: 'Ticket to Riot', family: 'ticket', price: 50, size: 'std', color: '#2f6fb0', ink: '#ffffff', gateway: true,
    blurb: 'Little plastic trains. Everyone has fun, which is suspicious.',
    components: 'Little plastic trains. Everyone has fun. That is suspicious.' },
  { id: 'pandemonium', name: 'Pandemonium', family: 'pandemonium', price: 40, size: 'std', color: '#2c8a8a', ink: '#ffffff', gateway: true,
    blurb: "Four diseases and you're the CDC. The first co-op you quarterbacked.",
    components: "Four diseases, and you're in charge of all of them." },
  { id: 'munchkind', name: 'Munchkind', family: 'munchkind', price: 25, size: 'std', color: '#e6c34a', ink: '#6b1a1a', mass: true,
    blurb: 'Cards that make puns. The puns have puns.', components: 'Cards that make puns. The puns have expansions.' },
  { id: 'kitties', name: 'Exploding Kitties', family: 'kitties', price: 20, size: 'tiny', color: '#e8462c', ink: '#ffffff', mass: true,
    blurb: 'It is at the grocery store. That is the whole review.', components: "A cat explodes. It's at the grocery store, folks." },
  { id: 'wingspam', name: 'Wingspam', family: 'wingspam', price: 60, size: 'std', color: '#9fc3c9', ink: '#24363a',
    blurb: 'Birds. Lovely birds. Egg miniatures. A dice tower shaped like a birdhouse.',
    components: 'Egg miniatures. A dice tower shaped like a birdhouse. Lovely.' },
  { id: 'mare', name: 'Terraforming Mare', family: 'mare', price: 70, size: 'std', color: '#b5482a', ink: '#fff0d0', heavy: true,
    blurb: 'You are turning Mars into a horse. The player boards are thin. Thin.',
    components: 'The player boards are thin, folks. Thin. Like paper.' },
  { id: 'spirit', name: 'Spirit Islund', family: 'spirit', price: 80, size: 'std', color: '#3f6b3a', ink: '#f4f0c8', heavy: true,
    blurb: 'You are the island. The colonists are the problem. The insert is the other problem.',
    components: 'You are the island. The insert is a second island.' },
  { id: 'gwt', name: 'Great Western Trial', family: 'gwt', price: 65, size: 'std', color: '#7a4a24', ink: '#ffe9c2', heavy: true,
    blurb: 'Cows and logistics. You will need a rules video before night one.',
    components: "Cows. Trains. You'll want a rules video first. I made one." },
];

const BY_ID = {};
CATALOG.forEach(g => { BY_ID[g.id] = g; });
const RETAIL = CATALOG.filter(g => !g.ks).map(g => g.id);
const KS_GAMES = CATALOG.filter(g => g.ks).map(g => g.id);
const ALL_IN_COST = 45;

const KS_PITCH = {
  gloomhavent: { creator: 'Cephalofrog Games', goal: 'Second printing. Same box. Heavier.', stretch: ['Metal coins', 'Bigger box (somehow)', 'Promo monster you will not open'] },
  marvel480: { creator: 'Sneer Games', goal: 'Box 480 of an endless line.', stretch: ['A box for the boxes', 'Exclusive hero (Untied Man)', 'Second exclusive hero (Tied Man)'] },
  patch_legacy: { creator: 'Lookout Below', goal: 'Patchwerk, but you destroy it.', stretch: ['Deluxe scissors', 'Wooden buttons → metal buttons', 'A promo patch you will not cut'] },
  arks_reach: { creator: 'Leder Barn', goal: 'The Arks campaign everyone has heard of.', stretch: ['Metal resource cubes', 'Upgraded box', 'Sleeved promo you will not open'] },
};

const SPONSORS = [
  'ShelfSnug — the Kallax insert so you can remove a box without injury.',
  'LidLock — because lid drift is a choice, and you can choose differently.',
  'MuseumSleeve archival bags — for the shrink that protects the box that protects the air.',
  'CoinCraft metal coins — they make a huge fun difference.',
  'Cubelite — LED strips for every cube. If it is not lit, it is a closet.',
];

const USERS = [
  'KallaxSupremacist', 'NISorBust', 'ChineseAirSommelier', 'FourFingersUp', 'ShelfOfOpportunity', 'LidDriftSurvivor',
  'AllInAlways', 'APisIntelligence', 'UnpunchedPurity', 'MeepleMcGrief', 'CultOfTheNewish', 'BrassTax', 'SealedForHerProtection',
  'dicks_out_for_shrink', 'GatewayShame', 'RealHobbyGamer_TM', 'WaitForRetail_lol', 'ArksEnjoyer', 'PileOfShameAccount',
  'NotADiceTowerAlt', 'MetalCoinGuy', 'OneMoreAndIllStop', 'burner_9931', 'TheDogKnows', 'quietly_culling',
];

const NOISE_COMMENTS = [
  'First.', 'Le whole hobby is a bad experience.', 'Is it on Kickstarter?', 'Outjerked.', '/rj nice Kallax',
  'Menu when?', 'Have you heard of Arks?', 'How many of these have you played? (Do not answer.)', 'Spines in, coward.',
  "I'm immune to hype. Anyway where did you get that box.", 'COMC energy. Be gentle with OP.', 'Billy gang rise up.',
  '/uj this is a nice shelf. /rj this is a cry for help.', 'Shut up and take my money (not you, OP, the shelf).',
  'Wine cellar. Not a hoard. A cellar.', 'My wife\'s boyfriend has this exact shelf.',
];

const CHANNEL_FORMATS = {
  fingers: { name: 'Fingers & a sponsor', desc: 'Describe the components, hold up some fingers, read a sponsor line.', clout: 4 },
  runthrough: { name: 'Two-handed run-through', desc: 'Careful hands, a soft voice, and a closing line that tells people to buy it.', clout: 6 },
  stylish: { name: 'Stylish takedown', desc: 'A sleek, British-adjacent review that tells people not to buy it.', clout: 2 },
};

const TEST_METHODS = {
  sub: { name: 'Ask the sub', desc: 'Post a vague question and read between the downvotes.' },
  burner: { name: 'Check the burner', desc: 'Log into the alt you use to see how normal people react.' },
  reviewer: { name: 'Email the reviewer', desc: 'Tom answers every email. Badly, but fast.' },
};

const SPOUSE = 'Dana';
