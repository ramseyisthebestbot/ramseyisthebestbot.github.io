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

const platformColor = '#2f3b48';
const hazardColor = '#d64b4b';
const checkpointColor = '#ff9f43';
const goalColor = '#4cd47a';

const platforms = [
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
];

const hazards = [
  { x: 565, y: 500, w: 60, h: 40 },
  { x: 1210, y: 500, w: 80, h: 40 },
  { x: 1830, y: 500, w: 70, h: 40 },
  { x: 2460, y: 500, w: 70, h: 40 },
  { x: 3080, y: 500, w: 60, h: 40 },
  { x: 3340, y: 500, w: 50, h: 40 },
];

const snarkSigns = [
  { x: 680, y: 422, w: 16, h: 38, text: 'Ticket says “urgent.” My sarcasm agrees.' },
  { x: 1600, y: 412, w: 16, h: 38, text: 'If it works on your machine, marry your machine.' },
  { x: 2545, y: 392, w: 16, h: 38, text: 'Deploy Friday? Bold strategy, chaos captain.' },
];

const goal = { x: 3480, y: 445, w: 42, h: 55 };

const keys = { left: false, right: false, jump: false };
const JUMP_VELOCITY = -700;
const RESPAWN_Y_LIMIT = 760;

let spawn = { x: 80, y: 440 };
let player;
let lives;
let won;
let cameraX;
let lastTime = 0;

function resetGame(full = true) {
  if (full) lives = 3;
  won = false;
  player = { x: spawn.x, y: spawn.y, w: 32, h: 48, vx: 0, vy: 0, onGround: false };
  cameraX = 0;
  setSnark('Booting sarcastic movement engine…');
  updateLives();
}

function setSnark(text) {
  snarkEl.textContent = text;
}

function updateLives() {
  livesEl.textContent = String(lives);
}

function respawn(reason) {
  lives -= 1;
  updateLives();
  setSnark(reason);
  if (lives <= 0) {
    setSnark('Out of lives. Even my optimism segfaulted. Press R to restart.');
    return;
  }
  player = { ...player, x: spawn.x, y: spawn.y, vx: 0, vy: 0, onGround: false };
}

function update(dt) {
  if (won || lives <= 0) return;

  player = applyInput(player, keys);
  if (keys.jump && canJump(player)) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  player = stepPlayer(player, dt);
  player = clampToWorld(player, WORLD);
  player = resolvePlatforms(player, platforms);

  if (player.y > RESPAWN_Y_LIMIT) respawn('Gravity filed a complaint.');
  if (hitHazard(player, hazards)) respawn('You hugged a spike. It did not hug back.');

  for (const sign of snarkSigns) {
    if (!sign.hit && overlap(player, sign)) {
      sign.hit = true;
      setSnark(sign.text);
      spawn = { x: sign.x - 20, y: sign.y - 20 };
    }
  }

  if (reachedGoal(player, goal)) {
    won = true;
    setSnark('Deployed. Nobody panic. (Too late.) Press R to play again.');
  }

  cameraX = Math.max(0, Math.min(player.x - canvas.width / 2 + player.w / 2, WORLD.width - canvas.width));
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
  drawBackground();

  platforms.forEach((p) => drawRect(p, platformColor));

  hazards.forEach((h) => {
    drawRect(h, hazardColor);
    ctx.fillStyle = '#a61e1e';
    for (let x = h.x - cameraX; x < h.x - cameraX + h.w; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, h.y + h.h);
      ctx.lineTo(x + 5, h.y);
      ctx.lineTo(x + 10, h.y + h.h);
      ctx.fill();
    }
  });

  snarkSigns.forEach((s) => {
    drawRect(s, s.hit ? '#4d657d' : checkpointColor);
  });

  drawRect(goal, goalColor);
  if (!won) {
    ctx.fillStyle = '#eaf7ef';
    ctx.font = 'bold 12px system-ui';
    ctx.fillText('DEPLOY', goal.x - cameraX - 8, goal.y - 8);
  }

  drawPlayer();

  if (lives <= 0 || won) {
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 34px system-ui';
    ctx.fillText(won ? 'Ship it. 🔥' : 'You Died (Professionally).', 260, 220);
    ctx.font = '18px system-ui';
    ctx.fillText('Press R to restart', 380, 260);
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
  if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'd' || e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') {
    keys.jump = true;
    e.preventDefault();
  }
  if (e.key.toLowerCase() === 'r') {
    spawn = { x: 80, y: 440 };
    snarkSigns.forEach((s) => { s.hit = false; });
    resetGame(true);
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'a' || e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'd' || e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') keys.jump = false;
});

resetGame(true);
requestAnimationFrame(frame);
