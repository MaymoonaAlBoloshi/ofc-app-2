import { FinanceShell } from '../../legacy/components/finance-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/finance.css';
import '../../legacy/styles/app.css';
export const metadata = { title: 'Finance & Accounts' };
export default function Page() {
    return (<DepartmentWorkspace department="finance">
      <FinanceShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
