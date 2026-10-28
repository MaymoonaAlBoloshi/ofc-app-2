import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, EntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { TreasuryHeader } from './treasury-header';
export function TreasuryShell() {
    return (<>
      <a className="app-skip" href="#view">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="Treasury tools"/>
        <NavigationPanel />
        <PanelScrim />
        <EntryPanel />
        <div className="page">
          <TreasuryHeader />
          <main id="view" tabIndex={-1}></main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital · Treasury'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
