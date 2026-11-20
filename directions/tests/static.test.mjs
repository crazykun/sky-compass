import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');

test('HTML IDs are unique and all JavaScript DOM targets exist', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const available = new Set(ids);
  const missing = new Set();
  for (const name of ['main.js', 'compass.js', 'scene.js', 'quiz.js']) {
    const source = readFileSync(resolve(root, 'js', name), 'utf8');
    for (const match of source.matchAll(/getElementById\('([^']+)'\)/g)) {
      if (!available.has(match[1])) missing.add(`${name}: ${match[1]}`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('all local HTML resources and JavaScript imports resolve', () => {
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)/g)) {
    assert.equal(existsSync(resolve(root, match[1])), true, `Missing resource ${match[1]}`);
  }
  for (const name of ['main.js', 'scene.js', 'quiz.js']) {
    const source = readFileSync(resolve(root, 'js', name), 'utf8');
    for (const match of source.matchAll(/from\s+'(\.[^']+)'/g)) {
      const target = match[1].split('?')[0];
      assert.equal(existsSync(resolve(root, 'js', target)), true, `Missing import ${target} in ${name}`);
    }
  }
});

test('HTML stays lightweight and covers the eight directions and three sun periods', () => {
  for (const dir of ['北', '东南', '南', '西北', '东', '西南', '西', '东北']) {
    assert.equal(html.includes(dir), true, `Missing direction ${dir}`);
  }
  for (const keyword of ['早上', '中午', '下午', '影子']) {
    assert.equal(html.includes(keyword), true, `Missing keyword ${keyword}`);
  }
  assert.equal(html.includes('data:image'), false);
  assert.equal(Buffer.byteLength(html) < 30000, true);
});
