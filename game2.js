import { spawnWord, stepWords, splitMissed, scoreForHit } from './game2-logic.js';

const arena = document.getElementById('arena');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timerEl = document.getElementById('timer');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');

let score = 0;
let lives = 5;
let timeLeft = 45;
let running = false;
let words = [];
let idSeq = 1;
let spawnAcc = 0;
let lastTime = 0;

function render() {
  arena.innerHTML = '';
  for (const w of words) {
    const el = document.createElement('button');
    el.className = `word ${w.bad ? 'bad' : ''}`;
    el.style.left = `${w.x}px`;
    el.style.top = `${w.y}px`;
    el.textContent = w.text;
    el.onclick = () => {
      if (!running) return;
      score += scoreForHit(w);
      words = words.filter((x) => x.id !== w.id);
      scoreEl.textContent = String(score);
    };
    arena.appendChild(el);
  }
}

function resetRound() {
  score = 0;
  lives = 5;
  timeLeft = 45;
  words = [];
  spawnAcc = 0;
  scoreEl.textContent = '0';
  livesEl.textContent = '5';
  timerEl.textContent = '45';
  statusEl.textContent = 'Crush the corporate buzzwords.';
}

function endRound(msg) {
  running = false;
  statusEl.textContent = msg;
}

function tick(ts) {
  const dt = Math.min(0.033, (ts - lastTime) / 1000 || 0.016);
  lastTime = ts;
  if (running) {
    timeLeft -= dt;
    timerEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));

    spawnAcc += dt;
    if (spawnAcc >= 0.6) {
      spawnAcc = 0;
      words.push(spawnWord(arena.clientWidth || 960, idSeq++));
    }

    words = stepWords(words, dt);
    const split = splitMissed(words, arena.clientHeight || 540);
    words = split.active;
    if (split.missed.length) {
      lives -= split.missed.length;
      livesEl.textContent = String(Math.max(0, lives));
    }

    if (lives <= 0) endRound(`Game over. Final score: ${score}. Even the buzzwords won this one.`);
    else if (timeLeft <= 0) endRound(`Round clear. Score: ${score}. You have defeated middle management.`);
  }
  render();
  requestAnimationFrame(tick);
}

startBtn.onclick = () => {
  resetRound();
  running = true;
};

resetRound();
requestAnimationFrame(tick);
