/* Page logic for the Unité 2 review site. */
(function () {
'use strict';
const B = window.BANK;
const app = document.getElementById('app');
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/* ---------- tiny helpers ---------- */
function h(tag, props, kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v);
  }
  (kids || []).forEach(c => { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}
function withBlank(text) { // underline the ___ blank
  const frag = document.createDocumentFragment();
  text.split('___').forEach((part, i, a) => { frag.appendChild(document.createTextNode(part)); if (i < a.length - 1) frag.appendChild(h('span', { class: 'blank', 'aria-label': 'blank' })); });
  return frag;
}
const store = {
  get() { try { return JSON.parse(localStorage.getItem('fr7u2') || '{}'); } catch (e) { return {}; } },
  set(o) { try { localStorage.setItem('fr7u2', JSON.stringify(o)); } catch (e) { /* storage may be blocked; that's fine */ } }
};
function say(text, slow) {
  if (!canSpeak) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = slow ? 0.65 : 0.92;
    const v = speechSynthesis.getVoices().find(x => /^fr/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
const QUIP_OK = ['Oui! Bravo!', 'Excellent!', 'Parfait!', 'Super! Murphy approves.', 'Bien joué!', 'Tail wag! That’s right.'];
const QUIP_NO = ['Pas tout à fait.', 'Almost! Here’s why.', 'Oups. Let’s fix that.', 'Not this time. Read the clue below.', 'Mistakes help your brain grow.'];
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const topicById = id => B.TOPICS.find(t => t.id === id);

/* ---------- screens ---------- */
let state = { screen: 'home', sel: B.TOPICS.filter(t => t.main).map(t => t.id), n: 15 };
function go(screen) { state.screen = screen; window.scrollTo(0, 0); render(); const h1 = app.querySelector('h1,h2'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } }
function render() {
  app.replaceChildren();
  ({ home, quiz, results, notes, tips, writing })[state.screen]();
}

function home() {
  const saved = store.get();
  app.appendChild(h('div', null, [
    h('h1', null, [h('span', { class: 'hlt', text: 'Unité 2' }), ' : révision']),
    h('p', { class: 'lede', text: 'Les cours, l’heure, les expressions avec avoir et les verbes en -ER. Pick what to practice, or take the whole unit.' }),
    h('div', { class: 'bubble' }, [h('span', { class: 'dog', 'aria-hidden': 'true', text: '🐶' }), h('div', { class: 'say', text: 'Allez! Choose a topic and let’s go. I’ll cheer for every right answer.' })])
  ]));
  // practice card
  const card = h('section', { class: 'card', 'aria-labelledby': 'ptitle' });
  card.appendChild(h('h2', { id: 'ptitle', text: 'Practice' }));
  card.appendChild(h('p', { class: 'muted', text: 'Every question has 4 choices, and every wrong choice tells you why it isn’t right.' }));
  const list = h('div', { class: 'topics' });
  B.TOPICS.filter(t => t.main).forEach(t => {
    const cb = h('input', { type: 'checkbox', id: 'tp-' + t.id, checked: state.sel.includes(t.id), onchange: () => { state.sel = B.TOPICS.filter(x => x.main && document.getElementById('tp-' + x.id).checked).map(x => x.id); startBtn.disabled = !state.sel.length; } });
    const last = saved[t.id] ? h('span', { class: 'last', text: 'Last: ' + saved[t.id].pct + '%' }) : null;
    list.appendChild(h('label', { class: 'topic', for: 'tp-' + t.id }, [cb, h('span', null, [h('b', { text: t.name }), h('small', { text: t.blurb })]), last]));
  });
  card.appendChild(list);
  const sel = h('select', { id: 'cnt', 'aria-label': 'Number of questions', onchange: e => { state.n = +e.target.value; } }, [10, 15, 20, 30].map(n => h('option', { value: n, text: n + ' questions', selected: n === state.n })));
  const startBtn = h('button', { class: 'btn', onclick: () => startRound(state.sel, state.n), text: 'Start practice' });
  startBtn.disabled = !state.sel.length;
  const all = h('button', { class: 'btn ghost small', text: 'Select all', onclick: () => { state.sel = B.TOPICS.filter(t => t.main).map(t => t.id); render(); } });
  const none = h('button', { class: 'btn ghost small', text: 'Clear', onclick: () => { state.sel = []; render(); } });
  card.appendChild(h('div', { class: 'row' }, [sel, startBtn, all, none]));
  app.appendChild(card);
  // other tiles
  const tiles = h('div', { class: 'tiles' });
  const tile = (title, sub, fn, tag) => h('button', { class: 'tile', onclick: fn }, [tag ? h('span', { class: 'tag', text: tag }) : null, h('b', { text: title }), h('span', { text: sub })]);
  tiles.appendChild(tile('Study notes', 'Vocabulary, times, avoir, and -ER endings in one place.', () => { state.notesTab = state.notesTab || 'cours'; go('notes'); }));
  tiles.appendChild(tile('Test tips', 'What each part of the test asks, and how to win it.', () => go('tips')));
  tiles.appendChild(tile('Écriture', 'Ungraded writing practice with a strong sample answer.', () => go('writing')));
  tiles.appendChild(tile('Écoute', canSpeak ? 'Listening practice. Tap the speaker to hear French.' : 'Listening practice (your browser can’t read French aloud, but you can still read the text).', () => startRound(['listen'], 10), 'Optional'));
  tiles.appendChild(tile('Challenge', 'Questions and negation. This goes beyond the test, but it’s good to know!', () => startRound(['challenge'], 10), 'Beyond the test'));
  app.appendChild(tiles);
}

/* ---------- quiz ---------- */
let R = null; // current round
function startRound(ids, n) {
  const qs = B.makeRound(ids, Math.min(n, B.maxRound(ids)));
  R = { ids, n, qs, i: 0, res: [], answered: false, hinted: false };
  state.screen = 'quiz'; render(); window.scrollTo(0, 0);
}
function quiz() {
  const q = R.qs[R.i]; R.answered = false; R.hinted = false;
  const t = topicById(q.topic);
  app.appendChild(h('div', { class: 'qhead' }, [h('span', { text: t.name + (q.challenge ? ' (beyond the test)' : '') }), h('span', { text: (R.i + 1) + ' / ' + R.qs.length })]));
  app.appendChild(h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': R.qs.length, 'aria-valuenow': R.i }, [h('i', { style: 'width:' + (R.i / R.qs.length * 100) + '%' })]));
  const card = h('section', { class: 'card qcard' });
  const pr = h('p', { class: 'prompt', id: 'prompt', tabindex: '-1' }); pr.appendChild(withBlank(q.prompt)); card.appendChild(pr);
  if (q.listen) {
    const shown = h('p', { class: 'shown', hidden: true, text: q.listen.text });
    card.appendChild(h('div', { class: 'listenbox' }, [
      h('button', { class: 'btn', text: '🔊 Play', onclick: () => say(q.listen.speak, false) }),
      h('button', { class: 'btn ghost', text: '🐢 Slowly', onclick: () => say(q.listen.speak, true) }),
      h('button', { class: 'btn ghost', text: 'Show the text', onclick: e => { shown.hidden = !shown.hidden; e.target.textContent = shown.hidden ? 'Show the text' : 'Hide the text'; } })
    ]));
    if (!canSpeak) card.appendChild(h('p', { class: 'muted', text: 'Your browser can’t read French aloud. Tap “Show the text” to read it instead.' }));
    card.appendChild(shown);
  } else if (q.speak && canSpeak) {
    card.appendChild(h('div', { class: 'listenbox' }, [h('button', { class: 'btn ghost small', 'aria-label': 'Hear the French', text: '🔊 Hear it', onclick: () => say(q.speak, false) })]));
  }
  const box = h('div', { class: 'choices', role: 'group', 'aria-label': 'Answer choices' });
  const btns = q.choices.map((c, i) => h('button', { class: 'choice', 'data-i': i, onclick: () => choose(i) }, [h('span', { class: 'k', text: 'ABCD'[i] }), h('span', { text: c.t })]));
  btns.forEach(b => box.appendChild(b)); card.appendChild(box);
  const hintSlot = h('div', { 'aria-live': 'polite' }), fbSlot = h('div', { 'aria-live': 'polite' });
  card.appendChild(hintSlot); card.appendChild(fbSlot);
  const hintBtn = h('button', { class: 'btn ghost small', text: 'Hint', onclick: () => { if (R.hinted || R.answered) return; R.hinted = true; hintSlot.appendChild(h('div', { class: 'hint', text: q.hint })); hintBtn.disabled = true; } });
  const skipBtn = h('button', { class: 'btn ghost small', text: 'Skip', onclick: () => { if (R.answered) return; R.res.push({ q, skipped: true, hinted: R.hinted }); R.answered = true; advance(); } });
  const nextBtn = h('button', { class: 'btn grow', text: R.i === R.qs.length - 1 ? 'See my results' : 'Next question', hidden: true, onclick: advance });
  card.appendChild(h('div', { class: 'actions' }, [hintBtn, skipBtn, h('button', { class: 'btn ghost small', text: 'Quit', onclick: () => go('home') }), nextBtn]));
  app.appendChild(card);
  pr.focus({ preventScroll: true });

  function choose(i) {
    if (R.answered) return; R.answered = true;
    const c = q.choices[i], good = c.ok;
    R.res.push({ q, chosen: i, ok: good, hinted: R.hinted });
    btns.forEach((b, j) => { b.disabled = true; const cj = q.choices[j]; if (cj.ok) { b.classList.add('ok'); b.appendChild(h('span', { class: 'mark', text: '✓ Correct' })); } else if (j === i) { b.classList.add('no'); b.appendChild(h('span', { class: 'mark', text: '✗ Not quite' })); } });
    hintBtn.disabled = true; skipBtn.hidden = true;
    const fb = h('div', { class: 'fb ' + (good ? 'ok' : 'no') });
    fb.appendChild(h('div', { class: 'quip', text: '🐶 ' + pickOne(good ? QUIP_OK : QUIP_NO) }));
    if (good) fb.appendChild(h('div', { text: q.choices.find(x => x.ok).why }));
    else { fb.appendChild(h('div', null, [h('b', { text: 'Why that’s not it: ' }), c.why])); fb.appendChild(h('div', { style: 'margin-top:6px' }, [h('b', { text: 'The answer: ' }), q.choices.find(x => x.ok).why])); }
    const wrongs = q.choices.filter(x => !x.ok && x !== c);
    if (wrongs.length) {
      const ul = h('ul', null, wrongs.map(x => h('li', null, [h('b', { text: x.t + ': ' }), x.why])));
      fb.appendChild(h('details', null, [h('summary', { text: good ? 'Why the other choices aren’t right' : 'Why the other two aren’t right' }), ul]));
    }
    fbSlot.appendChild(fb);
    nextBtn.hidden = false; nextBtn.focus();
  }
  function advance() { if (R.i < R.qs.length - 1) { R.i++; render(); window.scrollTo(0, 0); } else finish(); }
}
document.addEventListener('keydown', e => {
  if (state.screen !== 'quiz' || !R || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && /^(TEXTAREA|SELECT|INPUT)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), idx = '1234'.includes(k) && k ? +k - 1 : 'abcd'.indexOf(k);
  if (k.length === 1 && idx >= 0 && idx < 4 && !R.answered) { const b = app.querySelector('.choice[data-i="' + idx + '"]'); if (b) b.click(); }
});

function finish() {
  state.screen = 'results'; render(); window.scrollTo(0, 0);
  const saved = store.get(), per = tally();
  Object.keys(per).forEach(t => { saved[t] = { pct: Math.round(100 * per[t].right / per[t].total), date: Date.now() }; });
  store.set(saved);
}
function tally() {
  const per = {};
  R.res.forEach(r => { const t = r.q.topic; per[t] = per[t] || { right: 0, total: 0 }; per[t].total++; if (r.ok) per[t].right++; });
  return per;
}
function results() {
  const total = R.res.length, right = R.res.filter(r => r.ok).length, pct = total ? Math.round(100 * right / total) : 0;
  const per = tally();
  const msg = pct >= 90 ? 'Magnifique! Murphy is doing zoomies.' : pct >= 70 ? 'Très bien! A little polish and you’re set.' : pct >= 50 ? 'Bon début. The review list below is your plan.' : 'Courage! Use the study notes, then try again.';
  app.appendChild(h('h2', { text: 'Tes résultats' }));
  app.appendChild(h('p', { class: 'score', text: right + ' / ' + total }));
  app.appendChild(h('div', { class: 'bubble' }, [h('span', { class: 'dog', 'aria-hidden': 'true', text: '🐶' }), h('div', { class: 'say', text: msg + ' (' + pct + '%)' })]));
  if (R.ids.includes('challenge')) app.appendChild(h('p', { class: 'muted', text: 'Challenge questions go beyond the test, so they don’t count toward being test-ready.' }));
  const card = h('section', { class: 'card' }); card.appendChild(h('h3', { text: 'By topic' }));
  const rows = Object.keys(per).map(t => { const p = Math.round(100 * per[t].right / per[t].total), weak = p < 70;
    return h('tr', null, [h('td', { text: topicById(t).name }), h('td', { text: per[t].right + ' / ' + per[t].total }), h('td', null, [h('span', { class: 'pct', text: p + '%' }), ' ', weak ? 'Review this' : 'Looking good']), h('td', null, [h('div', { class: 'mini' + (weak ? ' weak' : '') }, [h('i', { style: 'width:' + p + '%' })])])]); });
  card.appendChild(h('div', { class: 'tblwrap' }, [h('table', null, [h('tr', null, ['Topic', 'Score', 'Status', ''].map(x => h('th', { text: x }))), ...rows])]));
  const weakIds = Object.keys(per).filter(t => per[t].right / per[t].total < 0.7);
  const act = h('div', { class: 'row' });
  if (weakIds.length) act.appendChild(h('button', { class: 'btn', text: 'Practice my weak topics', onclick: () => startRound(weakIds, 15) }));
  act.appendChild(h('button', { class: 'btn ' + (weakIds.length ? 'ghost' : ''), text: 'Try again', onclick: () => startRound(R.ids, R.n) }));
  act.appendChild(h('button', { class: 'btn ghost', text: 'Study notes', onclick: () => { state.notesTab = ({ cours: 'cours', vocab: 'vocab', avoir: 'avoir', heure: 'heure', er: 'er', choix: 'er', listen: 'vocab', challenge: 'cours' })[weakIds[0] || 'cours']; go('notes'); } }));
  act.appendChild(h('button', { class: 'btn ghost', text: 'Home', onclick: () => go('home') }));
  card.appendChild(act); app.appendChild(card);
  const missed = R.res.filter(r => !r.ok);
  if (missed.length) {
    const m = h('section', { class: 'card' }); m.appendChild(h('h3', { text: 'Questions to review' }));
    missed.forEach(r => { const d = h('details', { class: 'sec' }); const sm = h('summary'); sm.appendChild(withBlank(r.q.prompt)); d.appendChild(sm);
      if (!r.skipped) d.appendChild(h('p', null, [h('b', { text: 'You chose: ' }), r.q.choices[r.chosen].t, ' ', h('span', { class: 'muted', text: r.q.choices[r.chosen].why })]));
      else d.appendChild(h('p', { class: 'muted', text: 'You skipped this one.' }));
      d.appendChild(h('p', null, [h('b', { text: 'The answer: ' }), r.q.choices.find(c => c.ok).t, ' ', h('span', { class: 'muted', text: r.q.choices.find(c => c.ok).why })])); m.appendChild(d); });
    app.appendChild(m);
  }
}

/* ---------- study notes ---------- */
function table(head, rows) { return h('div', { class: 'tblwrap' }, [h('table', null, [h('tr', null, head.map(x => h('th', { text: x }))), ...rows.map(r => h('tr', null, r.map(c => h('td', { text: c }))))])]); }
const cl = s => s.replace(/\s*\((f|m)\.\)/g, '');
function notes() {
  const tabs = [['cours', 'Les cours'], ['vocab', 'Vocabulaire'], ['avoir', 'Avoir'], ['heure', 'L’heure'], ['er', 'Verbes -ER']];
  const cur = state.notesTab || 'cours';
  app.appendChild(h('h2', { text: 'Study notes' }));
  app.appendChild(h('p', { class: 'muted', text: 'Your teacher said it: make flashcards! Use these lists to build them.' }));
  app.appendChild(h('div', { class: 'tabs', role: 'tablist' }, tabs.map(t => h('button', { role: 'tab', 'aria-selected': String(t[0] === cur), text: t[1], onclick: () => { state.notesTab = t[0]; render(); } }))));
  const c = h('div');
  if (cur === 'cours') {
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Les opposés' }), table(['French', 'English', 'Opposite', 'English'], B.OPP.map(p => [p[0], B.GLOSS[p[0]], p[1], B.GLOSS[p[1]]]))]));
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Les cours' }), table(['French', 'English'], B.V.filter(p => p.cat === 'cours').map(p => [cl(p.fr), p.en])), h('p', { class: 'muted', text: 'Adjectives: difficile (difficult), facile (easy), inutile (useless), utile (useful).' })]));
  } else if (cur === 'vocab') {
    Object.keys(B.CAT_NAME).forEach(k => { const rows = B.V.filter(p => p.cat === k).map(p => [cl(p.fr), p.en]); c.appendChild(h('details', { class: 'sec', open: k === 'verbe' }, [h('summary', { text: B.CAT_NAME[k][0].toUpperCase() + B.CAT_NAME[k].slice(1) + ' (' + rows.length + ')' }), table(['French', 'English'], rows)])); });
  } else if (cur === 'avoir') {
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Avoir (to have)' }), table(['Subject', 'Form'], [['j’ (je)', 'ai'], ['tu', 'as'], ['il / elle / on', 'a'], ['nous', 'avons'], ['vous', 'avez'], ['ils / elles', 'ont']]),
      h('p', { text: 'In English you say “I am hungry.” In French you HAVE hunger: j’ai faim. Never use être for these.' })]));
    const rows = B.V.filter(p => p.cat === 'avoir').map(p => [cl(p.fr), p.en]);
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Expressions avec avoir' }), table(['French', 'English'], rows), h('p', { class: 'muted', text: 'Il a chaud = he feels hot. Il fait chaud = it’s hot out (weather).' })]));
  } else if (cur === 'heure') {
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Quelle heure est-il?' }), table(['Time', 'French'], [
      ['3:05', 'Il est trois heures cinq.'], ['10:15', 'Il est dix heures et quart.'], ['11:30', 'Il est onze heures et demie.'], ['9:45', 'Il est dix heures moins le quart.'],
      ['12:40', 'Il est une heure moins vingt.'], ['4:50', 'Il est cinq heures moins dix.'], ['12:00 p.m.', 'Il est midi.'], ['12:00 a.m.', 'Il est minuit.'], ['12:30 p.m.', 'Il est midi et demi.'], ['12:30 a.m.', 'Il est minuit et demi.']]),
      h('p', { text: 'After 30 minutes, count DOWN to the next hour with “moins,” so you say the next hour: 9:45 is “dix heures moins le quart.”' })]));
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Quel moment de la journée?' }), table(['Phrase', 'Time of day'], [['du matin', 'midnight to noon'], ['de l’après-midi', 'noon to 6 p.m.'], ['du soir', '6 p.m. to midnight']]),
      h('p', { text: 'Minuit pile = midnight on the dot. Il est presque quatre heures = it’s almost 4. Il est tôt = it’s early. Il est tard = it’s late. En avance = early. En retard = late. Vers = about.' })]));
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'The 24-hour clock' }), table(['12-hour French', 'Digits'], [['quatre heures de l’après-midi', '16h00'], ['neuf heures du soir', '21h00'], ['sept heures du matin', '07h00'], ['une heure et demie de l’après-midi', '13h30']]),
      h('p', { text: 'Before noon, the hour stays the same. After noon, add 12.' })]));
  } else {
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Les verbes en -ER' }), p2('Drop the -er, then add the ending.'), table(['Subject', 'Ending', 'parler'], [['je', '-e', 'je parle'], ['tu', '-es', 'tu parles'], ['il / elle / on', '-e', 'il parle'], ['nous', '-ons', 'nous parlons'], ['vous', '-ez', 'vous parlez'], ['ils / elles', '-ent', 'ils parlent']]),
      p2('Before a vowel or a silent h, je becomes j’: j’aime, j’habite, j’oublie.'),
      p2('Spelling changes with nous: commencer → nous commençons, partager → nous partageons, manger → nous mangeons, voyager → nous voyageons.')]));
    const mem = ['commencer', 'passer', 'préparer', 'aider', 'partager', 'expliquer', 'trouver', 'travailler', 'chercher', 'dessiner', 'oublier'];
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Mémorisez ces verbes' }), table(['Verb', 'English'], B.ER.filter(v => mem.includes(v[0])).map(v => [v[0] === 'passer' ? 'passer un examen' : v[0], v[1]])),
      p2('Careful: “perdre” (to lose something) is on the same page, but it’s NOT an -ER verb.')]));
    c.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'More -ER verbs from the textbook' }), table(['Verb', 'English'], B.ER.filter(v => !mem.includes(v[0])).map(v => [v[0], v[1]]))]));
  }
  app.appendChild(c);
  app.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Practice this topic', onclick: () => startRound([cur === 'cours' ? 'cours' : cur === 'vocab' ? 'vocab' : cur === 'avoir' ? 'avoir' : cur === 'heure' ? 'heure' : 'er'], 15) }), h('button', { class: 'btn ghost', text: 'Home', onclick: () => go('home') })]));
}
const p2 = t => h('p', { text: t });

