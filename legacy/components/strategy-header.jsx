export function StrategyHeader() {
    return (<>
      <div className="site">
        <div className="site-inner">
          <div className="crumb">
            <a href="/corporate">{'Corporate'}</a>
            <span className="sep">{'/'}</span>
            <span>{'Investment'}</span>
            <span className="sep">{'/'}</span>
            <button data-go="home">{'Strategy'}</button>
            <span id="crumbView"></span>
          </div>
          <div className="site-top">
            <span className="site-logo" style={{ background: '#3E6A3F' }} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" fill="#fff" opacity=".45"></circle>
                <circle cx="12" cy="12" r="5.5" fill="#fff" opacity=".75"></circle>
                <circle cx="12" cy="12" r="2.5" fill="#fff"></circle>
              </svg>
            </span>
            <div className="site-title">
              <h1>{'Strategy'}</h1>
              <p>{'Investment Department · Strategy Division · Group CIO'}</p>
            </div>
            <div className="site-chips">
              <span className="chip-s">
                {'Period '}
                <b>{'Aug 2026'}</b>
                {' · YTD'}
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
