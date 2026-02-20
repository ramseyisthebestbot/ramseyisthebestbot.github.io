import {
  WORLD,
  applyInput,
  stepPlayer,
  clampToWorld,
  resolvePlatforms,
  canJump,
  hitHazard,
  reachedGoal,
} from './game-logic.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const snarkEl = document.getElementById('snark');
const livesEl = document.getElementById('lives');

const keys = { left: false, right: false, jump: false };
const JUMP_VELOCITY = -700;
const RESPAWN_Y_LIMIT = 760;

const COLORS = {
  platform: '#2f3b48',
  moving: '#4f6c8a',
  crumble: '#816641',
  hazard: '#d64b4b',
  checkpoint: '#ff9f43',
  goal: '#4cd47a',
  wind: 'rgba(93, 165, 255, 0.22)',
  laser: '#ff3b7e',
};

const LEVELS = [
  {
    name: 'Level 1 — Warmup: Bug Sprint',
    intro: 'Welcome to onboarding. Please dodge sharp mistakes.',
    worldWidth: 3600,
    spawn: { x: 80, y: 440 },
    platforms: [
      { x: 0, y: 500, w: 560, h: 40 },
      { x: 650, y: 460, w: 220, h: 24 },
      { x: 960, y: 430, w: 220, h: 24 },
      { x: 1270, y: 395, w: 180, h: 24 },
      { x: 1530, y: 450, w: 280, h: 24 },
      { x: 1910, y: 410, w: 190, h: 24 },
      { x: 2190, y: 370, w: 240, h: 24 },
      { x: 2520, y: 430, w: 260, h: 24 },
      { x: 2860, y: 390, w: 210, h: 24 },
      { x: 3150, y: 350, w: 340, h: 24 },
      { x: 3400, y: 500, w: 200, h: 40 },
    ],
    hazards: [
      { x: 565, y: 500, w: 60, h: 40 },
      { x: 1210, y: 500, w: 80, h: 40 },
      { x: 1830, y: 500, w: 70, h: 40 },
      { x: 2460, y: 500, w: 70, h: 40 },
      { x: 3080, y: 500, w: 60, h: 40 },
      { x: 3340, y: 500, w: 50, h: 40 },
    ],
    signs: [
      { x: 680, y: 422, text: 'Ticket says “urgent.” My sarcasm agrees.' },
      { x: 1600, y: 412, text: 'If it works on your machine, marry your machine.' },
      { x: 2545, y: 392, text: 'Deploy Friday? Bold strategy, chaos captain.' },
    ],
    goal: { x: 3480, y: 445, w: 42, h: 55 },
  },
  {
    name: 'Level 2 — Motion to Merge',
    intro: 'New mechanic: moving platforms. Timing matters now.',
    worldWidth: 3900,
    spawn: { x: 70, y: 440 },
    platforms: [
      { x: 0, y: 500, w: 440, h: 40 },
      { x: 650, y: 470, w: 180, h: 24 },
      { x: 1420, y: 440, w: 200, h: 24 },
      { x: 2050, y: 410, w: 210, h: 24 },
      { x: 3360, y: 500, w: 500, h: 40 },
    ],
    movingPlatforms: [
      { x: 470, y: 430, w: 140, h: 22, axis: 'y', range: 110, speed: 1.2, phase: 0 },
      { x: 920, y: 390, w: 140, h: 22, axis: 'x', range: 200, speed: 1.4, phase: 1.2 },
      { x: 1750, y: 360, w: 150, h: 22, axis: 'y', range: 120, speed: 1.6, phase: 0.4 },
      { x: 2400, y: 330, w: 160, h: 22, axis: 'x', range: 180, speed: 1.5, phase: 2.2 },
      { x: 2860, y: 300, w: 140, h: 22, axis: 'y', range: 130, speed: 1.9, phase: 1.1 },
    ],
    hazards: [
      { x: 450, y: 500, w: 150, h: 40 },
      { x: 1260, y: 500, w: 120, h: 40 },
      { x: 1900, y: 500, w: 130, h: 40 },
      { x: 2630, y: 500, w: 110, h: 40 },
      { x: 3220, y: 500, w: 120, h: 40 },
    ],
    signs: [
      { x: 680, y: 432, text: 'Platform moves. Deadlines too. One of those is optional.' },
      { x: 2100, y: 372, text: 'Timing windows are just bugs with branding.' },
    ],
    goal: { x: 3780, y: 445, w: 42, h: 55 },
  },
  {
    name: 'Level 3 — Crosswind Complaints',
    intro: 'New mechanic: wind zones. Air control is now spicy.',
    worldWidth: 4000,
    spawn: { x: 70, y: 440 },
    platforms: [
      { x: 0, y: 500, w: 420, h: 40 },
      { x: 560, y: 450, w: 180, h: 24 },
      { x: 920, y: 410, w: 180, h: 24 },
      { x: 1300, y: 365, w: 170, h: 24 },
      { x: 1680, y: 335, w: 170, h: 24 },
      { x: 2040, y: 390, w: 170, h: 24 },
      { x: 2390, y: 350, w: 170, h: 24 },
      { x: 2740, y: 320, w: 170, h: 24 },
      { x: 3090, y: 360, w: 170, h: 24 },
      { x: 3440, y: 410, w: 180, h: 24 },
      { x: 3700, y: 500, w: 300, h: 40 },
    ],
    windZones: [
      { x: 760, y: 180, w: 300, h: 260, forceX: -320 },
      { x: 1550, y: 130, w: 380, h: 300, forceX: 340 },
      { x: 2550, y: 120, w: 420, h: 320, forceX: -360 },
    ],
    hazards: [
      { x: 430, y: 500, w: 90, h: 40 },
      { x: 1120, y: 500, w: 120, h: 40 },
      { x: 1870, y: 500, w: 140, h: 40 },
      { x: 2940, y: 500, w: 120, h: 40 },
      { x: 3650, y: 500, w: 40, h: 40 },
    ],
    signs: [
      { x: 560, y: 412, text: 'Air resistance is now your project manager.' },
      { x: 2410, y: 312, text: 'If flying sideways is wrong, why does it feel so right?' },
    ],
    goal: { x: 3920, y: 445, w: 42, h: 55 },
  },
  {
    name: 'Level 4 — Trust Fall Platforms',
    intro: 'New mechanic: crumbling platforms. Stand briefly, then regret.',
    worldWidth: 4100,
    spawn: { x: 70, y: 440 },
    platforms: [
      { x: 0, y: 500, w: 450, h: 40 },
      { x: 3880, y: 500, w: 220, h: 40 },
    ],
    crumblePlatforms: [
      { id: 'c1', x: 560, y: 455, w: 160, h: 22 },
      { id: 'c2', x: 820, y: 420, w: 150, h: 22 },
      { id: 'c3', x: 1070, y: 390, w: 140, h: 22 },
      { id: 'c4', x: 1320, y: 360, w: 140, h: 22 },
      { id: 'c5', x: 1570, y: 330, w: 140, h: 22 },
      { id: 'c6', x: 1840, y: 360, w: 140, h: 22 },
      { id: 'c7', x: 2120, y: 390, w: 150, h: 22 },
      { id: 'c8', x: 2400, y: 350, w: 140, h: 22 },
      { id: 'c9', x: 2660, y: 320, w: 140, h: 22 },
      { id: 'c10', x: 2920, y: 360, w: 150, h: 22 },
      { id: 'c11', x: 3200, y: 390, w: 150, h: 22 },
      { id: 'c12', x: 3470, y: 430, w: 160, h: 22 },
    ],
    hazards: [
      { x: 455, y: 500, w: 80, h: 40 },
      { x: 730, y: 500, w: 60, h: 40 },
      { x: 980, y: 500, w: 70, h: 40 },
      { x: 1230, y: 500, w: 70, h: 40 },
      { x: 1480, y: 500, w: 70, h: 40 },
      { x: 1730, y: 500, w: 70, h: 40 },
      { x: 1980, y: 500, w: 70, h: 40 },
      { x: 2230, y: 500, w: 70, h: 40 },
      { x: 2480, y: 500, w: 70, h: 40 },
      { x: 2730, y: 500, w: 70, h: 40 },
      { x: 2980, y: 500, w: 70, h: 40 },
      { x: 3230, y: 500, w: 70, h: 40 },
      { x: 3480, y: 500, w: 70, h: 40 },
      { x: 3740, y: 500, w: 120, h: 40 },
    ],
    signs: [
      { x: 850, y: 382, text: 'Platform trust issues are now gameplay.' },
      { x: 2650, y: 282, text: 'Standing still is how bugs reproduce.' },
    ],
    goal: { x: 4020, y: 445, w: 42, h: 55 },
  },
  {
    name: 'Level 5 — Laser Retro',
    intro: 'Final mechanic: timed lasers. Because subtlety is dead.',
    worldWidth: 4300,
    spawn: { x: 70, y: 440 },
    platforms: [
      { x: 0, y: 500, w: 430, h: 40 },
      { x: 540, y: 460, w: 150, h: 24 },
      { x: 800, y: 420, w: 180, h: 24 },
      { x: 1100, y: 380, w: 180, h: 24 },
      { x: 1420, y: 340, w: 180, h: 24 },
      { x: 1760, y: 380, w: 180, h: 24 },
      { x: 2100, y: 420, w: 180, h: 24 },
      { x: 2440, y: 380, w: 180, h: 24 },
      { x: 2780, y: 340, w: 180, h: 24 },
      { x: 3130, y: 390, w: 180, h: 24 },
      { x: 3470, y: 430, w: 180, h: 24 },
      { x: 3800, y: 500, w: 500, h: 40 },
    ],
    lasers: [
      { x: 720, y: 300, w: 16, h: 200, onMs: 1400, offMs: 1000, phaseMs: 200 },
      { x: 1360, y: 220, w: 16, h: 260, onMs: 1000, offMs: 1100, phaseMs: 900 },
      { x: 2020, y: 260, w: 16, h: 230, onMs: 1200, offMs: 900, phaseMs: 600 },
      { x: 2680, y: 220, w: 16, h: 250, onMs: 900, offMs: 1300, phaseMs: 350 },
      { x: 3350, y: 250, w: 16, h: 240, onMs: 1500, offMs: 1000, phaseMs: 1200 },
    ],
    hazards: [
      { x: 440, y: 500, w: 80, h: 40 },
      { x: 1020, y: 500, w: 70, h: 40 },
      { x: 1660, y: 500, w: 70, h: 40 },
      { x: 2320, y: 500, w: 70, h: 40 },
      { x: 2970, y: 500, w: 70, h: 40 },
      { x: 3630, y: 500, w: 150, h: 40 },
    ],
    signs: [
      { x: 1120, y: 342, text: 'Lasers are just deadlines made visible.' },
      { x: 3150, y: 352, text: 'Final review. Pretend you meant this all along.' },
    ],
    goal: { x: 4170, y: 445, w: 42, h: 55 },
  },
];

