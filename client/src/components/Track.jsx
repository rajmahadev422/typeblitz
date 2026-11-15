export default function Track({ players, me, total }) {
  return (
    <div className="track" role="list" aria-label="Live race progress">
      {players.map((p) => {
        const pct = Math.min(100, (p.progress / total) * 100);
        return (
          <div key={p.id} role="listitem" className={`lane ${p.id === me ? 'me' : ''} ${p.finished ? 'done' : ''}`}>
            <div className="lane-name">{p.name}{p.id === me && ' (you)'}{p.bot && <span className="tag bot">Bot</span>}</div>
            <div className="lane-road">
              <div className="lane-fill" style={{ width: `${pct}%`, background: p.color }} />
              <div className={`racer ${p.wpm > 0 && !p.finished ? 'moving' : ''}`}
                style={{ left: `calc(${pct}% - ${pct * 0.3}px)`, background: p.color }}>
                {p.name[0]?.toUpperCase()}
              </div>
            </div>
            <div className="lane-wpm"><b>{p.wpm}</b> wpm</div>
          </div>
        );
      })}
    </div>
  );
}
