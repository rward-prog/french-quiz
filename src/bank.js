/* Unité 2 question bank + generators. No DOM here, so it can be tested in Node. */
(function (root) {
'use strict';

/* ---------- helpers ---------- */
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function slug(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
const clean = s => s.replace(/\s*\((f|m)\.\)/g, '');
const speakable = s => s.replace(/\([^)]*\)/g, '').replace(/[…]/g, '').replace(/\s+/g, ' ').trim();
const pad = n => (n < 10 ? '0' : '') + n;

const TOPICS = [
  { id: 'cours',  name: 'Les cours et les opposés', blurb: 'School subjects, odd-one-out, opposites', main: true },
  { id: 'vocab',  name: 'Vocabulaire',              blurb: 'French to English and English to French', main: true },
  { id: 'avoir',  name: 'Expressions avec avoir',   blurb: 'Pick the expression, then conjugate avoir', main: true },
  { id: 'heure',  name: 'L’heure',                  blurb: 'Telling time, including the 24-hour clock', main: true },
  { id: 'er',     name: 'Les verbes en -ER',        blurb: 'Conjugate with the right subject', main: true },
  { id: 'choix',  name: 'Quel verbe?',              blurb: 'Choose between two verbs, then conjugate', main: true },
  { id: 'listen', name: 'Écoute (optional)',        blurb: 'Listening practice with a read-aloud button', main: false },
  { id: 'challenge', name: 'Challenge: questions et négation', blurb: 'This goes beyond the test, but it’s good to know!', main: false }
];

function Q(o) { return Object.assign({ fixed: true, hint: '' }, o); }
function mkChoices(correct, correctWhy, wrongs) {
  return [{ t: correct, ok: true, why: correctWhy }].concat(wrongs.map(w => ({ t: w.t, ok: false, why: w.why })));
}

/* ---------- VOCABULARY ---------- */
// [French, English, category, options]  g = meaning group (never used as a distractor for each other), ef:false = skip English->French
const V = [
  ['la chimie', 'chemistry', 'cours'], ['l’informatique (f.)', 'computer science', 'cours'],
  ['les langues (étrangères) (f.)', '(foreign) languages', 'cours'], ['la physique', 'physics', 'cours'],
  ['la biologie', 'biology', 'cours'], ['la géographie', 'geography', 'cours'], ['l’histoire (f.)', 'history', 'cours'],
  ['les mathématiques (f.)', 'math', 'cours'], ['l’art (m.)', 'art', 'cours'], ['l’éducation physique (f.)', 'physical education', 'cours'],
  ['la cantine', 'cafeteria', 'cours'], ['un cours', 'class, course', 'cours'], ['un devoir; les devoirs', 'homework', 'cours'],
  ['l’école (f.)', 'school', 'cours'], ['une note', 'grade', 'cours'],
  ['difficile', 'difficult', 'adj'], ['facile', 'easy', 'adj'], ['inutile', 'useless', 'adj'], ['utile', 'useful', 'adj'],
  ['J’aime bien…', 'I like…', 'opinion', { g: 'like' }], ['Je n’aime pas tellement…', 'I don’t like… very much', 'opinion', { g: 'like' }],
  ['aimer', 'to like; to love', 'verbe', { g: 'like' }], ['aimer mieux', 'to prefer', 'verbe'], ['chercher', 'to look for', 'verbe', { g: 'look' }],
  ['commencer', 'to begin, to start', 'verbe'], ['dessiner', 'to draw; to design', 'verbe'], ['donner', 'to give', 'verbe'],
  ['étudier', 'to study', 'verbe', { g: 'study' }], ['habiter (à)', 'to live (in)', 'verbe'], ['manger', 'to eat', 'verbe'], ['oublier', 'to forget', 'verbe'],
  ['parler (au téléphone)', 'to speak (on the phone)', 'verbe'], ['partager', 'to share', 'verbe'],
  ['penser (que/qu’)', 'to think (that)', 'verbe', { g: 'ft' }], ['regarder', 'to look (at), to watch', 'verbe', { g: 'look' }],
  ['rencontrer', 'to meet', 'verbe', { g: 'ft' }], ['retrouver', 'to meet up with; to find (again)', 'verbe', { g: 'ft' }],
  ['travailler', 'to work', 'verbe'], ['voyager', 'to travel', 'verbe'],
  ['assister à', 'to attend', 'verbe'], ['demander', 'to ask', 'verbe'], ['échouer', 'to fail', 'verbe'], ['écouter', 'to listen (to)', 'verbe'],
  ['enseigner', 'to teach', 'verbe'], ['expliquer', 'to explain', 'verbe'], ['passer un examen', 'to take an exam', 'verbe'],
  ['préparer', 'to prepare (for)', 'verbe'], ['rentrer (à la maison)', 'to return (home)', 'verbe'],
  ['trouver', 'to find; to think', 'verbe', { g: 'ft' }], ['visiter', 'to visit (a place)', 'verbe'],
  ['apprendre', 'to learn', 'verbe', { g: 'study' }], ['réussir', 'to succeed', 'verbe'],
  ['bien sûr', 'of course', 'opinion', { g: 'ofcourse' }], ['d’accord', 'OK, all right', 'opinion'], ['Est-ce que/qu’…?', 'question phrase', 'opinion', { ef: false }],
  ['(mais) non', 'no (but of course not)', 'opinion', { g: 'ofcourse' }], ['moi/toi non plus', 'me/you neither', 'opinion'], ['ne… pas', 'no, not', 'opinion', { g: 'no' }],
  ['n’est-ce pas?', 'isn’t that right?', 'opinion'], ['oui/si', 'yes', 'opinion', { ef: false }], ['parce que', 'because', 'opinion'],
  ['pas du tout', 'not at all', 'opinion', { g: 'no' }], ['peut-être', 'maybe, perhaps', 'opinion'], ['Pourquoi?', 'Why?', 'opinion'],
  ['un an', 'a year', 'temps', { g: 'year', ef: false }], ['une/cette année', 'one/this year', 'temps', { g: 'year', ef: false }],
  ['après', 'after', 'temps'], ['un/cet après-midi', 'an/this afternoon', 'temps', { g: 'afternoon', ef: false }],
  ['un jour', 'a day', 'temps', { g: 'day', ef: false }], ['une journée', 'a day', 'temps', { g: 'day', ef: false }],
  ['un/ce matin', 'a/this morning', 'temps', { g: 'morning', ef: false }], ['la matinée', 'morning', 'temps', { g: 'morning', ef: false }],
  ['un mois/ce mois-ci', 'a month/this month', 'temps'], ['une/cette nuit', 'a/this night', 'temps'], ['une/cette semaine', 'a/this week', 'temps'],
  ['un/ce soir', 'an/this evening', 'temps', { g: 'evening', ef: false }], ['une soirée', 'an evening', 'temps', { g: 'evening', ef: false }],
  ['dernier/dernière', 'last', 'temps'], ['premier/première', 'first', 'temps'], ['prochain(e)', 'next', 'temps'], ['tous les jours', 'every day', 'temps'],
  ['Quelle heure est-il?', 'What time is it?', 'heure'], ['et quart', 'fifteen minutes past the hour', 'heure'],
  ['et demie', 'thirty minutes past the hour', 'heure'], ['moins dix', 'ten minutes before the hour', 'heure'],
  ['moins le quart', 'fifteen minutes before the hour', 'heure'], ['À quelle heure?', '(At) what time/when?', 'heure'],
  ['de l’après-midi', 'in the afternoon', 'heure', { g: 'afternoon', ef: false }], ['du matin', 'in the morning', 'heure', { g: 'morning', ef: false }],
  ['du soir', 'in the evening', 'heure', { g: 'evening', ef: false }], ['en avance', 'early', 'heure', { g: 'early', ef: false }],
  ['en retard', 'late', 'heure', { g: 'late', ef: false }], ['midi', 'noon', 'heure'], ['minuit', 'midnight', 'heure'],
  ['pile', 'sharp, on the dot', 'heure'], ['presque', 'almost', 'heure'], ['tard', 'late', 'heure', { g: 'late', ef: false }],
  ['tôt', 'early', 'heure', { g: 'early', ef: false }], ['vers', 'about', 'heure'],
  ['avoir', 'to have', 'avoir'], ['avoir… ans', 'to be… years old', 'avoir'], ['avoir besoin (de)', 'to need', 'avoir'],
  ['avoir chaud', 'to be hot', 'avoir'], ['avoir froid', 'to be cold', 'avoir'], ['avoir soif', 'to be thirsty', 'avoir'],
  ['avoir sommeil', 'to be sleepy', 'avoir'], ['avoir faim', 'to be hungry', 'avoir'], ['avoir de la chance', 'to be lucky', 'avoir'],
  ['avoir envie (de)', 'to feel like', 'avoir'], ['avoir honte (de)', 'to be ashamed of', 'avoir'], ['avoir peur (de)', 'to be afraid of', 'avoir'],
  ['avoir l’air', 'to seem', 'avoir'], ['avoir raison', 'to be right', 'avoir'], ['avoir tort', 'to be wrong', 'avoir'],
  ['avoir de bonnes/mauvaises notes', 'to have good/bad grades', 'avoir']
].map(r => ({ fr: r[0], en: r[1], cat: r[2], g: (r[3] && r[3].g) || r[1], ef: !(r[3] && r[3].ef === false), id: slug(r[0]) }));

const CAT_NAME = { cours: 'school subjects', adj: 'adjectives', opinion: 'questions and opinions', verbe: 'verbs', temps: 'time expressions', heure: 'telling time', avoir: 'avoir expressions' };

function vocabQuestions() {
  const out = [], ids = new Set();
  V.forEach(p => { if (ids.has(p.id)) throw new Error('dup vocab id ' + p.id); ids.add(p.id); });
  function pool(p) {
    let a = V.filter(x => x !== p && x.cat === p.cat && x.g !== p.g);
    if (a.length < 8) a = a.concat(V.filter(x => x !== p && x.cat !== p.cat && x.g !== p.g));
    return shuffle(a);
  }
  V.forEach(p => {
    { // French -> English
      const seen = new Set([p.en]), ds = [];
      pool(p).forEach(d => { if (ds.length < 3 && !seen.has(d.en)) { seen.add(d.en); ds.push(d); } });
      out.push(Q({
        id: 'v-' + p.id + '-fe', topic: 'vocab', skill: 'vocab-fe',
        prompt: 'What does “' + clean(p.fr) + '” mean?', speak: speakable(clean(p.fr)),
        hint: 'This word is from the “' + CAT_NAME[p.cat] + '” vocabulary.',
        choices: mkChoices(p.en, '“' + clean(p.fr) + '” means “' + p.en + '.”',
          ds.map(d => ({ t: d.en, why: '“' + d.en + '” is what “' + clean(d.fr) + '” means. “' + clean(p.fr) + '” means “' + p.en + '.”' })))
      }));
    }
    if (p.ef) { // English -> French
      const seen = new Set([clean(p.fr)]), ds = [];
      pool(p).forEach(d => { if (ds.length < 3 && !seen.has(clean(d.fr))) { seen.add(clean(d.fr)); ds.push(d); } });
      out.push(Q({
        id: 'v-' + p.id + '-ef', topic: 'vocab', skill: 'vocab-ef',
        prompt: 'How do you say “' + p.en + '” in French?',
        hint: 'It starts with “' + clean(p.fr).slice(0, 2) + '…”.',
        choices: mkChoices(clean(p.fr), '“' + clean(p.fr) + '” means “' + p.en + '.”',
          ds.map(d => ({ t: clean(d.fr), why: '“' + clean(d.fr) + '” means “' + d.en + '.” For “' + p.en + '” you want “' + clean(p.fr) + '.”' })))
      }));
    }
  });
  return out;
}

/* ---------- LES COURS ---------- */
const GLOSS = { 'adorer': 'to love', 'détester': 'to hate', 'utile': 'useful', 'inutile': 'useless', 'facile': 'easy', 'difficile': 'difficult',
  'la journée': 'the day', 'la nuit': 'the night', 'enseigner': 'to teach', 'apprendre': 'to learn', 'échouer': 'to fail', 'réussir': 'to succeed',
  'en avance': 'early', 'en retard': 'late' };
const OPP = [['adorer', 'détester'], ['utile', 'inutile'], ['facile', 'difficile'], ['la journée', 'la nuit'], ['enseigner', 'apprendre'], ['échouer', 'réussir'], ['en avance', 'en retard']];
function oppOf(w) { for (const p of OPP) { if (p[0] === w) return p[1]; if (p[1] === w) return p[0]; } return null; }

function oppositeQuestions() {
  const out = [];
  OPP.forEach(pair => {
    [[pair[0], pair[1]], [pair[1], pair[0]]].forEach(([a, b]) => {
      const others = shuffle(OPP.filter(p => p !== pair).reduce((acc, p) => acc.concat(p), [])).slice(0, 3);
      out.push(Q({
        id: 'opp-' + slug(a), topic: 'cours', skill: 'opposites',
        prompt: 'What is the opposite of “' + a + '” (' + GLOSS[a] + ')?',
        hint: 'Your teacher’s “Les opposés” list has this pair.',
        choices: mkChoices(b, '“' + a + '” and “' + b + '” are opposites: ' + GLOSS[a] + ' / ' + GLOSS[b] + '.',
          others.map(o => ({ t: o, why: '“' + o + '” (' + GLOSS[o] + ') is the opposite of “' + oppOf(o) + ',” not of “' + a + '.”' })))
      }));
    });
  });
  return out;
}

const SUBJ = {
  'la chimie': 'atoms and chemical reactions', 'la physique': 'forces, energy, and motion', 'l’informatique': 'computers and coding',
  'la biologie': 'living things like cells and the human body', 'la géographie': 'countries, maps, and landforms', 'l’histoire': 'the past and big historical events',
  'les mathématiques': 'numbers and equations', 'l’art': 'painting, drawing, and museums', 'l’éducation physique': 'sports and exercise',
  'le français': 'French grammar and culture', 'l’anglais': 'English grammar and literature', 'l’espagnol': 'the Spanish language'
};
function subjectQuestions() {
  const items = [
    ['les volcans et les montagnes', 'la géographie'], ['les atomes et les molécules', 'la chimie'], ['la force et l’énergie', 'la physique'],
    ['un clavier et une souris', 'l’informatique'], ['une raquette et un ballon de basket', 'l’éducation physique'],
    ['les verbes et la grammaire françaises', 'le français'], ['les chiffres et les équations', 'les mathématiques'],
    ['Napoléon et la Révolution française', 'l’histoire'], ['les cellules et le corps humain', 'la biologie'], ['la peinture et les musées', 'l’art']
  ];
  const keys = Object.keys(SUBJ);
  return items.map((it, i) => {
    const ds = shuffle(keys.filter(k => k !== it[1])).slice(0, 3);
    return Q({
      id: 'subj-' + (i + 1), topic: 'cours', skill: 'subject-match',
      prompt: 'En quel cours? In what class would you study “' + it[0] + '”?',
      hint: 'Think about what the subject covers.',
      choices: mkChoices(it[1], '“' + it[1] + '” is the class for ' + SUBJ[it[1]] + '.',
        ds.map(d => ({ t: d, why: '“' + d + '” is the class for ' + SUBJ[d] + ', so it doesn’t match “' + it[0] + '.”' })))
    });
  });
}
function oddOneOutQuestions() {
  const items = [
    [['la chimie', 'la physique', 'la biologie'], 'un gymnase', 'a science class', '“un gymnase” is a place (a gym), not a school subject.'],
    [['le français', 'l’espagnol', 'l’anglais'], 'la chimie', 'a language class', '“la chimie” (chemistry) is a science, not a language.'],
    [['un gymnase', 'la cantine', 'l’école'], 'un devoir', 'a place at school', '“un devoir” (homework) is something you do, not a place.'],
    [['une note', 'un examen', 'un devoir'], 'la cantine', 'schoolwork', '“la cantine” is a place to eat, not a piece of schoolwork.'],
    [['facile', 'difficile', 'inutile'], 'l’école', 'an adjective', '“l’école” is a noun (school), while the others describe things.'],
    [['commencer', 'travailler', 'étudier'], 'difficile', 'a verb', '“difficile” is an adjective, while the others are verbs.']
  ];
  return items.map((it, i) => {
    const pos = shuffle(it[0].concat([it[1]]));
    return Q({
      id: 'odd-' + (i + 1), topic: 'cours', skill: 'odd-one-out',
      prompt: 'Chassez l’intrus. Which word does NOT belong? ' + pos.join(' / '),
      hint: 'Find what three of the words have in common.',
      choices: mkChoices(it[1], it[3], it[0].map(w => ({ t: w, why: '“' + w + '” is ' + it[2] + ', so it belongs to the group.' })))
    });
  });
}

/* ---------- AVOIR ---------- */
const EXPR = {
  chaud: { fr: 'chaud', en: 'hot' }, froid: { fr: 'froid', en: 'cold' }, soif: { fr: 'soif', en: 'thirsty' }, sommeil: { fr: 'sommeil', en: 'sleepy' },
  faim: { fr: 'faim', en: 'hungry' }, chance: { fr: 'de la chance', en: 'lucky' }, envie: { fr: 'envie', en: 'to feel like' }, peur: { fr: 'peur', en: 'afraid' },
  besoin: { fr: 'besoin', en: 'to need' }, honte: { fr: 'honte', en: 'ashamed' }, air: { fr: 'l’air', en: 'to seem' }, raison: { fr: 'raison', en: 'right' },
  tort: { fr: 'tort', en: 'wrong' }, notes: { fr: 'de bonnes notes', en: 'to have good grades' }, mnotes: { fr: 'de mauvaises notes', en: 'to have bad grades' }
};
const exprMeaning = k => EXPR[k].en.startsWith('to ') ? EXPR[k].en : 'to be ' + EXPR[k].en;
const AV = { 0: 'ai', 1: 'as', 2: 'a', 3: 'avons', 4: 'avez', 5: 'ont' };
const ETRE = { 0: 'suis', 1: 'es', 2: 'est', 3: 'sommes', 4: 'êtes', 5: 'sont' };
const PRON = { 0: 'je', 1: 'tu', 2: 'il/elle', 3: 'nous', 4: 'vous', 5: 'ils/elles' };
const PRONOUNS = ['Je', 'Tu', 'Il', 'Elle', 'Nous', 'Vous', 'Ils', 'Elles'];
const subjLabel = s => PRONOUNS.includes(s) ? s.toLowerCase() : s;

function avoirFixed() {
  const items = [
    ['Murphy voit un très gros aspirateur. Il ___ de lui.', 2, 'peur', ['besoin', 'envie', 'honte'], 'Being scared of something is “avoir peur de.”'],
    ['C’est l’été et il fait 38 degrés. Nous ___.', 3, 'chaud', ['froid', 'faim', 'sommeil'], 'Feeling hot is “avoir chaud.”'],
    ['Après une longue journée, ils veulent dormir. Ils ___.', 5, 'sommeil', ['froid', 'tort', 'chance'], 'Wanting to sleep means “avoir sommeil.”'],
    ['Tu n’as rien mangé depuis hier. Tu ___.', 1, 'faim', ['soif', 'peur', 'tort'], 'Not having eaten means “avoir faim.”'],
    ['Il trouve vingt dollars dans la rue! Il ___.', 2, 'chance', ['raison', 'honte', 'tort'], 'Good luck is “avoir de la chance.”'],
    ['Je ne peux pas faire mon devoir sans toi. J’___ de ton aide.', 0, 'besoin', ['envie', 'peur', 'honte'], 'Needing something is “avoir besoin de.”'],
    ['Il neige et tu n’as pas de manteau. Tu ___.', 1, 'froid', ['chaud', 'chance', 'sommeil'], 'Feeling cold is “avoir froid.”'],
    ['Elle dit que 3 + 4 = 7. Elle ___.', 2, 'raison', ['tort', 'honte', 'air'], 'Saying something correct means “avoir raison.”'],
    ['Il dit que Paris est la capitale de l’Espagne. Il ___.', 2, 'tort', ['raison', 'chance', 'soif'], 'Saying something incorrect means “avoir tort.”'],
    ['Elle a laissé tomber son plat devant tout le monde. Elle ___.', 2, 'honte', ['chaud', 'soif', 'raison'], 'Being embarrassed is “avoir honte.”'],
    ['Elle regarde le menu et rêve d’une pizza. Elle ___ d’une pizza.', 2, 'envie', ['peur', 'honte', 'raison'], 'Feeling like having something is “avoir envie de.”'],
    ['(Murphy looks happy.) Murphy ___ content.', 2, 'air', ['raison', 'soif', 'chance'], 'Seeming a certain way is “avoir l’air.”'],
    ['Après le match de foot, les joueurs boivent beaucoup d’eau. Ils ___.', 5, 'soif', ['faim', 'froid', 'sommeil'], 'Needing a drink is “avoir soif.”'],
    ['Tu regardes un film d’horreur et tu fermes les yeux. Tu ___.', 1, 'peur', ['chaud', 'soif', 'raison'], 'Being scared is “avoir peur.”'],
    ['Vous mettez un gros pull et un manteau. Vous ___.', 4, 'froid', ['chaud', 'faim', 'tort'], 'Feeling cold is “avoir froid.”'],
    ['Le professeur donne un A à tous les élèves. Ils ___.', 5, 'notes', ['mnotes', 'raison', 'tort'], 'Getting good grades is “avoir de bonnes notes.”']
  ];
  const out = items.map((it, i) => {
    const form = k => AV[it[1]] + ' ' + EXPR[k].fr;
    return Q({
      id: 'avoir-' + (i + 1), topic: 'avoir', skill: 'avoir-expr', prompt: it[0],
      hint: 'In English these use “to be.” In French they use avoir.',
      choices: mkChoices(form(it[2]), it[4] + ' (avoir ' + EXPR[it[2]].fr + ' = ' + exprMeaning(it[2]) + ')',
        it[3].map(k => ({ t: form(k), why: '“avoir ' + EXPR[k].fr + '” means “' + exprMeaning(k) + '.” That doesn’t fit this situation.' })))
    });
  });
  out.push(Q({ id: 'avoir-age', topic: 'avoir', skill: 'avoir-concept', prompt: 'How do you say “I am thirteen years old” in French?', hint: 'French uses avoir for age.',
    choices: mkChoices('J’ai treize ans.', 'French uses avoir for age: “j’ai … ans.”', [
      { t: 'Je suis treize ans.', why: '“Je suis” is être. Age uses avoir, not être.' },
      { t: 'J’ai treize.', why: 'You need the word “ans” (years) after the number.' },
      { t: 'Je suis treize années.', why: 'Wrong verb and wrong word: use “J’ai … ans.”' }]) }));
  out.push(Q({ id: 'avoir-hungry', topic: 'avoir', skill: 'avoir-concept', prompt: 'How do you say “I am hungry” in French?', hint: 'Think avoir, not “to be.”',
    choices: mkChoices('J’ai faim.', '“Avoir faim” is the expression for being hungry.', [
      { t: 'Je suis faim.', why: '“Je suis” is être. This expression uses avoir.' },
      { t: 'Je fais faim.', why: '“Faire” isn’t used here. It’s “avoir faim.”' },
      { t: 'Je veux faim.', why: '“Je veux” means “I want,” so this would mean “I want hunger.”' }]) }));
  out.push(Q({ id: 'avoir-weather', topic: 'avoir', skill: 'avoir-concept', prompt: 'Which sentence says that a PERSON feels hot?', hint: 'People feel things with avoir. Weather uses “il fait.”',
    choices: mkChoices('Il a chaud.', '“Il a chaud” = he feels hot. (“Il fait chaud” describes the weather.)', [
      { t: 'Il fait chaud.', why: '“Il fait chaud” describes the weather: “it’s hot out.”' },
      { t: 'Il est chaud.', why: '“Il est chaud” isn’t how you say someone feels hot. Use avoir.' },
      { t: 'Il y a chaud.', why: '“Il y a” means “there is/are,” so this doesn’t work.' }]) }));
  return out;
}

const AV_SUBJ = [
  { s: 'Je', p: 0 }, { s: 'Tu', p: 1 }, { s: 'Il', p: 2 }, { s: 'Elle', p: 2 }, { s: 'Nous', p: 3 }, { s: 'Vous', p: 4 }, { s: 'Ils', p: 5 }, { s: 'Elles', p: 5 },
  { s: 'Murphy', p: 2 }, { s: 'Les élèves', p: 5 }, { s: 'Murphy et moi', p: 3 }, { s: 'Mon ami', p: 2 }, { s: 'Toi et moi', p: 3 }
];
const AV_TAILS = ['faim', 'soif', 'froid', 'chaud', 'sommeil', 'raison', 'tort', 'de la chance', 'peur', 'honte', 'trois ans', 'douze ans'];
function avoirConjTemplate() {
  const S = pick(AV_SUBJ), tail = pick(AV_TAILS);
  const prompt = S.s === 'Je' ? 'J’___ ' + tail + '.' : S.s + ' ___ ' + tail + '.';
  const correct = AV[S.p], lbl = subjLabel(S.s);
  const cand = [];
  for (let q = 0; q < 6; q++) if (AV[q] !== correct) cand.push({ t: AV[q], why: '“' + AV[q] + '” goes with ' + PRON[q] + ', not with “' + lbl + '.”' });
  const etre = { t: ETRE[S.p], why: '“' + ETRE[S.p] + '” is a form of être. These expressions use avoir, never être.' };
  const wr = shuffle(shuffle(cand).slice(0, 2).concat([etre]));
  return Q({
    id: 'tpl-avoir-conj', topic: 'avoir', skill: 'avoir-conj', fixed: false, prompt: prompt,
    hint: 'Match avoir to the subject: j’ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont.',
    choices: mkChoices(correct, 'With ' + lbl + ', use “' + correct + '.”', wr)
  });
}

/* ---------- L’HEURE ---------- */
const HW = ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'];
const hourStr = n => (n === 1 ? 'une heure' : HW[n] + ' heures');
const MINW = { 5: 'cinq', 10: 'dix', 20: 'vingt' };
const h12of = h24 => (h24 % 12 === 0 ? 12 : h24 % 12);
function periodOf(h24) { return h24 < 12 ? 'du matin' : h24 < 18 ? 'de l’après-midi' : 'du soir'; }
function enPeriod(h24) { return h24 < 12 ? 'morning' : h24 < 18 ? 'afternoon' : 'evening'; }
function coreFr(h12, m) {
  switch (m) {
    case 0: return hourStr(h12);
    case 5: case 10: case 20: return hourStr(h12) + ' ' + MINW[m];
    case 15: return hourStr(h12) + ' et quart';
    case 30: return hourStr(h12) + ' et demie';
    case 40: return hourStr(h12 + 1) + ' moins vingt';
    case 45: return hourStr(h12 + 1) + ' moins le quart';
    case 50: return hourStr(h12 + 1) + ' moins dix';
  }
  throw new Error('bad minute ' + m);
}
const fr12 = (h24, m) => 'Il est ' + coreFr(h12of(h24), m) + ' ' + periodOf(h24) + '.';
const dig12 = (h24, m) => h12of(h24) + ':' + pad(m) + (h24 < 12 ? ' a.m.' : ' p.m.');
const dig24 = (h24, m) => pad(h24) + 'h' + pad(m);
const MINS = [0, 5, 10, 15, 20, 30, 40, 45, 50];
const validH = h => (h >= 1 && h <= 10) || (h >= 13 && h <= 22);
function okTime(h, m) { return validH(h) && !(m >= 40 && h === 17); } // keep away from the 6 p.m. boundary with “moins”
// Times that appear in the worksheets or in the teacher's notes are never generated, so a template can't repeat a source item.
const SOURCE_TIMES = new Set(['3:40', '1:20', '6:0', '9:15', '1:10', '10:45', '5:5', '10:0', '4:45', '2:15', '6:30', '10:15', '9:45', '11:30', '3:5', '9:5']);
function randTime() { for (;;) { const h24 = pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]), m = pick(MINS); if (okTime(h24, m) && !SOURCE_TIMES.has(h12of(h24) + ':' + m)) return { h24, m }; } }
function minutesDescr(m) {
  return { 0: 'exactly on the hour', 5: '5 minutes past', 10: '10 minutes past', 15: 'a quarter past (et quart)', 20: '20 minutes past', 30: 'half past (et demie)', 40: '20 minutes BEFORE the next hour (moins vingt)', 45: 'a quarter BEFORE the next hour (moins le quart)', 50: '10 minutes BEFORE the next hour (moins dix)' }[m];
}

