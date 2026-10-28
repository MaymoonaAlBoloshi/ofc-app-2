'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { readGateResponse } from '../lib/gate-check-response.mjs';
const names = {
    pending: 'Waiting',
    running: 'Running',
    passed: 'Passed',
    failed: 'Failed',
    skipped: 'Not run',
    interrupted: 'Interrupted',
};
export function GateCheck() {
    const [mount, setMount] = useState(null), [run, setRun] = useState(null), [error, setError] = useState(''), [starting, setStarting] = useState(false);
    const modal = useRef(null);
    useEffect(() => {
        const find = () => setMount(document.querySelector('#gate-check-launcher'));
        find();
        const observer = new MutationObserver(find);
        const view = document.querySelector('#view');
        if (view)
            observer.observe(view, { childList: true, subtree: true });
        let active = true;
        const id = localStorage.getItem('ofc-last-gate-check');
        if (id)
            void fetch('/api/gate-checks?id=' + encodeURIComponent(id))
                .then(async (response) => {
                if (response.ok) {
                    const data = await readGateResponse(response);
                    if (active)
                        setRun(data);
                }
            })
                .catch(() => { });
        return () => {
            active = false;
            observer.disconnect();
        };
    }, []);
    useEffect(() => {
        if (run?.status !== 'running')
            return;
        const id = run.id;
        let active = true;
        let timer;
        const controller = new AbortController();
        async function poll() {
            try {
                const response = await fetch('/api/gate-checks?id=' + encodeURIComponent(id), {
                    signal: controller.signal,
                    cache: 'no-store',
                });
                const data = await readGateResponse(response);
                if (active) {
                    setRun(data);
                    setError('');
                    if (data.status === 'running')
                        timer = setTimeout(poll, 1000);
                }
            }
            catch (reason) {
                if (active) {
                    setError(reason instanceof Error
                        ? reason.message
                        : 'Connection interrupted. Retrying the status check.');
                    timer = setTimeout(poll, 2000);
                }
            }
        }
        timer = setTimeout(poll, 500);
        return () => {
            active = false;
            controller.abort();
            clearTimeout(timer);
        };
    }, [run?.id, run?.status]);
    async function start() {
        modal.current?.showModal();
        setStarting(true);
        setError('');
        try {
            const response = await fetch('/api/gate-checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            });
            const data = await readGateResponse(response);
            setRun(data);
            try {
                localStorage.setItem('ofc-last-gate-check', data.id);
            }
            catch { }
        }
        catch (reason) {
            setError(reason instanceof Error ? reason.message : 'Could not start the gate check.');
        }
        finally {
            setStarting(false);
        }
    }
    const running = starting || run?.status === 'running';
    return (<>
      {mount &&
            createPortal(<span className="gate-check-actions">
            <button type="button" className="btn ghost" disabled={running} onClick={() => void start()}>
              <span aria-hidden="true">▶</span> {running ? 'Checking gates…' : 'Run G1 to G5'}
            </button>
            {run && (<button type="button" className="see" onClick={() => modal.current?.showModal()}>
                View {run.status === 'running' ? 'progress' : 'last check'}
              </button>)}
          </span>, mount)}
      <dialog className="gate-check-dialog" ref={modal} aria-labelledby="gate-check-title">
        <header>
          <div>
            <span className="gate-check-eyebrow">PLAYWRIGHT · WORKFLOW CHECK</span>
            <h2 id="gate-check-title">G1 to G5</h2>
          </div>
          <button type="button" className="gate-check-close" aria-label="Close gate check" onClick={() => modal.current?.close()}>
            ×
          </button>
        </header>
        <p className="gate-check-intro">
          Creates a test opportunity and follows it through Investment, PMO and Asset Management in
          a separate browser session. Your working records are unchanged.
        </p>
        <div className="gate-check-summary" role="status" aria-live="polite">
          {starting
            ? 'Starting the test browser…'
            : run
                ? run.status === 'passed'
                    ? 'Demo workflow checks passed. Full client requirements are not verified.'
                    : run.status === 'needs-attention'
                        ? 'Workflow checks completed. Client process gaps need attention.'
                        : run.status === 'running'
                            ? `${run.stages.filter((s) => s.status === 'passed').length} of 5 gates passed. Check in progress…`
                            : run.status === 'interrupted'
                                ? 'The check was interrupted. Run it again.'
                                : 'The check found a failure. Review the gate below.'
                : error
                    ? 'The check could not start. Try again.'
                    : 'Ready to run.'}
        </div>
        {error && (<p className="gate-check-error" role="alert">
            {error}
          </p>)}
        <ol className="gate-check-stages">
          {run?.stages.map((stage) => (<li key={stage.id} data-gate-result={stage.id} data-status={stage.status}>
              <div className="gate-check-row">
                <span className="gate-check-number">{stage.id}</span>
                <strong>{stage.title}</strong>
                <span className={'gate-check-status ' + stage.status}>
                  {stage.status === 'passed'
                ? 'Workflow passed'
                : names[stage.status] || stage.status}
                </span>
              </div>
              {stage.clientReview && (<details open={stage.clientReview.status === 'gaps-found'} className="gate-client-review">
                  <summary>
                    Client requirements:{' '}
                    {stage.clientReview.status === 'gaps-found' ? 'gaps found' : 'not fully tested'}{' '}
                    · {stage.clientReview.reference}
                  </summary>
                  <ul>
                    {stage.clientReview.findings.map((finding) => (<li key={finding}>{finding}</li>))}
                  </ul>
                  <details>
                    <summary>Source requirements</summary>
                    <ul>
                      {stage.clientReview.requirements.map((requirement) => (<li key={requirement}>{requirement}</li>))}
                    </ul>
                  </details>
                  <p>{stage.clientReview.remaining}</p>
                </details>)}
              {(stage.checks.length > 0 || stage.error) && (<details open={stage.status === 'failed'}>
                  <summary>
                    {stage.checks.length} checks completed{stage.error ? ' · failure details' : ''}
                  </summary>
                  <ul>
                    {stage.checks.map((check) => (<li key={check}>{check}</li>))}
                  </ul>
                  {stage.error && <pre>{stage.error}</pre>}
                  {stage.screenshot && (<a href={`/api/gate-checks?id=${run.id}&gate=${stage.id}`} target="_blank" rel="noreferrer">
                      View screenshot ↗
                    </a>)}
                </details>)}
            </li>))}
        </ol>
        {run && (<p className="gate-check-note">
            {run.source && <>Source: {run.source.title}. </>}
            {run.notes[1]}{' '}
            {run.finishedAt && `Finished ${new Date(run.finishedAt).toLocaleTimeString()}.`}
          </p>)}
        <footer>
          <button type="button" className="btn" disabled={running} onClick={() => void start()}>
            <span aria-hidden="true">▶</span> {run ? 'Run again' : 'Run check'}
          </button>
          <span>
            {running
            ? 'You can close this panel while the check runs.'
            : 'Runs against the local app.'}
          </span>
        </footer>
      </dialog>
    </>);
}
