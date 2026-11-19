import { memo, useEffect, useMemo, useRef, useState } from 'react';

// Stop-on-error typing: one wrong character can be shown, then you must backspace before continuing.
// A word is highlighted as soon as all of its letters have been typed correctly.
function TypingArea({ text, active, onType }) {
  const [typed, setTyped] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const textRef = useRef(null);
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

  // Split the paragraph into words so each one can be highlighted when completed.
  const nodes = useMemo(() => {
    const cls = (i) => (i < correct ? 'ok' : i < typed.length ? 'bad' : i === typed.length ? 'cur' : 'todo');
    const out = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] === ' ') {
        out.push(<span key={i} className={`ch ${cls(i)}`}> </span>);
        i++;
        continue;
      }
      let j = i;
      while (j < text.length && text[j] !== ' ') j++;
      const chars = [];
      for (let k = i; k < j; k++) chars.push(<span key={k} className={`ch ${cls(k)}`}>{text[k]}</span>);
      out.push(<span key={i} className={`word ${correct >= j ? 'done' : ''}`}>{chars}</span>);
      i = j;
    }
    return out;
  }, [text, typed.length, correct]);

  const shake = () =>
    textRef.current?.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
      { duration: 250 }
    );

  const handleChange = (e) => {
    if (!active) return;
    const v = e.target.value;
    let next;
    if (v.length > typed.length) {
      if (typed.length > correct || typed.length >= text.length) return; // fix the mistake first
      const ch = v[typed.length];
      counts.current.keystrokes++;
      if (ch !== text[typed.length]) { counts.current.errors++; shake(); }
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
      <div className="text" ref={textRef} aria-hidden="true">{nodes}</div>
      {active && !focused && <div className="focus-hint">Click here to keep typing</div>}
    </div>
  );
}

export default memo(TypingArea);
