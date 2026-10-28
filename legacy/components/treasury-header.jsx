export function TreasuryHeader() {
    return (<>
      <div className="site">
        <div className="site-inner">
          <div className="crumb">
            <a href="/corporate">{'Corporate'}</a>
            <span className="sep">{'/'}</span>
            <span>{'Finance'}</span>
            <span className="sep">{'/'}</span>
            <button data-go="home">{'Treasury'}</button>
            <span id="crumbView"></span>
          </div>
          <div className="site-top">
            <span className="site-logo" style={{ background: '#6E7F3A' }} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l9 5H3z" fill="#fff"></path>
                <rect x="5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"></rect>
                <rect x="10.75" y="10" width="2.5" height="7" fill="#fff" opacity=".7"></rect>
                <rect x="16.5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"></rect>
                <rect x="3" y="18" width="18" height="2.5" rx=".5" fill="#fff"></rect>
              </svg>
            </span>
            <div className="site-title">
              <h1>{'Treasury'}</h1>
              <p>{'Finance Department · Group CFO'}</p>
            </div>
            <div className="site-chips">
              <span className="chip-s">
                {'Cash as at '}
                <b>{'22 Sep 2026'}</b>
              </span>
              <span className="chip-s">
                {'Figures in '}
                <b>{'OMR m'}</b>
              </span>
              <span className="chip-s sample" title="Illustrative figures for the demo. Replace with OFC's figures.">
                {'Sample figures'}
              </span>
              <button className="follow" id="follow" aria-pressed="true" style={{ marginLeft: '0' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                  <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"></path>
                </svg>
                <span>{'Following'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>);
}
