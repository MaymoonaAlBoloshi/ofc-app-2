import { StrategyShell } from '../../legacy/components/strategy-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/strategy.css';
import '../../legacy/styles/app.css';
export const metadata = { title: 'Strategy' };
export default function Page() {
    return (<DepartmentWorkspace department="strategy">
      <StrategyShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
