export const WORDS = [
  'synergy', 'alignment', 'low-hanging fruit', 'circle back', 'paradigm', 'blocker',
  'scope creep', 'quick win', 'bandwidth', 'move fast', 'ping me', 'action item'
];

export function randInt(min, max, rnd = Math.random) {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

export function spawnWord(width, id, rnd = Math.random) {
  return {
    id,
    text: WORDS[randInt(0, WORDS.length - 1, rnd)],
    x: randInt(8, Math.max(8, width - 170), rnd),
    y: -30,
    vy: randInt(90, 180, rnd),
    bad: rnd() < 0.25,
  };
}

export function stepWords(words, dt) {
  return words.map((w) => ({ ...w, y: w.y + w.vy * dt }));
}

export function splitMissed(words, height) {
  const active = [];
  const missed = [];
  for (const w of words) {
    if (w.y > height - 34) missed.push(w);
    else active.push(w);
  }
  return { active, missed };
}

export function scoreForHit(word) {
  return word.bad ? 15 : 10;
}
