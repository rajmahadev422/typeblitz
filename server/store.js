import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Tiny JSON-file store for the overall leaderboard. Swap for MongoDB/Postgres when you scale.
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const FILE = path.join(dir, 'leaderboard.json');

let db = { players: {} };
try {
  fs.mkdirSync(dir, { recursive: true });
  db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch {
  /* first run: start empty */
}

let timer;
const persist = () => {
  clearTimeout(timer);
  timer = setTimeout(() => fs.writeFile(FILE, JSON.stringify(db), () => {}), 400);
};

export function recordResult({ pid, name, wpm, accuracy, won }) {
  const p = (db.players[pid] ??= { name, bestWpm: 0, bestAccuracy: 0, races: 0, wins: 0, totalWpm: 0 });
  p.name = name;
  p.races += 1;
  p.totalWpm += wpm;
  if (won) p.wins += 1;
  if (wpm > p.bestWpm) {
    p.bestWpm = wpm;
    p.bestAccuracy = accuracy;
  }
  persist();
}

export function top(limit = 50, sort = 'best') {
  const rows = Object.values(db.players).map((p) => ({
    name: p.name,
    bestWpm: p.bestWpm,
    bestAccuracy: p.bestAccuracy,
    races: p.races,
    wins: p.wins,
    avgWpm: p.races ? Math.round(p.totalWpm / p.races) : 0,
  }));
  const key = { best: 'bestWpm', avg: 'avgWpm', wins: 'wins' }[sort] ?? 'bestWpm';
  return rows.sort((a, b) => b[key] - a[key] || b.bestWpm - a.bestWpm).slice(0, limit);
}