let player;
let lives;
let won;
let cameraX;
let spawn;
let currentLevel = 0;
let levelTimeMs = 0;
let lastTime = 0;
let crumbleState = {};

function level() {
  return LEVELS[currentLevel];
}

function resetLevel(fullLives = false) {
  const l = level();
  if (fullLives) lives = 5;
  won = false;
  levelTimeMs = 0;
  spawn = { ...l.spawn };
  crumbleState = {};
  if (l.crumblePlatforms) {
    for (const p of l.crumblePlatforms) crumbleState[p.id] = { startedAt: null, brokenUntil: 0 };
  }
  player = { x: spawn.x, y: spawn.y, w: 32, h: 48, vx: 0, vy: 0, onGround: false };
  cameraX = 0;
  updateLives();
  setSnark(`${l.name}: ${l.intro}`);
  // reset sign hit flags
  l.signs = l.signs.map((s) => ({ ...s, hit: false }));
}

function setSnark(text) {
  snarkEl.textContent = `[${currentLevel + 1}/${LEVELS.length}] ${text}`;
}

function updateLives() {
  livesEl.textContent = String(lives);
}

function dynamicPlatforms(lvl, tMs) {
  const out = [...lvl.platforms];
  if (lvl.movingPlatforms) {
    for (const p of lvl.movingPlatforms) {
      const delta = Math.sin((tMs / 1000) * p.speed + p.phase) * p.range;
      out.push({
        x: p.axis === 'x' ? p.x + delta : p.x,
        y: p.axis === 'y' ? p.y + delta : p.y,
        w: p.w,
        h: p.h,
        moving: true,
      });
    }
  }

  if (lvl.crumblePlatforms) {
    for (const p of lvl.crumblePlatforms) {
      const st = crumbleState[p.id];
      if (!st || st.brokenUntil > tMs) continue;
      out.push({ ...p, crumble: true, id: p.id });
    }
  }
  return out;
}

