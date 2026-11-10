"""Click-through for the practice quiz and flashcards. Run: python3 tests/e2e_extras.py"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
URL = (pathlib.Path(__file__).resolve().parent.parent / 'index.html').as_uri()
OUT = pathlib.Path('/home/claude/shots'); OUT.mkdir(exist_ok=True)
problems = []
def check(c, m):
    if not c: problems.append(m); print('FAIL:', m)
def btn(page, name): return page.locator(f'#app button:text-is("{name}")')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1000, 'height': 900})
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        await page.goto(URL); await page.wait_for_selector('h1')

        # ---------- practice quiz, answers at the end ----------
        await page.click('.tile:has-text("Practice quiz")'); await page.wait_for_selector('text=What’s on it')
        check('Expressions avec avoir' in await page.inner_text('#app'), 'quiz start missing sections')
        await page.screenshot(path=str(OUT / 'quiz_start.png'), full_page=True)
        await btn(page, 'Start the quiz').click(); await page.wait_for_selector('.choice')
        check(await page.locator('text=Hint').count() == 0 and await page.locator('button:text-is("Skip")').count() == 0, 'quiz must have no hint or skip')
        check('Partie 1' in await page.inner_text('.qhead'), 'section label missing')
        ch = page.locator('.choice')
        await ch.nth(0).click(); check(await ch.nth(0).get_attribute('aria-pressed') == 'true', 'first pick not marked')
        check(await page.locator('.fb').count() == 0, 'end-mode quiz leaked feedback')
        await ch.nth(2).click()
        check(await ch.nth(0).get_attribute('aria-pressed') == 'false' and await ch.nth(2).get_attribute('aria-pressed') == 'true', 'could not change answer')
        check(await page.locator('.choice.ok').count() == 0, 'end-mode quiz leaked the correct answer')
        await page.click('.tracker button >> nth=9'); check('11' not in await page.inner_text('.qhead') and '10 / 30' in await page.inner_text('.qhead'), 'tracker jump failed')
        await page.screenshot(path=str(OUT / 'quiz_end_mode.png'), full_page=True)
        await btn(page, 'Previous').click(); check('9 / 30' in await page.inner_text('.qhead'), 'previous failed')
        # answer every question except question 5 and 12, using the tracker to move around
        for i in range(30):
            await page.click(f'.tracker button >> nth={i}')
            if i in (4, 11): continue
            await page.locator('.choice').nth(i % 4).click()
        await page.click('.tracker button >> nth=29')
        await btn(page, 'Finish quiz').click()
        w = await page.inner_text('.warn'); check('5, 12' in w, 'blank warning wrong: ' + w)
        await page.click('text=Go back and answer'); check('5 / 30' in await page.inner_text('.qhead'), 'go back should land on first blank')
        await page.locator('.choice').nth(1).click()
        await page.click('.tracker button >> nth=11'); await page.locator('.choice').nth(3).click()
        await page.click('.tracker button >> nth=29'); await btn(page, 'Finish quiz').click()
        await page.wait_for_selector('.score'); check('/ 30' in await page.inner_text('.score'), 'quiz score missing')
        rt = await page.inner_text('table'); 
        for name in ['Expressions avec avoir', 'L’heure', 'Les verbes en -ER', 'Quel verbe?', 'Vocabulaire']: check(name in rt, 'results missing part ' + name)
        await page.screenshot(path=str(OUT / 'quiz_results.png'), full_page=True)
        await btn(page, 'Home').click(); await page.wait_for_selector('h1')
        check('Last:' in await page.inner_text('.tile:has-text("Practice quiz")'), 'last quiz score not on home')

        # ---------- practice quiz, answers after each question ----------
        await page.click('.tile:has-text("Practice quiz")'); await page.check('input[value="each"]'); await btn(page, 'Start the quiz').click()
        await page.wait_for_selector('.choice')
        check(await page.locator('button:text-is("Previous")').count() == 0, 'each-mode should not allow going back')
        check(await page.locator('button:text-is("Next question")').is_hidden(), 'next should wait for an answer')
        for i in range(30):
            await page.locator('.choice').nth(i % 4).click()
            check(await page.locator('.choice.ok').count() == 1 and await page.locator('.fb').count() == 1, f'each-mode feedback missing at q{i+1}')
            if i == 2: await page.screenshot(path=str(OUT / 'quiz_each_mode.png'), full_page=True)
            await page.locator('.actions .btn:not([hidden]):not(.ghost)').click()
        await page.wait_for_selector('.score'); check('/ 30' in await page.inner_text('.score'), 'each-mode results missing')
        await btn(page, 'Home').click()

        # ---------- flashcards ----------
        await page.click('.tile:has-text("Flashcards")'); await page.wait_for_selector('text=Whole unit')
        await page.screenshot(path=str(OUT / 'flash_decks.png'), full_page=True)
        deck = page.locator('.deck:has-text("Questions et opinions")')
        n_cards = int((await deck.inner_text()).split(' cards')[0].split()[-1]); check(n_cards > 5, 'opinion deck too small')
        await deck.locator('text=Start').first.click(); await page.wait_for_selector('.fcard')
        front = await page.inner_text('.fcard'); check('French' in front, 'French should show first by default')
        await page.click('.fcard'); back = await page.inner_text('.fcard'); check('English' in back and back != front, 'flip failed')
        await page.screenshot(path=str(OUT / 'flash_card.png'), full_page=True)
        # first card: still learning -> goes to the next pass; second: I know it -> put aside
        await btn(page, 'Still learning').click(); await page.keyboard.press('ArrowRight')
        check(f'Put aside: 1' in await page.inner_text('.pile'), 'put-aside counter should be 1: ' + await page.inner_text('.pile'))
        # sort the rest of the pass
        while await page.locator('.fcard').count():
            await btn(page, 'Still learning').click()
        s = await page.inner_text('#app'); check('Pass 1 done' in s, 'pass summary missing')
        check(f'{n_cards - 1} still in the pile' in s, 'pile count wrong in summary: ' + s[:300])
        await page.click('text=Go again with'); await page.wait_for_selector('.fcard'); check('Pass 2' in await page.inner_text('.pile'), 'second pass did not start')
        # direction toggle to English first mid-study
        await page.click('.seg >> text=English first'); check('English' in await page.inner_text('.fcard'), 'English should show first after toggle')
        # progress persists across a reload
        await page.reload(); await page.wait_for_selector('h1'); await page.click('.tile:has-text("Flashcards")'); await page.wait_for_selector('text=Whole unit')
        check('1 put aside' in await page.locator('.deck:has-text("Questions et opinions")').inner_text(), 'progress not saved across reload')
        check(await page.locator('.seg button[aria-pressed="true"]').inner_text() == 'English first', 'direction not remembered')
        # finish the deck by knowing every remaining card
        await page.locator('.deck:has-text("Questions et opinions") >> text=Keep studying').click()
        while await page.locator('.fcard').count():
            await page.keyboard.press('ArrowRight')
        check('You know them all!' in await page.inner_text('#app'), 'empty-pile message missing')
        await page.screenshot(path=str(OUT / 'flash_done.png'), full_page=True)
        # review mode: one card goes back to the pile
        await page.click('text=Review the ones I put aside'); await page.wait_for_selector('.fcard')
        await page.keyboard.press('ArrowLeft')
        while await page.locator('.fcard').count(): await page.keyboard.press('ArrowRight')
        check('went back into the pile' in await page.inner_text('#app'), 'review summary wrong: ' + (await page.inner_text('#app'))[:200])
        await page.click('text=Back to decks')
        dtxt = await page.locator('.deck:has-text("Questions et opinions")').inner_text(); check(f'{n_cards - 1} put aside' in dtxt, 'review did not move the card back: ' + dtxt)
        await page.locator('.deck:has-text("Questions et opinions") >> text=Start over').click()
        check('0 put aside' in await page.locator('.deck:has-text("Questions et opinions")').inner_text(), 'start over failed')
        # -ER deck shows the nous form on the back (French first)
        await page.click('.seg >> text=French first')
        await page.locator('.deck:has-text("Verbes en -ER") >> text=Start').first.click(); await page.wait_for_selector('.fcard'); await page.click('.fcard')
        check('nous ' in await page.inner_text('.fcard'), '-ER card should show the nous form on the back')
        # shared card ids: putting a card aside in one deck counts in the whole-unit deck
        await page.click('text=Back to decks')
        # mobile
        m = await b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True); mp = await m.new_page(); await mp.goto(URL)
        await mp.click('.tile:has-text("Flashcards")'); await mp.locator('.deck:has-text("Les cours") >> text=Start').first.click(); await mp.wait_for_selector('.fcard')
        await mp.screenshot(path=str(OUT / 'mobile_flash.png'))
        sw = await mp.evaluate('document.documentElement.scrollWidth'); check(sw <= 392, f'mobile overflow {sw}')
        await mp.goto(URL); await mp.click('.tile:has-text("Practice quiz")'); await btn(mp, 'Start the quiz').click(); await mp.wait_for_selector('.tracker')
        await mp.screenshot(path=str(OUT / 'mobile_quiz_tracker.png'), full_page=True)
        sw = await mp.evaluate('document.documentElement.scrollWidth'); check(sw <= 392, f'mobile quiz overflow {sw}')
        # storage blocked: flashcards still work this visit
        c3 = await b.new_context(); await c3.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})")
        p3 = await c3.new_page(); e3 = []; p3.on('pageerror', lambda e: e3.append(str(e)))
        await p3.goto(URL); await p3.click('.tile:has-text("Flashcards")'); await p3.locator('.deck:has-text("Questions et opinions") >> text=Start').first.click()
        await p3.wait_for_selector('.fcard'); await p3.keyboard.press('ArrowRight'); check('Put aside: 1' in await p3.inner_text('.pile'), 'blocked storage broke flashcards')
        await p3.click('text=Back to decks'); check('1 put aside' in await p3.locator('.deck:has-text("Questions et opinions")').inner_text(), 'in-visit progress lost with blocked storage')
        check(not e3, 'errors with blocked storage: ' + str(e3))
        check(not errs, 'console errors: ' + str(errs[:5]))
        await b.close()
    print('Extras problems:', len(problems)); sys.exit(1 if problems else 0)
asyncio.run(main())
