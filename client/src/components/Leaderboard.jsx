import { useEffect, useState } from 'react';
import { API } from '../utils.js';

const TABS = [
  ['best', 'Best speed', 'bestWpm'],
  ['avg', 'Average speed', 'avgWpm'],
  ['wins', 'Most wins', 'wins'],
];

export default function Leaderboard({ myName }) {
  const [tab, setTab] = useState('best');
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null); setFailed(false);
    fetch(`${API}/api/leaderboard?sort=${tab}`)
      .then((r) => r.json())
      .then((d) => alive && setRows(d))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [tab]);

  const key = TABS.find((t) => t[0] === tab)[2];

  return (
    <section className="leaderboard">
      <h1 className="page-title">Global leaderboard</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="panel">
        {failed && <p className="error">Could not load the leaderboard. Is the server running?</p>}
        {!rows && !failed && <div className="skeletons">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}</div>}
        {rows && rows.length === 0 && <p className="muted center">No races yet. Finish one to take the first spot.</p>}
        {rows && rows.length > 0 && (
          <div className="table-wrap">
            <table className="board">
              <thead>
                <tr><th>#</th><th>Player</th><th className={key === 'bestWpm' ? 'sorted' : ''}>Best</th><th className={key === 'avgWpm' ? 'sorted' : ''}>Avg</th>
                  <th className={key === 'wins' ? 'sorted' : ''}>Wins</th><th className="hide-sm">Races</th><th className="hide-sm">Accuracy</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name + i} className={`${r.name === myName ? 'mine' : ''} ${i < 3 ? `top top-${i + 1}` : ''}`}>
                    <td><span className="place">{i + 1}</span></td>
                    <td className="who">{r.name}</td>
                    <td className={key === 'bestWpm' ? 'sorted' : ''}><b>{r.bestWpm}</b></td>
                    <td className={key === 'avgWpm' ? 'sorted' : ''}>{r.avgWpm}</td>
                    <td className={key === 'wins' ? 'sorted' : ''}>{r.wins}</td>
                    <td className="hide-sm">{r.races}</td>
                    <td className="hide-sm">{r.bestAccuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
