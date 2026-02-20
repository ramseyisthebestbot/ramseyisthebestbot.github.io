import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rectsOverlap,
  applyInput,
  stepPlayer,
  clampToWorld,
  resolvePlatforms,
  canJump,
  hitHazard,
  reachedGoal,
} from './game-logic.js';

test('rectsOverlap detects overlap correctly', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 10, h: 10 }), true);
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 2, h: 2 }), false);
});

test('applyInput sets velocity from directional keys', () => {
  const p = { vx: 0 };
  assert.equal(applyInput(p, { right: true }).vx, 260);
  assert.equal(applyInput(p, { left: true }).vx, -260);
  assert.equal(applyInput(p, { left: true, right: true }).vx, 0);
});

test('stepPlayer applies motion + gravity', () => {
  const p = stepPlayer({ x: 0, y: 0, w: 10, h: 10, vx: 10, vy: 0, onGround: true }, 0.5, 100);
  assert.equal(p.x, 5);
  assert.equal(p.y, 0);
  assert.equal(p.vy, 50);
  assert.equal(p.onGround, false);
});

test('resolvePlatforms lands player on top of platform', () => {
  const player = { x: 20, y: 95, w: 20, h: 20, vx: 0, vy: 200, onGround: false };
  const platform = { x: 0, y: 100, w: 100, h: 20 };
  const out = resolvePlatforms(player, [platform]);
  assert.equal(out.y, 80);
  assert.equal(out.vy, 0);
  assert.equal(out.onGround, true);
  assert.equal(canJump(out), true);
});

test('clampToWorld clamps x bounds', () => {
  const world = { width: 100, height: 50 };
  assert.equal(clampToWorld({ x: -5, y: 0, w: 10, h: 10 }, world).x, 0);
  assert.equal(clampToWorld({ x: 95, y: 0, w: 10, h: 10 }, world).x, 90);
});

test('hazard and goal detection', () => {
  const p = { x: 50, y: 50, w: 20, h: 20 };
  assert.equal(hitHazard(p, [{ x: 40, y: 40, w: 20, h: 20 }]), true);
  assert.equal(reachedGoal(p, { x: 200, y: 200, w: 10, h: 10 }), false);
});
