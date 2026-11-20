import test from 'node:test';
import assert from 'node:assert/strict';

import { DIRECTIONS, PERIODS, dirIndex, opposite, leftOf, rightOf, facingCard, angleOf } from '../js/compass.js';

test('八个方向顺时针排列且角度映射正确', () => {
  assert.deepEqual(DIRECTIONS, ['北', '东北', '东', '东南', '南', '西南', '西', '西北']);
  assert.equal(angleOf('北'), 0);
  assert.equal(angleOf('东北'), 45);
  assert.equal(angleOf('东'), 90);
  assert.equal(angleOf('东南'), 135);
  assert.equal(angleOf('南'), 180);
  assert.equal(angleOf('西南'), 225);
  assert.equal(angleOf('西'), 270);
  assert.equal(angleOf('西北'), 315);
  for (const name of DIRECTIONS) assert.equal(dirIndex(name) >= 0, true);
});

test('太阳时刻表：早上东、中午南、下午西，影子总在反方向', () => {
  assert.equal(PERIODS.morning.dir, '东');
  assert.equal(PERIODS.noon.dir, '南');
  assert.equal(PERIODS.afternoon.dir, '西');
  for (const period of Object.values(PERIODS)) {
    assert.equal(period.shadow, opposite(period.dir));
  }
});

test('口诀：早上面向太阳，前东后西左北右南', () => {
  assert.deepEqual(facingCard('东'), { face: '东', back: '西', left: '北', right: '南' });
});

test('口诀：中午面向太阳，前南后北左东右西', () => {
  assert.deepEqual(facingCard('南'), { face: '南', back: '北', left: '东', right: '西' });
});

test('口诀：下午面向太阳，前西后东左南右北', () => {
  assert.deepEqual(facingCard('西'), { face: '西', back: '东', left: '南', right: '北' });
});

test('全部八个方向的后/左/右推算自洽', () => {
  for (const face of DIRECTIONS) {
    const card = facingCard(face);
    assert.equal(card.back, DIRECTIONS[(dirIndex(face) + 4) % 8]);
    assert.equal(card.left, DIRECTIONS[(dirIndex(face) + 6) % 8]);
    assert.equal(card.right, DIRECTIONS[(dirIndex(face) + 2) % 8]);
    // 左与右必互为相反方向
    assert.equal(opposite(card.left), card.right);
  }
  assert.equal(opposite('东北'), '西南');
  assert.equal(opposite('东南'), '西北');
  assert.equal(rightOf('西'), '北');
  assert.equal(leftOf('西'), '南');
  // 测验用到的斜方向：面向东的左前方是东北；面向西的右前方是西北
  assert.equal(leftOf('东'), '北');
  assert.equal(rightOf('西'), '北');
});
