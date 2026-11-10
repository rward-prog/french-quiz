"""Browser click-through (headless Chromium). Run: python3 tests/e2e.py"""
import asyncio, pathlib, random, sys
from playwright.async_api import async_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OUT = pathlib.Path('/home/claude/shots'); OUT.mkdir(exist_ok=True)
problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL:', m)

async def play(page, n_expected, strategy):
    answered = 0
    for i in range(n_expected):
        await page.wait_for_selector('.choice')
        choices = await page.query_selector_all('.choice')
        check(len(choices) == 4, f'q{i+1}: expected 4 choices, got {len(choices)}')
        if strategy == 'skip' and i == 1:
            await page.click('text=Skip'); answered += 1; continue
        if i == 0:
            await page.click('text=Hint'); check(await page.query_selector('.hint') is not None, 'hint did not show')
        await choices[random.randrange(4)].click()
        oks = await page.query_selector_all('.choice.ok'); check(len(oks) == 1, f'q{i+1}: expected exactly one correct highlight')
        check(await page.query_selector('.fb') is not None, f'q{i+1}: no feedback shown')
        check(all([await c.is_disabled() for c in choices]), f'q{i+1}: choices not locked after answering')
        if i == 2: await page.screenshot(path=str(OUT / 'quiz_feedback.png'))
        await page.click('.actions .btn.grow:not([hidden])'); answered += 1
    return answered

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1100, 'height': 900})
        # stub speech so listening works headless
        await ctx.add_init_script("""
          window.__spoken=[]; 
          window.SpeechSynthesisUtterance = function(t){this.text=t;};
          Object.defineProperty(window,'speechSynthesis',{value:{speak:u=>window.__spoken.push(u.text),cancel(){},getVoices(){return[]}}});
        """)
        page = await ctx.new_page()
        errs = []
        page.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(URL)
        await page.wait_for_selector('h1')
        check('Unité 2' in await page.inner_text('h1'), 'home heading missing')
        await page.screenshot(path=str(OUT / 'home.png'), full_page=True)

        # whole-unit practice, 15 questions, one skip
        await page.click('text=Start practice')
        n = await play(page, 15, 'skip')
        await page.wait_for_selector('.score')
        score = await page.inner_text('.score'); check('/ 15' in score, 'score line wrong: ' + score)
        await page.screenshot(path=str(OUT / 'results.png'), full_page=True)
        check(await page.query_selector('text=By topic') is not None, 'no per-topic table')
        # weak-topic practice
        if await page.query_selector('text=Practice my weak topics'):
            await page.click('text=Practice my weak topics'); await page.wait_for_selector('.choice')
            await page.click('button:text-is("Quit")')
        else:
            await page.click('text=Home')
        await page.wait_for_selector('h1')
        # last score saved on home
        check(await page.query_selector('.last') is not None, 'last score not shown on home after a round')

        # single topics, each runs end to end
        for tid, label in [('cours', 'Les cours'), ('vocab', 'Vocabulaire'), ('avoir', 'avoir'), ('heure', 'heure'), ('er', 'verbes'), ('choix', 'Quel verbe')]:
            await page.click('text=Clear')
            await page.check('#tp-' + tid)
            await page.select_option('#cnt', '10')
            await page.click('text=Start practice')
            await play(page, 10, 'normal')
            await page.wait_for_selector('.score')
            await page.click('text=Home'); await page.wait_for_selector('h1')

        # listening (speech stubbed) + challenge
        await page.click('text=Écoute'); await page.wait_for_selector('.choice')
        await page.click('text=🔊 Play'); spoken = await page.evaluate('window.__spoken')
        check(len(spoken) == 1 and len(spoken[0]) > 2, 'listening did not speak: ' + str(spoken))
        await page.click('text=Show the text'); check(await page.is_visible('.shown'), 'show text failed')
        await page.screenshot(path=str(OUT / 'listen.png'))
        await page.keyboard.press('b'); check(await page.query_selector('.fb') is not None, 'keyboard answer failed')
        await page.click('button:text-is("Quit")'); await page.wait_for_selector('h1')
        await page.click('text=Challenge'); await page.wait_for_selector('.choice')
        txt = await page.inner_text('.qhead'); check('beyond the test' in txt, 'challenge not labeled: ' + txt)
        await page.click('button:text-is("Quit")')

        # notes tabs, tips, writing
        await page.click('nav >> text=Notes')
        for tab in ['Les cours', 'Vocabulaire', 'Avoir', 'L’heure', 'Verbes -ER']:
            await page.click(f'.tabs >> text={tab}'); check(len(await page.inner_text('#app')) > 300, 'notes tab empty: ' + tab)
        await page.screenshot(path=str(OUT / 'notes.png'), full_page=True)
        await page.click('nav >> text=Test tips'); check('Aural' in await page.inner_text('#app'), 'tips missing')
        await page.click('nav >> text=Écriture'); check('Show a strong sample answer' in await page.inner_text('#app'), 'writing missing')
        await page.click('text=Show a strong sample answer >> nth=0')
        sample = await page.query_selector_all('ol.sample >> nth=0 >> li'); 
        await page.screenshot(path=str(OUT / 'writing.png'), full_page=True)

        # mobile
        m = await b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
        mp = await m.new_page(); await mp.goto(URL)
        await mp.screenshot(path=str(OUT / 'mobile_home.png'), full_page=True)
        await mp.click('text=Start practice'); await mp.wait_for_selector('.choice')
        await mp.screenshot(path=str(OUT / 'mobile_quiz.png'))
        sw = await mp.evaluate('document.documentElement.scrollWidth'); check(sw <= 392, f'mobile horizontal overflow: {sw}')

        # blocked storage must not break anything
        c3 = await b.new_context(); await c3.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})")
        p3 = await c3.new_page(); e3 = []; p3.on('pageerror', lambda e: e3.append(str(e)))
        await p3.goto(URL); await p3.click('text=Start practice'); await play(p3, 15, 'normal'); await p3.wait_for_selector('.score')
        check(not e3, 'errors with blocked storage: ' + str(e3))

        check(not errs, 'console errors/warnings: ' + str(errs[:5]))
        await b.close()
    print('E2E problems:', len(problems)); sys.exit(1 if problems else 0)
asyncio.run(main())
