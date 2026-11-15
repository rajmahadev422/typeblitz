import Lobby from './Lobby.jsx';
import Race from './Race.jsx';
import Results from './Results.jsx';

export default function Game({ room, live, me, myName, onLeave, onAgain }) {
  if (room.state === 'waiting') return <Lobby room={room} me={me} myName={myName} onLeave={onLeave} />;
  if (room.state === 'finished') return <Results room={room} me={me} myName={myName} onLeave={onLeave} onAgain={onAgain} />;
  return <Race room={room} live={live} me={me} />;
}
