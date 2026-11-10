// Automated checks for the question bank. Run: node tests/test_bank.js
const B = require('../src/bank.js');
let fails = 0, checks = 0;
const fail = m => { fails++; if (fails < 40) console.log('FAIL:', m); };
const ok = (c, m) => { checks++; if (!c) fail(m); };

/* 1. structure of every fixed question + stable unique IDs */
const ids = new Set();
for (const t in B.FIXED) B.FIXED[t].forEach(q => {
  const e = B.validate(q); ok(e.length === 0, q.id + ': ' + e.join('; '));
  ok(!ids.has(q.id), 'duplicate fixed id ' + q.id); ids.add(q.id);
  ok(q.topic === t, q.id + ' wrong topic');
});

/* 2. structure of many generated template questions */
const N = 4000; let tplCount = 0;
for (const t in B.TEMPLATES) {
  if (!B.TEMPLATES[t].length) continue;
  for (let i = 0; i < N; i++) { const q = B.genTemplateQ(t); tplCount++; const e = B.validate(q); ok(e.length === 0, q.id + ' | ' + q.prompt + ' | ' + e.join('; ')); }
}

/* 3. independent answer-key checks (separate logic from the generators) */
const NUM = { une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12 };
function parseFr(s) { // French sentence -> 24h minutes since midnight
  s = s.replace(/^Il est /, '').replace(/\.$/, '');
  let per = /du matin$/.test(s) ? 'am' : /de l’après-midi$/.test(s) ? 'pm' : /du soir$/.test(s) ? 'eve' : null;
  s = s.replace(/ (du matin|de l’après-midi|du soir)$/, '');
  const m = s.match(/^(\w+) heures? ?(.*)$/); if (!m) throw new Error('cannot parse ' + s);
  let h = NUM[m[1]], rest = m[2], min = 0;
  if (rest === '') min = 0; else if (rest === 'et quart') min = 15; else if (rest === 'et demie') min = 30;
  else if (rest === 'moins le quart') { h -= 1; min = 45; } else if (rest === 'moins vingt') { h -= 1; min = 40; } else if (rest === 'moins dix') { h -= 1; min = 50; }
  else if (rest === 'cinq') min = 5; else if (rest === 'dix') min = 10; else if (rest === 'vingt') min = 20; else throw new Error('rest ' + rest);
  if (h === 0) h = 12;
  let h24 = per === 'am' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
  // teacher's rule: matin = midnight-noon, après-midi = noon-6pm, soir = 6pm-midnight. A label that breaks the rule is not a valid sentence.
  const real = h24 * 60 + min, label = real < 720 ? 'am' : real < 1080 ? 'pm' : 'eve';
  if (label !== per) return NaN;
  return real;
}
function parseDig(s) { let m = s.match(/^(\d+):(\d\d) (a|p)\.m\.$/); if (m) { let h = +m[1] % 12; if (m[3] === 'p') h += 12; return h * 60 + +m[2]; }
  m = s.match(/^(\d\d)h(\d\d)$/); if (m) return +m[1] * 60 + +m[2]; throw new Error('dig ' + s); }
const correctOf = q => q.choices.find(c => c.ok).t;
for (let i = 0; i < 6000; i++) {
  let q = B.TEMPLATES.heure[i % 4](); const c = correctOf(q);
  if (q.skill === 'time-d2f' || q.skill === 'time-24d') { // prompt has digits; answer is French
    const dg = q.prompt.match(/(\d+:\d\d (?:a|p)\.m\.)|(\d\dh\d\d)/)[0];
    ok(!isNaN(parseFr(c)) && parseFr(c) === parseDig(dg), 'time key wrong: ' + q.prompt + ' -> ' + c);
    q.choices.filter(x => !x.ok).forEach(w => ok(parseFr(w.t) !== parseDig(dg), 'wrong choice equals target: ' + q.prompt + ' ' + w.t));
  } else { // prompt has French; answer is digits
    const fr = q.prompt.split('. ')[0] + '.';
    ok(!isNaN(parseFr(fr)) && parseFr(fr) === parseDig(c), 'time key wrong: ' + q.prompt + ' -> ' + c);
    q.choices.filter(x => !x.ok).forEach(w => ok(parseDig(w.t) !== parseDig(c), 'wrong digits equal correct: ' + q.prompt));
  }
}
for (let i = 0; i < 1000; i++) { const q = B.genTemplateQ('listen'); if (q.skill === 'listen-time') ok(parseFr(q.listen.speak) === parseDig(correctOf(q)), 'listen time key wrong ' + q.listen.speak); }

// -ER conjugation: independent table for key verbs
const EXPECT = { commencer: ['commence', 'commences', 'commence', 'commençons', 'commencez', 'commencent'], manger: ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'],
  partager: ['partage', 'partages', 'partage', 'partageons', 'partagez', 'partagent'], voyager: ['voyage', 'voyages', 'voyage', 'voyageons', 'voyagez', 'voyagent'],
  parler: ['parle', 'parles', 'parle', 'parlons', 'parlez', 'parlent'], étudier: ['étudie', 'études'.replace('études', 'étudies'), 'étudie', 'étudions', 'étudiez', 'étudient'] };
