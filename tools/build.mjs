// Builds Starcradle from src/ into two files:
//   site/            — the public site: index.html plus everything in public/ (manifest, icons, CNAME)
//   dist/artifact.html — the same game as a Claude artifact page (no document skeleton; the host adds one)
// Usage: node tools/build.mjs   (add --watch to rebuild on change)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, watch, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const read = p => readFileSync(join(src, p), 'utf8');

const THREE = '0.147.0';
const THREE_SCRIPTS = ['build/three.min.js','examples/js/controls/OrbitControls.js','examples/js/shaders/CopyShader.js','examples/js/shaders/LuminosityHighPassShader.js',
  'examples/js/postprocessing/EffectComposer.js','examples/js/postprocessing/RenderPass.js','examples/js/postprocessing/ShaderPass.js','examples/js/postprocessing/UnrealBloomPass.js']
  .map(f => `<script src="https://cdn.jsdelivr.net/npm/three@${THREE}/${f}"></script>`).join('\n');

async function bundle() {
  // The app files share one scope: concatenate them in name order into a single module that imports the lib.
  const files = readdirSync(join(src, 'app')).filter(f => f.endsWith('.js') && f !== '_imports.js').sort();
  // Wrapped in a function so the early `return`s on a missing 3D engine keep working.
  const entry = read('app/_imports.js') + '\n(function(){\n' + files.map(f => `\n/* ===== ${f} ===== */\n` + read('app/' + f)).join('\n') + '\n})();\n';
  mkdirSync(join(root, 'dist'), { recursive: true });
  const r = await build({ stdin: { contents: entry, resolveDir: join(src, 'app'), sourcefile: 'app.entry.js', loader: 'js' }, bundle: true, format: 'iife', write: false, target: ['es2020'], legalComments: 'none', logLevel: 'warning' });
  return r.outputFiles[0].text;
}

export async function buildAll() {
  const js = await bundle();
  const css = read('styles.css'), body = read('body.html'), head = read('head.html');
  const scripts = `${THREE_SCRIPTS}\n<script>\n${js}</script>\n`;
  // Claude artifact: title/meta/fonts, styles, markup, scripts; the host wraps it in a document.
  const artifact = `${head}<meta name="claude:viewport-fit-sides" content="cover">\n<style>\n${css}</style>\n\n${body}\n${scripts}`;
  writeFileSync(join(root, 'dist', 'artifact.html'), artifact);
  // Public site: a full document with manifest and icons; postcards get a working Save button here.
  const siteHead = `<!doctype html>
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
`;
  let siteBody = body.replace('<div class="row"><button class="btn primary" id="cardCopy">Copy image</button><span class="err" id="cardMsg">Press and hold, or right-click, to save it.</span></div>',
    '<div class="row"><a class="btn primary" id="cardSave" download="postcard.png" href="#" style="text-decoration:none;display:inline-block">Save image</a><button class="btn ghost" id="cardCopy">Copy image</button><span class="err" id="cardMsg"></span></div>');
  if (siteBody === body) throw new Error('postcard save button did not apply');
  const site = `${siteHead}${head}<style>\n${css}</style>\n</head>\n<body>\n${siteBody}\n${THREE_SCRIPTS}\n<script>\n${js}</script>\n</body>\n</html>\n`;
  mkdirSync(join(root, 'site'), { recursive: true });
  cpSync(join(root, 'public'), join(root, 'site'), { recursive: true });
  writeFileSync(join(root, 'site', 'index.html'), site);
  console.log(`built: site/index.html (${(site.length/1024).toFixed(0)} KB), dist/artifact.html (${(artifact.length/1024).toFixed(0)} KB)`);
}

await buildAll();
if (process.argv.includes('--watch')) { let t; watch(src, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => buildAll().catch(e => console.error(e.message)), 150); }); console.log('watching src/'); }
