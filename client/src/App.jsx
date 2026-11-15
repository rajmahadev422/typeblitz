import { useCallback, useEffect, useRef, useState } from 'react';
import { socket } from './socket.js';
import { getPid } from './utils.js';
import Header from './components/Header.jsx';
import Home from './components/Home.jsx';
import Game from './components/Game.jsx';
import Leaderboard from './components/Leaderboard.jsx';

export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [view, setView] = useState('home'); // home | board | game
  const [name, setName] = useState(() => localStorage.getItem('tb:name') || '');
  const [room, setRoom] = useState(null);
  const [live, setLive] = useState(null);
  const [me, setMe] = useState(socket.id);
  const [online, setOnline] = useState(socket.connected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pid = useRef(getPid()).current;
  const inviteCode = useRef((new URLSearchParams(location.search).get('room') || '').toUpperCase()).current;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('tb:theme', theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    const onConnect = () => { setOnline(true); setMe(socket.id); setError(''); };
    const onDisconnect = () => {
      setOnline(false); setRoom(null); setLive(null);
      setView((v) => (v === 'game' ? 'home' : v));
      setError('Connection lost. Reconnecting…');
    };
    const onRoom = (r) => { setRoom(r); if (r.state !== 'racing') setLive(null); };
    const onTick = (players) => setLive(players);
    if (socket.connected) onConnect();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:update', onRoom);
    socket.on('race:tick', onTick);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:update', onRoom);
      socket.off('race:tick', onTick);
    };
  }, []);

  const enter = useCallback((event, extra = {}) => {
    const n = name.trim();
    if (n.length < 2) { setError('Enter a name with at least 2 characters.'); return; }
    try { localStorage.setItem('tb:name', n); } catch { /* ignore */ }
    setBusy(true); setError('');
    socket.emit(event, { name: n, pid, ...extra }, (res) => {
      setBusy(false);
      if (!res?.ok) return setError(res?.error || 'Something went wrong. Try again.');
      history.replaceState({}, '', '/');
      setView('game');
    });
  }, [name, pid]);

  const leave = () => { socket.emit('room:leave'); setRoom(null); setLive(null); setView('home'); };
  const inGame = view === 'game';

  return (
    <div className="app">
      <Header view={view} setView={setView} theme={theme} setTheme={setTheme} online={online} inGame={inGame} />
      <main>
        {view === 'home' && (
          <Home
            name={name} setName={setName} busy={busy} error={error} inviteCode={inviteCode}
            onGlobal={() => enter('global:join')}
            onCreate={() => enter('room:create')}
            onJoin={(code) => enter('room:join', { code })}
          />
        )}
        {view === 'board' && <Leaderboard myName={name.trim()} />}
        {inGame && (room
          ? <Game room={room} live={live} me={me} myName={name.trim()} onLeave={leave} onAgain={() => enter('global:join')} />
          : <p className="center muted">Connecting…</p>)}
      </main>
    </div>
  );
}
