import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../socket.js';
import { useCountdown } from '../utils.js';
import RoomBoard from './RoomBoard.jsx';

export default function Lobby({ room, me, myName, onLeave }) {
  const isHost = room.hostId === me;
  const isGlobal = room.type === 'global';
  const left = useCountdown(room.lobbyEndsIn, room);
  const humanCount = room.players.filter((p) => !p.bot).length;
  const link = `${location.origin}/?room=${room.code}`;
  const [copied, setCopied] = useState('');

  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); } catch { setCopied('fail'); }
    setTimeout(() => setCopied(''), 1600);
  };
  const share = () => (navigator.share ? navigator.share({ title: 'Race me on TypeBlitz', url: link }).catch(() => {}) : copy(link, 'link'));

  return (
    <section className="lobby">
      <div className="panel lobby-main">
        {isGlobal ? (
          <>
            <div className="radar" aria-hidden="true"><span /><span /><span /></div>
            <h2>{room.lobbyEndsIn == null ? 'Finding opponents' : `Race starts in ${Math.ceil(left / 1000)}s`}</h2>
            <p className="muted">
              {humanCount < room.minRacers
                ? `Real players can still join. Bots fill any empty lanes up to ${room.minRacers} racers.`
                : 'More players can still join before the countdown ends.'}
            </p>
          </>
        ) : (
          <>
            <h2>Room code</h2>
            <button className="code-display" onClick={() => copy(room.code, 'code')} aria-label="Copy room code">
              {room.code.split('').map((c, i) => <span key={i} style={{ animationDelay: `${i * 60}ms` }}>{c}</span>)}
            </button>
            <div className="qr-wrap"><QRCodeSVG value={link} size={156} level="M" marginSize={2} bgColor="#ffffff" fgColor="#101828" /></div>
            <p className="muted small">Friends can scan this with their phone camera, or enter the code.</p>
            <div className="row">
              <button className="btn" onClick={() => copy(room.code, 'code')}>{copied === 'code' ? 'Copied' : 'Copy code'}</button>
              <button className="btn" onClick={share}>{copied === 'link' ? 'Link copied' : 'Share link'}</button>
            </div>
            {copied === 'fail' && <p className="error">Copy is blocked on this connection. Select the code manually.</p>}
          </>
        )}
      </div>

      <div className="panel lobby-side">
        <div className="panel-head">
          <h3>Players</h3>
          <span className="pill">{room.players.length}/{room.maxPlayers}</span>
        </div>
        <ul className="players">
          {room.players.map((p) => (
            <li key={p.id}>
              <span className="avatar" style={{ background: p.color }}>{p.name[0]?.toUpperCase()}</span>
              <span className="pname">{p.name}{p.id === me && ' (you)'}</span>
              {p.bot && <span className="tag bot">Bot</span>}
              {p.id === room.hostId && !isGlobal && <span className="tag">Host</span>}
            </li>
          ))}
        </ul>

        {!isGlobal && isHost && (
          <div className="row">
            <button className="btn" disabled={room.players.length >= room.maxPlayers} onClick={() => socket.emit('room:addBot')}>Add bot</button>
            <button className="btn" disabled={!room.players.some((p) => p.bot)} onClick={() => socket.emit('room:removeBot')}>Remove bot</button>
          </div>
        )}
        {!isGlobal && (isHost
          ? <button className="btn primary big" onClick={() => socket.emit('room:start')}>
              {room.players.length === 1 ? 'Start solo race' : 'Start race'}
            </button>
          : <p className="muted center">Waiting for the host to start…</p>)}
        <button className="btn ghost-btn" onClick={onLeave}>Leave</button>
      </div>

      {room.board.length > 0 && <RoomBoard board={room.board} myName={myName} />}
    </section>
  );
}
