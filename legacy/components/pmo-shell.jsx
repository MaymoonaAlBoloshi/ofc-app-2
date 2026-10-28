import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, EntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { PmoHeader } from './pmo-header';
export function PmoShell() {
    return (<>
      <a className="app-skip" href="#view">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="PMO tools"/>
        <NavigationPanel />
        <PanelScrim />
        <EntryPanel />
        <div className="page">
          <PmoHeader />
          <main id="view" tabIndex={-1}></main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital · PMO'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
