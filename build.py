#!/usr/bin/env python3
"""Builds the single-file site: src/*  ->  index.html (deploy this file)."""
import pathlib
root = pathlib.Path(__file__).parent
t = (root / 'src/template.html').read_text(encoding='utf-8')
for key, f in (('{{CSS}}', 'style.css'), ('{{BANK}}', 'bank.js'), ('{{APP}}', 'app.js')):
    t = t.replace(key, (root / 'src' / f).read_text(encoding='utf-8'))
(root / 'index.html').write_text(t, encoding='utf-8')
print('built index.html', len(t) // 1024, 'KB')
