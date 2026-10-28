'use client';
import { useState } from 'react';
export function SiraajHistory({ conversations, selected, onSelect, onDelete, onClose, }) {
    const [query, setQuery] = useState('');
    const filtered = conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.messages.some((message) => message.text.toLowerCase().includes(query.toLowerCase())));
    return (<aside id="siraaj-history" className="siraaj-history" aria-label="Chat history">
      <div className="siraaj-history-heading">
        <div>
          <span className="siraaj-eyebrow">YOUR WORKSPACE</span>
          <h3>Conversations</h3>
        </div>
        <button type="button" className="siraaj-glass-icon" aria-label="Close history" onClick={onClose}>
          ×
        </button>
      </div>
      <label className="siraaj-history-search">
        <span className="sr-only">Search conversations</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5"/>
          <path d="m16 16 4 4"/>
        </svg>
        <input type="search" autoFocus placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)}/>
      </label>
      <div className="siraaj-history-list">
        {!filtered.length && (<p className="siraaj-history-empty">
            {query
                ? 'No matching conversations.'
                : 'Your conversations will appear here after your first message.'}
          </p>)}
        {filtered.map((item) => (<div className={`siraaj-history-row ${item.id === selected ? 'is-selected' : ''}`} key={item.id}>
            <button className="siraaj-history-select" type="button" aria-current={item.id === selected ? 'true' : undefined} onClick={() => onSelect(item)}>
              <strong>{item.title}</strong>
              <span>
                {new Date(item.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
            })}{' '}
                · {item.messages.filter((message) => message.role === 'user').length}{' '}
                {item.messages.filter((message) => message.role === 'user').length === 1
                ? 'message'
                : 'messages'}
              </span>
            </button>
            <button type="button" className="siraaj-history-delete" aria-label={`Delete conversation: ${item.title}`} onClick={() => onDelete(item)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/>
              </svg>
            </button>
          </div>))}
      </div>
      <p className="siraaj-history-note">
        <span aria-hidden="true">◉</span> Saved in this browser.
        <br />
        Available across OFC departments on this device.
      </p>
    </aside>);
}
