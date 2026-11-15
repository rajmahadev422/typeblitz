import { memo, useEffect, useMemo, useRef, useState } from 'react';

// Stop-on-error typing: one wrong character can be shown, then you must backspace before continuing.
function TypingArea({ text, active, onType }) {
  const [typed, setTyped] = useState('');
  const [focused, setFocused] = useState(false);
  const [shake, setShake] = useState(0);
  const inputRef = useRef(null);
  const counts = useRef({ keystrokes: 0, errors: 0 });

  useEffect(() => {
    setTyped('');
    counts.current = { keystrokes: 0, errors: 0 };
  }, [text]);

  useEffect(() => { if (active) inputRef.current?.focus(); }, [active]);

  const correct = useMemo(() => {
    let i = 0;
    while (i < typed.length && typed[i] === text[i]) i++;
    return i;
  }, [typed, text]);

  const handleChange = (e) => {
    if (!active) return;
    const v = e.target.value;
    let next;
    if (v.length > typed.length) {
      if (typed.length > correct || typed.length >= text.length) return; // fix the mistake first
      const ch = v[typed.length];
      counts.current.keystrokes++;
      if (ch !== text[typed.length]) { counts.current.errors++; setShake((s) => s + 1); }
      next = typed + ch;
    } else {
      next = v;
    }
    setTyped(next);
    let i = 0;
    while (i < next.length && next[i] === text[i]) i++;
    onType({ index: i, ...counts.current });
  };

  return (
    <div className={`typing ${active ? 'active' : ''}`} onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef} className="hidden-input" value={typed} onChange={handleChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onPaste={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}
        autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
        aria-label="Type the paragraph here" disabled={!active}
      />
      <div className={`text ${shake ? 'shake' : ''}`} key={shake} aria-hidden="true">
        {text.split('').map((ch, i) => {
          const cls = i < correct ? 'ok' : i < typed.length ? 'bad' : i === typed.length ? 'cur' : 'todo';
          return <span key={i} className={`ch ${cls}`}>{ch}</span>;
        })}
      </div>
      {active && !focused && <div className="focus-hint">Click here to keep typing</div>}
    </div>
  );
}

export default memo(TypingArea);
