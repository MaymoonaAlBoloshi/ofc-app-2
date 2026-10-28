import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, EntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { InvestmentHeader } from './investment-header';
export function InvestmentShell() {
    return (<>
      <a className="app-skip" href="#view">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="Investment tools"/>
        <NavigationPanel />
        <PanelScrim />
        <EntryPanel />
        <div className="page">
          <InvestmentHeader />
          <main id="view" tabIndex={-1}></main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital · Investment & Deal Sourcing'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
