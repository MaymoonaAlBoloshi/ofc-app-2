export function PmoHeader() {
    return (<>
      <div className="site">
        <div className="site-inner">
          <div className="crumb">
            <a href="/corporate">{'Corporate'}</a>
            <span className="sep">{'/'}</span>
            <span>{'Investment'}</span>
            <span className="sep">{'/'}</span>
            <button data-go="home">{'PMO'}</button>
            <span id="crumbView"></span>
          </div>
          <div className="site-top">
            <span className="site-logo" style={{ background: '#8A6B4E' }} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="4" y="5" width="9" height="3.5" rx="1.5" fill="#fff"></rect>
                <rect x="8" y="10.25" width="10" height="3.5" rx="1.5" fill="#fff" opacity=".75"></rect>
                <rect x="12" y="15.5" width="8" height="3.5" rx="1.5" fill="#fff" opacity=".55"></rect>
              </svg>
            </span>
            <div className="site-title">
              <h1>{'PMO'}</h1>
              <p>{'Investment Department · Project Management Office · SG4'}</p>
            </div>
            <div className="site-chips">
              <span className="chip-s">
                {'As of '}
                <b>{'23 Sep 2026'}</b>
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
