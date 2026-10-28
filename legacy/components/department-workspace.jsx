'use client';
import { useEffect, useState } from 'react';
import { loadSpreadsheet } from '../lib/load-spreadsheet';
import { createRuntimeScope } from '../lib/runtime-scope';
import { SiraajProvider } from './siraaj';
import { QuickChat } from './quick-chat';
import { ReportStudio } from './report-studio';
const workflows = {
    corporate: () => import('../features/corporate'),
    finance: () => import('../features/finance'),
    treasury: () => import('../features/treasury'),
    strategy: () => import('../features/strategy'),
    investment: () => import('../features/investment'),
    pmo: () => import('../features/pmo'),
    'asset-management': () => import('../features/asset-management'),
};
export function DepartmentWorkspace({ department, children, }) {
    const [error, setError] = useState(false);
    useEffect(() => {
        const scope = createRuntimeScope();
        let active = true;
        Promise.all([
            workflows[department](),
            department === 'asset-management' ? loadSpreadsheet() : Promise.resolve(),
        ])
            .then(([module]) => {
            if (!active)
                return;
            module.initialize(scope);
            document.documentElement.dataset.workspaceReady = department;
        })
            .catch((reason) => {
            if (active) {
                console.error('Unable to initialize department', reason);
                scope.dispose();
                setError(true);
            }
        });
        const onPageShow = (event) => {
            if (event.persisted)
                location.reload();
        };
        window.addEventListener('pageshow', onPageShow);
        return () => {
            active = false;
            scope.dispose();
            delete document.documentElement.dataset.workspaceReady;
            window.removeEventListener('pageshow', onPageShow);
        };
    }, [department]);
    return (<SiraajProvider>
      {children}
      <QuickChat department={department}/>
      <ReportStudio />
      {error && (<div className="workspace-error" role="alert">
          This workspace could not load.{' '}
          <button className="btn" onClick={() => location.reload()}>
            Reload workspace
          </button>
        </div>)}
    </SiraajProvider>);
}