function timeD2F(opts) {
  opts = opts || {};
  const T = randTime(), h12 = h12of(T.h24);
  const correct = fr12(T.h24, T.m);
  const cands = [];
  if (T.m >= 40) { // “moins” counted from the same hour
    const ex = { 40: 'vingt', 45: 'le quart', 50: 'dix' }[T.m];
    cands.push({ t: 'Il est ' + hourStr(h12) + ' moins ' + ex + ' ' + periodOf(T.h24) + '.',
      why: 'With “moins,” you name the NEXT hour. “' + hourStr(h12) + ' moins ' + ex + '” would be ' + dig12(T.h24 - 1, T.m) + '.' });
  }
  shuffle(MINS.filter(x => x !== T.m && okTime(T.h24, x))).slice(0, 3).forEach(x =>
    cands.push({ t: fr12(T.h24, x), why: 'That says ' + dig12(T.h24, x) + (x ? ', which means ' + minutesDescr(x) + '.' : '.') }));
  const nh = T.h24 + (rnd(2) ? 1 : -1);
  if (okTime(nh, T.m) && periodOf(nh) === periodOf(T.h24) && !(T.m >= 40 && h12of(nh) > 10))
    cands.push({ t: fr12(nh, T.m), why: 'That says ' + dig12(nh, T.m) + ', so the hour is off by one.' });
  { const p = shuffle(['du matin', 'de l’après-midi', 'du soir'].filter(x => x !== periodOf(T.h24)))[0];
    const range = { 'du matin': 'midnight to noon', 'de l’après-midi': 'noon to 6 p.m.', 'du soir': '6 p.m. to midnight' };
    cands.push({ t: 'Il est ' + coreFr(h12, T.m) + ' ' + p + '.',
      why: '“' + p + '” is for ' + range[p] + '. ' + dig12(T.h24, T.m) + ' is in the ' + enPeriod(T.h24) + ' (' + range[periodOf(T.h24)] + ').' }); }
  const seen = new Set([correct]), ws = [];
  shuffle(cands).forEach(c => { if (ws.length < 3 && !seen.has(c.t)) { seen.add(c.t); ws.push(c); } });
  return Q({
    id: opts.digits24 ? 'tpl-time-24d' : 'tpl-time-d2f', topic: 'heure', skill: opts.digits24 ? 'time-24d' : 'time-d2f', fixed: false,
    prompt: opts.digits24 ? 'Which French sentence matches ' + dig24(T.h24, T.m) + '?' : 'Which is the correct way to say ' + dig12(T.h24, T.m) + ' (' + enPeriod(T.h24) + ')?',
    hint: 'Remember: “moins” counts down to the NEXT hour. Check matin / après-midi / soir too.',
    choices: mkChoices(correct, (opts.digits24 ? dig24(T.h24, T.m) + ' is ' + dig12(T.h24, T.m) + ' = ' : dig12(T.h24, T.m) + ' = ') + '“' + correct.replace(/\.$/, '') + '.”', ws)
  });
}
function timeF2D(opts) {
  opts = opts || {};
  const T = randTime(), h12 = h12of(T.h24);
  const fmt = opts.digits24 ? dig24 : dig12;
  const correct = fmt(T.h24, T.m);
  const cands = [];
  if (T.m >= 40) {
    const x = { 40: 20, 45: 15, 50: 10 }[T.m];
    cands.push({ t: fmt(T.h24 + 1, x), why: '“moins” means BEFORE the hour, so it isn’t ' + fmt(T.h24 + 1, x) + '. It’s ' + correct + '.' });
    cands.push({ t: fmt(T.h24 + 1, T.m), why: '“moins” subtracts from the hour named, so the time is ' + correct + ', not ' + fmt(T.h24 + 1, T.m) + '.' });
  } else {
    shuffle(MINS.filter(x => x !== T.m && x < 40)).slice(0, 2).forEach(x =>
      cands.push({ t: fmt(T.h24, x), why: 'That’s ' + fmt(T.h24, x) + ', but the French sentence gives :' + pad(T.m) + '.' }));
    cands.push({ t: fmt(T.h24 + (rnd(2) ? 1 : -1), T.m), why: 'The hour is off by one. The French says “' + hourStr(h12) + '.”' });
  }
  const flip = T.h24 < 12 ? T.h24 + 12 : T.h24 - 12;
  cands.push({ t: fmt(flip, T.m), why: '“' + periodOf(T.h24) + '” tells you ' + (opts.digits24 ? 'whether to add 12 hours' : 'it’s ' + (T.h24 < 12 ? 'a.m.' : 'p.m.') + ', not ' + (T.h24 < 12 ? 'p.m.' : 'a.m.')) + '.' });
  const seen = new Set([correct]), ws = [];
  shuffle(cands).forEach(c => { if (ws.length < 3 && !seen.has(c.t) && !/^(24|25|26)h|^-/.test(c.t)) { seen.add(c.t); ws.push(c); } });
  const sentence = fr12(T.h24, T.m);
  return Q({
    id: opts.digits24 ? 'tpl-time-24f' : 'tpl-time-f2d', topic: 'heure', skill: opts.digits24 ? 'time-24f' : 'time-f2d', fixed: false,
    prompt: sentence.replace(/\.$/, '') + '. ' + (opts.digits24 ? 'Write this time on the 24-hour clock.' : 'Quelle heure est-il? Choose the time in numbers.'),
    speak: sentence,
    hint: opts.digits24 ? 'After noon, add 12 to the hour (4 p.m. = 16h). Then work out the minutes.' : '“et” adds minutes. “moins” subtracts them from the next hour.',
    choices: mkChoices(correct, sentence.replace(/\.$/, '') + ' = ' + correct + '.', ws)
  });
}
function timeFixed() {
  const L = [
    ['t-midi', 'How do you say “noon” in French?', 'midi', [['minuit', '“minuit” is midnight.'], ['minuit pile', '“minuit pile” is midnight on the dot.'], ['du matin', '“du matin” means “in the morning.” It isn’t a time by itself.']], '“midi” is noon.'],
    ['t-minuit-pile', 'How do you say “midnight on the dot” in French?', 'minuit pile', [['midi pile', '“midi pile” would be noon on the dot.'], ['minuit et demi', '“minuit et demi” is 12:30 a.m.'], ['presque minuit', '“presque minuit” is almost midnight.']], '“pile” means “on the dot,” so “minuit pile” is exactly midnight.'],
    ['t-minuit-demi', 'Which sentence says it is 12:30 a.m.?', 'Il est minuit et demi.', [['Il est midi et demi.', '“midi et demi” is 12:30 p.m.'], ['Il est minuit et quart.', '“minuit et quart” is 12:15 a.m.'], ['Il est minuit moins le quart.', '“minuit moins le quart” is 11:45 p.m.']], '“minuit et demi” is 12:30 a.m.'],
    ['t-midi-demi', 'Which sentence says it is 12:30 p.m.?', 'Il est midi et demi.', [['Il est minuit et demi.', '“minuit et demi” is 12:30 a.m.'], ['Il est midi et quart.', '“midi et quart” is 12:15 p.m.'], ['Il est midi moins le quart.', '“midi moins le quart” is 11:45 a.m.']], '“midi et demi” is 12:30 p.m.'],
    ['t-presque', '“Il est presque huit heures.” What does it mean?', 'It’s almost 8:00.', [['It’s exactly 8:00.', '“pile” means exactly. “presque” means almost.'], ['It’s just after 8:00.', '“presque” means almost, so it hasn’t reached 8:00 yet.'], ['It’s about 8:00 at night.', '“presque” is “almost.” It doesn’t say anything about night.']], '“presque” means “almost.”'],
    ['t-pile', '“Il est quatre heures pile.” What does it mean?', 'It’s exactly 4:00.', [['It’s almost 4:00.', '“presque” means almost. “pile” means on the dot.'], ['It’s about 4:00.', '“vers” means about. “pile” means on the dot.'], ['It’s 4:30.', 'For 4:30 you would say “quatre heures et demie.”']], '“pile” means sharp, on the dot.'],
    ['t-retard', 'Class starts at 9:00. You arrive at 9:20. Tu es ___.', 'en retard', [['en avance', '“en avance” means early.'], ['tôt', '“tôt” means early, which doesn’t fit arriving after the start.'], ['pile', '“pile” would mean exactly on time.']], '“en retard” means late.'],
    ['t-avance', 'Class starts at 9:00. You arrive at 8:40. Tu es ___.', 'en avance', [['en retard', '“en retard” means late.'], ['tard', '“tard” means late.'], ['presque', '“presque” means almost.']], '“en avance” means early.'],
    ['t-quelle-heure', 'Which question means “What time is it?”', 'Quelle heure est-il?', [['À quelle heure?', '“À quelle heure?” means “At what time?”'], ['Quel jour est-il?', '“Quel jour” asks about the day.'], ['Quelle heure est le jour?', 'This doesn’t make sense in French.']], '“Quelle heure est-il?” asks for the current time.'],
    ['t-a-quelle-heure', 'Which question means “At what time?”', 'À quelle heure?', [['Quelle heure est-il?', '“Quelle heure est-il?” means “What time is it?”'], ['Pourquoi?', '“Pourquoi?” means “Why?”'], ['Est-ce que?', '“Est-ce que” starts a yes/no question.']], '“À quelle heure?” asks when something happens.'],
    ['t-vers', '“On mange vers midi.” What does “vers” mean here?', 'about, around', [['exactly', '“pile” means exactly.'], ['after', '“après” means after.'], ['almost', '“presque” means almost.']], '“vers” means about.'],
    ['t-matin-soir', 'Which phrase goes with 9:00 p.m.?', 'du soir', [['du matin', '“du matin” is for midnight to noon.'], ['de l’après-midi', '“de l’après-midi” is for noon to 6 p.m.'], ['pile', '“pile” means on the dot. It isn’t a time of day.']], '“du soir” covers 6 p.m. to midnight.'],
    ['t-1h-moins-vingt', '“Il est une heure moins vingt.” What time is it?', '12:40', [['1:20', '“moins” means before, so it isn’t after 1:00.'], ['1:40', 'It’s 20 minutes before 1:00, not 40 after.'], ['12:20', '“moins vingt” is before the hour, so it’s 12:40, not 12:20.']], '20 minutes before 1:00 is 12:40.']
  ];
  return L.map(r => Q({ id: r[0], topic: 'heure', skill: 'time-concept', prompt: r[1], hint: 'Think about what each little word does.',
    choices: mkChoices(r[2], r[4], r[3].map(w => ({ t: w[0], why: w[1] }))) }));
}

