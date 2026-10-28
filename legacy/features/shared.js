export function createShared(scope, APP_ID, context) {
  /* Shared shell for the OFC application: formatting helpers, the app
     registry, demo roles, and cross-app navigation. Identical across every
     ofc-*.html page; each page defines only its own APP_ID/APP_NAME before
     this file's openApp() is ever called. */
  const $ = s => document.querySelector(s),
    $$ = s => [...document.querySelectorAll(s)];
  const TODAY = new Date('2026-09-23T00:00:00');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const escH = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
  function fmtDate(v) {
    if (!v) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? `${m[3]}-${MON[+m[2] - 1]}-${m[1]}` : v;
  }
  const toD = v => v ? new Date(v + 'T00:00:00') : null;
  const daysLate = v => {
    const d = toD(v);
    return d ? Math.round((TODAY - d) / 864e5) : 0;
  };
  const f1 = v => (v < 0 ? '(' : '') + Math.abs(v).toFixed(1) + (v < 0 ? ')' : '');
  const pct = (a, b) => b ? (a - b) / Math.abs(b) * 100 : 0;
  const sp = v => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  const gap = (a, b, up = 'above', down = 'below') => {
    const v = pct(a, b);
    return `<span class="${v >= 0 ? 'pos' : 'neg'}">${Math.abs(v).toFixed(1)}% ${v >= 0 ? up : down}</span>`;
  };
  const listN = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  const nk = v => Number(v).toLocaleString('en-US');
  function toast(m) {
    const t = $('#toast');
    t.textContent = m;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = scope.setTimeout(() => t.classList.remove('show'), 3000);
  }

  /* ---------------- Apps, roles ---------------- */
  const APPS = [{
    id: 'corporate',
    n: 'Corporate',
    c: '#214A3C',
    g: '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="#fff"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="#A9CD69"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="#fff"/>'
  }, {
    id: 'fa',
    n: 'Finance & Accounts',
    c: '#4B6B78',
    g: '<path d="M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1z" fill="#fff" opacity=".7"/><path d="M20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1z" fill="#fff"/>'
  }, {
    id: 'treasury',
    n: 'Treasury',
    c: '#6E7F3A',
    g: '<path d="M12 3l9 5H3z" fill="#fff"/><rect x="5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="10.75" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="16.5" y="10" width="2.5" height="7" fill="#fff" opacity=".7"/><rect x="3" y="18" width="18" height="2.5" rx=".5" fill="#fff"/>'
  }, {
    id: 'strategy',
    n: 'Strategy',
    c: '#3E6A3F',
    g: '<circle cx="12" cy="12" r="8.5" fill="#fff" opacity=".45"/><circle cx="12" cy="12" r="5.5" fill="#fff" opacity=".75"/><circle cx="12" cy="12" r="2.5" fill="#fff"/>'
  }, {
    id: 'investment',
    n: 'Investment & Deals',
    c: '#7FA84A',
    g: '<path d="M5 19L17 7" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M9 6h10v10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
  }, {
    id: 'pmo',
    n: 'PMO',
    c: '#8A6B4E',
    g: '<rect x="4" y="5" width="9" height="3.5" rx="1.5" fill="#fff"/><rect x="8" y="10.25" width="10" height="3.5" rx="1.5" fill="#fff" opacity=".75"/><rect x="12" y="15.5" width="8" height="3.5" rx="1.5" fill="#fff" opacity=".55"/>'
  }, {
    id: 'am',
    n: 'Asset Management',
    c: '#2D5A6B',
    g: '<path d="M12 3l9 4.5-9 4.5-9-4.5z" fill="#fff"/><path d="M3 12l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".75"/><path d="M3 16.5l9 4.5 9-4.5" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>'
  }, {
    id: 'admin',
    n: 'Admin / Settings',
    c: '#56645C',
    g: '<circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>'
  }];
  APPS.push({id:'siraaj',n:'Siraaj',c:'#214A3C',g:'<path d="M5 6h14v10H9l-4 4z" fill="none" stroke="white" stroke-width="2"/>'});
  const ROLES = [{
    id: 'ceo',
    n: 'Group CEO',
    i: 'CEO',
    d: 'All apps',
    apps: APPS.map(a => a.id)
  }, {
    id: 'cfo',
    n: 'Group CFO',
    i: 'CFO',
    d: 'Corporate and Finance apps',
    apps: ['corporate', 'fa', 'treasury']
  }, {
    id: 'cio',
    n: 'Group CIO',
    i: 'CIO',
    d: 'Corporate and Investment apps',
    apps: ['corporate', 'strategy', 'investment', 'pmo', 'am']
  }, {
    id: 'amd',
    n: 'Asset Management Director',
    i: 'AMD',
    d: 'Corporate and Asset Management',
    apps: ['corporate', 'am']
  }];
  ROLES.forEach(r => { if (!r.apps.includes('siraaj')) r.apps.push('siraaj'); });
  let role = ROLES[0];
  try {
    role = ROLES.find(r => r.id === localStorage.getItem('ofc-role')) || ROLES[0];
  } catch (e) {}
  const APP_URL = {
    admin: '/settings',
    siraaj: '/siraaj',
    am: '/asset-management',
    pmo: '/pmo',
    corporate: '/corporate',
    fa: '/finance',
    treasury: '/treasury',
    strategy: '/strategy',
    investment: '/'
  };
  function openApp(id) {
    const a = APPS.find(x => x.id === id);
    if (!a) return;
    context.closeFlyouts();
    if (!context.getRole().apps.includes(id)) {
      toast(`${context.getRole().n} doesn't have access to ${a.n}.`);
      return;
    }
    if (id === APP_ID) {
      context.go('home');
      return;
    }
    if (APP_URL[id]) {
      location.href = APP_URL[id];
      return;
    }
    toast(`Opening ${a.n}…`);
  }

  /* ---------------- Charts ----------------
     Shared bridge/waterfall chart and a tiny inline trend sparkline, so a
     dashboard can show what moved a number, not just the number. */
  function niceScale(v) {
    const raw = v * 1.04 / 4,
      p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map(m => m * p).find(s => s >= raw - 1e-9);
    return {
      max: step * 4,
      step
    };
  }
  function niceMax(v) {
    return niceScale(v).max;
  }
  function colsChart(labels, series, o = {}) {
    const W = o.w || 720,
      H = o.h || 250,
      pl = 40,
      pr = 10,
      pt = 22,
      pb = 28,
      iw = W - pl - pr,
      ih = H - pt - pb;
    const allV = series.flatMap(s => s.v);
    const max = niceMax(Math.max(0, ...allV)),
      minNeg = Math.min(0, ...allV),
      min = minNeg < 0 ? -niceMax(-minNeg) : 0,
      span = max - min || 1;
    const n = labels.length,
      bw = iw / n;
    const y = v => pt + ih - (v - min) / span * ih,
      zeroY = y(0);
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const v = min + (max - min) * i / 4,
        yy = y(v);
      g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl - 8}" y="${yy + 4}" class="ax" text-anchor="end">${+v.toFixed(2)}</text>`;
    }
    const bars = series.filter(s => s.kind === 'bar'),
      nb = bars.length,
      gw = bw * .58,
      bwi = gw / nb;
    let b = '',
      l = '';
    bars.forEach((s, si) => s.v.forEach((v, i) => {
      const x = pl + i * bw + (bw - gw) / 2 + si * bwi;
      const top = Math.min(y(v), zeroY),
        h = Math.abs(y(v) - zeroY);
      b += `<rect x="${x + 1}" y="${top}" width="${bwi - 2}" height="${h}" rx="2" fill="${s.fill}"><title>${labels[i]} · ${s.name}: ${v.toFixed(1)}</title></rect>`;
      if (o.labels && si === 0 && h > 24) b += `<text x="${x + bwi / 2}" y="${v >= 0 ? y(v) + 16 : top + h + 14}" class="vl" text-anchor="middle">${v.toFixed(1)}</text>`;
    }));
    series.filter(s => s.kind === 'line').forEach(s => {
      const pts = s.v.map((v, i) => `${pl + i * bw + bw / 2},${y(v)}`).join(' ');
      l += `<polyline points="${pts}" fill="none" stroke="${s.stroke}" stroke-width="2" ${s.dash ? 'stroke-dasharray="5 4"' : ''}/>` + s.v.map((v, i) => `<circle cx="${pl + i * bw + bw / 2}" cy="${y(v)}" r="3.2" fill="#fff" stroke="${s.stroke}" stroke-width="2"><title>${labels[i]} · ${s.name}: ${v.toFixed(1)}</title></circle>`).join('');
    });
    const xl = labels.map((t, i) => `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" class="xl" text-anchor="middle">${t}</text>`).join('');
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escH(o.aria || '')}"><defs><pattern id="hatchG" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#C6D4AB"/><rect width="2" height="5" fill="#A1C364"/></pattern><pattern id="hatchS" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#D9E3C8"/><rect width="2" height="5" fill="#B7C997"/></pattern></defs>${g}${b}${l}${xl}</svg>`;
  }
  function waterfall(steps, aria = 'Bridge chart') {
    const W = 1100,
      H = 320,
      pl = 44,
      pr = 10,
      pt = 26,
      pb = 48,
      iw = W - pl - pr,
      ih = H - pt - pb;
    let run = 0;
    const bars = [];
    steps.forEach(s => {
      if (s.total) {
        bars.push({
          l: s.l,
          a: 0,
          b: s.v,
          v: s.v,
          t: 1
        });
        run = s.v;
      } else {
        bars.push({
          l: s.l,
          a: run,
          b: run + s.v,
          v: s.v
        });
        run += s.v;
      }
    });
    const max = niceMax(Math.max(...bars.map(x => Math.max(x.a, x.b))));
    const n = bars.length,
      bw = iw / n,
      y = v => pt + ih - v / max * ih;
    let g = '';
    for (let i = 0; i <= 4; i++) {
      const v = max * i / 4,
        yy = y(v);
      g += `<line x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}" class="gl"/><text x="${pl - 8}" y="${yy + 4}" class="ax" text-anchor="end">${+v.toFixed(0)}</text>`;
    }
    let r = '';
    bars.forEach((x, i) => {
      const top = y(Math.max(x.a, x.b)),
        h = Math.abs(y(x.a) - y(x.b));
      const bx = pl + i * bw + bw * .18,
        w = bw * .64;
      const fill = x.t ? '#344B37' : x.v >= 0 ? 'url(#hatchG)' : '#F3BD7A';
      r += `<rect x="${bx}" y="${top}" width="${w}" height="${Math.max(h, 1.5)}" rx="2" fill="${fill}"><title>${x.l.replace('|', ' ')}: ${x.v.toFixed(1)}</title></rect><text x="${bx + w / 2}" y="${top - 6}" class="vl" text-anchor="middle">${x.t ? x.v.toFixed(1) : (x.v > 0 ? '+' : '') + x.v.toFixed(1)}</text>`;
      if (i < n - 1) {
        const ny = y(x.t ? x.b : x.b);
        r += `<line x1="${bx + w}" x2="${pl + (i + 1) * bw + bw * .18}" y1="${ny}" y2="${ny}" stroke="var(--ink-3)" stroke-dasharray="2 2"/>`;
      }
      const [l1, l2] = x.l.split('|');
      r += `<text x="${bx + w / 2}" y="${H - 26}" class="xl" text-anchor="middle">${l1}</text>${l2 ? `<text x="${bx + w / 2}" y="${H - 12}" class="xl" text-anchor="middle">${l2}</text>` : ''}`;
    });
    return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escH(aria)}"><defs><pattern id="hatchG" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#C6D4AB"/><rect width="2" height="5" fill="#A1C364"/></pattern></defs>${g}${r}</svg>`;
  }
  function spark(values, opts = {}) {
    const w = opts.w || 64,
      h = opts.h || 22,
      vals = (values || []).filter(v => Number.isFinite(v));
    if (vals.length < 2) return '';
    const min = Math.min(...vals),
      max = Math.max(...vals),
      span = max - min || Math.abs(max) * .1 || 1;
    const pts = vals.map((v, i) => `${(i / (vals.length - 1) * w).toFixed(1)},${(h - 1 - (v - min) / span * (h - 2)).toFixed(1)}`).join(' ');
    const up = vals.at(-1) >= vals[0];
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${up ? '#5E7A52' : '#B4653F'}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }

  /* ---------------- Tracker entry workflow ----------------
     A small Draft -> Submitted -> Approved (or Rejected -> Submitted)
     overlay any app can attach to its own tracker rows, without changing
     how that app stores the rows themselves. Not role-gated: any role with
     access to the tracker can move an entry through the stages.
     Overlay keys are namespaced per app (APP_ID:id) so every app can share
     one localStorage key. A row with no overlay entry defaults to
     'Approved' for seed/baseline data or 'Draft' for a freshly-added one -
     the caller says which via isLocal. */
  function wfKey(id) {
    return `${APP_ID}:${id}`;
  }
  function wfOverlay() {
    try {
      return JSON.parse(localStorage.getItem('ofc-workflow') || '{}');
    } catch (e) {
      return {};
    }
  }
  function wfState(id, isLocal) {
    const o = wfOverlay()[wfKey(id)];
    return o ? o.state : isLocal ? 'Draft' : 'Approved';
  }
  function wfNote(id) {
    return wfOverlay()[wfKey(id)]?.note || '';
  }
  function setWorkflow(id, state, note) {
    const overlay = wfOverlay();
    overlay[wfKey(id)] = {
      state,
      note: note || '',
      at: Date.now()
    };
    try {
      localStorage.setItem('ofc-workflow', JSON.stringify(overlay));
    } catch (e) {
      toast('Could not save the workflow change. Browser storage may be full.');
      return false;
    }
    return true;
  }
  function wfActions(id, state) {
    const btn = (action, label) => `<button class="btn ghost sm noprint" data-wf-action="${action}" data-wf-id="${escH(id)}">${label}</button>`;
    if (state === 'Draft') return btn('submit', 'Submit for review');
    if (state === 'Submitted') return btn('approve', 'Approve') + ' ' + btn('reject', 'Send back');
    if (state === 'Rejected') return `<small style="display:block;color:var(--ink-2);margin-bottom:4px">${escH(wfNote(id))}</small>` + btn('resubmit', 'Resubmit');
    return '';
  }

  /* ---------------- Record patch overlay ----------------
     Lets an action button mutate specific fields on an existing hardcoded
     row (a deal's stage, a project's status) in place, without turning the
     row into a new tracker entry. Generalises the per-row EDITS overlay
     Asset Management already uses for inline edits. One localStorage key
     per store, keyed by whatever id the caller uses for that row. */
  function recordOverlay(store) {
    try {
      const v = JSON.parse(localStorage.getItem(store) || '{}');
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) {
      return {};
    }
  }
  const fieldOverlay = recordOverlay;
  // Keep a handover's register, state and audit changes together; roll back on failure.
  function handoverWrite(changes) {
    const before = {};
    try {
      for (const key of Object.keys(changes)) before[key] = localStorage.getItem(key);
      for (const [key, value] of Object.entries(changes)) localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      for (const [key, value] of Object.entries(before)) {
        try {
          if (value === null) localStorage.removeItem(key);else localStorage.setItem(key, value);
        } catch {}
      }
      toast('Could not save the handover. Browser storage may be full.');
      return false;
    }
  }
  function recordPatch(store, id) {
    return recordOverlay(store)[id] || null;
  }
  function patchRecord(store, id, patch) {
    const overlay = recordOverlay(store);
    overlay[id] = {
      ...overlay[id],
      ...patch,
      at: Date.now()
    };
    try {
      localStorage.setItem(store, JSON.stringify(overlay));
    } catch (e) {
      toast('Could not save that change. Browser storage may be full.');
      return false;
    }
    return true;
  }

  /* ---------------- Live cross-app register ----------------
     A shared localStorage array an upstream app pushes new records onto and
     a downstream app reads and unions onto its own static list - the same
     pattern used to add ONLDC outside Asset Management's static SUBS array,
     generalised so any app can hand a brand-new record to the next one
     (Investment -> PMO -> Asset Management). */
  function liveRegister(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }
  function pushLive(key, obj) {
    const list = liveRegister(key);
    list.push({
      ...obj,
      at: Date.now()
    });
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      toast('Could not save that handover. Browser storage may be full.');
      return false;
    }
    return true;
  }
  return {
    $,
    $$,
    TODAY,
    MON,
    escH,
    fmtDate,
    toD,
    daysLate,
    f1,
    pct,
    sp,
    gap,
    listN,
    nk,
    toast,
    APPS,
    ROLES,
    role,
    APP_URL,
    openApp,
    niceScale,
    niceMax,
    colsChart,
    waterfall,
    spark,
    wfKey,
    wfOverlay,
    wfState,
    wfNote,
    setWorkflow,
    wfActions,
    recordOverlay,
    fieldOverlay,
    handoverWrite,
    recordPatch,
    patchRecord,
    liveRegister,
    pushLive
  };
}