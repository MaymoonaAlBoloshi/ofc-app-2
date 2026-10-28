"use client";
import "./globals.css";
import "./original-language.css";
import "./chat-base.css";
import { QuickChat } from "../legacy/components/quick-chat";
import { SiraajProvider } from "../legacy/components/siraaj";
import { AppletLauncher } from "../components/applet-launcher";
import { useEffect, useRef, useState } from "react";
import {
  stages,
  stageById,
  roles,
  areas,
  approvalRoles,
  reportReviewRoles,
} from "../lib/requirements.mjs";
import {
  readiness,
  latestReport,
  revision,
  reviewReady,
} from "../lib/engine.mjs";

const formatDate = (x) =>
  x
    ? new Date(x.length === 10 ? x + "T12:00:00" : x).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short", year: "numeric" },
      )
    : "Not set";
function Badge({ children, tone = "" }) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">◎</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function RoleSelect({ value, onChange, label = "Profile role" }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {roles.map((r) => (
        <option key={r}>{r}</option>
      ))}
    </select>
  );
}
function Modal({ title, onClose, children, busy }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else onClose();
      }}
    >
      <div className="modal-top">
        <h2>{title}</h2>
        <button
          className="icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
const assistantTasks = {
  report: [
    "Drafting your investment report",
    "Siraaj is preparing the report from saved assessments and source evidence.",
    "The draft will open for your review when it is ready.",
  ],
  research: [
    "Reading the official source",
    "Siraaj is retrieving the source and extracting evidence for this opportunity.",
    "New evidence will appear in the source library for review.",
  ],
  prepare: [
    "Preparing gate assessments",
    "Siraaj is matching uploaded evidence to the gate requirements and preparing draft notes.",
    "Review the suggested notes and linked sources before submitting.",
  ],
  suggest: [
    "Finding evidence for this assessment",
    "Siraaj is matching source passages to this requirement and drafting notes.",
    "Suggested notes will appear in this assessment for you to review.",
  ],
  intake: [
    "Finding opportunity details",
    "Siraaj is reading the uploaded evidence for names, dates and other opportunity details.",
    "You can review the suggested details before applying them.",
  ],
};
function WorkingState({ label, task, elapsed, progress }) {
  const copy = assistantTasks[task];
  return (
    <section
      className={"working-state" + (copy ? " working-siraaj" : "")}
      aria-label={copy ? "Siraaj activity" : "Current activity"}
    >
      <div className="working-heading">
        <span className="working-symbol" aria-hidden="true">
          {copy ? (
            <img src="/brand/siraaj.svg" alt="" />
          ) : (
            <span className="spinner" />
          )}
        </span>
        <div className="working-copy">
          <div className="working-kicker">
            {copy ? "SIRAAJ IS WORKING" : "IN PROGRESS"}
            <span aria-hidden="true">{elapsed}s elapsed</span>
          </div>
          <strong role="status">{copy ? copy[0] : label}</strong>
          <p>
            {copy
              ? copy[1]
              : "Keep this page open while the request completes."}
          </p>
        </div>
        <span className="working-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      {progress ? (
        <>
          <progress
            value={progress.done}
            max={progress.total}
            aria-label="Files processed"
          />
          <small>
            {progress.done} of {progress.total} selected files processed.
            Archives are extracted as one upload.
          </small>
        </>
      ) : (
        <div className="working-track" aria-hidden="true">
          <span />
        </div>
      )}
      <p className="working-next" role={elapsed >= 30 ? "status" : undefined}>
        {elapsed >= 30
          ? "This is taking longer. We are still waiting for Siraaj to respond. You do not need to submit again."
          : copy
            ? copy[2]
            : "Your saved work is retained."}
      </p>
    </section>
  );
}
function WorkspaceSkeleton() {
  return (
    <div
      className="workspace-skeleton"
      role="status"
      aria-label="Loading investment workspace"
    >
      <span className="sr-only">Loading your investment workspace…</span>
      <div className="skeleton-title skeleton" />
      <div className="skeleton-summary">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
      <div className="skeleton-table">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
    </div>
  );
}
async function request(url, options = {}) {
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    throw Error("The server returned an unreadable response. Please retry.");
  }
  if (!res.ok) throw Error(data.error || "Request failed.");
  return data;
}
const json = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
export default function App() {
  const [state, setState] = useState(null),
    [selected, setSelected] = useState(""),
    [role, setRole] = useState("Investment"),
    [demoApprovals, setDemoApprovals] = useState(true),
    [tab, setTab] = useState("work"),
    [stageView, setStageView] = useState(""),
    [busy, setBusy] = useState(""),
    [elapsed, setElapsed] = useState(0),
    [task, setTask] = useState(""),
    [progress, setProgress] = useState(null),
    [reportActivity, setReportActivity] = useState(null),
    [reportClock, setReportClock] = useState(Date.now()),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [query, setQuery] = useState(""),
    [area, setArea] = useState("All");
  const running = useRef(false);
  const startingReport = useRef(false);
  const uploadRef = useRef(),
    o = state?.opportunities.find((o) => o.id === selected),
    stage = o ? stageById(stageView || o.stage) : null,
    ready = o ? readiness(o) : null;
  useEffect(() => {
    request("/api/workspace")
      .then((s) => {
        setState(s);
        const q = new URL(location.href).searchParams;
        setSelected(q.get("opportunity") || "");
        if (["work", "evidence", "reports", "tasks", "registers", "decisions"].includes(q.get("tab"))) setTab(q.get("tab"));
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setArea("All");
  }, [stageView, o?.stage]);
  useEffect(() => {
    if (!busy) {
      setElapsed(0);
      return;
    }
    const start = Date.now(),
      t = setInterval(
        () => setElapsed(Math.floor((Date.now() - start) / 1000)),
        1000,
      );
    return () => clearInterval(t);
  }, [!!busy]);
  const reportJob =
    reportActivity?.opportunityId === o?.id ? reportActivity : null;
  const reportPending =
    reportJob?.starting || reportJob?.job?.status === "running";
  useEffect(() => {
    if (!selected || tab !== "reports") return;
    let cancelled = false,
      timer;
    async function poll() {
      try {
        const { job } = await request(
          "/api/report-job?id=" + encodeURIComponent(selected),
        );
        if (cancelled) return;
        setReportActivity((previous) =>
          previous?.opportunityId === selected &&
          (previous.starting ||
            (previous.job?.startedAt || 0) > (job?.startedAt || 0))
            ? previous
            : { opportunityId: selected, job },
        );
        setReportClock(Date.now());
        if (job?.status === "completed") {
          const fresh = await request("/api/workspace");
          if (!cancelled)
            setState((previous) =>
              !previous || fresh.version > previous.version ? fresh : previous,
            );
        }
      } catch (e) {
        if (!cancelled)
          setReportActivity((previous) => ({
            ...previous,
            opportunityId: selected,
            error:
              "Could not check report status. Reconnecting automatically. " +
              e.message,
          }));
      } finally {
        if (!cancelled) timer = setTimeout(poll, 2500);
      }
    }
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selected, tab]);
  async function startReport(
    reportStage = o.stage,
    scope = "single",
    demo = false,
  ) {
    if (startingReport.current || reportPending) return;
    startingReport.current = true;
    const id = o.id;
    setReportActivity({ opportunityId: id, starting: true });
    try {
      const { job } = await request(
        "/api/report-job",
        json({ id, role, version: state.version, reportStage, scope, demo }),
      );
      setReportActivity({ opportunityId: id, job });
      setReportClock(Date.now());
    } catch (e) {
      setReportActivity({ opportunityId: id, error: e.message });
    } finally {
      startingReport.current = false;
    }
  }
  function select(id) {
    setSelected(id);
    setStageView("");
    setTab("work");
    setArea("All");
    const url = new URL(location.href);
    id
      ? url.searchParams.set("opportunity", id)
      : url.searchParams.delete("opportunity");
    history.replaceState(null, "", url);
  }
  async function run(label, fn, taskName = "") {
    if (running.current) return;
    running.current = true;
    const trigger = document.activeElement?.closest("button");
    trigger?.setAttribute("aria-busy", "true");
    setElapsed(0);
    setTask(taskName);
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      running.current = false;
      trigger?.removeAttribute("aria-busy");
      setTask("");
      setProgress(null);
      setBusy("");
    }
  }
  async function command(action, values = {}, close = true) {
    return run(
      action === "create" && values.demoPack
        ? "Loading 42 demo files and preparing your SG1 assessments and report…"
        : "Saving " + action.replaceAll("-", " ") + "…",
      async () => {
        const next = await request(
          "/api/workspace",
          json({
            action,
            id: o?.id,
            role,
            version: state.version,
            ...(action === "task"
              ? {
                  expectedTask:
                    modal?.type === "task"
                      ? modal.t
                      : o.tasks.find((t) => t.id === values.taskId),
                  expectedStage: o.stage,
                  expectedStatus: o.status,
                }
              : {}),
            ...values,
          }),
        );
        setState((previous) =>
          !previous || next.version >= previous.version ? next : previous,
        );
        if (action === "create") select(next.opportunities[0].id);
        if (action === "decision" || action === "new-period") setStageView("");
        if (close) setModal(null);
        if (action === "prepare-reports" && values.demo) {
          const report = next.opportunities
            .find((item) => item.id === o.id)
            .reports.at(-1);
          setTab("reports");
          setModal({
            type: "report",
            r: report,
            sections: structuredClone(report.sections),
            note: "",
          });
        }
        setNotice(
          action === "prepare-reports"
            ? "Reports prepared. Open the new drafts below to review their content."
            : action === "create" && values.demoPack
              ? "Your demo is ready: 42 files loaded, SG1 assessments prefilled and a starter report prepared."
              : action === "demo-assume-reviewed"
                ? "Demo reviews applied. A new report version is ready in Reports for review and submission."
                : "Saved. The workspace is up to date.",
        );
      },
    );
  }
  async function assist(action, values = {}, consume) {
    if (action === "report") return startReport();
    return run(
      action === "report"
        ? "Siraaj is drafting and checking source references…"
        : action === "research"
          ? "Retrieving the official source and extracting evidence…"
          : "Finding relevant evidence…",
      async () => {
        const data = await request(
          "/api/assist",
          json({ action, id: o.id, role, version: state.version, ...values }),
        );
        if (data.state) setState(data.state);
        if (consume) consume(data);
        setNotice(
          "Siraaj has finished. Review the suggested material before using it.",
        );
      },
      action,
    );
  }
  async function downloadReport(report) {
    return run("Rendering saved report as PDF…", async () => {
      const response = await fetch(
        "/api/report?format=pdf&id=" + encodeURIComponent(report.id),
      );
      if (!response.ok) {
        const data = await response.json();
        throw Error(
          data.error || "PDF export failed. Open the report to print it.",
        );
      }
      const url = URL.createObjectURL(await response.blob()),
        link = document.createElement("a");
      link.href = url;
      link.download = `${o.reference} - ${report.title}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNotice("Saved report downloaded as PDF.");
    });
  }
  async function upload(files) {
    if (!files.length) return;
    await run("Uploading and extracting documents…", async () => {
      let current = state;
      let count = 0,
        skipped = [];
      for (let i = 0; i < files.length; i++) {
        setProgress({ done: i, total: files.length });
        setBusy(`Reading ${i + 1} of ${files.length}: ${files[i].name}`);
        const q = new URLSearchParams({
          name: files[i].name,
          id: o.id,
          role,
          version: String(current.version),
        });
        const data = await request("/api/upload?" + q, {
          method: "POST",
          body: files[i],
        });
        current = data.state;
        setProgress({ done: i + 1, total: files.length });
        setState(current);
        count += data.count;
        skipped.push(...data.skipped);
      }
      setNotice(
        `${count} files processed. Review their classification and evidence gaps.${skipped.length ? " Skipped: " + skipped.join("; ") : ""}`,
      );
      setTab("evidence");
    });
    if (uploadRef.current) uploadRef.current.value = "";
  }
  const actionButton = (text, fn, cls = "primary") => (
    <button className={cls} disabled={!!busy} onClick={fn}>
      {text}
    </button>
  );
  const openRequirement = (r) =>
    setModal({
      type: "requirement",
      r,
      narrative: r.saved?.narrative || "",
      sourceIds: r.saved?.sourceIds || [],
      status: r.saved?.status || "Draft",
      readOnly: stage.id !== o.stage || o.status !== "Active",
    });
  const patch = (values) => setModal((m) => ({ ...m, ...values }));
  const current = stage?.id === o?.stage;
  const reportEditable =
    modal?.type === "report" &&
    o?.status === "Active" &&
    latestReport(o)?.id === modal.r.id;
  return (
    <SiraajProvider>
      <div className="app">
        <header className="suite">
          <AppletLauncher opportunityId={selected} />
          <a
            className="logo"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              select("");
            }}
            aria-label="Oman Food Capital"
          >
            <span className="ar" lang="ar">
              العمانية لاستثمارات الغذاء
            </span>
            <span className="en">Oman Food Capital</span>
          </a>
          <div className="suite-search">
            <label>
              <Icon name="search" />
              <input
                type="search"
                aria-label="Search this site"
                placeholder="Search this site"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (o) select("");
                }}
              />
            </label>
          </div>
          <details className="profile-switch">
            <summary aria-label="Profile" title="Profile">
              <span className="avatar">{role.slice(0, 2).toUpperCase()}</span>
            </summary>
            <div className="suite-flyout profile-flyout">
              <h3>{role}</h3>
              <p>Workspace profile</p>
              <RoleSelect
                value={role}
                onChange={(value) => {
                  setRole(value);
                  document.querySelector(".profile-switch").open = false;
                }}
              />
              <small>
                Preview profiles for reviewing the approval workflow.
              </small>
            </div>
          </details>
        </header>
        <nav className="rail" aria-label="Investment tools">
          {[
            ["home", "Home"],
            ["input", "Input"],
            ["reports", "Reports"],
            ["dashboards", "Dashboards"],
            ["siraaj", "Siraaj"],
          ].map(([id, label]) => (
            <button
              key={id}
              className="rbtn"
              aria-current={
                id === "home"
                  ? !o
                  : id === "input"
                    ? !!o && ["work", "evidence", "tasks"].includes(tab)
                    : id === "reports"
                      ? !!o && tab === "reports"
                      : id === "dashboards"
                        ? !!o && tab === "registers"
                        : false
              }
              onClick={() => {
                if (id === "siraaj") {
                  window.location.href =
                    "/siraaj" +
                    (selected
                      ? "?opportunity=" + encodeURIComponent(selected)
                      : "");
                  return;
                }
                if (id === "home") {
                  select("");
                  return;
                }
                if (!o) {
                  const first = state?.opportunities[0];
                  if (!first) {
                    setNotice(
                      "Select or create an opportunity to open " +
                        label.toLowerCase() +
                        ".",
                    );
                    return;
                  }
                  select(first.id);
                } else
                  setTab(
                    {
                      input: "evidence",
                      reports: "reports",
                      dashboards: "registers",
                    }[id],
                  );
              }}
            >
              {id === "siraaj" ? (
                <img src="/brand/siraaj.svg" alt="" />
              ) : (
                <Icon name={id} />
              )}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="main-shell">
          <header className="site">
            <div className="site-inner">
              <div className="crumb">
                <button onClick={() => select("")}>Oman Food Capital</button>
                <span>/</span>
                <button onClick={() => select("")}>Investment</button>
                {o && (
                  <>
                    <span>/</span>
                    <span>{o.reference}</span>
                  </>
                )}
              </div>
              <div className="site-top">
                <span className="site-logo" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M5 19L17 7M9 6h10v10"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="site-title">
                  <h1>Investment &amp; Deal Sourcing</h1>
                  <p>Investment Department · Stage Gates 1 to 3 · Group CIO</p>
                </div>
                <span className="site-chip">
                  {o ? o.reference : "Investment workspace"}
                </span>
              </div>
            </div>
          </header>
          <main
            id="view"
            data-opportunity-id={selected}
            data-page-title={o ? `${o.name}: ${tab}` : "Investment pipeline"}
          >
            {busy && !modal && (
              <div className="activity-dock">
                <WorkingState
                  label={busy}
                  task={task}
                  elapsed={elapsed}
                  progress={progress}
                />
              </div>
            )}
            {error && (
              <div className="alert error" role="alert">
                <span>{error}</span>
                <button
                  onClick={() =>
                    run("Refreshing workspace…", async () => {
                      setState(await request("/api/workspace"));
                      setError("");
                    })
                  }
                  disabled={!!busy}
                >
                  Refresh workspace
                </button>
              </div>
            )}
            {notice && (
              <div className="alert success" role="status">
                {notice}
                <button
                  aria-label="Dismiss notice"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}
            {!state ? (
              error ? (
                <Empty title="Workspace could not load">
                  Use Refresh workspace above to try again.
                </Empty>
              ) : (
                <WorkspaceSkeleton />
              )
            ) : !o ? (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">INVESTMENT MANAGEMENT</div>
                    <h1>Investment pipeline</h1>
                    <p>
                      Track investment opportunities, review evidence and manage
                      stage decisions.
                    </p>
                  </div>
                  {actionButton("+ New opportunity", () =>
                    setModal({ type: "create" }),
                  )}
                </div>
                <div className="stats">
                  <Stat
                    label="Opportunities"
                    value={state.opportunities.length}
                  />
                  <Stat
                    label="In preparation"
                    value={
                      state.opportunities.filter((o) => o.status === "Active")
                        .length
                    }
                  />
                  <Stat
                    label="Operating assets"
                    value={
                      state.opportunities.filter(
                        (o) => o.stage === "monitoring",
                      ).length
                    }
                  />
                  <Stat
                    label="Open conditions"
                    value={state.opportunities.reduce(
                      (n, o) =>
                        n +
                        o.conditions.filter((c) => c.status === "Open").length,
                      0,
                    )}
                  />
                </div>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Your investment pipeline</h2>
                      <p>
                        Three investment gates, then ownership, delivery and
                        stewardship.
                      </p>
                    </div>
                    <input
                      className="search"
                      aria-label="Search opportunities"
                      placeholder="Search opportunities…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {state.opportunities.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Opportunity</th>
                            <th>Type / sector</th>
                            <th>Current stage</th>
                            <th>Readiness</th>
                            <th>Target</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.opportunities
                            .filter((o) =>
                              (o.name + " " + o.reference)
                                .toLowerCase()
                                .includes(query.toLowerCase()),
                            )
                            .map((o) => {
                              const r = readiness(o);
                              return (
                                <tr key={o.id}>
                                  <td>
                                    <button
                                      className="text-button"
                                      onClick={() => select(o.id)}
                                    >
                                      {o.name}
                                    </button>
                                    <small>
                                      {o.reference} · {o.owner}
                                    </small>
                                  </td>
                                  <td>
                                    {o.type}
                                    <small>{o.sector}</small>
                                  </td>
                                  <td>{stageById(o.stage).title}</td>
                                  <td>
                                    <div className="mini-progress">
                                      <span
                                        style={{
                                          width:
                                            (r.complete / r.total) * 100 + "%",
                                        }}
                                      />
                                    </div>
                                    <small>
                                      {r.complete} / {r.total} reviews
                                    </small>
                                  </td>
                                  <td>{formatDate(o.targetDate)}</td>
                                  <td>
                                    <Badge
                                      tone={
                                        o.status === "Active" ? "green" : ""
                                      }
                                    >
                                      {o.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty title="Start with an opportunity">
                      Create a case, upload its documents and let the workspace
                      prepare the review tasks.
                    </Empty>
                  )}
                </section>
                <div className="demo-card">
                  <div>
                    <Badge tone="gold">GUIDED START</Badge>
                    <h2>Explore the ORCI document pack</h2>
                    <p>
                      42 public-source demo files across market, finance, KYC,
                      regulatory and ESG. Import the evidence and see what still
                      needs review.
                    </p>
                  </div>
                  {actionButton(
                    "Start ORCI example ↗",
                    () =>
                      run(
                        "Importing 42 ORCI documents and preparing the review plan…",
                        async () => {
                          const s = await request("/api/demo", {
                            method: "POST",
                          });
                          setState(s);
                          select(s.opportunities[0].id);
                          setTab("evidence");
                          setNotice(
                            "Example loaded. No evidence reviews or approvals have been assumed.",
                          );
                        },
                      ),
                    "secondary",
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="page-heading compact">
                  <div>
                    <button className="back-link" onClick={() => select("")}>
                      ← All opportunities
                    </button>
                    <div className="eyebrow">
                      {o.reference} · {o.type.toUpperCase()}
                    </div>
                    <h1>{o.name}</h1>
                    <p>
                      {o.sector} <span className="dot">·</span>{" "}
                      {o.assetOwner || o.owner} <span className="dot">·</span>{" "}
                      Target {formatDate(o.targetDate)}
                    </p>
                  </div>
                  <div className="heading-actions">
                    <Badge tone={o.status === "Active" ? "green" : "gold"}>
                      {o.status}
                    </Badge>
                    {actionButton(
                      "Edit opportunity facts",
                      () => setModal({ type: "facts", facts: { ...o.facts } }),
                      "secondary",
                    )}
                  </div>
                </div>
                <nav className="journey" aria-label="Lifecycle stages">
                  {stages.map((s, i) => (
                    <button
                      key={s.id}
                      className={
                        (stage.id === s.id ? "selected " : "") +
                        (s.id === o.stage ? "current" : "")
                      }
                      onClick={() => {
                        setStageView(s.id);
                        setTab("work");
                      }}
                    >
                      <small>{s.label}</small>
                      <span>{s.title}</span>
                      {o.decisions.some(
                        (d) =>
                          d.stage === s.id && d.outcome.startsWith("Approve"),
                      ) && <b>✓</b>}
                    </button>
                  ))}
                </nav>
                <nav className="tabs" aria-label="Opportunity views">
                  {[
                    ["work", "Gate workspace"],
                    ["evidence", `Evidence (${o.documents.length})`],
                    ["reports", `Reports (${o.reports.length})`],
                    ["tasks", "Tasks & conditions"],
                    ["registers", "Meetings & performance"],
                    ["decisions", "Decisions & history"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      className={tab === id ? "selected" : ""}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
                {tab === "work" && (
                  <>
                    <div className="stage-intro">
                      <div>
                        <div className="eyebrow">
                          {stage.label} · {stage.owner.toUpperCase()}
                        </div>
                        <h2>{stage.question}</h2>
                        <p>{stage.reference}</p>
                      </div>
                      <div className="readiness-score">
                        <strong>
                          {
                            reviewReady(o, stage.id).filter((r) => r.done)
                              .length
                          }
                          <span> / {stage.requirements.length}</span>
                        </strong>
                        <small>requirements reviewed</small>
                      </div>
                    </div>
                    {!current && (
                      <div className="alert">
                        {o.decisions.some(
                          (d) =>
                            d.stage === stage.id &&
                            d.outcome.startsWith("Approve"),
                        )
                          ? "This stage has an archived approval. Its report and source snapshot are retained."
                          : "This stage opens after the previous decision. You can review its requirements now."}
                        <button onClick={() => setStageView("")}>
                          Go to current stage
                        </button>
                      </div>
                    )}
                    <div className="work-grid">
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Prepare the case</h2>
                            <p>
                              Each review has a responsible team and linked
                              evidence.
                            </p>
                          </div>
                          {current ? (
                            <button
                              className="secondary small"
                              disabled={
                                !!busy ||
                                !o.documents.length ||
                                o.status !== "Active"
                              }
                              onClick={() => assist("prepare")}
                            >
                              ✧ Prefill from evidence
                            </button>
                          ) : (
                            <Badge>
                              {stage.requirements.length} requirements
                            </Badge>
                          )}
                        </div>
                        <div className="filters">
                          {[
                            "All",
                            ...areas.filter((a) =>
                              stage.requirements.some((r) => r.area === a),
                            ),
                          ].map((a) => (
                            <button
                              key={a}
                              onClick={() => setArea(a)}
                              className={area === a ? "selected" : ""}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                        <div className="requirements">
                          {reviewReady(o, stage.id)
                            .filter((r) => area === "All" || r.area === area)
                            .map((r, i) => (
                              <div className="requirement" key={r.id}>
                                <span
                                  className={"check " + (r.done ? "done" : "")}
                                >
                                  {r.done
                                    ? "✓"
                                    : String(i + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <h3>{r.title}</h3>
                                  <p>{r.detail}</p>
                                  <div className="meta">
                                    <span>{r.owner}</span>
                                    <span>
                                      {r.saved?.demoAssumed
                                        ? "Assumed reviewed for demo"
                                        : r.saved?.status || "Not started"}
                                    </span>
                                    {r.optional && (
                                      <span>Applicability review</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  className="secondary small"
                                  disabled={!!busy}
                                  onClick={() => openRequirement(r)}
                                >
                                  {!current || o.status !== "Active"
                                    ? "View"
                                    : r.saved
                                      ? "Review"
                                      : "Prepare"}
                                </button>
                              </div>
                            ))}
                        </div>
                        {current && o.status === "Active" && (
                          <div className="demo-review-footer">
                            <div>
                              <strong>Quick demo</strong>
                              <p>
                                Assume all current gate requirements are
                                reviewed and prepare a demo report version.
                                Evidence gaps remain visible.
                              </p>
                            </div>
                            <button
                              className="secondary"
                              disabled={
                                !!busy || reviewReady(o).every((r) => r.done)
                              }
                              onClick={() =>
                                command("demo-assume-reviewed", {}, false)
                              }
                            >
                              Assume reviewed for demo
                            </button>
                          </div>
                        )}
                      </section>
                      <aside className="work-aside">
                        <section className="panel next-card">
                          <div className="eyebrow">NEXT DECISION</div>
                          <h2>
                            {current
                              ? o.status === "Monitoring"
                                ? "Quarter submitted"
                                : ready.blockers.length
                                  ? "Preparation needed"
                                  : "Ready for decision"
                              : "Stage overview"}
                          </h2>
                          <p>{stage.report}</p>
                          <div className="mini-progress">
                            <span
                              style={{
                                width:
                                  (reviewReady(o, stage.id).filter(
                                    (r) => r.done,
                                  ).length /
                                    stage.requirements.length) *
                                    100 +
                                  "%",
                              }}
                            />
                          </div>
                          {current && (
                            <>
                              {o.status === "Monitoring" && (
                                <>
                                  <p>
                                    The approved report is archived. Start a new
                                    period when the next review is due.
                                  </p>
                                  <button
                                    className="primary full"
                                    onClick={() => setModal({ type: "period" })}
                                  >
                                    Start next reporting period
                                  </button>
                                </>
                              )}
                              <ul className="next-list">
                                {ready.blockers.slice(0, 5).map((b) => (
                                  <li key={b}>{b}</li>
                                ))}
                              </ul>
                              {ready.blockers.length > 5 && (
                                <p className="muted">
                                  + {ready.blockers.length - 5} more
                                  requirements
                                </p>
                              )}
                              <button
                                className="primary full"
                                disabled={!!busy || o.status !== "Active"}
                                onClick={() => setTab("reports")}
                              >
                                Prepare & review report →
                              </button>
                              <button
                                className="secondary full"
                                disabled={!!busy || o.status !== "Active"}
                                onClick={() =>
                                  setModal({
                                    type: "decision",
                                    outcome: "Approve",
                                    conditions: [],
                                  })
                                }
                              >
                                Record decision
                              </button>
                            </>
                          )}
                          <small>
                            Decision authority:{" "}
                            {approvalRoles[stage.id].join(" or ")}
                          </small>
                        </section>
                        <section className="assist-card">
                          <img src="/brand/siraaj.svg" alt="Siraaj" />
                          <h3>Less entry. More review.</h3>
                          <p>
                            Find relevant passages, prefill the opportunity
                            overview and prepare report drafts from your
                            documents.
                          </p>
                          <button
                            className="text-button"
                            onClick={() => setTab("evidence")}
                          >
                            Open evidence workspace ↗
                          </button>
                        </section>
                        <p className="muted fine">
                          Source: source of truth.pdf. Delivery and monitoring
                          are operational phases, not additional numbered
                          investment gates.
                        </p>
                      </aside>
                    </div>
                  </>
                )}
                {tab === "evidence" && (
                  <>
                    <section className="upload-zone">
                      <div className="upload-symbol">↥</div>
                      <div>
                        <h2>Bring the evidence into one place</h2>
                        <p>
                          PDF, Word, Excel, CSV and text, or a ZIP data room. We
                          extract text, suggest categories and flag missing
                          information.
                        </p>
                        <small>
                          10 MB per document · 25 MB per ZIP · up to 100 files
                          per ZIP
                        </small>
                      </div>
                      <input
                        ref={uploadRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.xlsx,.csv,.txt,.zip"
                        aria-label="Upload documents"
                        onChange={(e) =>
                          upload(Array.from(e.target.files || []))
                        }
                        disabled={!!busy || o.status !== "Active"}
                      />
                    </section>
                    <div className="toolbar">
                      <h2>Source library</h2>
                      <div>
                        {actionButton(
                          "Research official sources",
                          () => setModal({ type: "research", url: "" }),
                          "secondary",
                        )}
                        {actionButton(
                          "Suggest opportunity facts",
                          () =>
                            assist("intake", {}, (data) =>
                              setModal({
                                type: "facts",
                                facts: data,
                                notice: data.notice,
                              }),
                            ),
                          "secondary",
                        )}
                      </div>
                    </div>
                    <div className="evidence-grid">
                      {o.documents.map((d) => (
                        <article className="panel document-card" key={d.id}>
                          <div className="document-top">
                            <span className="filetype">
                              {d.extension.slice(1).toUpperCase()}
                            </span>
                            <Badge tone={d.reviewed ? "green" : "gold"}>
                              {d.reviewed ? "Reviewed" : "Needs review"}
                            </Badge>
                          </div>
                          <h3>{d.name.replaceAll("_", " ")}</h3>
                          <p>
                            {d.category} · {d.kind} ·{" "}
                            {(d.size / 1024).toFixed(0)} KB
                          </p>
                          {d.warnings
                            .filter(
                              (w) =>
                                ![
                                  "Demo compilation from public sources; not company-issued.",
                                  "Contains missing information or unconfirmed items.",
                                ].includes(w),
                            )
                            .slice(0, 2)
                            .map((w, i) => (
                              <p className="warning-text" key={i}>
                                {w}
                              </p>
                            ))}
                          <div className="card-actions">
                            <button
                              className="text-button"
                              onClick={() =>
                                setModal({
                                  type: "document",
                                  d,
                                  kind: d.kind,
                                  note: d.reviewNote || "",
                                })
                              }
                            >
                              Read & review ↗
                            </button>
                            <a href={"/api/file?id=" + d.id}>Download</a>
                          </div>
                        </article>
                      ))}
                    </div>
                    {!o.documents.length && (
                      <Empty title="No evidence uploaded yet">
                        Upload the files supplied by the investor, partner or
                        your research team.
                      </Empty>
                    )}
                  </>
                )}
                {tab === "reports" && (
                  <>
                    <div className="toolbar">
                      <div>
                        <h2>Reports through {stageById(o.stage).label}</h2>
                        <p>
                          Choose a report type below or prepare the full set.
                          New drafts keep earlier versions and approvals in the
                          history.
                        </p>
                      </div>
                      <div>
                        <button
                          className="secondary"
                          disabled={!!busy || reportPending}
                          onClick={() =>
                            command(
                              "prepare-reports",
                              { scope: "through" },
                              false,
                            )
                          }
                        >
                          Compile all saved assessments
                        </button>
                        <button
                          className="primary"
                          disabled={!!busy || reportPending}
                          onClick={() => startReport(o.stage, "through")}
                        >
                          Draft all with Siraaj
                        </button>
                      </div>
                    </div>
                    <div className="report-type-grid">
                      {stages
                        .slice(0, stages.findIndex((s) => s.id === o.stage) + 1)
                        .map((s) => (
                          <section
                            className="panel report-type-card"
                            key={s.id}
                          >
                            <div className="meta">
                              <Badge>{s.label}</Badge>
                              <span>
                                {s.id === o.stage
                                  ? "Current stage"
                                  : "Earlier stage"}
                              </span>
                            </div>
                            <h3>{s.report}</h3>
                            <p>
                              {s.id === o.stage
                                ? "Prepare the report for this stage's review and decision."
                                : "Create a reference draft using saved evidence. The recorded gate decision remains in history."}
                            </p>
                            <div className="report-type-actions">
                              <button
                                className="secondary"
                                disabled={!!busy || reportPending}
                                onClick={() =>
                                  command(
                                    "prepare-reports",
                                    { reportStage: s.id, demo: true },
                                    false,
                                  )
                                }
                              >
                                Open prepared demo report
                              </button>
                              <button
                                className="secondary"
                                disabled={!!busy || reportPending}
                                onClick={() =>
                                  command(
                                    "prepare-reports",
                                    { reportStage: s.id },
                                    false,
                                  )
                                }
                              >
                                Compile saved assessments
                              </button>
                              <button
                                className="primary"
                                disabled={!!busy || reportPending}
                                onClick={() => startReport(s.id)}
                              >
                                Draft with Siraaj
                              </button>
                            </div>
                            <small>
                              Demo: a ready-written ORCI report, available
                              immediately. Assessments: saved notes. Siraaj: a
                              fresh AI draft.
                            </small>
                          </section>
                        ))}
                    </div>
                    {reportPending && (
                      <div className="report-activity">
                        <WorkingState
                          label="Starting report preparation"
                          task="report"
                          elapsed={
                            reportJob?.job
                              ? Math.max(
                                  0,
                                  Math.floor(
                                    (reportClock - reportJob.job.startedAt) /
                                      1000,
                                  ),
                                )
                              : 0
                          }
                        />
                        {reportJob?.job?.currentReport && (
                          <p className="report-background-note">
                            Preparing {reportJob.job.currentReport} ·{" "}
                            {reportJob.job.completed || 0} of{" "}
                            {reportJob.job.total || 1} drafted
                          </p>
                        )}
                        <p className="report-background-note">
                          You can work on tasks or leave this page. Return to
                          Reports to check the result.
                        </p>
                      </div>
                    )}
                    {(reportJob?.error ||
                      reportJob?.job?.status === "failed") && (
                      <div className="alert error" role="alert">
                        {reportJob.error || reportJob.job.error}
                      </div>
                    )}
                    {reportJob?.job?.status === "completed" && (
                      <div className="alert success" role="status">
                        Siraaj has prepared your draft. Open it below to review
                        the evidence and conclusions.
                      </div>
                    )}
                    <div className="report-list">
                      {[...o.reports].reverse().map((r) => (
                        <section className="panel report-card" key={r.id}>
                          <div>
                            <div className="eyebrow">
                              {stageById(r.stage).label} · VERSION {r.version} ·{" "}
                              {r.mode}
                            </div>
                            <h2>{r.title}</h2>
                            <p>
                              {formatDate(r.createdAt)} · {r.preparedBy}{" "}
                              {r.period ? "· " + r.period : ""}
                            </p>
                            <div className="meta">
                              <Badge
                                tone={
                                  r.status === "Approved" ? "green" : "gold"
                                }
                              >
                                {r.status}
                              </Badge>
                              {r.stage === o.stage &&
                                r.revision !== revision(o) && (
                                  <Badge tone="red">Sources changed</Badge>
                                )}
                              <span>
                                Reviews:{" "}
                                {r.reviews.map((v) => v.role).join(", ") ||
                                  "None yet"}
                              </span>
                            </div>
                          </div>
                          <div className="report-actions">
                            <a
                              className="secondary"
                              target="_blank"
                              rel="noreferrer"
                              href={"/api/report?id=" + r.id}
                            >
                              Open report ↗
                            </a>
                            <button
                              className="secondary"
                              disabled={!!busy}
                              onClick={() => downloadReport(r)}
                            >
                              Download PDF
                            </button>
                            <button
                              className="secondary"
                              onClick={() =>
                                setModal({
                                  type: "report",
                                  r,
                                  sections: structuredClone(r.sections),
                                  note: "",
                                })
                              }
                            >
                              Read & review
                            </button>
                          </div>
                        </section>
                      ))}
                    </div>
                    {!o.reports.length && (
                      <Empty title="Your first report starts with evidence">
                        Prepare a structured draft now to see the missing
                        sections, or use Siraaj to draft from uploaded sources.
                        Neither action records approval.
                      </Empty>
                    )}
                  </>
                )}
                {tab === "tasks" && (
                  <>
                    <div className="toolbar">
                      <div>
                        <h2>Accountability across teams</h2>
                        <p>
                          Tasks are created from gate requirements. Dates are
                          suggested and editable.
                        </p>
                      </div>
                    </div>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Open approval conditions</h2>
                        <Badge>
                          {
                            o.conditions.filter((c) => c.status === "Open")
                              .length
                          }{" "}
                          open
                        </Badge>
                      </div>
                      {o.conditions.length ? (
                        o.conditions.map((c) => (
                          <div key={c.id} className="requirement">
                            <span
                              className={
                                "check " +
                                (c.status === "Resolved" ? "done" : "")
                              }
                            >
                              {c.status === "Resolved" ? "✓" : "!"}
                            </span>
                            <div>
                              <h3>{c.text}</h3>
                              <p>
                                {c.owner} · Due {formatDate(c.due)} · Required
                                before {c.before.toLowerCase()}
                              </p>
                            </div>
                            <button
                              className="secondary"
                              disabled={c.status === "Resolved"}
                              onClick={() => setModal({ type: "condition", c })}
                            >
                              Resolve
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="panel-padding muted">
                          No conditions have been recorded.
                        </p>
                      )}
                    </section>
                    <section className="panel task-panel">
                      <div className="table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Task</th>
                              <th>Team</th>
                              <th>Due date</th>
                              <th>Status</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {o.tasks.map((t) => (
                              <tr key={t.id}>
                                <td>
                                  {t.title}
                                  <small>{stageById(t.stage).label}</small>
                                </td>
                                <td>{t.owner}</td>
                                <td>
                                  {formatDate(t.due)}
                                  {t.status !== "Completed" &&
                                    t.due <
                                      new Date().toISOString().slice(0, 10) && (
                                      <Badge tone="red">Overdue</Badge>
                                    )}
                                </td>
                                <td>{t.status}</td>
                                <td>
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      setModal({ type: "task", t })
                                    }
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </>
                )}
                {tab === "registers" && (
                  <>
                    <div className="page-heading">
                      <div>
                        <h2>Meetings & performance</h2>
                        <p>
                          Record meeting outcomes, assign follow-ups and track
                          shared performance data.
                        </p>
                      </div>
                    </div>
                    <div className="record-actions">
                      {[
                        [
                          "meeting",
                          "Record a meeting",
                          "Save the agenda, minutes and an assigned follow-up.",
                          "All teams",
                        ],
                        [
                          "financials",
                          "Add financial period",
                          "Record actuals, budget and the supporting evidence.",
                          "Finance",
                        ],
                        [
                          "kpi",
                          "Add performance indicator",
                          "Track a target and actual result.",
                          "Asset Management",
                        ],
                        [
                          "board",
                          "Record board appointment",
                          "Keep representative details and review dates.",
                          "Asset Management",
                        ],
                      ].map(([kind, label, description, owner]) => (
                        <div className="record-action-card" key={kind}>
                          <div className="record-owner">
                            <span>Owner</span>
                            <Badge>{owner}</Badge>
                          </div>
                          <p>{description}</p>
                          <button
                            className={
                              kind === "meeting" ? "primary" : "secondary"
                            }
                            disabled={!!busy || o.status !== "Active"}
                            onClick={() => setModal({ type: "register", kind })}
                          >
                            {label}
                          </button>
                        </div>
                      ))}
                    </div>
                    <section className="panel meetings-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Meetings and follow-up</h2>
                          <p>Meeting details and actions in one place.</p>
                        </div>
                        <Badge>
                          {o.registers?.meeting?.length || 0} recorded
                        </Badge>
                      </div>
                      {o.registers?.meeting?.length ? (
                        [...o.registers.meeting].reverse().map((r) => {
                          const linkedTask =
                            o.tasks.find((t) => t.meetingId === r.id) ||
                            o.tasks.find(
                              (t) =>
                                t.title === r.action &&
                                t.note === `From meeting: ${r.title}`,
                            );
                          return (
                            <article className="meeting-record" key={r.id}>
                              <div className="meeting-record-heading">
                                <h3>{r.title}</h3>
                                <Badge>{r.forum}</Badge>
                                <span>{formatDate(r.date)}</span>
                              </div>
                              <div className="meeting-details">
                                <div>
                                  <h4>Agenda</h4>
                                  <p>{r.agenda}</p>
                                </div>
                                <div>
                                  <h4>Minutes and recommendations</h4>
                                  <p>{r.minutes || "Not recorded"}</p>
                                </div>
                                <div>
                                  <h4>Voting outcome</h4>
                                  <p>{r.votes || "Not recorded"}</p>
                                </div>
                              </div>
                              <div className="meeting-followup">
                                <h4>Follow-up action</h4>
                                {r.action ? (
                                  <>
                                    <p className="meeting-action-title">
                                      {r.action}
                                    </p>
                                    <dl className="meeting-properties">
                                      <div>
                                        <dt>Responsible team</dt>
                                        <dd>{linkedTask?.owner || r.owner}</dd>
                                      </div>
                                      <div>
                                        <dt>Due date</dt>
                                        <dd>
                                          {formatDate(linkedTask?.due || r.due)}
                                        </dd>
                                      </div>
                                      <div>
                                        <dt>Status</dt>
                                        <dd>
                                          <Badge>
                                            {linkedTask?.status ||
                                              "Task status unavailable"}
                                          </Badge>
                                        </dd>
                                      </div>
                                    </dl>
                                    {linkedTask ? (
                                      <button
                                        className="secondary"
                                        disabled={!!busy}
                                        onClick={() =>
                                          setModal({
                                            type: "task",
                                            t: linkedTask,
                                          })
                                        }
                                      >
                                        Edit follow-up
                                      </button>
                                    ) : (
                                      <button
                                        className="secondary"
                                        onClick={() => setTab("tasks")}
                                      >
                                        Open tasks
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <p>
                                    No follow-up action recorded for this
                                    meeting.
                                  </p>
                                )}
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="panel-padding">
                          <p className="muted">
                            No meetings recorded yet. Use Record a meeting above
                            to add the agenda, outcomes and follow-up.
                          </p>
                        </div>
                      )}
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Financial periods</h2>
                        <Badge>OMR</Badge>
                      </div>
                      {o.registers?.financials?.length ? (
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th>Revenue</th>
                                <th>Budget</th>
                                <th>Variance</th>
                                <th>EBITDA</th>
                                <th>Adjusted EBITDA</th>
                                <th>Funds used / allocated</th>
                              </tr>
                            </thead>
                            <tbody>
                              {o.registers.financials.map((f) => (
                                <tr key={f.id}>
                                  <td>
                                    {f.period}
                                    <small>{formatDate(f.at)}</small>
                                  </td>
                                  {[
                                    "revenue",
                                    "budget",
                                    "variance",
                                    "ebitda",
                                    "adjustedEbitda",
                                  ].map((k) => (
                                    <td key={k}>{f[k].toLocaleString()}</td>
                                  ))}
                                  <td>
                                    {f.utilized.toLocaleString()} /{" "}
                                    {f.allocated.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="panel-padding muted">
                          No financial periods recorded. Enter actuals and
                          budget with a reviewed source.
                        </p>
                      )}
                    </section>
                    <div className="register-grid">
                      {[
                        ["kpi", "Performance indicators"],
                        ["board", "Board representation"],
                      ].map(([kind, title]) => (
                        <section className="panel panel-padding" key={kind}>
                          <h2>{title}</h2>
                          {o.registers?.[kind]?.length ? (
                            o.registers[kind].map((r) => (
                              <article className="register-record" key={r.id}>
                                <h3>{r.title || r.name}</h3>
                                {kind === "kpi" ? (
                                  <>
                                    <small>{r.period}</small>
                                    <p>
                                      Target: {r.target}
                                      <br />
                                      Actual: {r.actual}
                                    </p>
                                    <p>{r.note}</p>
                                  </>
                                ) : (
                                  <>
                                    <p>{r.position}</p>
                                    <small>
                                      Appointed {formatDate(r.appointed)} ·
                                      Review {formatDate(r.reviewDate)}
                                    </small>
                                    <p>{r.note}</p>
                                  </>
                                )}
                              </article>
                            ))
                          ) : (
                            <p className="muted">No records yet.</p>
                          )}
                        </section>
                      ))}
                    </div>
                  </>
                )}
                {tab === "decisions" && (
                  <>
                    <div className="toolbar">
                      <div>
                        <h2>Decisions and audit history</h2>
                        <p>
                          Review decisions, responsible teams and their
                          supporting records.
                        </p>
                      </div>
                      <div>
                        {o.status === "Active"
                          ? actionButton(
                              "Request closure or deferral",
                              () => setModal({ type: "closure" }),
                              "secondary",
                            )
                          : o.status === "Monitoring"
                            ? actionButton("Start next reporting period", () =>
                                setModal({ type: "period" }),
                              )
                            : actionButton(
                                "Reopen opportunity",
                                () => setModal({ type: "reopen" }),
                                "secondary",
                              )}
                      </div>
                    </div>
                    {o.closure && (
                      <section className="panel panel-padding">
                        <Badge tone="gold">
                          Closure report: {o.closure.status}
                        </Badge>
                        <h2>{o.closure.outcome}</h2>
                        <p>{o.closure.reason}</p>
                        <p>Commitments: {o.closure.commitments}</p>
                        <a
                          className="secondary"
                          target="_blank"
                          rel="noreferrer"
                          href={"/api/report?id=" + o.closure.id}
                        >
                          Open closure report ↗
                        </a>
                        <button
                          className="secondary"
                          disabled={!!busy}
                          onClick={() =>
                            downloadReport({
                              id: o.closure.id,
                              title: "Investment closure report",
                            })
                          }
                        >
                          Download closure PDF
                        </button>
                        <p>Authority: {o.closure.authority.join(" / ")}</p>
                        {o.closure.status === "Submitted" && (
                          <div className="button-row">
                            {actionButton("Review closure request", () =>
                              setModal({ type: "approve-closure" }),
                            )}
                            {actionButton(
                              "Return for revision",
                              () => setModal({ type: "return-closure" }),
                              "secondary",
                            )}
                          </div>
                        )}
                      </section>
                    )}
                    <section className="panel timeline">
                      {[...state.events]
                        .reverse()
                        .filter((e) => e.opportunityId === o.id)
                        .map((e) => (
                          <article key={e.id}>
                            <span className="timeline-dot" />
                            <div>
                              <small>
                                {formatDate(e.at)} · {e.role} ·{" "}
                                {stageById(e.stage).label}
                              </small>
                              <h3>{e.action}</h3>
                              <p>{e.details}</p>
                            </div>
                          </article>
                        ))}
                    </section>
                  </>
                )}
              </>
            )}
            <footer className="workspace-footer">
              FOOD CAPITAL <span>Oman Food Capital</span>
              <small>Investment & Deal Sourcing</small>
            </footer>
          </main>
        </div>
        {modal && (
          <Modal
            title={
              {
                assistant: "Siraaj",
                create: "New opportunity",
                requirement: modal.r?.title,
                document: "Source review",
                facts: "Opportunity facts",
                report: "Report review",
                research: "Research official sources",
                decision: "Record a decision",
                register: {
                  meeting: "Record a meeting",
                  financials: "Add financial period",
                  kpi: "Add performance indicator",
                  board: "Record board appointment",
                }[modal.kind],
                task: "Task assignment",
                condition: "Resolve approval condition",
                closure: "Investment closure report",
                "approve-closure": "Approve closure",
                "return-closure": "Return closure request",
                reopen: "Reopen opportunity",
                period: "Next reporting period",
              }[modal.type]
            }
            busy={!!busy}
            onClose={() => setModal(null)}
          >
            <div className="modal-content">
              {error && (
                <div role="alert" className="alert error">
                  {error}
                </div>
              )}
              {busy && (
                <div className="modal-activity">
                  <WorkingState
                    label={busy}
                    task={task}
                    elapsed={elapsed}
                    progress={progress}
                  />
                </div>
              )}
              {notice && !busy && (
                <div className="alert success" role="status">
                  {notice}
                </div>
              )}
              {modal.type === "assistant" && (
                <div className="assistant-options">
                  <p>
                    Use the saved opportunity evidence to prepare your next
                    step.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setModal(null);
                      setTab("work");
                      assist("prepare");
                    }}
                    disabled={!!busy || !o?.documents.length}
                  >
                    Prefill gate assessments
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      setModal(null);
                      setTab("reports");
                    }}
                  >
                    Prepare investment reports
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setModal({ type: "research", url: "" })}
                  >
                    Research official sources
                  </button>
                </div>
              )}
              {modal.type === "create" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("create", {
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                      demoPack: true,
                    });
                  }}
                >
                  <Field label="Opportunity name">
                    <input
                      name="name"
                      required
                      maxLength={160}
                      placeholder="For example, ORCI investment study"
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Investment type">
                      <select name="type">
                        {[
                          "Brownfield",
                          "Greenfield",
                          "Venture Capital",
                          "Divestment",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Sector">
                      <input
                        name="sector"
                        defaultValue="Food and beverages"
                        required
                      />
                    </Field>
                    <Field label="Opportunity owner">
                      <input
                        name="owner"
                        defaultValue="Investment team"
                        required
                      />
                    </Field>
                    <Field label="Target date">
                      <input name="targetDate" type="date" />
                    </Field>
                  </div>
                  <p className="muted">
                    SG1 tasks and suggested dates will be prepared
                    automatically. Create using the Investment profile.
                  </p>
                  <button className="primary" disabled={!!busy}>
                    Create opportunity
                  </button>
                </form>
              )}
              {modal.type === "requirement" && (
                <>
                  {modal.readOnly && (
                    <div className="alert">
                      This stage is read-only. The recorded assessment remains
                      available for reference.
                    </div>
                  )}
                  <div className="review-context">
                    <Badge>{modal.r.owner}</Badge>
                    <p>{modal.r.detail}</p>
                  </div>
                  <button
                    className="assist-button"
                    disabled={!!busy || modal.readOnly}
                    onClick={() =>
                      assist("suggest", { requirementId: modal.r.id }, (d) =>
                        patch({
                          narrative: d.text,
                          sourceIds: d.sourceIds,
                          status: "Draft",
                        }),
                      )
                    }
                  >
                    ✧ Find relevant evidence and draft notes
                  </button>
                  <Field
                    label="Assessment and conclusion"
                    hint="Review suggested passages, resolve gaps and record your conclusion. Assistance never approves the requirement."
                  >
                    <textarea
                      readOnly={modal.readOnly || !!busy}
                      rows={10}
                      value={modal.narrative}
                      onChange={(e) => patch({ narrative: e.target.value })}
                    />
                  </Field>
                  <fieldset className="source-picker">
                    <legend>Linked source evidence</legend>
                    {o.documents.map((d) => (
                      <label key={d.id}>
                        <input
                          type="checkbox"
                          disabled={modal.readOnly}
                          checked={modal.sourceIds.includes(d.id)}
                          onChange={(e) =>
                            patch({
                              sourceIds: e.target.checked
                                ? [...modal.sourceIds, d.id]
                                : modal.sourceIds.filter((id) => id !== d.id),
                            })
                          }
                        />
                        <span>
                          {d.name}
                          <small>
                            {d.category} · {d.kind} ·{" "}
                            {d.reviewed ? "Reviewed" : "Needs source review"}
                          </small>
                        </span>
                      </label>
                    ))}
                    {!o.documents.length && <p>Upload evidence first.</p>}
                  </fieldset>
                  <Field label="Review outcome">
                    <select
                      disabled={modal.readOnly}
                      value={modal.status}
                      onChange={(e) => patch({ status: e.target.value })}
                    >
                      <option>Draft</option>
                      <option>Reviewed</option>
                      {modal.r.optional && <option>Not applicable</option>}
                    </select>
                  </Field>
                  <p className="muted">
                    Current profile: {role}. Review assigned to {modal.r.owner}.
                  </p>
                  {!modal.readOnly &&
                    actionButton("Save assessment", () =>
                      command("requirement", {
                        requirementId: modal.r.id,
                        narrative: modal.narrative,
                        sourceIds: modal.sourceIds,
                        status: modal.status,
                      }),
                    )}
                </>
              )}
              {modal.type === "document" && (
                <>
                  <div className="review-context">
                    <h3>{modal.d.name}</h3>
                    <p>{modal.d.path}</p>
                    {modal.d.warnings.map((w, i) => (
                      <p className="warning-text" key={i}>
                        {w}
                      </p>
                    ))}
                  </div>
                  <details open>
                    <summary>Extracted content</summary>
                    <pre className="source-text">
                      {modal.d.text ||
                        "No readable text. Upload an accessible copy or a manual excerpt."}
                    </pre>
                  </details>
                  <a href={"/api/file?id=" + modal.d.id}>Download original ↗</a>
                  <Field label="Evidence classification">
                    <select
                      value={modal.kind}
                      onChange={(e) => patch({ kind: e.target.value })}
                    >
                      <option>Source</option>
                      <option>Template</option>
                      <option>Reference</option>
                    </select>
                  </Field>
                  <Field
                    label="Review notes"
                    hint="State what this source supports and which gaps remain. A blank template or list of links does not prove completion."
                  >
                    <textarea
                      rows={4}
                      value={modal.note}
                      onChange={(e) => patch({ note: e.target.value })}
                    />
                  </Field>
                  {actionButton("Save source review", () =>
                    command("review-document", {
                      documentId: modal.d.id,
                      kind: modal.kind,
                      note: modal.note,
                    }),
                  )}
                </>
              )}
              {modal.type === "facts" && (
                <>
                  {modal.notice && <div className="alert">{modal.notice}</div>}
                  {modal.facts.source && (
                    <p>Suggested from: {modal.facts.source}</p>
                  )}
                  {[
                    ["overview", "Opportunity overview"],
                    ["investor", "Investor / partner"],
                    ["amount", "Proposed investment amount"],
                    ["currency", "Currency"],
                    ["rationale", "Investment rationale"],
                  ].map(([key, label]) => (
                    <Field key={key} label={label}>
                      {["overview", "rationale"].includes(key) ? (
                        <textarea
                          rows={key === "overview" ? 7 : 3}
                          value={modal.facts[key] || ""}
                          onChange={(e) =>
                            patch({
                              facts: { ...modal.facts, [key]: e.target.value },
                            })
                          }
                        />
                      ) : (
                        <input
                          value={modal.facts[key] || ""}
                          onChange={(e) =>
                            patch({
                              facts: { ...modal.facts, [key]: e.target.value },
                            })
                          }
                        />
                      )}
                    </Field>
                  ))}
                  {actionButton("Save reviewed facts", () =>
                    command("facts", { facts: modal.facts }),
                  )}
                </>
              )}
              {modal.type === "research" && (
                <>
                  <p>
                    Retrieve official company or exchange material. Sources are
                    added as unreviewed evidence with their URL and retrieval
                    date.
                  </p>
                  <Field label="Official source URL">
                    <input
                      type="url"
                      value={modal.url}
                      onChange={(e) => patch({ url: e.target.value })}
                      placeholder="https://www.msx.om/snapshot.aspx?s=ORCI"
                    />
                  </Field>
                  <p className="muted">
                    Supported official sites: pepsioman.com, msx.om and mcd.om.
                    For other sources, upload the document with its citation.
                  </p>
                  {actionButton("Retrieve source", () =>
                    assist("research", { url: modal.url }, () => {
                      setModal(null);
                      setNotice(
                        "Research added to the source library. Review its date and relevance.",
                      );
                    }),
                  )}
                  <h3>Links found in uploaded evidence</h3>
                  <div className="research-links">
                    {[
                      ...new Set(
                        o.documents.flatMap((d) => d.researchUrls || []),
                      ),
                    ]
                      .slice(0, 50)
                      .map((url) => (
                        <button key={url} onClick={() => patch({ url })}>
                          {url}
                        </button>
                      ))}
                  </div>
                </>
              )}
              {((modal.type === "report" && reportEditable) ||
                modal.type === "decision") && (
                <label className="demo-pack-option">
                  <input
                    type="checkbox"
                    checked={demoApprovals}
                    onChange={(e) => setDemoApprovals(e.target.checked)}
                  />
                  <span>
                    <strong>Demo approval mode</strong>
                    <small>
                      Review and approve using your current profile. All
                      required report reviewer roles are simulated together and
                      recorded in the history.
                    </small>
                  </span>
                </label>
              )}
              {modal.type === "report" && (
                <>
                  <div className="review-context">
                    <h3>
                      {modal.r.title} v{modal.r.version}
                    </h3>
                    <Badge>{modal.r.status}</Badge>
                    {modal.r.demoSubmission && (
                      <div className="alert">
                        <strong>Submitted for demo</strong>
                        <p>
                          {modal.r.demoSubmission.gaps.length} outstanding items
                          recorded at submission. Reviews and evidence were not
                          marked complete.
                        </p>
                        <details>
                          <summary>View outstanding items</summary>
                          <ul>
                            {modal.r.demoSubmission.gaps.map((g) => (
                              <li key={g}>{g}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                    )}
                    <p>
                      Required reviewers:{" "}
                      {reportReviewRoles[modal.r.stage].join(", ")}
                    </p>
                  </div>
                  {modal.r.presentation && (
                    <div className="report-overview">
                      <div className="eyebrow">
                        PREPARED ORCI DEMO · {modal.r.presentation.asOf}
                      </div>
                      <h2>Executive summary</h2>
                      {modal.r.presentation.summary
                        .split("\n\n")
                        .map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      <div className="report-metrics">
                        {modal.r.presentation.metrics.map((m) => (
                          <div key={m.label}>
                            <span>{m.label}</span>
                            <strong>{m.value}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="report-recommendation">
                        <h3>Recommendation</h3>
                        <p>{modal.r.presentation.recommendation}</p>
                      </div>
                      <h3>Next actions</h3>
                      <div className="report-next-actions">
                        {modal.r.presentation.actions.map(([owner, action]) => (
                          <div key={owner}>
                            <Badge>{owner}</Badge>
                            <p>{action}</p>
                          </div>
                        ))}
                      </div>
                      <small>{modal.r.presentation.basis}</small>
                    </div>
                  )}
                  {modal.sections.map((s, i) => (
                    <details
                      className="report-section"
                      key={s.id}
                      open={i === 0}
                    >
                      <summary>
                        {String(i + 1).padStart(2, "0")} · {s.title}
                      </summary>
                      <textarea
                        readOnly={!reportEditable}
                        aria-label={s.title}
                        rows={7}
                        value={s.text}
                        onChange={(e) =>
                          patch({
                            sections: modal.sections.map((x, j) =>
                              j === i ? { ...x, text: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      <small>
                        Sources:{" "}
                        {s.sourceIds
                          .map(
                            (id) =>
                              o.documents.find((d) => d.id === id)?.name || id,
                          )
                          .join("; ") ||
                          s.sourceNames?.join("; ") ||
                          "Missing evidence"}
                      </small>
                    </details>
                  ))}
                  {reportEditable && (
                    <>
                      <Field label="Review conclusion">
                        <textarea
                          readOnly={!reportEditable}
                          rows={3}
                          value={modal.note}
                          onChange={(e) => patch({ note: e.target.value })}
                        />
                      </Field>
                      <div className="button-row">
                        {actionButton(
                          "Save edits as new version",
                          () =>
                            command("edit-report", {
                              reportId: modal.r.id,
                              sections: modal.sections,
                            }),
                          "secondary",
                        )}
                        {actionButton(
                          "Confirm report review",
                          () =>
                            JSON.stringify(modal.sections) !==
                            JSON.stringify(modal.r.sections)
                              ? setError(
                                  "Save your edited sections as a new version before reviewing.",
                                )
                              : command("review-report", {
                                  reportId: modal.r.id,
                                  note: modal.note,
                                  demoApproval: demoApprovals,
                                }),
                          "secondary",
                        )}
                        {actionButton("Submit for decision", () =>
                          JSON.stringify(modal.sections) !==
                          JSON.stringify(modal.r.sections)
                            ? setError(
                                "Save your edited sections as a new version before submitting.",
                              )
                            : command("submit-report", {
                                reportId: modal.r.id,
                                demoApproval: demoApprovals,
                              }),
                        )}
                      </div>
                    </>
                  )}
                  {!reportEditable && (
                    <p className="muted">
                      This saved report is read-only. Its content and review
                      history are retained.
                    </p>
                  )}
                  <p className="muted">
                    Save any edits as a new version before reviewing. Only the
                    latest current-stage report can progress.
                  </p>
                </>
              )}
              {modal.type === "decision" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("decision", {
                      demoApproval: demoApprovals,
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                      outcome: modal.outcome,
                      conditions: modal.conditions,
                    });
                  }}
                >
                  <div className="review-context">
                    <p>
                      Decision authority: {approvalRoles[o.stage].join(" or ")}
                    </p>
                    <p>Current profile: {role}</p>
                    {ready.blockers.length > 0 && (
                      <details>
                        <summary>
                          {ready.blockers.length} approval blockers
                        </summary>
                        <ul>
                          {ready.blockers.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  <Field label="Outcome">
                    <select
                      value={modal.outcome}
                      onChange={(e) => patch({ outcome: e.target.value })}
                    >
                      <option>Approve</option>
                      <option>Approve with conditions</option>
                      <option>Request information</option>
                    </select>
                  </Field>
                  <Field label="Decision rationale / information request">
                    <textarea name="note" rows={4} required minLength={15} />
                  </Field>
                  <div className="form-grid">
                    <Field label="Meeting / decision date">
                      <input
                        type="date"
                        name="meetingDate"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                      />
                    </Field>
                    <Field label="Voting outcome">
                      <input
                        name="votes"
                        placeholder="For example, 5 in favour, 0 against"
                        required={["sg2", "sg3", "monitoring"].includes(
                          o.stage,
                        )}
                      />
                    </Field>
                  </div>
                  {modal.outcome === "Request information" && (
                    <Field label="Response due date">
                      <input type="date" name="due" required />
                    </Field>
                  )}
                  {modal.outcome === "Approve with conditions" && (
                    <>
                      <h3>Conditions of approval</h3>
                      {modal.conditions.map((c, i) => (
                        <div className="condition-form" key={i}>
                          <Field label="Condition">
                            <textarea
                              value={c.text}
                              required
                              minLength={10}
                              onChange={(e) =>
                                patch({
                                  conditions: modal.conditions.map((x, j) =>
                                    i === j
                                      ? { ...x, text: e.target.value }
                                      : x,
                                  ),
                                })
                              }
                            />
                          </Field>
                          <div className="form-grid">
                            <Field label="Owner">
                              <RoleSelect
                                label="Condition owner"
                                value={c.owner}
                                onChange={(v) =>
                                  patch({
                                    conditions: modal.conditions.map((x, j) =>
                                      i === j ? { ...x, owner: v } : x,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <Field label="Due">
                              <input
                                type="date"
                                required
                                value={c.due}
                                onChange={(e) =>
                                  patch({
                                    conditions: modal.conditions.map((x, j) =>
                                      i === j
                                        ? { ...x, due: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <Field label="Must resolve before">
                              <select
                                value={c.before}
                                onChange={(e) =>
                                  patch({
                                    conditions: modal.conditions.map((x, j) =>
                                      i === j
                                        ? { ...x, before: e.target.value }
                                        : x,
                                    ),
                                  })
                                }
                              >
                                {["Next gate", "Execution", "Monitoring"].map(
                                  (v) => (
                                    <option key={v}>{v}</option>
                                  ),
                                )}
                              </select>
                            </Field>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          patch({
                            conditions: [
                              ...modal.conditions,
                              {
                                text: "",
                                owner: "Investment",
                                due: "",
                                before: "Next gate",
                              },
                            ],
                          })
                        }
                      >
                        + Add condition
                      </button>
                    </>
                  )}
                  <div className="modal-footer">
                    <button className="primary" disabled={!!busy}>
                      Record decision
                    </button>
                  </div>
                </form>
              )}
              {modal.type === "register" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("register", {
                      kind: modal.kind,
                      data: Object.fromEntries(new FormData(e.currentTarget)),
                    });
                  }}
                >
                  {modal.kind === "financials" ? (
                    <>
                      <p>
                        Enter OMR amounts. Variance and adjusted EBITDA are
                        calculated automatically. Finance owns this shared
                        record.
                      </p>
                      <Field label="Period">
                        <input
                          name="period"
                          required
                          pattern="[0-9]{4}-Q[1-4]"
                          defaultValue={o.period}
                        />
                      </Field>
                      <div className="form-grid">
                        {[
                          ["revenue", "Actual revenue"],
                          ["budget", "Revenue budget"],
                          ["ebitda", "EBITDA"],
                          ["adjustments", "EBITDA adjustments"],
                          ["allocated", "Funds allocated"],
                          ["utilized", "Funds utilized"],
                        ].map(([key, label]) => (
                          <Field label={label} key={key}>
                            <input
                              name={key}
                              type="number"
                              step="any"
                              required
                            />
                          </Field>
                        ))}
                      </div>
                      <Field label="Reviewed financial source">
                        <select name="sourceId" required>
                          <option value="">Select evidence</option>
                          {o.documents
                            .filter((d) => d.reviewed && d.kind === "Source")
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Adjustment reconciliation and variance explanation">
                        <textarea
                          name="note"
                          required
                          minLength={15}
                          rows={4}
                        />
                      </Field>
                    </>
                  ) : modal.kind === "meeting" ? (
                    <>
                      <Field label="Meeting title">
                        <input name="title" required />
                      </Field>
                      <div className="form-grid">
                        <Field label="Forum">
                          <select name="forum">
                            {[
                              "Weekly investment meeting",
                              "EC",
                              "IC",
                              "Board",
                              "Asset performance review",
                              "Cross-functional coordination",
                            ].map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Meeting date">
                          <input name="date" type="date" required />
                        </Field>
                      </div>
                      <Field label="Agenda">
                        <textarea name="agenda" required />
                      </Field>
                      <Field label="Minutes and recommendations">
                        <textarea name="minutes" rows={4} />
                      </Field>
                      <Field label="Voting outcome">
                        <input name="votes" />
                      </Field>
                      <Field
                        label="Follow-up action"
                        hint="Entering an action creates an assigned task automatically."
                      >
                        <input name="action" />
                      </Field>
                      <div className="form-grid">
                        <Field label="Responsible team">
                          <select name="owner">
                            {roles.map((r) => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Follow-up due date">
                          <input name="due" type="date" />
                        </Field>
                      </div>
                    </>
                  ) : modal.kind === "board" ? (
                    <>
                      <Field label="Representative name">
                        <input name="name" required />
                      </Field>
                      <Field label="Board position">
                        <input name="position" required />
                      </Field>
                      <div className="form-grid">
                        <Field label="Appointment date">
                          <input name="appointed" type="date" required />
                        </Field>
                        <Field label="Term review date">
                          <input name="reviewDate" type="date" />
                        </Field>
                      </div>
                      <Field label="Appointment evidence / governance notes">
                        <textarea name="note" rows={4} />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Indicator">
                        <input name="name" required />
                      </Field>
                      <Field label="Period">
                        <input name="period" defaultValue={o.period} required />
                      </Field>
                      <div className="form-grid">
                        <Field label="Target including units">
                          <input name="target" required />
                        </Field>
                        <Field label="Actual including units">
                          <input name="actual" required />
                        </Field>
                      </div>
                      <Field label="Explanation and follow-up">
                        <textarea name="note" rows={4} />
                      </Field>
                    </>
                  )}
                  <button className="primary" disabled={!!busy}>
                    Save record
                  </button>
                </form>
              )}
              {modal.type === "task" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("task", {
                      taskId: modal.t.id,
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                    });
                  }}
                >
                  <h3>{modal.t.title}</h3>
                  <Field label="Responsible team">
                    <select name="owner" defaultValue={modal.t.owner}>
                      {roles.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Due date">
                    <input
                      name="due"
                      type="date"
                      defaultValue={modal.t.due}
                      required
                    />
                  </Field>
                  <Field label="Notes">
                    <textarea name="note" defaultValue={modal.t.note} />
                  </Field>
                  {!modal.t.key && (
                    <Field label="Follow-up status">
                      <select name="status" defaultValue={modal.t.status}>
                        <option>Open</option>
                        <option>Completed</option>
                      </select>
                    </Field>
                  )}
                  <button className="primary" disabled={!!busy}>
                    Save task
                  </button>
                </form>
              )}
              {modal.type === "condition" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("condition", {
                      conditionId: modal.c.id,
                      ...Object.fromEntries(new FormData(e.currentTarget)),
                    });
                  }}
                >
                  <h3>{modal.c.text}</h3>
                  <p>Resolution owner: {modal.c.owner}</p>
                  <Field label="Resolution and evidence">
                    <textarea name="note" minLength={20} required rows={4} />
                  </Field>
                  <Field label="Reviewed source">
                    <select name="documentId" required>
                      <option value="">Select evidence</option>
                      {o.documents
                        .filter((d) => d.reviewed && d.kind === "Source")
                        .map((d) => (
                          <option value={d.id} key={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <button className="primary" disabled={!!busy}>
                    Record resolution
                  </button>
                </form>
              )}
              {modal.type === "closure" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command(
                      "request-closure",
                      Object.fromEntries(new FormData(e.currentTarget)),
                    );
                  }}
                >
                  <p>
                    The existing reports and source records will be retained.
                    The opportunity status changes only after the required
                    authority approves this closure report.
                  </p>
                  <Field label="Requested outcome">
                    <select name="outcome">
                      <option>Deferred</option>
                      <option>Declined</option>
                      <option>Closed</option>
                    </select>
                  </Field>
                  <Field label="Justification">
                    <textarea name="note" required minLength={30} rows={5} />
                  </Field>
                  <Field label="Outstanding commitments, liabilities and follow-up">
                    <textarea
                      name="commitments"
                      required
                      minLength={15}
                      rows={4}
                    />
                  </Field>
                  <button className="primary" disabled={!!busy}>
                    Submit closure report
                  </button>
                </form>
              )}
              {["approve-closure", "return-closure", "reopen"].includes(
                modal.type,
              ) && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command(
                      modal.type,
                      Object.fromEntries(new FormData(e.currentTarget)),
                    );
                  }}
                >
                  <Field label="Decision rationale">
                    <textarea name="note" required minLength={15} rows={5} />
                  </Field>
                  <button className="primary" disabled={!!busy}>
                    Record decision
                  </button>
                </form>
              )}
              {modal.type === "period" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    command(
                      "new-period",
                      Object.fromEntries(new FormData(e.currentTarget)),
                    );
                  }}
                >
                  <Field label="Reporting period" hint="For example, 2027-Q1">
                    <input
                      name="period"
                      required
                      pattern="[0-9]{4}-Q[1-4]"
                      placeholder="2027-Q1"
                    />
                  </Field>
                  <p>
                    Previous reports remain archived. New reviews are required
                    for the next period.
                  </p>
                  <button className="primary" disabled={!!busy}>
                    Start reporting cycle
                  </button>
                </form>
              )}
            </div>
          </Modal>
        )}
        <QuickChat department="investment" />
      </div>
    </SiraajProvider>
  );
}
function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Current workspace</small>
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    home: (
      <path d="M3 9l7-5.5L17 9v7.5a1 1 0 01-1 1h-3.5v-5h-5v5H4a1 1 0 01-1-1z" />
    ),
    input: (
      <>
        <path d="M11.5 3H5a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5V9" />
        <path d="M14.8 2.7a1.6 1.6 0 012.3 2.3L10.5 11.6 7.5 12.5l.9-3z" />
      </>
    ),
    reports: (
      <>
        <path d="M5 2.5h7l4 4v11H5z" />
        <path d="M12 2.5v4h4M8 10.5h5M8 13.5h5" />
      </>
    ),
    dashboards: (
      <>
        <rect x="3" y="3" width="6" height="8" rx="1.2" />
        <rect x="11" y="3" width="6" height="5" rx="1.2" />
        <rect x="11" y="10" width="6" height="7" rx="1.2" />
        <rect x="3" y="13" width="6" height="4" rx="1.2" />
      </>
    ),
    search: (
      <>
        <circle cx="8" cy="8" r="5" />
        <path d="M12 12l4 4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
