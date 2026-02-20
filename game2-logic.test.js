import test from 'node:test';
import assert from 'node:assert/strict';
import { randInt, spawnWord, stepWords, splitMissed, scoreForHit } from './game2-logic.js';

test('randInt stays in range', () => {
  for (let i = 0; i < 50; i++) {
    const n = randInt(2, 4);
    assert.ok(n >= 2 && n <= 4);
  }
});

test('spawnWord returns expected shape', () => {
  const w = spawnWord(400, 7, () => 0.5);
  assert.equal(w.id, 7);
  assert.equal(typeof w.text, 'string');
  assert.equal(w.y, -30);
  assert.ok(w.x >= 8);
});

test('stepWords updates y by velocity', () => {
  const out = stepWords([{ id: 1, y: 0, vy: 100 }], 0.5);
  assert.equal(out[0].y, 50);
});

test('splitMissed separates missed words', () => {
  const { active, missed } = splitMissed([{ id:1, y: 10 }, { id:2, y: 99 }], 120);
  assert.equal(active.length, 1);
  assert.equal(missed.length, 1);
});

test('scoreForHit gives bonus for bad words', () => {
  assert.equal(scoreForHit({ bad: false }), 10);
  assert.equal(scoreForHit({ bad: true }), 15);
});
