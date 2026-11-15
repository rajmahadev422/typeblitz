import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { randomText } from './texts.js';
import { recordResult, top } from './store.js';

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || true; // true = reflect the request origin (fine for dev)

const MAX_PLAYERS = 8;
const LOBBY_WAIT = 10_000;      // global lobby: wait this long after the first player arrives
const MIN_RACERS = 4;           // global races are topped up with bots to this many racers
const COUNTDOWN = 5_000;
const RACE_CAP = 150_000;       // hard stop for a race
const GRACE_AFTER_FIRST = 30_000; // stragglers get this long after the first finisher
const MAX_VALID_WPM = 250;      // anything above is not saved to leaderboards
const COLORS = ['#2457ff', '#e8590c', '#12b886', '#ae3ec9', '#f59f00', '#e03131', '#1098ad', '#5c7cfa'];
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BOT_NAMES = ['Nova', 'Pixel', 'Turbo', 'Zippy', 'Echo', 'Bolt', 'Sable', 'Quill', 'Rocket', 'Glitch'];

const app = express();
app.use(cors({ origin: ORIGIN }));
app.get('/api/leaderboard', (req, res) => res.json(top(50, req.query.sort)));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Serve the built client when it exists (single-server deployment)
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGIN } });

const rooms = new Map();