for (const v in EXPECT) EXPECT[v].forEach((f, p) => ok(B.conj(v, p) === f, 'conj ' + v + ' ' + p + ' = ' + B.conj(v, p) + ' expected ' + f));
for (let i = 0; i < 3000; i++) { const q = B.genTemplateQ('er'); const inf = q.prompt.match(/\(([^)]+)\)/)[1]; const subj = q.prompt.split('___')[0].trim().replace('J’', 'Je');
  const p = { Je: 0, Tu: 1, Il: 2, Elle: 2, Nous: 3, Vous: 4, Ils: 5, Elles: 5, Murphy: 2, 'Le professeur': 2, 'Les élèves': 5, 'Murphy et moi': 3, 'Mes amis': 5 }[subj];
  ok(p !== undefined, 'unknown subject ' + subj); ok(correctOf(q) === B.conj(inf, p), 'er key ' + q.prompt);
  ok(!/^J’___ \(/.test(q.prompt) || /^[aeiouhéèêâîô]/i.test(inf), 'elision error ' + q.prompt); ok(!/^Je ___ \([aeiouhéèêâîô]/i.test(q.prompt), 'missing elision ' + q.prompt); }
// avoir conjugation key
const AVEXP = { Je: 'ai', Tu: 'as', Il: 'a', Elle: 'a', Nous: 'avons', Vous: 'avez', Ils: 'ont', Elles: 'ont', Murphy: 'a', 'Les élèves': 'ont', 'Murphy et moi': 'avons', 'Mon ami': 'a', 'Toi et moi': 'avons' };
for (let i = 0; i < 2000; i++) { const q = B.genTemplateQ('avoir'); const subj = q.prompt.split('___')[0].trim().replace('J’', 'Je'); ok(correctOf(q) === AVEXP[subj], 'avoir key ' + q.prompt); }
// fixed "choix" and avoir keys: correct answer must contain the right conjugated form
B.FIXED.choix.forEach(q => ok(q.choices.filter(c => c.ok).length === 1, q.id));
// vocab: no two vocab entries share a French string (ambiguous keys)
const frs = new Set(); B.V.forEach(p => { ok(!frs.has(p.fr), 'dup French ' + p.fr); frs.add(p.fr); });
// no choice text in a vocab question matches a synonym of the right answer
B.FIXED.vocab.forEach(q => { const c = correctOf(q); q.choices.filter(x => !x.ok).forEach(w => ok(w.t !== c, q.id + ' wrong==correct')); });

/* 4. round builder */
for (const set of [['cours'], ['vocab'], ['avoir'], ['heure'], ['er'], ['choix'], ['listen'], ['challenge'], ['cours', 'vocab', 'avoir', 'heure', 'er', 'choix']]) {
  for (const n of [10, 15, 20]) { const r = B.makeRound(set, n); const want = Math.min(n, B.maxRound(set)); ok(r.length === want || (set.length > 1 && r.length >= n - 2), set + ' round gave ' + r.length + ' not ' + want);
    ok(new Set(r.map(B.roundKey)).size === r.length, 'duplicate questions in round ' + set); r.forEach(q => ok(B.validate(q).length === 0, 'round q invalid ' + q.id)); }
}

/* 5. never an exact copy of a source worksheet/test item */
const SOURCE = ['Vous êtes canadien', 'Tu regardes la télévision', 'Ils cherchent un livre à la bibliothèque', 'Nous arrivons à l’école', 'Elle parle chinois',
  'Ils sont québécois', 'Elles adorent voyager', 'Tu parles espagnol', 'Il y a vingt-cinq élèves', 'Le professeur donne des devoirs difficiles',
  'C’est mon anniversaire', 'Il fait 0 degrés', 'Il a gagné 100,00$', 'burrito', 'Ils veulent boire de l’eau', 'Elle met sa tête sur son pupitre', 'Vous dites que 10 et 10 font 25',
  'Elles voient un serpent', 'nouvelle maison', 'enlever mon manteau', 'le Canada est né en 1867', 'six heures pour voir le docteur', 'a volé un bonbon', 'Mettez un pull', 'acheter de l’alcool', 'le concert commence',
  'quatre heures moins vingt de l’après-midi', 'Il est six heures du matin', 'neuf heures et quart du soir', 'Il est minuit moins dix', 'une heure dix de l’après-midi', 'onze heures moins le quart du matin', 'cinq heures cinq du soir', 'dix heures du soir',
  'Abraham Lincoln', 'Claude Monet', 'Sigmund Freud', 'Albert Einstein', 'les crayons de couleur', 'un dictionnaire anglais-français', 'une calculatrice', 'un microscope', 'une carte topographique', 'une explication de la constitution'];
const all = []; for (const t in B.FIXED) B.FIXED[t].forEach(q => all.push(q.prompt + ' ' + (q.speak || '')));
for (let i = 0; i < 2000; i++) for (const t in B.TEMPLATES) if (B.TEMPLATES[t].length) { const q = B.genTemplateQ(t); all.push(q.prompt + ' ' + (q.speak || '') + ' ' + (q.listen ? q.listen.speak : '')); }
const blob = all.join('\n').toLowerCase();
SOURCE.forEach(s => ok(!blob.includes(s.toLowerCase()), 'a question prompt repeats source text: ' + s));

console.log('Fixed questions:', Object.values(B.FIXED).reduce((a, b) => a + b.length, 0), '| generated samples checked:', tplCount + 6000 + 3000 + 2000);
console.log(checks + ' checks, ' + fails + ' failures');
process.exit(fails ? 1 : 0);
