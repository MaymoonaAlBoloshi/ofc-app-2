"use client";
import { useEffect, useState } from "react";
import { SiraajProvider, SiraajWorkspace } from "../legacy/components/siraaj";
import { AppletLauncher } from "./applet-launcher";
import "../app/chat-base.css";
import "./applets.css";
export default function SiraajPage() {
  const [opportunities, setOpportunities] = useState([]),
    [selected, setSelected] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    const id = new URL(location.href).searchParams.get("opportunity") || "";
    setSelected(id);
    fetch("/api/workspace")
      .then((r) => {
        if (!r.ok) throw Error("Could not load opportunities.");
        return r.json();
      })
      .then((s) => setOpportunities(s.opportunities))
      .catch((e) => setError(e.message));
  }, []);
  function change(id) {
    setSelected(id);
    const url = new URL(location.href);
    id
      ? url.searchParams.set("opportunity", id)
      : url.searchParams.delete("opportunity");
    history.replaceState(null, "", url);
  }
  return (
    <div className="dedicated-chat" data-opportunity-id={selected}>
      <header className="standalone-suite">
        <AppletLauncher opportunityId={selected} />
        <a href="/">Oman Food Capital</a>
        <a
          className="return-link"
          href={
            "/" +
            (selected ? "?opportunity=" + encodeURIComponent(selected) : "")
          }
        >
          Back to investment
        </a>
      </header>
      <div className="siraaj-context-bar">
        <label htmlFor="chat-opportunity">Chat context</label>
        <select
          id="chat-opportunity"
          value={selected}
          onChange={(e) => change(e.target.value)}
        >
          <option value="">OFC applets and knowledge</option>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        {error && <span role="alert">{error}</span>}
      </div>
      <SiraajProvider key={selected} initialOpen standalone>
        <div>
          <SiraajWorkspace />
        </div>
      </SiraajProvider>
    </div>
  );
}
