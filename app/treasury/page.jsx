import { TreasuryShell } from '../../legacy/components/treasury-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/treasury.css';
import '../../legacy/styles/app.css';
export const metadata = { title: 'Treasury' };
export default function Page() {
    return (<DepartmentWorkspace department="treasury">
      <TreasuryShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