/* ---------- LES VERBES EN -ER ---------- */
const ER = [
  ['commencer', 'to start', 'le cours à neuf heures'], ['passer', 'to take (an exam)', 'un examen demain'], ['préparer', 'to prepare', 'le dîner'],
  ['aider', 'to help', 'les élèves'], ['partager', 'to share', 'la pizza'], ['expliquer', 'to explain', 'la leçon'], ['trouver', 'to find', 'un livre'],
  ['chercher', 'to look for', 'les clés'], ['oublier', 'to forget', 'le devoir'], ['travailler', 'to work', 'à la bibliothèque'], ['dessiner', 'to draw', 'un chien'],
  ['aimer', 'to like', 'le chocolat'], ['donner', 'to give', 'un cadeau'], ['étudier', 'to study', 'le français'], ['habiter', 'to live', 'à Paris'],
  ['manger', 'to eat', 'une salade'], ['parler', 'to speak', 'au téléphone'], ['penser', 'to think', 'que le test est facile'], ['regarder', 'to watch', 'la télévision'],
  ['rencontrer', 'to meet', 'un ami'], ['retrouver', 'to meet up with', 'les amis à la cantine'], ['assister', 'to attend', 'à un cours'], ['demander', 'to ask', 'l’heure'],
  ['écouter', 'to listen to', 'la musique'], ['enseigner', 'to teach', 'les maths'], ['rentrer', 'to return', 'à la maison'], ['visiter', 'to visit', 'un musée'], ['voyager', 'to travel', 'en train']
];
const ER_SUBJ = [
  { s: 'Je', p: 0 }, { s: 'Tu', p: 1 }, { s: 'Il', p: 2 }, { s: 'Elle', p: 2 }, { s: 'Nous', p: 3 }, { s: 'Vous', p: 4 }, { s: 'Ils', p: 5 }, { s: 'Elles', p: 5 },
  { s: 'Murphy', p: 2 }, { s: 'Le professeur', p: 2 }, { s: 'Les élèves', p: 5 }, { s: 'Murphy et moi', p: 3 }, { s: 'Mes amis', p: 5 }
];
const ENDS = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
function conj(inf, p) {
  const stem = inf.slice(0, -2);
  if (p === 3) { if (inf.endsWith('cer')) return stem.slice(0, -1) + 'çons'; if (inf.endsWith('ger')) return stem + 'eons'; }
  return stem + ENDS[p];
}
const PRON_LBL = { 0: 'je', 1: 'tu', 2: 'il/elle/on', 3: 'nous', 4: 'vous', 5: 'ils/elles' };
const startsVowel = w => /^[aeiouhéèêâîô]/i.test(w);
function erTemplate() {
  const v = pick(ER), S = pick(ER_SUBJ), inf = v[0], correct = conj(inf, S.p);
  const prompt = ((S.s === 'Je' && startsVowel(inf)) ? 'J’___' : S.s + ' ___') + ' (' + inf + ') ' + v[2] + '.';
  const seenT = new Set([correct]), uc = [];
  shuffle([0, 1, 2, 3, 4, 5]).forEach(q => { const f = conj(inf, q); if (!seenT.has(f)) { seenT.add(f); uc.push({ t: f, why: '“' + f + '” is the form for ' + PRON_LBL[q] + ', not for “' + subjLabel(S.s) + '.”' }); } });
  const infC = { t: inf, why: '“' + inf + '” is the infinitive. You have to conjugate it to match the subject.' };
  const bad = (inf.endsWith('cer') || inf.endsWith('ger')) ? inf.slice(0, -2) + 'ons' : null;
  const spell = (bad && bad !== correct && !seenT.has(bad)) ? { t: bad, why: 'With -' + inf.slice(-3) + ' verbs, the nous form changes spelling to keep the soft sound: “' + conj(inf, 3) + '.”' } : null;
  const ws = [];
  if (S.p === 3 && spell) ws.push(spell);
  shuffle(uc.concat([infC])).forEach(c => { if (ws.length < 3 && !ws.some(w => w.t === c.t)) ws.push(c); });
  return Q({
    id: 'tpl-er-conj', topic: 'er', skill: 'er-conj', fixed: false, prompt: prompt, hint: 'Drop -er, then add: -e, -es, -e, -ons, -ez, -ent.',
    choices: mkChoices(correct, '“' + inf + '” (' + v[1] + ') with ' + subjLabel(S.s) + ' is “' + correct + '.”', ws)
  });
}
function erFixed() {
  const L = [
    ['er-not-er', 'Which of these is NOT an -ER verb?', 'perdre', [['aider', '“aider” is an -ER verb.'], ['partager', '“partager” is an -ER verb.'], ['oublier', '“oublier” is an -ER verb.']], '“Perdre” (to lose) ends in -RE, so it follows a different pattern.'],
    ['er-nous-commencer', 'What is the nous form of “commencer”?', 'commençons', [['commencons', 'You need the cedilla (ç) to keep the soft “s” sound.'], ['commencent', '“commencent” is the ils/elles form.'], ['commencez', '“commencez” is the vous form.']], 'The ç keeps the soft “s” sound before -ons.'],
    ['er-nous-manger', 'What is the nous form of “manger”?', 'mangeons', [['mangons', 'Without the “e,” the g would sound hard. Keep it: mangeons.'], ['mangent', '“mangent” is the ils/elles form.'], ['mangez', '“mangez” is the vous form.']], 'The extra “e” keeps the soft “g” sound.'],
    ['er-nous-voyager', 'What is the nous form of “voyager”?', 'voyageons', [['voyagons', 'Keep the “e” after g: voyageons.'], ['voyagent', '“voyagent” is the ils/elles form.'], ['voyagez', '“voyagez” is the vous form.']], 'The extra “e” keeps the soft “g” sound.'],
    ['er-nous-partager', 'What is the nous form of “partager”?', 'partageons', [['partagons', 'Keep the “e” after g: partageons.'], ['partagent', '“partagent” is the ils/elles form.'], ['partagez', '“partagez” is the vous form.']], 'The extra “e” keeps the soft “g” sound.'],
    ['er-ending-vous', 'Which subject goes with “parlez”?', 'vous', [['nous', '“nous” takes -ons: parlons.'], ['tu', '“tu” takes -es: parles.'], ['ils', '“ils” takes -ent: parlent.']], 'The -ez ending goes with vous.'],
    ['er-ending-nous', 'Which ending goes with “nous” for regular -ER verbs?', '-ons', [['-ez', '-ez goes with vous.'], ['-ent', '-ent goes with ils/elles.'], ['-es', '-es goes with tu.']], 'Nous takes -ons (watch the spelling of -cer and -ger verbs).'],
    ['er-ending-ils', 'Which ending goes with “ils” for regular -ER verbs?', '-ent', [['-ons', '-ons goes with nous.'], ['-ez', '-ez goes with vous.'], ['-e', '-e goes with je, il, and elle.']], 'Ils/elles take -ent (and you don’t pronounce it).']
  ];
  return L.map(r => Q({ id: r[0], topic: 'er', skill: 'er-concept', prompt: r[1], hint: 'Check your endings: -e, -es, -e, -ons, -ez, -ent.',
    choices: mkChoices(r[2], r[4], r[3].map(w => ({ t: w[0], why: w[1] }))) }));
}

