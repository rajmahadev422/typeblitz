export default function RoomBoard({ board, myName, title = 'Room leaderboard' }) {
  return (
    <div className="panel board-panel">
      <div className="panel-head"><h3>{title}</h3><span className="muted small">Points: 1 per player you beat, plus 1 for finishing</span></div>
      <div className="table-wrap">
        <table className="board">
          <thead><tr><th>#</th><th>Player</th><th>Points</th><th>Best</th><th className="hide-sm">Avg</th><th className="hide-sm">Wins</th></tr></thead>
          <tbody>
            {board.map((r, i) => (
              <tr key={r.name} className={r.name === myName ? 'mine' : ''}>
                <td>{i + 1}</td><td className="who">{r.name}</td><td><b>{r.points}</b></td>
                <td>{r.bestWpm}</td><td className="hide-sm">{r.avgWpm}</td><td className="hide-sm">{r.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