/* ---------- test tips ---------- */
function tips() {
  app.appendChild(h('h2', { text: 'Test tips' }));
  app.appendChild(h('p', { class: 'lede', text: 'Here’s how the unit test is built, with a plan for each part.' }));
  const sec = (title, items, open) => h('details', { class: 'sec', open: !!open }, [h('summary', { text: title }), h('ul', { class: 'tips' }, items.map(t => h('li', { text: t })))]);
  app.appendChild(sec('1. Aural comprehension (8 questions)', ['Read the answer choices before the audio starts, so you know what to listen for.', 'Listen for the little words: “et” means after, “moins” means before.', 'Numbers and feelings come last in a sentence: j’ai … faim, il est … heures cinq. Don’t stop listening early.', 'Use the 🔊 buttons in Écoute to train your ear.'], true));
  app.appendChild(sec('2. Expressions avec avoir (5 sentences)', ['Ask: how would I say this in English? “I am hungry,” “she is right.”', 'French uses avoir for all of these. If you wrote “est,” cross it out.', 'Pick the expression first, then conjugate avoir for the subject: ai, as, a, avons, avez, ont.', 'Weather is different: il fait chaud (it’s hot out) versus il a chaud (he feels hot).']));
  app.appendChild(sec('3. The time (5 questions, numbers to French)', ['Say the minutes first. 1 to 30 minutes: say the hour, then the minutes (or et quart, et demie).', 'Past 30: name the NEXT hour, then “moins” and the minutes left. 9:45 = dix heures moins le quart.', 'Don’t forget the time of day: du matin, de l’après-midi (noon to 6), du soir (6 to midnight).', 'Midi and minuit are special: midi et demi, minuit et demi.']));
  app.appendChild(sec('4. -ER verbs (7 sentences, verb at the end)', ['Circle the subject. Then pick the ending: -e, -es, -e, -ons, -ez, -ent.', 'With nous, check the spelling: commençons, partageons, mangeons, voyageons.', 'Use j’ before a vowel or a silent h.', 'Make flashcards for every -ER verb. Your teacher said this is super important.']));
  app.appendChild(sec('5. Choose the verb, then conjugate', ['Read the whole sentence and decide which verb makes sense.', 'Then conjugate that verb. Two steps: meaning first, ending second.', 'Check yourself: does the ending match the subject?']));
  app.appendChild(sec('6. Essay (10 sentences)', ['Use as many -ER verbs from the unit as you can, with a different verb in each sentence.', 'Mix subjects (je, nous, il, ils) so you practice different endings.', 'Add time expressions, an avoir expression, and a reason with “parce que.”', 'Keep sentences simple and correct. A short correct sentence beats a long wrong one.', 'Try the Écriture practice page.']));
  app.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn', text: 'Start the whole-unit practice', onclick: () => startRound(B.TOPICS.filter(t => t.main).map(t => t.id), 20) }), h('button', { class: 'btn ghost', text: 'Home', onclick: () => go('home') })]));
}

