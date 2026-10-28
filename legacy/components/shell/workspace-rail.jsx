import { SiraajButton } from '../siraaj';
export function WorkspaceRail({ label }) {
    return (<nav className="rail" aria-label={label}>
      <button className="rbtn" data-rail="home" aria-current="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M3 9l7-5.5L17 9v7.5a1 1 0 01-1 1h-3.5v-5h-5v5H4a1 1 0 01-1-1z"></path>
        </svg>
        {'Home\n  '}
      </button>
      <button className="rbtn" data-rail="input" aria-current="false">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M11.5 3H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5V9"></path>
          <path d="M14.8 2.7a1.6 1.6 0 012.3 2.3L10.5 11.6 7.5 12.5l.9-3z"></path>
        </svg>
        {'Input\n    '}
        <span className="rb" id="railCount" hidden></span>
      </button>
      <button className="rbtn" data-rail="reports" aria-current="false">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M5 2.5h7l4 4v11H5z"></path>
          <path d="M12 2.5v4h4M8 10.5h5M8 13.5h5"></path>
        </svg>
        {'Reports\n  '}
      </button>
      <button className="rbtn" data-rail="dashboards" aria-current="false">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="6" height="8" rx="1.2"></rect>
          <rect x="11" y="3" width="6" height="5" rx="1.2"></rect>
          <rect x="11" y="10" width="6" height="7" rx="1.2"></rect>
          <rect x="3" y="13" width="6" height="4" rx="1.2"></rect>
        </svg>
        {'Dashboards\n  '}
      </button>
      <SiraajButton />
    </nav>);
}
