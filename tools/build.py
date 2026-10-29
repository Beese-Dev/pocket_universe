#!/usr/bin/env python3
"""Turn the artifact page (pocket-universe.html, written for Claude's artifact host) into a standalone index.html for GitHub Pages."""
import sys, pathlib
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '../pocket-universe.html').read_text()
head = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#06050d">
<meta name="description" content="Starcradle, a small universe in your browser: plant stars, grow planets from their discs, launch probes, and watch stars live, die and feed black holes.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
'''
s = src.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
# downloads work on a real host: add a Save button beside Copy image
s = s.replace('<div class="row"><button class="btn primary" id="cardCopy">Copy image</button><span class="err" id="cardMsg">Press and hold, or right-click, to save it.</span></div>',
  '<div class="row"><a class="btn primary" id="cardSave" download="postcard.png" href="#" style="text-decoration:none;display:inline-block">Save image</a><button class="btn ghost" id="cardCopy">Copy image</button><span class="err" id="cardMsg"></span></div>')
s = s.replace("$('#cardImg').src=c.toDataURL('image/png'); $('#cardMsg').textContent='Press and hold, or right-click, to save it.';",
  "const url=c.toDataURL('image/png'); $('#cardImg').src=url; const sv=$('#cardSave'); sv.href=url; sv.download=`${o.d.name.replace(/[^\\w-]+/g,'_')}-postcard.png`; $('#cardMsg').textContent='';")
i = s.index('<canvas id="c"')
pathlib.Path('index.html').write_text(head + s[:i] + '</head>\n<body>\n' + s[i:] + '\n</body>\n</html>\n')
print('index.html written')
