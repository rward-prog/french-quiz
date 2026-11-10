"""Privacy scan over every file in the project. Run: python3 tests/privacy_scan.py"""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parent.parent
checks = {
  'email address': re.compile(r'[\w.+-]+@[\w-]+\.[\w.-]+'),
  'phone number': re.compile(r'(?<!\d)(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?!\d)'),
  'street address': re.compile(r'\b\d{1,5}\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b'),
  'web link': re.compile(r'https?://', re.I),
  'image tag': re.compile(r'<img\b', re.I),
  'embedded image': re.compile(r'data:image/(?!svg\+xml)', re.I),
  'image file reference': re.compile(r'\.(png|jpe?g|gif|webp|heic|bmp)\b', re.I),
}
bad = 0; n = 0
for f in sorted(root.rglob('*')):
    if not f.is_file() or f.suffix in ('.pyc',) or '.git' in f.parts or '__pycache__' in f.parts: continue
    n += 1
    if f.name == 'privacy_scan.py': continue  # the scanner contains its own patterns
    txt = f.read_text(encoding='utf-8', errors='replace').replace('http://www.w3.org/2000/svg', '')  # SVG namespace in the emoji favicon
    for label, rx in checks.items():
        for m in rx.finditer(txt):
            if label == 'image file reference' and f.name in ('e2e.py', 'privacy_scan.py'): continue  # test code names its own screenshots
            bad += 1; print(f'FOUND {label} in {f.relative_to(root)}: {m.group(0)[:60]!r}')
print(f'Scanned {n} files, {bad} problem(s).')
sys.exit(1 if bad else 0)