/* ---------- QUEL VERBE? ---------- */
function choixFixed() {
  const L = [
    ['Le professeur', 2, 'explique', 'expliquer', 'oublier', 'la grammaire aux élèves'], ['Nous', 3, 'passons', 'passer', 'dessiner', 'un examen de chimie demain'],
    ['Je', 0, 'cherche', 'chercher', 'donner', 'mes clés partout'], ['Tu', 1, 'regardes', 'regarder', 'travailler', 'la télévision après l’école'],
    ['Les élèves', 5, 'travaillent', 'travailler', 'manger', 'à la bibliothèque pour étudier'], ['Vous', 4, 'écoutez', 'écouter', 'oublier', 'la musique avec des écouteurs'],
    ['Elle', 2, 'oublie', 'oublier', 'aider', 'son stylo à la maison. Quel dommage!'], ['Murphy', 2, 'trouve', 'trouver', 'enseigner', 'un os sous l’arbre'],
    ['Mes grands-parents', 5, 'habitent', 'habiter', 'dessiner', 'à Paris'], ['Ils', 5, 'préparent', 'préparer', 'visiter', 'le dîner dans la cuisine'],
    ['Tu', 1, 'aides', 'aider', 'manger', 'ton camarade à étudier pour le test'], ['Elles', 5, 'partagent', 'partager', 'voyager', 'une pizza à la cantine'],
    ['Nous', 3, 'voyageons', 'voyager', 'expliquer', 'en France cet été'], ['Le cours', 2, 'commence', 'commencer', 'dessiner', 'à neuf heures'],
    ['Tu', 1, 'dessines', 'dessiner', 'rentrer', 'un beau paysage dans ton cahier']
  ];
  const enOf = inf => (ER.find(e => e[0] === inf) || [0, 'another verb'])[1];
  return L.map((r, i) => {
    const subj = r[0], p = r[1], ans = r[2], A = r[3], B = r[4], comp = r[5];
    if (conj(A, p) !== ans) throw new Error('choix key mismatch ' + (i + 1));
    if (subj === 'Je' && (startsVowel(A) || startsVowel(B))) throw new Error('elision problem choix ' + (i + 1));
    const qa = shuffle([0, 1, 2, 3, 4, 5].filter(q => q !== p && conj(A, q) !== ans))[0];
    const qb = shuffle([0, 1, 2, 3, 4, 5].filter(q => q !== p && conj(B, q) !== conj(B, p)))[0];
    return Q({
      id: 'choix-' + (i + 1), topic: 'choix', skill: 'verb-choice',
      prompt: subj + ' ___ ' + comp + (/[!?.]$/.test(comp) ? '' : '.') + ' (' + shuffle([A, B]).join(' / ') + ')',
      hint: 'First pick the verb that makes sense. Then match the ending to the subject.',
      choices: mkChoices(ans, '“' + A + '” (' + enOf(A) + ') makes sense here, and with ' + subjLabel(subj) + ' it becomes “' + ans + '.”', [
        { t: conj(A, qa), why: 'Right verb, wrong ending. “' + conj(A, qa) + '” goes with ' + PRON_LBL[qa] + ', not with “' + subj + '.”' },
        { t: conj(B, p), why: '“' + B + '” (' + enOf(B) + ') has the right ending, but it doesn’t make sense in this sentence.' },
        { t: conj(B, qb), why: 'Wrong verb AND wrong ending. “' + B + '” (' + enOf(B) + ') doesn’t fit the meaning.' }
      ])
    });
  });
}

