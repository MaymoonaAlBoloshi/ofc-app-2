import { PmoShell } from '../../legacy/components/pmo-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/pmo.css';
import '../../legacy/styles/app.css';
export const metadata = { title: 'PMO' };
export default function Page() {
    return (<DepartmentWorkspace department="pmo">
      <PmoShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
