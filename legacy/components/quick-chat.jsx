"use client";
import { useEffect, useRef, useState } from "react";
import { pageChatProfiles, promptsForPage } from "../lib/page-chat-context.mjs";
import { useSiraajOpen } from "./siraaj";
import { requestChat } from "../lib/chat-client.mjs";
import "../styles/quick-chat.css";
function readPage(department, includeContent = false) {
  const view =
    document.querySelector('#panel[aria-hidden="false"]') ||
    document.querySelector("#view, #app-content");
  const title =
    view?.dataset.pageTitle ||
    (view?.id === "app-content"
      ? "Corporate overview"
      : view
          ?.querySelector(".vh h2, .view-head h2, h1, h2")
          ?.textContent?.trim()) ||
    pageChatProfiles[department].name;
  const description =
    view?.querySelector(".vh p, .view-head p")?.textContent?.trim() || "";
  let visibleText = "";
  if (includeContent && view) {
    const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode()) && visibleText.length < 10000) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          'script,style,input,textarea,button,[hidden],[aria-hidden="true"]',
        ) ||
        !parent.getClientRects().length ||
        getComputedStyle(parent).visibility === "hidden"
      )
        continue;
      const text = node.textContent?.replace(/\s+/g, " ").trim();
      if (text) visibleText += text + "\n";
    }
  }
  const filters = [...(view?.querySelectorAll("select") || [])]
    .filter((el) => el.getClientRects().length && !el.closest("form"))
    .map(
      (el) =>
        `${el.getAttribute("aria-label") || el.name || "Selected filter"}: ${el.selectedOptions[0]?.text || ""}`,
    )
    .join("; ");
  return {
    department,
    title,
    description,
    visibleText: visibleText.slice(0, 10000),
    filters: [
      filters,
      ...[...document.querySelectorAll(".site-chips .chip-s")]
        .filter((el) => el.getClientRects().length)
        .map((el) => el.textContent?.trim()),
    ]
      .filter(Boolean)
      .join("; "),
  };
}
function Answer({ text }) {
  return (
    <>
      {text
        .split(/(\[Source\]\(\/api\/knowledge\/source\?id=[a-zA-Z0-9%_-]+\))/g)
        .map((part, i) => {
          const match = part.match(/^\[Source\]\(([^)]+)\)$/);
          return match ? (
            <a key={i} href={match[1]} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          ) : (
            <span key={i}>{part}</span>
          );
        })}
    </>
  );
}
export function QuickChat({ department }) {
  const fullChat = useSiraajOpen();
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(() => ({
    department,
    title: pageChatProfiles[department].name,
    description: "",
    visibleText: "",
    filters: "",
  }));
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const controller = useRef(null),
    generation = useRef(0),
    launcher = useRef(null),
    field = useRef(null),
    transcript = useRef(null),
    currentPage = useRef("");
  useEffect(() => {
    const sync = () => {
      const next = readPage(department);
      const key =
        next.title +
        "|" +
        next.description +
        "|" +
        next.filters +
        "|" +
        (document
          .querySelector("[data-opportunity-id]")
          ?.getAttribute("data-opportunity-id") || "");
      if (key !== currentPage.current) {
        currentPage.current = key;
        generation.current++;
        controller.current?.abort();
        setContext(next);
        setMessages([]);
        setBusy(false);
        setError("");
        setInput("");
      }
    };
    sync();
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(sync, 100);
    });
    const view = document.querySelector("#view, #app-content");
    for (const target of [view, document.querySelector("#panel")])
      if (target)
        observer.observe(target, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: [
            "hidden",
            "aria-current",
            "aria-hidden",
            "data-page-title",
            "data-opportunity-id",
          ],
        });
    view?.addEventListener("change", sync);
    document.querySelector("#panel")?.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      view?.removeEventListener("change", sync);
      document.querySelector("#panel")?.removeEventListener("change", sync);
      generation.current++;
      controller.current?.abort();
    };
  }, [department]);
  useEffect(() => {
    if (fullChat) setOpen(false);
  }, [fullChat]);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
  }, [messages, busy, error]);
  function reset() {
    generation.current++;
    controller.current?.abort();
    setMessages([]);
    setError("");
    setBusy(false);
    setInput("");
    field.current?.focus();
  }
  async function send(text) {
    if (busy || !text.trim()) return;
    const page = readPage(department, true),
      history = [...messages, { role: "user", text: text.trim() }].slice(-29);
    setMessages(history);
    setInput("");
    setBusy(true);
    setError("");
    const token = ++generation.current,
      abort = new AbortController();
    controller.current = abort;
    try {
      const data = await requestChat(
        {
          department: pageChatProfiles[department].name,
          messages: history,
          pageContext: page,
        },
        { signal: abort.signal },
      );
      if (token === generation.current)
        setMessages([...history, { role: "ai", text: data.text }]);
    } catch (reason) {
      if (token === generation.current) {
        setError(
          reason instanceof Error && reason.name !== "TimeoutError"
            ? reason.message
            : "The request timed out. Please try again.",
        );
        setMessages(history.slice(0, -1));
        setInput(text);
      }
    } finally {
      if (token === generation.current) setBusy(false);
    }
  }
  if (fullChat) return null;
  return (
    <div className="quick-chat-root">
      {open && (
        <section
          id="quick-chat-panel"
          className="quick-chat-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="quick-chat-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              setOpen(false);
              launcher.current?.focus();
            }
          }}
        >
          <header className="quick-chat-header">
            <img
              className="quick-chat-brand"
              src="/brand/siraaj.svg"
              alt=""
              width="30"
              height="30"
            />
            <div>
              <strong id="quick-chat-title">Siraaj</strong>
              <a
                className="quick-chat-full-link"
                href={
                  "/siraaj" +
                  (document
                    .querySelector("[data-opportunity-id]")
                    ?.getAttribute("data-opportunity-id")
                    ? "?opportunity=" +
                      encodeURIComponent(
                        document
                          .querySelector("[data-opportunity-id]")
                          .getAttribute("data-opportunity-id"),
                      )
                    : "")
                }
              >
                Open full chat ↗
              </a>
              <small title={context.title}>{context.title}</small>
            </div>
            <button
              type="button"
              aria-label="New quick chat"
              title="New quick chat"
              onClick={reset}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Close quick chat"
              onClick={() => {
                setOpen(false);
                launcher.current?.focus();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M6 18 18 6" />
              </svg>
            </button>
          </header>
          <div
            className="quick-chat-messages"
            ref={transcript}
            aria-live="polite"
            aria-relevant="additions text"
          >
            {!messages.length && (
              <div className="quick-chat-intro">
                <span className="quick-chat-welcome-mark">
                  <img src="/brand/siraaj.svg" alt="" width="36" height="36" />
                </span>
                <span className="quick-chat-eyebrow">OFC KNOWLEDGE</span>
                <p>How can I help with this page?</p>
                <small>
                  {context.description || pageChatProfiles[department].goal}
                </small>
                <div className="quick-chat-prompts">
                  {promptsForPage(department, context.title).map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => void send(prompt)}
                      disabled={busy}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message, i) => (
              <div key={i} className={`quick-chat-message ${message.role}`}>
                <span className="sr-only">
                  {message.role === "user" ? "You" : "Siraaj"}:{" "}
                </span>
                <Answer text={message.text} />
              </div>
            ))}
            {busy && (
              <p className="quick-chat-thinking" role="status">
                Checking this page and relevant sources…
              </p>
            )}
            {error && (
              <p className="quick-chat-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <form
            className="quick-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <label className="sr-only" htmlFor="quick-chat-input">
              Ask Siraaj about this page
            </label>
            <textarea
              ref={field}
              id="quick-chat-input"
              value={input}
              maxLength={12000}
              rows={2}
              placeholder="Ask about this page…"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void send(input);
                }
              }}
            />
            <button
              type="submit"
              aria-label="Send quick message"
              disabled={busy || !input.trim()}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 19V5m-6 6 6-6 6 6" />
              </svg>
            </button>
          </form>
          <p className="quick-chat-note">
            Uses visible page content. Sample figures stay separate from client
            sources.
          </p>
        </section>
      )}
      <button
        ref={launcher}
        type="button"
        className="quick-chat-bubble"
        aria-label={open ? "Hide Siraaj quick chat" : "Open Siraaj quick chat"}
        aria-expanded={open}
        aria-controls="quick-chat-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <img src="/brand/siraaj.svg" alt="" width="24" height="24" />
        <span>Siraaj</span>
      </button>
    </div>
  );
}
