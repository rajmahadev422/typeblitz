import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socket } from '../socket.js';
import { useCountdown } from '../utils.js';
import TypingArea from './TypingArea.jsx';
import Track from './Track.jsx';
import Gauge from './Gauge.jsx';

export default function Race({ room, live, me }) {
  const racing = room.state === 'racing';
  const total = room.text.length;
  const left = useCountdown(room.startsIn, room);
  const [stats, setStats] = useState({ index: 0, keystrokes: 0, errors: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [go, setGo] = useState(false);
  const t0 = useRef(0);
  const sendTimer = useRef(null);
  const lastSend = useRef(0);

  useEffect(() => {
    if (!racing) return;
    t0.current = performance.now() - (room.elapsed || 0);
    setGo(true);
    const goTimer = setTimeout(() => setGo(false), 900);
    const id = setInterval(() => setElapsed(performance.now() - t0.current), 100);
    return () => { clearInterval(id); clearTimeout(goTimer); };
  }, [racing]);

  // Throttle progress to ~14 updates/s; the final keystroke is always sent immediately.
  const onType = useCallback((s) => {
    setStats(s);
    const emit = () => { lastSend.current = performance.now(); socket.emit('race:progress', s); };
    clearTimeout(sendTimer.current);
    if (performance.now() - lastSend.current > 70 || s.index >= total) emit();
    else sendTimer.current = setTimeout(emit, 70);
  }, [total]);

  useEffect(() => () => clearTimeout(sendTimer.current), []);

  const done = stats.index >= total;
  const wpm = racing && stats.index > 0 ? Math.round(stats.index / 5 / (Math.max(elapsed, 2000) / 60000)) : 0;
  const accuracy = stats.keystrokes ? Math.round(((stats.keystrokes - stats.errors) / stats.keystrokes) * 100) : 100;

  const liveById = useMemo(() => Object.fromEntries((live || []).map((p) => [p.id, p])), [live]);
  const players = room.players.map((p) => {
    const l = liveById[p.id] || p;
    return p.id === me ? { ...l, progress: stats.index, wpm, finished: done } : l;
  });

  return (
    <section className="race">
      <div className="race-top">
        <span className="pill">{room.type === 'global' ? 'Global race' : `Room ${room.code}`}</span>
        <span className="muted small">{room.players.length} racing</span>
      </div>

      <Track players={players} me={me} total={total} />

      <div className="race-main">
        <div className="panel typing-panel">
          {room.state === 'countdown' && (
            <div className="overlay" aria-live="assertive">
              <div className="count" key={Math.ceil(left / 1000)}>{Math.max(1, Math.ceil(left / 1000))}</div>
              <p>Get your fingers ready</p>
            </div>
          )}
          {go && <div className="overlay go"><div className="count">Go</div></div>}
          <TypingArea text={room.text} active={racing && !done} onType={onType} />
          {done && <div className="banner">Finished. Waiting for the others…</div>}
        </div>

        <aside className="panel meter">
          <Gauge wpm={wpm} />
          <div className="stats">
            <div><b>{accuracy}%</b><span>Accuracy</span></div>
            <div><b>{Math.round((stats.index / total) * 100)}%</b><span>Progress</span></div>
            <div><b>{racing ? Math.floor(elapsed / 1000) : 0}s</b><span>Time</span></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
