import { WorkspaceRail } from './shell/workspace-rail';
import { SiraajWorkspace } from './siraaj';
import { AppLauncher, EntryPanel, NavigationPanel, PanelScrim, RoleMenu, SuiteHeader, Toast, } from './shell/controls';
import { StrategyHeader } from './strategy-header';
export function StrategyShell() {
    return (<>
      <a className="app-skip" href="#view">
        Skip to content
      </a>

      <SuiteHeader />

      <AppLauncher />

      <RoleMenu />
      <div className="frame">
        <WorkspaceRail label="Strategy tools"/>
        <NavigationPanel />
        <PanelScrim />
        <EntryPanel />
        <div className="page">
          <StrategyHeader />
          <main id="view" tabIndex={-1}></main>
          <SiraajWorkspace />
          <footer>{'Oman Food Capital · Strategy'}</footer>
        </div>
      </div>
      <Toast />
    </>);
}