function activeLaserHazards(lvl, tMs) {
  if (!lvl.lasers) return [];
  const hz = [];
  for (const laser of lvl.lasers) {
    const cycle = laser.onMs + laser.offMs;
    const local = (tMs + laser.phaseMs) % cycle;
    const on = local < laser.onMs;
    if (on) hz.push({ x: laser.x, y: laser.y, w: laser.w, h: laser.h, laser: true });
  }
  return hz;
}

function applyWind(lvl, dt) {
  if (!lvl.windZones) return;
  for (const wz of lvl.windZones) {
    if (overlap(player, wz)) player.x += wz.forceX * dt;
  }
}

function respawn(reason) {
  lives -= 1;
  updateLives();
  setSnark(reason);
  if (lives <= 0) {
    setSnark('Out of lives. Respawned directly into accountability. Press R to restart.');
    return;
  }
  player = { ...player, x: spawn.x, y: spawn.y, vx: 0, vy: 0, onGround: false };
}

function completeLevel() {
  if (currentLevel === LEVELS.length - 1) {
    won = true;
    setSnark('All five levels cleared. The bugs fear you now. Press R to replay.');
    return;
  }
  currentLevel += 1;
  setSnark('Level cleared. Escalating chaos…');
  resetLevel(false);
}

function update(dt) {
  if (won || lives <= 0) return;

  const lvl = level();
  levelTimeMs += dt * 1000;

  player = applyInput(player, keys);
  if (keys.jump && canJump(player)) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  player = stepPlayer(player, dt);
  applyWind(lvl, dt);
  player = clampToWorld(player, { ...WORLD, width: lvl.worldWidth });

  const activePlatforms = dynamicPlatforms(lvl, levelTimeMs);
  player = resolvePlatforms(player, activePlatforms);

  if (player.y > RESPAWN_Y_LIMIT) respawn('Gravity submitted a bug report with your name on it.');

  const hazards = [...lvl.hazards, ...activeLaserHazards(lvl, levelTimeMs)];
  if (hitHazard(player, hazards)) respawn('You touched the danger. It touched back.');

  for (const sign of lvl.signs) {
    const signRect = { x: sign.x, y: sign.y ?? 420, w: 16, h: 38 };
    if (!sign.hit && overlap(player, signRect)) {
      sign.hit = true;
      setSnark(sign.text);
      spawn = { x: signRect.x - 20, y: signRect.y - 24 };
    }
  }

  // crumble support detection
  if (lvl.crumblePlatforms && player.onGround) {
    for (const p of activePlatforms) {
      if (!p.crumble) continue;
      const standing = Math.abs((player.y + player.h) - p.y) < 2 && player.x + player.w > p.x + 4 && player.x < p.x + p.w - 4;
      if (standing) {
        const st = crumbleState[p.id];
        if (st.startedAt === null) st.startedAt = levelTimeMs;
        if (levelTimeMs - st.startedAt > 700) {
          st.brokenUntil = levelTimeMs + 1800;
          st.startedAt = null;
          setSnark('Platform confidence collapsed. Keep moving.');
        }
      }
    }
  }

  if (reachedGoal(player, lvl.goal)) completeLevel();

  cameraX = Math.max(0, Math.min(player.x - canvas.width / 2 + player.w / 2, lvl.worldWidth - canvas.width));
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawRect(rect, color) {
  ctx.fillStyle = color;
  ctx.fillRect(rect.x - cameraX, rect.y, rect.w, rect.h);
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;
  ctx.fillStyle = '#ffb347';
  ctx.fillRect(x, y, player.w, player.h);
  ctx.fillStyle = '#111';
  ctx.fillRect(x + 7, y + 12, 5, 5);
  ctx.fillRect(x + 20, y + 12, 5, 5);
  ctx.fillRect(x + 10, y + 30, 12, 3);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#132130');
  g.addColorStop(1, '#0b1118');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1d2835';
  for (let i = 0; i < 26; i++) {
    const x = ((i * 170) - (cameraX * 0.35)) % (canvas.width + 260) - 100;
    const h = 90 + (i % 4) * 35;
    ctx.fillRect(x, canvas.height - h, 80, h);
  }
}

function render() {
  const lvl = level();
  const activePlatforms = dynamicPlatforms(lvl, levelTimeMs);
  const activeLasers = activeLaserHazards(lvl, levelTimeMs);

  drawBackground();

  if (lvl.windZones) {
    for (const wz of lvl.windZones) drawRect(wz, COLORS.wind);
  }

  for (const p of activePlatforms) {
    let c = COLORS.platform;
    if (p.moving) c = COLORS.moving;
    if (p.crumble) c = COLORS.crumble;
    drawRect(p, c);
  }

  for (const h of lvl.hazards) {
    drawRect(h, COLORS.hazard);
    ctx.fillStyle = '#a61e1e';
    for (let x = h.x - cameraX; x < h.x - cameraX + h.w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, h.y + h.h);
      ctx.lineTo(x + 5, h.y);
      ctx.lineTo(x + 10, h.y + h.h);
      ctx.fill();
    }
  }

  for (const lz of activeLasers) {
    drawRect(lz, COLORS.laser);
    ctx.fillStyle = 'rgba(255, 59, 126, 0.28)';
    ctx.fillRect(lz.x - cameraX - 8, lz.y, lz.w + 16, lz.h);
  }

  for (const sign of lvl.signs) {
    const rect = { x: sign.x, y: sign.y ?? 420, w: 16, h: 38 };
    drawRect(rect, sign.hit ? '#4d657d' : COLORS.checkpoint);
  }

  drawRect(lvl.goal, COLORS.goal);
  if (!won) {
    ctx.fillStyle = '#eaf7ef';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('DEPLOY', lvl.goal.x - cameraX - 8, lvl.goal.y - 8);
  }

  drawPlayer();

  ctx.fillStyle = '#d5dbe2';
  ctx.font = 'bold 16px system-ui';
  ctx.fillText(lvl.name, 14, 24);

  if (lives <= 0 || won) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui';
    ctx.fillText(won ? 'You shipped it. 🔥' : 'You Died (Professionally).', 250, 220);
    ctx.font = '18px system-ui';
    ctx.fillText('Press R to restart all levels', 340, 260);
  }
}

function frame(ts) {
  const dt = Math.min(0.033, (ts - lastTime) / 1000 || 0.016);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  const k = (e.key || '').toLowerCase();
  const code = e.code || '';
  if (k === 'a' || e.key === 'ArrowLeft' || code === 'KeyA') keys.left = true;
  if (k === 'd' || e.key === 'ArrowRight' || code === 'KeyD') keys.right = true;
  if (k === 'w' || e.key === 'ArrowUp' || e.key === ' ' || code === 'KeyW') {
    keys.jump = true;
    e.preventDefault();
  }
  if (k === 'r' || code === 'KeyR') {
    currentLevel = 0;
    resetLevel(true);
  }
});

window.addEventListener('keyup', (e) => {
  const k = (e.key || '').toLowerCase();
  const code = e.code || '';
  if (k === 'a' || e.key === 'ArrowLeft' || code === 'KeyA') keys.left = false;
  if (k === 'd' || e.key === 'ArrowRight' || code === 'KeyD') keys.right = false;
  if (k === 'w' || e.key === 'ArrowUp' || e.key === ' ' || code === 'KeyW') keys.jump = false;
});

resetLevel(true);
requestAnimationFrame(frame);