const calcWpm = (chars, ms) => (ms > 0 ? Math.round(chars / 5 / (ms / 60000)) : 0);
const cleanName = (n) =>
  String(n ?? '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16) || `Guest${1000 + Math.floor(Math.random() * 9000)}`;

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(type) {
  const room = {
    code: makeCode(), type, state: 'waiting', hostId: null,
    players: new Map(), board: new Map(), text: '', startAt: 0,
    finishCount: 0, results: null, lobbyEndsAt: null, timers: {},
  };
  rooms.set(room.code, room);
  return room;
}

const publicPlayer = (p) => ({
  id: p.id, name: p.name, color: p.color, progress: p.progress, wpm: p.wpm,
  accuracy: p.accuracy, finished: p.finished, rank: p.rank, bot: !!p.bot,
});

const boardRows = (room) =>
  [...room.board.values()]
    .map((b) => ({
      name: b.name, points: b.points, wins: b.wins, races: b.races, bestWpm: b.bestWpm,
      avgWpm: b.races ? Math.round(b.totalWpm / b.races) : 0,
    }))
    .sort((a, b) => b.points - a.points || b.bestWpm - a.bestWpm);

function snapshot(room) {
  const now = Date.now();
  return {
    code: room.code,
    type: room.type,
    state: room.state,
    hostId: room.hostId,
    maxPlayers: MAX_PLAYERS,
    minRacers: MIN_RACERS,
    text: room.state === 'waiting' ? null : room.text,
    startsIn: room.state === 'countdown' ? Math.max(0, room.startAt - now) : null,
    elapsed: room.state === 'racing' ? now - room.startAt : null,
    lobbyEndsIn: room.lobbyEndsAt ? Math.max(0, room.lobbyEndsAt - now) : null,
    players: [...room.players.values()].map(publicPlayer),
    results: room.results,
    board: boardRows(room),
  };
}

const push = (room) => io.to(room.code).emit('room:update', snapshot(room));

function clearTimers(room) {
  Object.values(room.timers).forEach((t) => { clearTimeout(t); clearInterval(t); });
  room.timers = {};
}

function resetPlayers(room) {
  room.players.forEach((p) =>
    Object.assign(p, { progress: 0, wpm: 0, accuracy: 100, finished: false, rank: null, keystrokes: 0, errors: 0, finishMs: 0, fp: 0 }));
}

const humans = (room) => [...room.players.values()].filter((p) => !p.bot);
const pickColor = (room) => {
  const used = new Set([...room.players.values()].map((p) => p.color));
  return COLORS.find((c) => !used.has(c)) ?? COLORS[room.players.size % COLORS.length];
};

/* ---------- bots ---------- */

function addBot(room) {
  const names = new Set([...room.players.values()].map((p) => p.name));
  const free = BOT_NAMES.filter((n) => !names.has(n));
  const name = free.length ? free[Math.floor(Math.random() * free.length)] : `Bot${Math.floor(Math.random() * 900 + 100)}`;
  const id = `bot:${Math.random().toString(36).slice(2, 8)}`;
  room.players.set(id, {
    id, pid: null, bot: true, name, color: pickColor(room),
    progress: 0, wpm: 0, accuracy: 100, finished: false, rank: null, keystrokes: 0, errors: 0, finishMs: 0,
    skill: 30 + Math.random() * 50,           // base speed, 30-80 WPM
    acc: 93 + Math.floor(Math.random() * 7),  // final accuracy, 93-99%
    phase: Math.random() * Math.PI * 2,       // makes each bot speed up and slow down differently
    fp: 0,
  });
}

function stepBot(room, p, elapsed, dt) {
  const wpm = p.skill * (1 + 0.15 * Math.sin(elapsed / 1700 + p.phase));
  p.fp = Math.min(room.text.length, p.fp + ((wpm * 5) / 60) * dt);
  p.progress = Math.floor(p.fp);
  p.accuracy = p.acc;
  if (p.fp >= room.text.length) finishPlayer(room, p, elapsed);
}

/* ---------- lifecycle ---------- */

function updateLobby(room) {
  if (room.type !== 'global' || room.state !== 'waiting') return;
  const n = humans(room).length;
  if (n >= MAX_PLAYERS) return beginCountdown(room);
  if (n >= 1 && !room.timers.lobby) {
    // Wait for real players; when time is up, empty lanes are filled with bots.
    room.lobbyEndsAt = Date.now() + LOBBY_WAIT;
    room.timers.lobby = setTimeout(() => {
      while (room.players.size < MIN_RACERS) addBot(room);
      beginCountdown(room);
    }, LOBBY_WAIT);
  } else if (n < 1 && room.timers.lobby) {
    clearTimeout(room.timers.lobby);
    delete room.timers.lobby;
    room.lobbyEndsAt = null;
  }
}

function beginCountdown(room) {
  if (room.state !== 'waiting' || room.players.size === 0) return;
  clearTimers(room);
  room.lobbyEndsAt = null;
  room.state = 'countdown';
  room.text = randomText();
  room.results = null;
  room.finishCount = 0;
  room.startAt = Date.now() + COUNTDOWN;
  resetPlayers(room);
  push(room);
  room.timers.start = setTimeout(() => startRace(room), COUNTDOWN);
}

function startRace(room) {
  room.state = 'racing';
  room.startAt = Date.now();
  push(room);
  room.lastTick = Date.now();
  room.timers.tick = setInterval(() => {
    const now = Date.now();
    const dt = Math.min(0.5, (now - room.lastTick) / 1000);
    room.lastTick = now;
    const elapsed = now - room.startAt;
    for (const p of room.players.values()) {
      if (room.state !== 'racing') return; // a bot just ended the race
      if (p.bot && !p.finished) stepBot(room, p, elapsed, dt);
    }
    room.players.forEach((p) => { if (!p.finished && p.progress > 0) p.wpm = calcWpm(p.progress, elapsed); });
    io.to(room.code).emit('race:tick', [...room.players.values()].map(publicPlayer));
  }, 100);
  room.timers.cap = setTimeout(() => finishRace(room), RACE_CAP);
}

function finishPlayer(room, p, elapsed) {
  p.finished = true;
  p.finishMs = elapsed;
  p.rank = ++room.finishCount;
  p.wpm = calcWpm(room.text.length, elapsed);
  const hs = humans(room);
  // The first human to finish gives other humans a grace period. A bot finishing never cuts anyone off.
  if (!p.bot && hs.length > 1 && !room.timers.grace) {
    room.timers.grace = setTimeout(() => finishRace(room), GRACE_AFTER_FIRST);
  }
  if (hs.every((h) => h.finished)) finishRace(room);
}

function finishRace(room) {
  if (room.state !== 'racing') return;
  clearTimers(room);
  room.state = 'finished';

  const all = [...room.players.values()];
  const done = all.filter((p) => p.finished).sort((a, b) => a.rank - b.rank);
  const rest = all.filter((p) => !p.finished).sort((a, b) => b.progress - a.progress);
  let next = done.length + 1;
  rest.forEach((p) => { p.rank = next++; });
  const n = all.length;

  room.results = [...done, ...rest].map((p) => ({
    id: p.id, name: p.name, color: p.color, rank: p.rank, wpm: p.wpm,
    accuracy: p.accuracy, finished: p.finished, timeMs: p.finishMs, bot: !!p.bot,
  }));

  done.forEach((p) => {
    if (p.bot) return; // bots never touch the leaderboards
    const won = p.rank === 1 && n > 1;
    const b = room.board.get(p.pid) ?? { name: p.name, points: 0, wins: 0, races: 0, bestWpm: 0, totalWpm: 0 };
    b.name = p.name;
    b.races += 1;
    b.totalWpm += p.wpm;
    b.bestWpm = Math.max(b.bestWpm, p.wpm);
    b.points += n - p.rank + 1;
    if (won) b.wins += 1;
    room.board.set(p.pid, b);
    if (p.wpm <= MAX_VALID_WPM && p.finishMs >= 3000) {
      recordResult({ pid: p.pid, name: p.name, wpm: p.wpm, accuracy: p.accuracy, won });
    }
  });
  push(room);
}

function onProgress(socket, payload) {
  const room = rooms.get(socket.data.code);
  const p = room?.players.get(socket.id);
  if (!room || !p || room.state !== 'racing' || p.finished) return;

  const elapsed = Date.now() - room.startAt;
  let idx = Math.floor(Number(payload?.index));
  if (!Number.isFinite(idx)) return;
  idx = Math.max(0, Math.min(idx, room.text.length));
  if (idx > (elapsed / 1000) * 30 + 12) return; // faster than ~360 WPM: reject

  p.progress = idx;
  p.keystrokes = Math.max(0, Math.floor(Number(payload.keystrokes)) || 0);
  p.errors = Math.min(p.keystrokes, Math.max(0, Math.floor(Number(payload.errors)) || 0));
  p.accuracy = p.keystrokes ? Math.round(((p.keystrokes - p.errors) / p.keystrokes) * 100) : 100;
  p.wpm = calcWpm(idx, elapsed);
  if (idx >= room.text.length) finishPlayer(room, p, elapsed);
}

/* ---------- membership ---------- */

function leave(socket) {
  const code = socket.data.code;
  if (!code) return;
  socket.leave(code);
  socket.data.code = null;
  const room = rooms.get(code);
  if (!room) return;

  room.players.delete(socket.id);
  if (humans(room).length === 0) {
    clearTimers(room);
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = humans(room)[0].id;
  if (room.state === 'racing' && humans(room).every((p) => p.finished)) return finishRace(room);
  updateLobby(room);
  push(room);
}

function join(socket, room, { name, pid }) {
  let nm = cleanName(name);
  const taken = new Set([...room.players.values()].map((p) => p.name));
  for (let i = 2; taken.has(nm); i++) nm = `${cleanName(name)} ${i}`;

  const color = pickColor(room);

  room.players.set(socket.id, {
    id: socket.id, pid: String(pid ?? socket.id).slice(0, 64), name: nm, color,
    progress: 0, wpm: 0, accuracy: 100, finished: false, rank: null, keystrokes: 0, errors: 0, finishMs: 0,
  });
  room.hostId ??= socket.id;
  socket.join(room.code);
  socket.data.code = room.code;
  updateLobby(room);
  push(room);
}

io.on('connection', (socket) => {
  socket.on('global:join', (data, ack) => {
    leave(socket);
    const room =
      [...rooms.values()].find((r) => r.type === 'global' && r.state === 'waiting' && r.players.size < MAX_PLAYERS) ??
      createRoom('global');
    join(socket, room, data ?? {});
    ack?.({ ok: true, code: room.code });
  });

  socket.on('room:create', (data, ack) => {
    leave(socket);
    const room = createRoom('private');
    join(socket, room, data ?? {});
    ack?.({ ok: true, code: room.code });
  });

  socket.on('room:join', (data, ack) => {
    leave(socket);
    const room = rooms.get(String(data?.code ?? '').trim().toUpperCase());
    if (!room || room.type !== 'private') return ack?.({ ok: false, error: 'Room not found. Check the code and try again.' });
    if (room.state === 'countdown' || room.state === 'racing') return ack?.({ ok: false, error: 'A race is in progress. Try again in a moment.' });
    if (room.players.size >= MAX_PLAYERS) return ack?.({ ok: false, error: 'This room is full.' });
    join(socket, room, data ?? {});
    ack?.({ ok: true, code: room.code });
  });

  socket.on('room:start', () => {
    const room = rooms.get(socket.data.code);
    if (room?.type === 'private' && room.hostId === socket.id && room.state === 'waiting') beginCountdown(room);
  });

  socket.on('room:addBot', () => {
    const room = rooms.get(socket.data.code);
    if (room?.type === 'private' && room.hostId === socket.id && room.state === 'waiting' && room.players.size < MAX_PLAYERS) {
      addBot(room);
      push(room);
    }
  });

  socket.on('room:removeBot', () => {
    const room = rooms.get(socket.data.code);
    if (room?.type !== 'private' || room.hostId !== socket.id || room.state !== 'waiting') return;
    const bot = [...room.players.values()].reverse().find((p) => p.bot);
    if (bot) { room.players.delete(bot.id); push(room); }
  });

  socket.on('room:again', () => {
    const room = rooms.get(socket.data.code);
    if (room?.type === 'private' && room.hostId === socket.id && room.state === 'finished') {
      room.state = 'waiting';
      room.results = null;
      room.text = '';
      resetPlayers(room);
      push(room);
    }
  });

  socket.on('room:leave', () => leave(socket));
  socket.on('race:progress', (p) => onProgress(socket, p));
  socket.on('disconnect', () => leave(socket));
});

server.listen(PORT, () => console.log(`TypeBlitz server running on http://localhost:${PORT}`));
