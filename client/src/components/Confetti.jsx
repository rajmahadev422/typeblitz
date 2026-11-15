import { useMemo } from 'react';

const COLORS = ['#2457ff', '#ffc700', '#e8590c', '#12b886', '#ae3ec9'];

export default function Confetti() {
  const bits = useMemo(() => Array.from({ length: 46 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 2.2 + Math.random() * 1.6,
    color: COLORS[i % COLORS.length],
    rot: Math.random() * 360,
    w: 6 + Math.random() * 6,
  })), []);
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ left: `${b.left}%`, background: b.color, width: b.w, height: b.w * 1.6,
          animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}
