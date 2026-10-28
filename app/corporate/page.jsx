import { CorporateShell } from '../../legacy/components/corporate-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/corporate.css';
import '../../legacy/styles/app.css';
import '../../legacy/styles/corporate-market.css';
export const metadata = { title: 'Corporate' };
export default function Page() {
    return (<DepartmentWorkspace department="corporate">
      <CorporateShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
