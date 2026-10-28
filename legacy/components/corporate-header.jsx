export function CorporateHeader() {
    return (<>
      <div className="site">
        <div className="site-inner">
          <div className="site-top">
            <span className="site-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="7" height="7" rx="1.5" fill="#fff"></rect>
                <rect x="13" y="4" width="7" height="7" rx="1.5" fill="#A9CD69"></rect>
                <rect x="4" y="13" width="7" height="7" rx="1.5" fill="#A9CD69"></rect>
                <rect x="13" y="13" width="7" height="7" rx="1.5" fill="#fff"></rect>
              </svg>
            </span>
            <div className="site-title">
              <h1>{'Corporate'}</h1>
              <p>{'Corporate workspace · Generated 23/09/2026'}</p>
            </div>
            <button className="follow" id="follow" aria-pressed="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"></path>
              </svg>
              <span>{'Following'}</span>
            </button>
          </div>
        </div>
      </div>
    </>);
}