/* ---------- CHALLENGE ---------- */
function challengeFixed() {
  const L = [
    ['ch-estce', 'Make this a question with est-ce que: Vous aimez les maths.', 'Est-ce que vous aimez les maths?', [['Est-ce vous aimez les maths?', 'You need “que” in “est-ce que.”'], ['Est-ce que aimez vous les maths?', 'With est-ce que, keep the normal word order.'], ['Vous est-ce que aimez les maths?', '“Est-ce que” goes at the start.']], 'Est-ce que + normal word order makes a yes/no question.'],
    ['ch-invert', 'Make this a question by inverting: Ils habitent à Paris.', 'Habitent-ils à Paris?', [['Ils habitent-ils à Paris?', 'When you invert, the verb goes first and the subject doesn’t repeat.'], ['Habitent ils à Paris?', 'Add a hyphen between the verb and the subject pronoun.'], ['Ils-habitent à Paris?', 'The verb goes before the subject in an inverted question.']], 'Inversion: verb + hyphen + subject pronoun.'],
    ['ch-invert-t', 'Make this a question by inverting: Elle a un chien.', 'A-t-elle un chien?', [['A-elle un chien?', 'When a verb ends in a vowel and the pronoun starts with a vowel, add -t-.'], ['Elle a-t un chien?', 'The verb goes first, then -t-, then the pronoun.'], ['T-a-elle un chien?', 'The -t- goes between the verb and the pronoun.']], 'A-t-elle: the -t- keeps two vowels from bumping together.'],
    ['ch-neg1', 'Make this negative: Je mange à la cantine.', 'Je ne mange pas à la cantine.', [['Je ne pas mange à la cantine.', '“Ne… pas” wraps around the conjugated verb.'], ['Je mange ne pas à la cantine.', '“Ne” goes before the verb, not after it.'], ['Je pas ne mange à la cantine.', 'The order is ne + verb + pas.']], 'Ne… pas wraps around the verb.'],
    ['ch-neg2', 'Make this negative: Il aime le sport.', 'Il n’aime pas le sport.', [['Il ne aime pas le sport.', '“Ne” becomes “n’” before a vowel.'], ['Il n’aime le sport pas.', '“Pas” goes right after the verb.'], ['Il ne pas aime le sport.', 'The order is ne + verb + pas.']], '“Ne” shrinks to n’ before a vowel sound.'],
    ['ch-neg-de', 'Make this negative: Il y a des devoirs.', 'Il n’y a pas de devoirs.', [['Il n’y a pas des devoirs.', 'After a negative, “des” becomes “de.”'], ['Il ne y a pas de devoirs.', 'Use n’y before a vowel sound.'], ['Il y n’a pas de devoirs.', '“Ne” goes before “y a.”']], 'After a negative, des/un/une become de (or d’).'],
    ['ch-nest', 'Elle aime la chimie, ___?', 'n’est-ce pas', [['est-ce que', '“Est-ce que” starts a question.'], ['pourquoi', '“Pourquoi” means why.'], ['parce que', '“Parce que” means because.']], '“N’est-ce pas?” = “isn’t that right?”'],
    ['ch-si', 'Tu n’aimes pas la physique? — ___, j’aime ça!', 'Si', [['Oui', 'After a NEGATIVE question, say “si” to contradict.'], ['Non', '“Non” would agree that you don’t like it.'], ['Peut-être', 'This means “maybe,” which doesn’t fit.']], '“Si” = “yes” when you answer a negative question.'],
    ['ch-pourquoi', '___ tu étudies? — Parce que j’ai un examen.', 'Pourquoi', [['Parce que', 'This is the answer word, not the question word.'], ['Est-ce que', 'This starts a yes/no question and can’t stand alone.'], ['Bien sûr', 'This means “of course.”']], '“Pourquoi” asks why. “Parce que” answers.'],
    ['ch-nonplus', 'Je n’aime pas les devoirs. — ___.', 'Moi non plus', [['Moi aussi', '“Moi aussi” agrees with a positive statement.'], ['Moi si', 'This isn’t how you say it.'], ['Moi bien sûr', 'This doesn’t make sense.']], '“Moi non plus” means “me neither.”']
  ];
  return L.map(r => Q({ id: r[0], topic: 'challenge', skill: 'challenge', challenge: true, prompt: r[1], hint: 'Think about the word order and what each little word does.',
    choices: mkChoices(r[2], r[4], r[3].map(w => ({ t: w[0], why: w[1] }))) }));
}

