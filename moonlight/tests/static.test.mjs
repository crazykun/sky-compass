import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

test('HTML IDs are unique and all JavaScript DOM targets exist', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const available = new Set(ids);
  const missing = new Set();
  for (const file of readdirSync(resolve(root, 'js')).filter(name => name.endsWith('.js'))) {
    const source = readFileSync(resolve(root, 'js', file), 'utf8');
    for (const match of source.matchAll(/getElementById\('([^']+)'\)/g)) {
      if (!available.has(match[1])) missing.add(`${file}: ${match[1]}`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('all local HTML resources and JavaScript imports resolve', () => {
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)/g)) {
    assert.equal(existsSync(resolve(root, match[1])), true, `Missing resource ${match[1]}`);
  }
  for (const file of readdirSync(resolve(root, 'js')).filter(name => name.endsWith('.js'))) {
    const source = readFileSync(resolve(root, 'js', file), 'utf8');
    for (const match of source.matchAll(/from\s+'(\.[^']+)'/g)) {
      const target = match[1].split('?')[0];
      assert.equal(existsSync(resolve(root, 'js', target)), true, `Missing import ${target} in ${file}`);
    }
  }
});

test('HTML stays lightweight and contains no development diagnostics', () => {
  assert.equal(html.includes('data:image'), false);
  assert.equal(html.includes('debug-'), false);
  assert.equal(Buffer.byteLength(html) < 50000, true);
  for (const file of readdirSync(resolve(root, 'js')).filter(name => name.endsWith('.js'))) {
    const source = readFileSync(resolve(root, 'js', file), 'utf8');
    assert.equal(/pauseStack|clickCount|nextProgress|debug-/.test(source), false, `Diagnostics left in ${file}`);
  }
});