/* ---------- written response (ungraded) ---------- */
const WRITE = [
  { title: 'Ma journée à l’école', en: 'My day at school',
    approaches: ['Walk through your day in order: morning, lunch, after school.', 'Give each sentence a different -ER verb.', 'Mix subjects: je, nous, il, ils.', 'Add the time or a feeling with avoir.'],
    sample: ['Je travaille à l’école tous les jours.', 'Les cours commencent à huit heures et demie du matin.', 'J’étudie les mathématiques et le français.', 'Mon professeur explique la leçon et il aide les élèves.',
      'Nous parlons français en classe.', 'Je regarde les notes de mon examen.', 'À midi, nous mangeons à la cantine.', 'Nous partageons nos devoirs avec nos amis.', 'Après les cours, je rentre à la maison.', 'Le soir, j’écoute de la musique et je dessine un peu.'],
    why: ['Twelve different -ER verbs: travailler, commencer, étudier, expliquer, aider, parler, regarder, manger, partager, rentrer, écouter, dessiner.', 'Different subjects: je, les cours, mon professeur, nous.', 'Correct endings and spelling: les cours commencent (-ent), nous mangeons and nous partageons (the extra “e” keeps the soft sound).', 'A time expression (huit heures et demie du matin) and the time of day.'] },
  { title: 'Mes opinions sur les cours', en: 'My opinions about my classes',
    approaches: ['Say what you like or don’t like, and give a reason with “parce que.”', 'Use adjectives from the unit: facile, difficile, utile, inutile.', 'Mix in -ER verbs like aimer, étudier, penser.', 'Ask a question to finish: est-ce que tu…?'],
    sample: ['J’aime bien l’informatique parce que c’est utile.', 'Je n’aime pas tellement la chimie. C’est difficile.', 'J’adore le français parce que c’est amusant.', 'Je déteste les devoirs de maths.',
      'Nous étudions les langues à l’école.', 'Mon ami travaille beaucoup, mais il oublie ses devoirs.', 'Je pense que l’histoire est intéressante.', 'J’aime mieux l’art que la physique.',
      'Le professeur de sciences donne beaucoup de devoirs.', 'Et toi, est-ce que tu aimes les cours?'],
    why: ['Opinion phrases from the vocabulary: j’aime bien, je n’aime pas tellement, j’aime mieux.', 'Reasons with parce que, and adjectives like utile, difficile, intéressante.', 'Different -ER verbs: aimer, étudier, travailler, oublier, penser, donner.', 'It ends with a question using est-ce que, just like a real conversation.'] }
];
function writing() {
  app.appendChild(h('h2', { text: 'Écriture: practice writing' }));
  app.appendChild(h('p', { class: 'lede', text: 'This page isn’t graded. Your teacher will give the real topic on test day. Write 10 sentences using as many -ER verbs as you can.' }));
  WRITE.forEach((w, wi) => {
    const card = h('section', { class: 'card' });
    card.appendChild(h('h3', { text: w.title })); card.appendChild(h('p', { class: 'muted', text: w.en }));
    card.appendChild(h('p', { text: 'Possible approaches' })); card.appendChild(h('ul', { class: 'tips' }, w.approaches.map(a => h('li', { text: a }))));
    card.appendChild(h('textarea', { 'aria-label': 'Write your 10 sentences here', placeholder: 'Écris tes 10 phrases ici. (This stays on your screen and isn’t saved.)' }));
    const checks = ['I wrote 10 sentences.', 'Every sentence has a different -ER verb (or close to it).', 'The ending matches the subject each time.', 'With nous, I checked spelling like commençons and mangeons.', 'I used at least one avoir expression and one time expression.'];
    card.appendChild(h('div', { class: 'chk' }, checks.map((c, ci) => h('label', null, [h('input', { type: 'checkbox' }), h('span', { text: c })]))));
    const ol = h('ol', { class: 'sample' }, w.sample.map(s => h('li', { text: s })));
    card.appendChild(h('details', { class: 'sec' }, [h('summary', { text: 'Show a strong sample answer' }), ol, h('p', null, [h('b', { text: 'What makes it strong' })]), h('ul', { class: 'tips' }, w.why.map(x => h('li', { text: x })))]));
    app.appendChild(card);
  });
  app.appendChild(h('button', { class: 'btn ghost', text: 'Home', onclick: () => go('home') }));
}

/* ---------- boot ---------- */
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { const s = b.getAttribute('data-go'); if (s === 'notes') state.notesTab = state.notesTab || 'cours'; go(s); }));
if (canSpeak) { try { speechSynthesis.getVoices(); } catch (e) { /* ignore */ } }
render();
})();
