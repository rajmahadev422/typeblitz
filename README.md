# TypeBlitz

Real-time typing races. React (Vite) + Node.js (Express, Socket.IO).

- **Play global**: auto-matchmaking. The lobby waits 10 s after the first player arrives, then a 5 s countdown. Everyone races the same paragraph and sees each other's speed live.
- **Bots**: if fewer than 4 real players are in a global lobby when the timer ends, bots (30-80 WPM) fill the empty lanes. Bots never appear on any leaderboard. In private rooms the host can add or remove bots.
- **Play with friends**: create a private room (5-character code + QR code). Friends join by code, link, or in-app QR scan. The host starts each round.
- **Leaderboards**: overall (best speed, average speed, most wins) and a per-room leaderboard that accumulates points across rounds.
- Light and dark themes, responsive layout, animated speedometer, racers, caret, countdown and confetti.

<img width="1843" height="957" alt="image" src="https://github.com/user-attachments/assets/1aaace79-bc17-4977-ba68-86f6822ccc57" />
<img width="1841" height="938" alt="image" src="https://github.com/user-attachments/assets/71e6a98c-c4ef-4e16-b51f-be62ae63cbf3" />

## Notes

- The in-app QR scanner needs camera access, which browsers only allow on HTTPS or localhost. Deploy behind HTTPS for it to work on phones.
- Leaderboard data is stored in `server/data/leaderboard.json`. Swap `server/store.js` for MongoDB or Postgres when you scale.
- Players are identified by an anonymous ID kept in the browser, not by login. Add auth if you need protected names.
- The server computes WPM itself, rejects impossible progress jumps, and does not save results above 250 WPM.
- Add paragraphs in `server/texts.js`.
