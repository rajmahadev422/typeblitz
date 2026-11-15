export default function Header({ view, setView, theme, setTheme, online, inGame }) {
  return (
    <header className="header">
      <button className="brand" onClick={() => !inGame && setView('home')} aria-label="TypeBlitz home">
        <span className="brand-key">T</span>
        <span className="brand-name">TypeBlitz</span>
      </button>

      {!inGame && (
        <nav className="nav" aria-label="Main">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Play</button>
          <button className={view === 'board' ? 'active' : ''} onClick={() => setView('board')}>Leaderboard</button>
        </nav>
      )}

      <div className="header-right">
        <span className={`status ${online ? 'on' : 'off'}`} title={online ? 'Connected' : 'Offline'} role="status">
          {online ? 'Online' : 'Offline'}
        </span>
        <button className="icon-btn theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch light or dark theme">
          <svg className="sun" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          <svg className="moon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