/* ---------- LISTENING ---------- */
function listenTime() {
  const T = randTime(), correct = dig12(T.h24, T.m);
  const cands = [];
  if (T.m >= 40) cands.push({ t: dig12(T.h24 + 1, { 40: 20, 45: 15, 50: 10 }[T.m]), why: '“moins” means before the hour. Listen for it.' });
  shuffle(MINS.filter(x => x !== T.m && x < 40)).slice(0, 3).forEach(x => cands.push({ t: dig12(T.h24, x), why: 'Listen for the minutes: this would be ' + dig12(T.h24, x) + '.' }));
  cands.push({ t: dig12(T.h24 < 12 ? T.h24 + 12 : T.h24 - 12, T.m), why: 'Listen for matin / après-midi / soir to decide a.m. or p.m.' });
  const seen = new Set([correct]), ws = [];
  shuffle(cands).forEach(c => { if (ws.length < 3 && !seen.has(c.t)) { seen.add(c.t); ws.push(c); } });
  const text = fr12(T.h24, T.m);
  return Q({ id: 'tpl-listen-time', topic: 'listen', skill: 'listen-time', fixed: false, listen: { speak: text, text: text }, prompt: 'Listen. What time is it?',
    hint: 'Listen for “et” or “moins,” and for matin, après-midi, or soir.', choices: mkChoices(correct, text + ' = ' + correct + '.', ws) });
}
function listenAvoir() {
  const EN = { faim: 'hungry', soif: 'thirsty', froid: 'cold', chaud: 'hot', sommeil: 'sleepy', raison: 'right', tort: 'wrong', 'de la chance': 'lucky', peur: 'afraid', honte: 'ashamed' };
  const tails = Object.keys(EN), p = pick([0, 1, 3, 5]), tail = pick(tails);
  const subjFr = { 0: 'J’', 1: 'Tu ', 3: 'Nous ', 5: 'Ils ' }[p], enP = { 0: 'I am', 1: 'You are', 3: 'We are', 5: 'They are' }[p];
  const said = subjFr + AV[p] + ' ' + tail + '.';
  const ds = shuffle(tails.filter(t => t !== tail)).slice(0, 3);
  return Q({ id: 'tpl-listen-avoir', topic: 'listen', skill: 'listen-avoir', fixed: false, listen: { speak: said, text: said }, prompt: 'Listen. What does the speaker say?',
    hint: 'Listen to the last word: it’s the feeling.',
    choices: mkChoices(enP + ' ' + EN[tail] + '.', '“' + said + '” = ' + enP + ' ' + EN[tail] + '.', ds.map(d => ({ t: enP + ' ' + EN[d] + '.', why: 'That would be “' + subjFr + AV[p] + ' ' + d + '.” Listen for the feeling at the end.' }))) });
}
function listenVocab() {
  const p = pick(V.filter(x => ['verbe', 'cours', 'adj', 'heure', 'opinion'].includes(x.cat) && x.ef));
  const pool = shuffle(V.filter(x => x !== p && x.cat === p.cat && x.g !== p.g)), seen = new Set([p.en]), ds = [];
  pool.forEach(d => { if (ds.length < 3 && !seen.has(d.en)) { seen.add(d.en); ds.push(d); } });
  return Q({ id: 'tpl-listen-vocab', topic: 'listen', skill: 'listen-vocab', fixed: false, listen: { speak: speakable(clean(p.fr)), text: clean(p.fr) }, prompt: 'Listen. What does the word mean?',
    hint: 'Say it back to yourself and think of an English cousin.',
    choices: mkChoices(p.en, '“' + clean(p.fr) + '” means “' + p.en + '.”', ds.map(d => ({ t: d.en, why: '“' + d.en + '” is “' + clean(d.fr) + '.” You heard “' + clean(p.fr) + '.”' }))) });
}

