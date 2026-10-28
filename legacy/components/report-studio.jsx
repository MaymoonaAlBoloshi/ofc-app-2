'use client';
import { useEffect, useRef, useState } from 'react';
import { reportPeriods, reportTypes, reportAudiences, reportSections, } from '../lib/report-schema.mjs';
const defaults = {
    entity: 'ONLDC',
    period: '2026-02-ytd',
    type: 'performance',
    audience: 'management',
    comparison: 'budget',
};
const label = (map, key) => map[key] || key;
const amount = (n) => n.toLocaleString('en-GB', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
async function post(body) {
    const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(75000),
    });
    if (!response.headers.get('content-type')?.includes('application/json'))
        throw Error('The report server is unavailable. Please try again.');
    const data = await response.json();
    if (!response.ok)
        throw Error(data.error || 'The report request failed.');
    return data;
}
export function ReportStudio() {
    const modal = useRef(null);
    const [scope, setScope] = useState(defaults), [coverage, setCoverage] = useState(null), [report, setReport] = useState(null), [sections, setSections] = useState({}), [status, setStatus] = useState('draft'), [reports, setReports] = useState([]), [busy, setBusy] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState(''), [dirty, setDirty] = useState(false), [instructions, setInstructions] = useState({});
    const generationId = useRef('');
    async function library() {
        const response = await fetch('/api/reports', { cache: 'no-store' });
        if (!response.ok)
            throw Error('Could not load saved reports.');
        setReports((await response.json()).reports);
    }
    useEffect(() => {
        const open = () => {
            modal.current?.showModal();
            setError('');
            void library().catch((reason) => setError(reason.message));
            document.querySelector('#hpClose')?.click();
        };
        const click = (event) => {
            if (event.target.closest('[data-report-studio]')) {
                event.preventDefault();
                event.stopPropagation();
                open();
            }
        };
        document.addEventListener('click', click, true);
        window.addEventListener('ofc:open-report-studio', open);
        if (location.pathname === '/reports')
            open();
        return () => {
            document.removeEventListener('click', click, true);
            window.removeEventListener('ofc:open-report-studio', open);
        };
    }, []);
    useEffect(() => {
        const before = (event) => {
            if (dirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', before);
        return () => window.removeEventListener('beforeunload', before);
    }, [dirty]);
    function discard() {
        return (!dirty ||
            window.confirm('Discard unsaved report edits? Your saved versions will remain available.'));
    }
    function viewSource(id) {
        const details = [
            ...(modal.current?.querySelectorAll('details[data-source-id]') || []),
        ].find((item) => item.dataset.sourceId === id);
        if (details) {
            details.open = true;
            details.scrollIntoView({ behavior: 'smooth', block: 'center' });
            details.querySelector('summary')?.focus();
        }
    }
    function close() {
        if (!busy && discard())
            modal.current?.close();
    }
    function apply(value) {
        setReport(value);
        setScope(value.scope);
        setCoverage(value.snapshot);
        setSections(value.sections);
        setStatus(value.status);
        setDirty(false);
        setInstructions({});
        generationId.current = '';
    }
    function scopeChange(next) {
        if (!discard())
            return;
        setScope(next);
        setReport(null);
        setCoverage(null);
        setSections({});
        setDirty(false);
        setError('');
        setNotice('');
        generationId.current = '';
    }
    async function run(name, task) {
        setBusy(name);
        setError('');
        setNotice('');
        try {
            await task();
        }
        catch (reason) {
            setError(reason instanceof Error
                ? reason.name === 'TimeoutError'
                    ? 'The request timed out. Check saved reports before generating again.'
                    : reason.message
                : 'The request failed. Please try again.');
        }
        finally {
            setBusy('');
        }
    }
    async function openReport(id, version) {
        if (!discard())
            return;
        await run('Loading report', async () => {
            const response = await fetch(`/api/reports?id=${encodeURIComponent(id)}${version ? `&version=${version}` : ''}`, { cache: 'no-store' });
            const data = await response.json();
            if (!response.ok)
                throw Error(data.error);
            apply(data);
        });
    }
    async function refine(key, instruction) {
        await run(`Refining ${label(reportSections, key)}`, async () => {
            const updated = await post({
                action: 'refine',
                id: report.id,
                section: key,
                text: sections[key].text,
                instruction,
            });
            setSections((current) => ({ ...current, [key]: updated }));
            setStatus('draft');
            setDirty(true);
            setNotice('Section updated. Review it and save a new version.');
        });
    }
    const snapshot = report?.snapshot || coverage, m = snapshot?.metrics;
    return (<dialog ref={modal} className="report-studio" aria-labelledby="report-studio-title" onCancel={(event) => {
            event.preventDefault();
            close();
        }}>
      <header className="report-studio-header">
        <div>
          <span className="report-eyebrow">SIRAAJ · CLIENT REPORTS</span>
          <h2 id="report-studio-title">From evidence to a management report</h2>
        </div>
        <button type="button" className="report-close" aria-label="Close report builder" disabled={Boolean(busy)} onClick={close}>
          ×
        </button>
      </header>
      <div className="report-studio-body">
        <aside className="report-controls">
          <h3>Report scope</h3>
          <label>
            Subsidiary
            <select aria-label="Subsidiary" value={scope.entity} disabled={Boolean(busy)} onChange={(e) => scopeChange({ ...scope, entity: e.target.value })}>
              <option value="ONLDC">ONLDC</option>
            </select>
          </label>
          <p className="report-help">
            Reviewed client financials are currently available for ONLDC.
          </p>
          <label>
            Report type
            <select aria-label="Report type" value={scope.type} disabled={Boolean(busy)} onChange={(e) => scopeChange({ ...scope, type: e.target.value })}>
              {Object.entries(reportTypes).map(([value, text]) => (<option key={value} value={value}>
                  {text}
                </option>))}
            </select>
          </label>
          <label>
            Reporting period
            <select aria-label="Reporting period" value={scope.period} disabled={Boolean(busy)} onChange={(e) => scopeChange({ ...scope, period: e.target.value })}>
              {Object.entries(reportPeriods).map(([value, text]) => (<option key={value} value={value}>
                  {text}
                </option>))}
            </select>
          </label>
          <label>
            Audience
            <select aria-label="Audience" value={scope.audience} disabled={Boolean(busy)} onChange={(e) => scopeChange({ ...scope, audience: e.target.value })}>
              {Object.entries(reportAudiences).map(([value, text]) => (<option key={value} value={value}>
                  {text}
                </option>))}
            </select>
          </label>
          <label>
            Comparison
            <select aria-label="Comparison" value="budget" disabled>
              <option value="budget">Budget for the same period</option>
            </select>
          </label>
          <button type="button" className="report-secondary" disabled={Boolean(busy)} onClick={() => void run('Checking sources', async () => {
            const checked = await post({ action: 'coverage', scope });
            setCoverage(checked);
            if (report)
                setNotice('Source availability checked. The saved report retains its original evidence snapshot.');
        })}>
            Check available evidence
          </button>
          {!report && (<button type="button" className="report-primary" disabled={Boolean(busy) || !coverage?.ready} onClick={() => void run('Generating your report', async () => {
                if (!generationId.current)
                    generationId.current = crypto.randomUUID();
                const value = await post({ action: 'generate', scope, id: generationId.current });
                apply(value);
                setNotice('Draft generated and saved as version 1. Review the narrative before circulation.');
                await library();
            })}>
              Generate report
            </button>)}
          {report && (<button type="button" className="report-secondary" disabled={Boolean(busy)} onClick={() => scopeChange({ ...scope })}>
              Start another report
            </button>)}
          <div className="report-library">
            <h3>Saved reports</h3>
            {reports.length === 0 ? (<p className="report-help">Generated reports and their versions will appear here.</p>) : (reports.map((item) => (<button type="button" key={item.id} disabled={Boolean(busy)} className={report?.id === item.id ? 'selected' : ''} onClick={() => void openReport(item.id)}>
                  <strong>ONLDC {label(reportTypes, item.scope.type).toLowerCase()}</strong>
                  <small>
                    {label(reportPeriods, item.scope.period)} · v{item.version}
                  </small>
                </button>)))}
          </div>
        </aside>
        <main className="report-editor">
          <div className="report-feedback" aria-live="polite">
            {busy && <p role="status">{busy}…</p>}
            {notice && <p role="status">{notice}</p>}
            {error && (<p className="report-error" role="alert">
                {error}
              </p>)}
          </div>
          {!snapshot && (<div className="report-empty">
              <span>01 / SCOPE & EVIDENCE</span>
              <h3>A report you can trace back to its sources</h3>
              <p>
                Select a reporting period and check the evidence. Siraaj will draft the explanation
                around figures calculated from the client workbooks.
              </p>
              <ol>
                <li>Check data coverage and limitations</li>
                <li>Generate and refine the narrative</li>
                <li>Save a reviewed version and export PDF</li>
              </ol>
            </div>)}
          {snapshot && (<>
              {!report && (<section className="report-coverage">
                  <span className="report-eyebrow">02 / SOURCE CHECK</span>
                  <h3>
                    {snapshot.ready
                    ? 'Ready to draft, with coverage limitations'
                    : 'More evidence is needed'}
                  </h3>
                  <p>
                    {snapshot.periodLabel} · {snapshot.evidence.length} evidence records · Revenue
                    only
                  </p>
                  {snapshot.missing.map((note) => (<p key={note} className="report-error">
                      {note}
                    </p>))}
                  <ul>
                    {snapshot.warnings.map((note) => (<li key={note}>{note}</li>))}
                  </ul>
                </section>)}
              {report && (<div className="report-document-header">
                  <div>
                    <span className="report-eyebrow">
                      {dirty
                    ? 'UNSAVED CHANGES'
                    : `${status.toUpperCase()} · VERSION ${report.version}`}
                    </span>
                    <h3>ONLDC {label(reportTypes, report.scope.type).toLowerCase()}</h3>
                    <p>
                      {snapshot.periodLabel} · {label(reportAudiences, report.scope.audience)}
                    </p>
                  </div>
                  <div className="report-version-controls">
                    <label>
                      Saved version
                      <select aria-label="Saved version" value={report.version} disabled={Boolean(busy)} onChange={(e) => void openReport(report.id, Number(e.target.value))}>
                        {report.versions.map((v) => (<option key={v.version} value={v.version}>
                            v{v.version} · {v.status}
                          </option>))}
                      </select>
                    </label>
                  </div>
                </div>)}
              {m && (<section className="report-metrics">
                  <div>
                    <span>Actual revenue · OMR</span>
                    <strong>{amount(m.actual)}</strong>
                  </div>
                  <div>
                    <span>Budget · OMR</span>
                    <strong>{amount(m.budget)}</strong>
                  </div>
                  <div>
                    <span>Variance · OMR</span>
                    <strong className={m.gap < 0 ? 'adverse' : ''}>{amount(m.gap)}</strong>
                    <small>{m.variance.toFixed(2)}% against budget</small>
                  </div>
                  <p>
                    Calculated from {m.actualLocator} and {m.budgetLocator}. Same period, OMR units.{' '}
                    <button type="button" className="report-source-link" onClick={() => viewSource(m.sourceId)}>
                      View financial evidence
                    </button>
                  </p>
                </section>)}
              {report && (<>
                  <p className="report-help">
                    Figures and source records are fixed to this report's evidence snapshot.
                    Narrative edits remain drafts until you review and save them.
                  </p>
                  {Object.entries(reportSections).map(([key, title]) => (<section className="report-section" key={key}>
                      <div className="report-section-heading">
                        <h4>{title}</h4>
                        <button type="button" disabled={Boolean(busy)} onClick={() => void refine(key, 'Shorten this section while preserving its evidence and caveats.')}>
                          Shorten with AI
                        </button>
                      </div>
                      <label className="report-sr" htmlFor={`report-${key}`}>
                        {title}
                      </label>
                      <textarea id={`report-${key}`} value={sections[key]?.text || ''} disabled={Boolean(busy)} maxLength={6000} rows={key === 'summary' ? 5 : 6} onChange={(e) => {
                        setSections((current) => ({
                            ...current,
                            [key]: { ...current[key], text: e.target.value },
                        }));
                        setStatus('draft');
                        setDirty(true);
                    }}/>
                      <p className="report-help">
                        Sources:{' '}
                        {sections[key]?.sourceIds.map((id) => (<button type="button" className="report-source-link" key={id} onClick={() => viewSource(id)} aria-label={`View source ${snapshot.evidence.findIndex((e) => e.id === id) + 1}`}>
                            [{snapshot.evidence.findIndex((e) => e.id === id) + 1}]
                          </button>))}
                      </p>
                      <details>
                        <summary>Refine this section</summary>
                        <div className="report-refine">
                          <input aria-label={`Instructions for ${title}`} value={instructions[key] || ''} maxLength={1200} disabled={Boolean(busy)} placeholder="For example: expand the questions management should ask" onChange={(e) => setInstructions((current) => ({ ...current, [key]: e.target.value }))}/>
                          <button type="button" className="report-secondary" disabled={Boolean(busy) || !instructions[key]?.trim()} onClick={() => void refine(key, instructions[key])}>
                            Apply with AI
                          </button>
                        </div>
                      </details>
                    </section>))}
                  <section className="report-tasks">
                    <h4>Recorded critical tasks</h4>
                    <p className="report-help">
                      Snapshot date unconfirmed. These are recorded tracker statuses, not live or
                      period-end statuses.
                    </p>
                    {snapshot.tasks.map((task) => (<div key={task.id}>
                        <strong>{task.title}</strong>
                        <span>
                          {task.owner} · {task.status} · [
                          {snapshot.evidence.findIndex((e) => e.id === task.id) + 1}]
                        </span>
                      </div>))}
                  </section>
                  <section className="report-limitations">
                    <h4>Coverage and limitations</h4>
                    <ul>
                      {snapshot.warnings.map((note) => (<li key={note}>{note}</li>))}
                    </ul>
                  </section>
                  <div className="report-savebar">
                    <label>
                      Review status
                      <select aria-label="Review status" value={status} disabled={Boolean(busy)} onChange={(e) => {
                    setStatus(e.target.value);
                    setDirty(true);
                }}>
                        <option value="draft">Draft, needs review</option>
                        <option value="reviewed">Reviewed by demo user</option>
                      </select>
                    </label>
                    <button type="button" className="report-primary" disabled={Boolean(busy) || !dirty} onClick={() => void run('Saving version', async () => {
                    const updated = await post({
                        action: 'save',
                        id: report.id,
                        baseVersion: report.latestVersion,
                        sections,
                        status,
                    });
                    apply(updated);
                    setNotice(`Version ${updated.version} saved.`);
                    await library();
                })}>
                      Save new version
                    </button>
                    <button type="button" className="report-secondary" disabled={Boolean(busy) || dirty} onClick={() => void run('Preparing PDF', async () => {
                    const response = await fetch(`/api/reports/pdf?id=${report.id}&version=${report.version}`);
                    if (!response.ok) {
                        const data = await response.json();
                        throw Error(data.error);
                    }
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ONLDC-${report.scope.period}-v${report.version}.pdf`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                    setNotice(`Version ${report.version} exported as PDF.`);
                })}>
                      Export PDF
                    </button>
                    {dirty && <small>Save your edits before exporting.</small>}
                  </div>
                </>)}
              <section className="report-sources">
                <h4>Source register</h4>
                {snapshot.evidence.map((item, index) => (<details key={item.id} data-source-id={item.id}>
                    <summary>
                      [{index + 1}] {item.locator}
                    </summary>
                    <p>{item.path}</p>
                    <small>SHA-256: {item.hash}</small>
                    <p className="report-source-text">{item.text}</p>
                  </details>))}
              </section>
            </>)}
        </main>
      </div>
    </dialog>);
}
