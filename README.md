# Unité 2 : révision (Fr. 7)

A one-file practice site. `index.html` is the whole site: put it on Vercel and it works.

## Put it online (no command line)
1. GitHub: your repo, then "Add file", then "Upload files". Drag in `index.html` (plus `src`, `tests`, `build.py`, `README.md` if you want to keep the source).
2. Vercel: "Add New", then "Project", then import that repo.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty. Click Deploy.

## Changing questions later
Edit `src/bank.js` (questions) or `src/app.js` (page), then run `python3 build.py` to rebuild `index.html`.

## Checks
- `node tests/test_bank.js` checks every question and the answer keys.
- `python3 tests/privacy_scan.py` scans all files for emails, phones, addresses, links and images.
- `python3 tests/e2e.py` clicks through the site in a headless browser (needs Playwright).

Student answers and last scores stay on the student's own device. Nothing is sent anywhere.
