import { socket } from '../socket.js';
import { fmtTime, useCountUp } from '../utils.js';
import Confetti from './Confetti.jsx';
import RoomBoard from './RoomBoard.jsx';

export default function Results({ room, me, myName, onLeave, onAgain }) {
  const results = room.results || [];
  const mine = results.find((r) => r.id === me);
  const wpm = useCountUp(mine?.wpm || 0);
  const isHost = room.hostId === me;
  const won = mine?.finished && mine.rank === 1;

  return (
    <section className="results">
      {won && <Confetti />}

      {mine && (
        <div className="panel result-hero">
          <p className="result-title">{won ? (results.length > 1 ? 'You won the race' : 'Solo race complete') : mine.finished ? 'Race complete' : "Time's up"}</p>
          <div className="big-wpm"><span>{wpm}</span><small>WPM</small></div>
          <div className="chips">
            <span>Accuracy {mine.accuracy}%</span>
            <span>Place {mine.rank} of {results.length}</span>
            {mine.finished && <span>Time {fmtTime(mine.timeMs)}</span>}
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-head"><h3>This race</h3></div>
        <ol className="result-list">
          {results.map((r) => (
            <li key={r.id} className={r.id === me ? 'mine' : ''}>
              <span className="rank">{r.rank}</span>
              <span className="avatar" style={{ background: r.color }}>{r.name[0]?.toUpperCase()}</span>
              <span className="pname">{r.name}{r.id === me && ' (you)'}{r.bot && <span className="tag bot">Bot</span>}</span>
              <span className="muted small">{r.finished ? `${r.accuracy}% accuracy` : r.bot ? 'Still typing' : 'Did not finish'}</span>
              <b>{r.wpm} <small>wpm</small></b>
            </li>
          ))}
        </ol>
      </div>

      <RoomBoard board={room.board} myName={myName} />

      <div className="actions">
        {room.type === 'global'
          ? <button className="btn primary big" onClick={onAgain}>Race again</button>
          : isHost
            ? <button className="btn primary big" onClick={() => socket.emit('room:again')}>Play again</button>
            : <p className="muted">Waiting for the host to start the next round…</p>}
        <button className="btn" onClick={onLeave}>Leave</button>
      </div>
    </section>
  );
}
