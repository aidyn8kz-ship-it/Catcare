import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

execFileSync(process.execPath, [join(ROOT, 'tools/build.mjs')], { stdio: 'pipe' });
const html = readFileSync(join(ROOT, 'dist/catcare.html'), 'utf-8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);

test('Test case 1', () => {
  assert.equal(scripts.length, 2);
  assert.ok(html.includes('<style>'));
  assert.ok(!html.includes('href="css/style.css"') && !html.includes('src="js/main.js"'));
});

test('Test case 2', () => {
  for (const code of scripts) assert.doesNotThrow(() => new vm.Script(code));
});

test('Test case 3', () => {
  const bundle = scripts[1];
  assert.ok(!/^export\s/m.test(bundle));
  const modules = [...readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => `js/${f}`),
    ...readdirSync(join(ROOT, 'js/ai')).map(f => `js/ai/${f}`)];
  for (const m of modules) assert.ok(bundle.includes(`__defs["${m}"]`), `missing module ${m}`);
  assert.ok(bundle.includes('async function loadJSON'), 'Check 4');
});

test('Test case 5', () => {
  const b = JSON.parse(scripts[0].replace(/^window\.__CATCARE_BUNDLE__ = /, '').replace(/;\s*$/, '').replace(/<\\\//g, '</'));
  for (const name of ['diseases', 'mdp', 'city', 'episodes', 'book']) assert.ok(b.data[name], name);
  for (const path of ['assets/rooms/kitchen.png', 'assets/sprites/cat_walk0.png', 'assets/items/lilies.png', 'assets/sprites/book_closed.png']) {
    assert.ok(b.assets[path]?.startsWith('data:image/png;base64,'), path);
  }
  assert.equal(Object.keys(b.assets).length, 23);
});

test('Test case 6', () => {
  assert.ok(!/<\/script/i.test(scripts[0]) && !/<\/script/i.test(scripts[1]));
});

test('Test case 7', () => {
  const index = readFileSync(join(ROOT, 'index.html'), 'utf-8');
  const block = index.match(/<!-- file-guard:start -->([\s\S]*?)<!-- file-guard:end -->/);
  assert.ok(block, 'Check 8');
  assert.ok(block[1].includes('dist/catcare.html'), 'Check 9');
  const code = block[1].match(/<script>([\s\S]*?)<\/script>/)[1];
  const run = protocol => {
    const warning = { hidden: true };
    vm.runInNewContext(code, { location: { protocol }, document: { getElementById: id => (id === 'fileWarning' ? warning : null) } });
    return warning.hidden;
  };
  assert.equal(run('file:'), false, 'Check 10');
  assert.equal(run('http:'), true, 'Check 11');
  assert.equal(run('https:'), true);
});

test('Test case 12', () => {
  assert.ok(!html.includes('file-guard') && !html.includes('fileWarning'));
});
