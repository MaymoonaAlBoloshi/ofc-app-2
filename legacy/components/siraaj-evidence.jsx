'use client';
import { useEffect, useRef, useState } from 'react';
export function SiraajEvidence({ evidence }) {
    const modal = useRef(null);
    const [opportunity, setOpportunity] = useState('');
    const [status, setStatus] = useState();
    const [error, setError] = useState('');
    const [saved, setSaved] = useState('');
    const [saving, setSaving] = useState(false);
    const taskId = useRef('');
    async function refresh() {
        try {
            const id = document.querySelector('[data-opportunity-id]')?.dataset.opportunityId || new URL(location.href).searchParams.get('opportunity') || '';
            setOpportunity(id);
            const response = await fetch('/api/knowledge' + (id ? '?opportunity=' + encodeURIComponent(id) : ''));
            if (!response.ok)
                throw Error();
            setStatus(await response.json());
        }
        catch {
            setError('Could not load the knowledge database. Try reopening this panel.');
        }
    }
    useEffect(() => {
        void refresh();
    }, []);
    return (<>
      <button className="siraaj-evidence-toggle" type="button" onClick={() => {
            setError('');
            void refresh();
            modal.current?.showModal();
        }}>
        Sources & follow-ups{evidence.length ? ` (${evidence.length})` : ''}
      </button>
      <dialog className="siraaj-evidence-dialog" ref={modal}>
        <button className="siraaj-evidence-close" aria-label="Close sources" onClick={() => modal.current?.close()}>
          ×
        </button>
        <h2>Client knowledge</h2>
        <a className="report-secondary" href={opportunity ? `/?opportunity=${encodeURIComponent(opportunity)}&tab=reports` : '/reports'}>Open reports</a>
        {status && <p>{status.documents} files cataloged. {status.coverage}</p>}
        <h3>Evidence retrieved for the last answer</h3>
        {!evidence.length && <p>Ask a question to see its source records here.</p>}
        <ul>
          {evidence.map((item) => (<li key={item.id}>
              <a href={`/api/knowledge/source?id=${encodeURIComponent(item.id)}`} target="_blank" rel="noreferrer">
                {item.entity}: {item.locator}
              </a>
              <small>{item.path}</small>
            </li>))}
        </ul>
        {opportunity ? <p><a href={`/?opportunity=${encodeURIComponent(opportunity)}&tab=tasks`}>Manage opportunity tasks</a></p> : <>
        <h3>Create follow-up</h3>
        <p>Review the details, then save a task linked to this answer's retrieved evidence.</p>
        <form onSubmit={async (event) => {
            event.preventDefault();
            if (saving)
                return;
            const form = event.currentTarget;
            const fields = new FormData(form);
            if (!taskId.current)
                taskId.current = crypto.randomUUID();
            setSaving(true);
            setError('');
            setSaved('');
            try {
                const response = await fetch('/api/knowledge/actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: taskId.current,
                        title: fields.get('title'),
                        owner: fields.get('owner'),
                        due: fields.get('due'),
                        evidence_ids: evidence.map((x) => x.id),
                        confirm: true,
                    }),
                });
                const data = await response.json();
                if (!response.ok)
                    throw Error(data.error || 'Could not save task.');
                taskId.current = '';
                form.reset();
                setSaved('Follow-up saved.');
                await refresh();
            }
            catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Could not save task.');
            }
            finally {
                setSaving(false);
            }
        }}>
          <label>
            Task title
            <input name="title" required maxLength={300} placeholder="Investigate the ONLDC revenue shortfall"/>
          </label>
          <div className="siraaj-task-fields">
            <label>
              Owner
              <input name="owner" required maxLength={100} placeholder="Assign an owner"/>
            </label>
            <label>
              Due date
              <input name="due" type="date" required/>
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Confirm and save follow-up'}
          </button>
        </form></>}
        <p role="alert">{error}</p>
        <p role="status">{saved}</p>
        <h3>{opportunity ? "Opportunity tasks" : "Saved demo follow-ups"}</h3>
        {!opportunity && <p>These tasks are stored in this app, separately from the original client tracker.</p>}
        <ul>
          {status?.actions?.map((action) => (<li key={action.id}>
              <strong>{action.title}</strong>
              <small>
                {action.owner} · Due {action.due}
              </small>
            </li>))}
        </ul>
        {status?.actions?.length === 0 && <p>No follow-ups saved yet.</p>}
      </dialog>
    </>);
}