/* ---------- Assemble ---------- */
const FIXED = {
  cours: oppositeQuestions().concat(subjectQuestions(), oddOneOutQuestions()),
  vocab: vocabQuestions(), avoir: avoirFixed(), heure: timeFixed(), er: erFixed(), choix: choixFixed(), listen: [], challenge: challengeFixed()
};
const TEMPLATES = {
  cours: [], vocab: [], avoir: [avoirConjTemplate],
  heure: [() => timeD2F(), () => timeF2D(), () => timeD2F({ digits24: true }), () => timeF2D({ digits24: true })],
  er: [erTemplate], choix: [], listen: [listenTime, listenAvoir, listenVocab], challenge: []
};
const TPL_SHARE = { cours: 0, vocab: 0, avoir: 0.4, heure: 0.7, er: 0.6, choix: 0, listen: 1, challenge: 0 };

function play(q) { return Object.assign({}, q, { choices: shuffle(q.choices.map(x => Object.assign({}, x))) }); }
function genTemplateQ(topic) { return pick(TEMPLATES[topic])(); }

function makeRound(topicIds, n) {
  const ids = topicIds.slice(), quota = ids.map(() => Math.floor(n / ids.length));
  const extra = n - quota.reduce((a, b) => a + b, 0);
  for (let i = 0; i < extra; i++) quota[i % ids.length]++;
  const prompts = new Set(), picked = [];
  const take = q => { const key = q.prompt + '|' + (q.listen ? q.listen.speak : ''); if (prompts.has(key)) return false; prompts.add(key); picked.push(play(q)); return true; };
  ids.forEach((t, k) => {
    const fx = shuffle(FIXED[t]); let fi = 0, got = 0, guard = 0;
    while (got < quota[k] && guard++ < 800) {
      const wantTpl = TEMPLATES[t].length > 0 && (Math.random() < TPL_SHARE[t] || fi >= fx.length);
      if (wantTpl) { if (take(genTemplateQ(t))) got++; }
      else if (fi < fx.length) { if (take(fx[fi++])) got++; }
      else break;
    }
  });
  return shuffle(picked);
}

