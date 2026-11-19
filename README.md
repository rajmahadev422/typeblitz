# TypeBlitz

Real-time typing races. React (Vite) + Node.js (Express, Socket.IO).

- **Play global**: auto-matchmaking. The lobby waits 10 s after the first player arrives, then a 5 s countdown. Everyone races the same paragraph and sees each other's speed live.
- **Bots**: if fewer than 4 real players are in a global lobby when the timer ends, bots (30-80 WPM) fill the empty lanes. Bots never appear on any leaderboard. In private rooms the host can add or remove bots.
- **Play with friends**: create a private room (5-character code + QR code). Friends join by code, link, or in-app QR scan. The host starts each round.
- **Leaderboards**: overall (best speed, average speed, most wins) and a per-room leaderboard that accumulates points across rounds.
- Light and dark themes, responsive layout, animated speedometer, racers, caret, countdown and confetti.

## Run it

```bash
npm run install:all     # installs root, server and client
npm run dev             # server on :4000, client on :5173
```

Open http://localhost:5173. To try a global race alone, open two tabs.

To test on your phone, open `http://<your-computer-LAN-IP>:5173` (the dev server is exposed on your network). The room QR code encodes a join link, so the phone's normal camera app can scan it.

## Production

```bash
npm run build           # builds client/dist
npm start               # server serves API, sockets and the built client on :4000
```

Env vars: `PORT` (default 4000), `CLIENT_ORIGIN` (CORS origin if the client is hosted separately), `VITE_SERVER_URL` (client build-time, if the API is on another domain).

## Notes

- The in-app QR scanner needs camera access, which browsers only allow on HTTPS or localhost. Deploy behind HTTPS for it to work on phones.
- Leaderboard data is stored in `server/data/leaderboard.json`. Swap `server/store.js` for MongoDB or Postgres when you scale.
- Players are identified by an anonymous ID kept in the browser, not by login. Add auth if you need protected names.
- The server computes WPM itself, rejects impossible progress jumps, and does not save results above 250 WPM.
- Add paragraphs in `server/texts.js`.

## Structure

```
server/   index.js (rooms, matchmaking, race loop)  store.js (leaderboard)  texts.js
client/   src/App.jsx  src/styles.css  src/components/*
```
