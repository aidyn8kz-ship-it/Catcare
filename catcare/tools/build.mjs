//

import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf-8');
const toPosix = p => p.split(sep).join('/');

const IMPORT_RE = /^import\s+\{([\s\S]*?)\}\s+from\s+'([^']+)';?[ \t]*$/gm;
const EXPORT_RE = /^export\s+(async\s+)?(function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;

function transform(id, code) {
  const exportsList = [];
  let out = code.replace(IMPORT_RE, (_, names, spec) => {
    const target = posix.normalize(posix.join(posix.dirname(id), spec));
    const destructured = names.split(',').map(s => s.trim()).filter(Boolean)
      .map(s => s.replace(/\s+as\s+/, ': ')).join(', ');
    return `const { ${destructured} } = __require(${JSON.stringify(target)});`;
  });
  out = out.replace(EXPORT_RE, (_, isAsync, kind, name) => { exportsList.push(name); return `${isAsync ?? ''}${kind} ${name}`; });
  if (/^export\s/m.test(out)) throw new Error(`${id}: unsupported export syntax`);
  if (/^import\s/m.test(out)) throw new Error(`${id}: unsupported import syntax`);
  if (/\bimport\.meta\b/.test(out)) throw new Error(`${id}: import.meta is not supported in the bundle`);
  return { body: out, exportsList };
}

function collectJs(dir) {
  const files = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = posix.join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) files.push(...collectJs(rel));
    else if (name.endsWith('.js')) files.push(rel);
  }
  return files;
}

function bundleScript() {
  const parts = [`(function () {
  'use strict';
  const __defs = {}, __cache = {};
  function __require(id) {
    if (__cache[id]) return __cache[id].exports;
    const def = __defs[id];
    if (!def) throw new Error('Module not found: ' + id);
    const module = (__cache[id] = { exports: {} });
    def(module.exports);
    return module.exports;
  }`];
  for (const id of collectJs('js').sort()) {
    const { body, exportsList } = transform(id, read(id));
    parts.push(`  __defs[${JSON.stringify(id)}] = function (exports) {\n${body}\n${exportsList.length ? `  Object.assign(exports, { ${exportsList.join(', ')} });` : ''}\n  };`);
  }
  parts.push(`  __require('js/main.js');\n})();`);
  return parts.join('\n');
}

function collectPngs(dir) {
  const out = {};
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = posix.join(dir, name);
    const full = join(ROOT, rel);
    if (statSync(full).isDirectory()) Object.assign(out, collectPngs(rel));
    else if (name.endsWith('.png')) out[rel] = 'data:image/png;base64,' + readFileSync(full).toString('base64');
  }
  return out;
}

const assetDirs = ['assets/rooms', 'assets/sprites', 'assets/items'];
const assets = Object.assign({}, ...assetDirs.map(collectPngs));
const data = Object.fromEntries(readdirSync(join(ROOT, 'data')).filter(f => f.endsWith('.json'))
  .map(f => [f.replace(/\.json$/, ''), JSON.parse(read(`data/${f}`))]));

const safe = s => s.replace(/<\//g, '<\\/');

let html = read('index.html');
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

const cssLink = '<link rel="stylesheet" href="css/style.css">';
const scriptTag = '<script type="module" src="js/main.js"></script>';
must(html.includes(cssLink), 'Stylesheet link not found in index.html');
must(html.includes(scriptTag), 'main.js script tag not found in index.html');

html = html.replace(cssLink, () => `<style>\n${read('css/style.css')}\n</style>`);
html = html.replace(scriptTag, () =>
  `<script>window.__CATCARE_BUNDLE__ = ${safe(JSON.stringify({ data, assets }))};</script>\n<script>\n${safe(bundleScript())}\n</script>`);
html = html.replace(/src="(assets\/[^"]+\.png)"/g, (m, path) => {
  must(assets[path], `Missing image ${path}`);
  return `src="${assets[path]}"`;
});

html = html.replace(/<!-- file-guard:start -->[\s\S]*?<!-- file-guard:end -->\s*/, '');

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const outPath = join(ROOT, 'dist', 'catcare.html');
writeFileSync(outPath, html);
console.log(`Built: ${toPosix(relative(ROOT, outPath))} (${(html.length / 1024).toFixed(0)} KB)`);
console.log(`Modules: ${collectJs('js').length}, images: ${Object.keys(assets).length}, data files: ${Object.keys(data).length}`);
