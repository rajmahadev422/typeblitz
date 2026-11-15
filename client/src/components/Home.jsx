import { lazy, Suspense, useState } from 'react';

// The QR scanner library is large, so it only loads when someone taps "Scan QR code".
const ScanModal = lazy(() => import('./ScanModal.jsx'));

const GHOSTS = [
  { n: 'Mira', d: '7.5s' },
  { n: 'Kenji', d: '9s' },
  { n: 'You', d: '11s', me: true },
];

export default function Home({ name, setName, busy, error, inviteCode, onGlobal, onCreate, onJoin }) {
  const [code, setCode] = useState(inviteCode || '');
  const [scan, setScan] = useState(false);
  const canJoin = code.trim().length === 5;

  return (
    <section className="home">
      <div className="hero">
        <div className="hero-copy">
          <h1>How fast can you type?</h1>
          <p className="sub">
            Race the same paragraph against real people, see everyone's speed move live, and climb the leaderboard.
          </p>

          <div className="field">
            <label htmlFor="nm">Racing name</label>
            <input id="nm" maxLength={16} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Pick a name" autoComplete="off" spellCheck={false} />
          </div>

          {inviteCode && <p className="invite">You were invited to room <b>{inviteCode}</b>. Enter your name and join below.</p>}
          {error && <p className="error" role="alert">{error}</p>}
        </div>

        <div className="ghost" aria-hidden="true">
          {GHOSTS.map((g) => (
            <div key={g.n} className={`ghost-lane ${g.me ? 'me' : ''}`}>
              <span className="ghost-name">{g.n}</span>
              <div className="ghost-road">
                <span className="ghost-racer" style={{ animationDuration: g.d }}>{g.n[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="modes">
        <div className="mode mode-main">
          <div>
            <h2>Play global</h2>
            <p>Get matched with random players. Everyone starts together and sees each other's speed in real time.</p>
          </div>
          <button className="btn primary big" disabled={busy} onClick={onGlobal}>Find a race</button>
        </div>

        <div className="mode">
          <h2>Play with friends</h2>
          <p>Make a private room, then share the code or QR code.</p>
          <button className="btn" disabled={busy} onClick={onCreate}>Create room</button>
          <form className="join-row" onSubmit={(e) => { e.preventDefault(); canJoin && onJoin(code.trim().toUpperCase()); }}>
            <input className="code-input" maxLength={5} placeholder="ROOM" value={code} aria-label="Room code"
              onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" spellCheck={false} />
            <button className="btn primary" type="submit" disabled={busy || !canJoin}>Join room</button>
            <button className="btn" type="button" onClick={() => setScan(true)}>Scan QR code</button>
          </form>
        </div>
      </div>

      {scan && (
        <Suspense fallback={null}>
          <ScanModal onClose={() => setScan(false)} onCode={(c) => { setScan(false); setCode(c); onJoin(c); }} />
        </Suspense>
      )}
    </section>
  );
}
