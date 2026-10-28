export function SuiteHeader() {
    return (<>
      <header className="suite">
        <button className="waffle" id="waffle" aria-label="App launcher" aria-expanded="false" aria-controls="launcher" title="App launcher">
          <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
            <circle cx="3" cy="3" r="1.6"></circle>
            <circle cx="9" cy="3" r="1.6"></circle>
            <circle cx="15" cy="3" r="1.6"></circle>
            <circle cx="3" cy="9" r="1.6"></circle>
            <circle cx="9" cy="9" r="1.6"></circle>
            <circle cx="15" cy="9" r="1.6"></circle>
            <circle cx="3" cy="15" r="1.6"></circle>
            <circle cx="9" cy="15" r="1.6"></circle>
            <circle cx="15" cy="15" r="1.6"></circle>
          </svg>
        </button>
        <div className="logo" aria-label="Oman Food Capital">
          <span className="ar" lang="ar">
            {'العمانية لاستثمارات الغذاء'}
          </span>
          <span className="en">{'Oman Food Capital'}</span>
        </div>
        <div className="suite-search">
          <label>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="7" cy="7" r="5"></circle>
              <path d="M11 11l3.5 3.5"></path>
            </svg>
            <input type="search" id="gsearch" placeholder="Search this site" aria-label="Search this site"/>
          </label>
        </div>
        <button className="suite-icon" aria-label="Settings" data-toast="Settings live under Admin / Settings.">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="10" cy="10" r="2.6"></circle>
            <path d="M10 2v2.4M10 15.6V18M2 10h2.4M15.6 10H18M4.3 4.3L6 6M14 14l1.7 1.7M4.3 15.7L6 14M14 6l1.7-1.7"></path>
          </svg>
        </button>
        <button className="suite-icon" aria-label="Help" data-toast="Help and guidance for the platform.">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="10" cy="10" r="7.5"></circle>
            <path d="M7.8 7.8a2.3 2.3 0 114 1.6c-.8.6-1.8 1-1.8 2.1M10 14.2v.3"></path>
          </svg>
        </button>
        <button className="me" id="meBtn" aria-label="Account" aria-haspopup="menu" aria-expanded="false" aria-controls="roleMenu">
          <span className="avatar" id="meInit">
            {'CEO'}
          </span>
        </button>
      </header>
    </>);
}
export function AppLauncher() {
    return (<>
      <section className="launcher" id="launcher" role="dialog" aria-label="Apps">
        <div className="l-search">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="7" cy="7" r="5"></circle>
            <path d="M11 11l3.5 3.5"></path>
          </svg>
          <input type="search" id="lsearch" placeholder="Find OFC apps" aria-label="Find OFC apps"/>
        </div>
        <div className="l-grid" id="lgrid"></div>
        <div className="l-foot">
          <span id="accessNote"></span>
          <span>{'Access is set by your role'}</span>
        </div>
      </section>
    </>);
}
export function RoleMenu() {
    return (<>
      <div className="menu" id="roleMenu" role="menu" aria-label="Demo role">
        <h4>{'View the platform as'}</h4>
        <div id="roles"></div>
      </div>
    </>);
}
export function NavigationPanel() {
    return (<>
      <section className="hpane" id="hpane" aria-labelledby="hpT" aria-hidden="true">
        <div className="hp-h">
          <h2 id="hpT">{'Input'}</h2>
          <button className="pbtn" id="hpClose" aria-label="Close">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M4 4l8 8M12 4l-8 8"></path>
            </svg>
          </button>
        </div>
        <div className="hp-b" id="hpB"></div>
      </section>
    </>);
}
export function PanelScrim() {
    return (<>
      <div className="pscrim" id="pscrim"></div>
    </>);
}
export function CorporateEntryPanel() {
    return (<>
      <aside className="panel" id="panel" aria-labelledby="panelT" aria-hidden="true">
        <div className="panel-h">
          <button className="pbtn" id="pBack" aria-label="Back to reports" hidden>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M10 3L5 8l5 5"></path>
            </svg>
          </button>
          <h2 id="panelT">{'Panel'}</h2>
          <button className="pbtn" id="pClose" aria-label="Close panel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8"></path>
            </svg>
          </button>
        </div>
        <div className="panel-b" id="panelB"></div>
      </aside>
    </>);
}
export function Toast() {
    return (<>
      <div className="toast" id="toast" role="status" aria-live="polite"></div>
    </>);
}
export function EntryPanel() {
    return (<>
      <aside className="panel" id="panel" aria-labelledby="panelT" aria-hidden="true">
        <div className="panel-h">
          <h2 id="panelT">{'New entry'}</h2>
          <button className="pbtn" id="pClose" aria-label="Close panel">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8"></path>
            </svg>
          </button>
        </div>
        <div className="panel-b" id="panelB"></div>
      </aside>
    </>);
}