function validate(q) {
  const errs = [];
  if (!q.id) errs.push('no id');
  if (!q.prompt) errs.push('no prompt');
  if (!q.choices || q.choices.length !== 4) { errs.push('not 4 choices'); return errs; }
  const ts = q.choices.map(c => c.t);
  if (new Set(ts).size !== 4) errs.push('duplicate choice text: ' + ts.join(' | '));
  if (q.choices.filter(c => c.ok).length !== 1) errs.push('not exactly one correct');
  q.choices.forEach(c => { if (!c.why || !c.why.trim()) errs.push('missing explanation for ' + c.t); if (!c.t || !c.t.trim()) errs.push('empty choice'); });
  return errs;
}

function roundKey(q) { return q.prompt + '|' + (q.listen ? q.listen.speak : ''); }
function maxRound(topicIds) { return topicIds.reduce((a, t) => a + (TEMPLATES[t].length ? 1e9 : FIXED[t].length), 0); }
const api = { roundKey, maxRound, TOPICS, FIXED, TEMPLATES, V, OPP, GLOSS, EXPR, AV, ER, ENDS, conj, makeRound, play, genTemplateQ, validate, dig12, dig24, fr12, coreFr, hourStr, oppOf, CAT_NAME };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BANK = api;
})(typeof window !== 'undefined' ? window : this);
