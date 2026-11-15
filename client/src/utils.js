import { useEffect, useState } from 'react';

export const API = import.meta.env.VITE_SERVER_URL || '';

// Anonymous, stable player identity so leaderboard stats follow the browser (works on plain-http LAN too).
export function getPid() {
  try {
    let id = localStorage.getItem('tb:pid');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('tb:pid', id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

// Accepts a join URL (…/?room=ABCDE) or a bare 5-character code.
export function parseRoomCode(text) {
  try {
    const c = new URL(text).searchParams.get('room');
    if (c) return c.toUpperCase();
  } catch { /* not a URL */ }
  const m = /^[A-Za-z0-9]{5}$/.exec(String(text).trim());
  return m ? m[0].toUpperCase() : null;
}

// Counts down locally from a "ms remaining" value received from the server (no clock-sync needed).
export function useCountdown(ms, stamp) {
  const [left, setLeft] = useState(ms ?? 0);
  useEffect(() => {
    if (ms == null) { setLeft(0); return; }
    const end = performance.now() + ms;
    setLeft(ms);
    const id = setInterval(() => setLeft(Math.max(0, end - performance.now())), 100);
    return () => clearInterval(id);
  }, [ms, stamp]);
  return left;
}

// Eased count-up used for the big WPM number on the results screen.
export function useCountUp(target, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const step = (t) => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export const fmtTime = (ms) => `${(ms / 1000).toFixed(1)}s`;
