import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, CorporateEntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { CorporateHeader } from './corporate-header';
export function CorporateShell() {
    return (<>
      <a className="app-skip" href="#app-content">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="Workspace tools"/>
        <NavigationPanel />
        <PanelScrim />
        <CorporateEntryPanel />
        <div className="page">
          <CorporateHeader />
          <main id="app-content" tabIndex={-1}>
            <div>
              <div className="corporate-top">
                <section className="wp market-panel" aria-labelledby="marketTitle">
                  <div className="wp-h">
                    <div>
                      <h2 id="marketTitle">{'Market news'}</h2>
                      <p>{'Oman · listed food & beverage companies'}</p>
                    </div>
                    <div className="market-tools">
                      <button className="market-refresh" id="marketRefresh" aria-label="Refresh market prices" title="Refresh market prices">
                        {'↻'}
                      </button>
                    </div>
                  </div>
                  <div className="market-grid" id="marketGrid"></div>
                  <div className="market-footer">
                    <span id="marketStatus" role="status">
                      {'Loading verified MSX snapshot…'}
                    </span>
                    <a href="https://www.msx.om/" target="_blank" rel="noopener">
                      {'Source: MSX ↗'}
                    </a>
                  </div>
                  <div className="market-footer">
                    <span>
                      {'Daily closing observations over 2 years; non-trading days omitted. Hover for prices.'}
                    </span>
                  </div>
                </section>
                <section className="wp corporate-attention" aria-labelledby="attT">
                  <div className="wp-h">
                    <div>
                      <h2 id="attT">{'Needs your attention'}</h2>
                      <p>{'Decisions awaiting a forum · escalated first'}</p>
                    </div>
                    <button className="see" data-tracker="decisions">
                      {'View all decisions ↗'}
                    </button>
                  </div>
                  <ul className="dlist" id="dlist"></ul>
                  <div className="attention-foot">
                    {'Select a decision to review its owner, deadline and forum.'}
                  </div>
                </section>
              </div>
              <section className="section" aria-labelledby="glanceT">
                <div className="sec-h">
                  <h2 id="glanceT">{'At a glance'}</h2>
                  <span>{'Select a card to open the full view'}</span>
                </div>
                <div className="glance">
                  <button className="kcard hero" data-link="/strategy#kpid" data-lapp="strategy">
                    <span className="lbl">{'Corporate performance'}</span>
                    <span className="val num">
                      {'76%'}
                      <span className="pill">{'Target'}</span>
                    </span>
                    <span className="ctx">{'Corporate BSC · 12 strategic KPIs'}</span>
                    <span className="go">
                      {'Open in Strategy'}
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 10l6-6M5 4h5v5"></path>
                      </svg>
                    </span>
                  </button>
                  <button className="kcard peach" data-tracker="decisions">
                    <span className="lbl">{'Decisions required'}</span>
                    <span className="val num" id="kDec">
                      {'5'}
                    </span>
                    <span className="ctx" id="kDecSub">
                      {'2 escalated · 3 pending'}
                    </span>
                    <span className="go">
                      {'Decisions report'}
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 10l6-6M5 4h5v5"></path>
                      </svg>
                    </span>
                  </button>
                  <button className="kcard mint" data-tracker="actions">
                    <span className="lbl">{'Key actions'}</span>
                    <span className="val num" id="kAct">
                      {'6'}
                    </span>
                    <span className="ctx" id="kActSub">
                      {'3 open actions'}
                    </span>
                    <span className="go">
                      {'Actions report'}
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 10l6-6M5 4h5v5"></path>
                      </svg>
                    </span>
                  </button>
                  <button className="kcard" data-link="/strategy#trk-init" data-lapp="strategy">
                    <span className="lbl">{'Initiatives'}</span>
                    <span className="val num" id="kIni">
                      {'4'}
                    </span>
                    <span className="ctx">{'Strategic initiatives tracked'}</span>
                    <span className="go">
                      {'Open in Strategy'}
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 10l6-6M5 4h5v5"></path>
                      </svg>
                    </span>
                  </button>
                  <button className="kcard" data-link="/strategy#kpid" data-lapp="strategy">
                    <span className="lbl">{'KPIs below target'}</span>
                    <span className="val num">
                      {'5'}
                      <small>{'of 12'}</small>
                    </span>
                    <span className="ctx">{'42% of the scorecard'}</span>
                    <span className="go">
                      {'Open in Strategy'}
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 10l6-6M5 4h5v5"></path>
                      </svg>
                    </span>
                  </button>
                </div>
              </section>
              <div className="row section">
                <section className="wp" aria-labelledby="bscT">
                  <div className="wp-h">
                    <div>
                      <h2 id="bscT">{'Department BSC'}</h2>
                      <p>{'Reported scores · 0–100%'}</p>
                    </div>
                  </div>
                  <div className="chart-scroll">
                    <div>
                      <div className="chart">
                        <div className="yaxis" aria-hidden="true">
                          <span style={{ bottom: '100%' }}>{'100%'}</span>
                          <span style={{ bottom: '50%' }}>{'50%'}</span>
                          <span style={{ bottom: '0' }}>{'0%'}</span>
                        </div>
                        <div className="plot">
                          <div className="gl" style={{ bottom: '100%' }}></div>
                          <div className="gl" style={{ bottom: '50%' }}></div>
                          <div className="cols" id="cols"></div>
                        </div>
                      </div>
                      <div className="xlabels" id="xlabels"></div>
                    </div>
                  </div>
                  <div className="note">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.5"></circle>
                      <path d="M8 4.5v4M8 11v.3"></path>
                    </svg>
                    <span>
                      <b style={{ fontWeight: '500' }}>{'Corporate Support'}</b>
                      {' at 69% is the only department rated below target.'}
                    </span>
                  </div>
                  <div className="wp-h" style={{ marginTop: '14px' }}>
                    <div>
                      <h3 style={{ margin: '0', fontSize: '13.5px' }}>{'By KPI'}</h3>
                      <p>
                        {'Select a KPI to see its target, actual and the cause behind the score'}
                      </p>
                    </div>
                  </div>
                  <ul className="mini-list" id="kpiCauses"></ul>
                </section>
                <section className="wp" aria-labelledby="scT">
                  <div className="wp-h">
                    <div>
                      <h2 id="scT">{'Scorecard balance'}</h2>
                      <p>{'How the 12 strategic KPIs are performing'}</p>
                    </div>
                    <button className="see" data-link="/strategy#kpid" data-lapp="strategy">
                      {'All KPIs ↗'}
                    </button>
                  </div>
                  <div className="donut">
                    <svg viewBox="0 0 42 42" id="donut" aria-hidden="true"></svg>
                    <div className="c">
                      <div>
                        <b className="num">{'12'}</b>
                        <span>{'KPIs'}</span>
                      </div>
                    </div>
                  </div>
                  <ul className="legend" id="legend"></ul>
                </section>
              </div>
            </div>
          </main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
