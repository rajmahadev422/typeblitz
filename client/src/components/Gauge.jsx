// Half-circle speedometer. The needle and arc ease toward the live WPM.
const MAX = 200;
const TICKS = [0, 50, 100, 150, 200];

export default function Gauge({ wpm }) {
  const pct = Math.min(wpm / MAX, 1);
  return (
    <div className="gauge-wrap">
      <svg className="gauge" viewBox="0 0 200 112" role="img" aria-label={`${wpm} words per minute`}>
        <path d="M 20 100 A 80 80 0 0 1 180 100" className="gauge-bg" pathLength="100" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" className="gauge-fg" pathLength="100" style={{ strokeDasharray: `${pct * 100} 100` }} />
        {TICKS.map((t) => {
          const a = Math.PI * (1 - t / MAX);
          return <text key={t} className="gauge-tick" x={100 + 96 * Math.cos(a)} y={104 - 96 * Math.sin(a) + 3} textAnchor="middle">{t}</text>;
        })}
        <g className="needle" style={{ transform: `rotate(${-90 + pct * 180}deg)`, transformOrigin: '100px 100px' }}>
          <path d="M 100 100 L 97 96 L 100 36 L 103 96 Z" />
        </g>
        <circle className="hub" cx="100" cy="100" r="7" />
      </svg>
      <div className="gauge-value"><span>{wpm}</span><small>WPM</small></div>
    </div>
  );
}
