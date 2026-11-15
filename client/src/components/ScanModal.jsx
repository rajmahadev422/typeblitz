import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseRoomCode } from '../utils.js';

// Needs HTTPS (or localhost) for camera access. Phones can also just scan the QR with their normal camera app.
export default function ScanModal({ onClose, onCode }) {
  const [err, setErr] = useState('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    let handled = false;
    const started = scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          const code = parseRoomCode(text);
          if (code && !handled) { handled = true; onCode(code); }
        },
        () => {}
      )
      .catch(() => setErr('Camera unavailable. Allow camera access (HTTPS is required on phones), or type the room code instead.'));
    return () => {
      started.then(() => scanner.stop()).then(() => scanner.clear()).catch(() => {});
    };
  }, []);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Scan a room QR code" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Scan a room QR code</h3>
        <div id="qr-reader" />
        {err && <p className="error">{err}</p>}
        <button className="btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
