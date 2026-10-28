"use client";
import { useState } from "react";
import { applets } from "../lib/applets.mjs";
import "./applets.css";
export function AppletLauncher({ opportunityId = "" }) {
  const [query, setQuery] = useState("");
  return (
    <details
      className="ofc-app-launcher"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.currentTarget.open = false;
          e.currentTarget.querySelector("summary").focus();
        }
      }}
    >
      <summary className="waffle" aria-label="App launcher">
        <svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          {[3, 9, 15].flatMap((x) =>
            [3, 9, 15].map((y) => (
              <circle key={x + "-" + y} cx={x} cy={y} r="1.6" />
            )),
          )}
        </svg>
      </summary>
      <div className="ofc-app-flyout">
        <h3>Oman Food Capital apps</h3>
        <input
          type="search"
          aria-label="Find OFC apps"
          placeholder="Find an app"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="ofc-app-grid">
          {applets
            .filter((a) => a.n.toLowerCase().includes(query.toLowerCase()))
            .map((a) => (
              <a key={a.id} href={a.href}>
                <span className="ofc-app-icon" style={{ background: a.c }}>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: a.g }}
                  />
                </span>
                <span>{a.n}</span>
              </a>
            ))}
          <a
            href={
              "/siraaj" +
              (opportunityId
                ? "?opportunity=" + encodeURIComponent(opportunityId)
                : "")
            }
          >
            <span className="ofc-app-icon ofc-siraaj-icon">
              <img src="/brand/siraaj.svg" alt="" />
            </span>
            <span>Siraaj</span>
          </a>
        </div>
      </div>
    </details>
  );
}
