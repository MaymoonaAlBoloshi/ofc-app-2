import { AssetManagementShell } from '../../legacy/components/asset-management-shell';
import { DepartmentWorkspace } from '../../legacy/components/department-workspace';
import '../../legacy/styles/asset-management.css';
import '../../legacy/styles/app.css';
export const metadata = { title: 'Client Reports' };
export default function Page() {
    return (<DepartmentWorkspace department="asset-management">
      <AssetManagementShell />
    </DepartmentWorkspace>);
}

import "../../legacy/styles/next.css";
