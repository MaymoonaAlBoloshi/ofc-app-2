import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, EntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { FinanceHeader } from './finance-header';
export function FinanceShell() {
    return (<>
      <a className="app-skip" href="#view">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="Finance & Accounts tools"/>
        <NavigationPanel />
        <PanelScrim />
        <EntryPanel />
        <div className="page">
          <FinanceHeader />
          <main id="view" tabIndex={-1}></main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital · Finance & Accounts'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
