"use client";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { SiraajEvidence } from "./siraaj-evidence";
import { requestChat } from "../lib/chat-client.mjs";
import { SiraajHistory } from "./siraaj-history";
import {
  chatStorageKey,
  ACTIVE_CHAT_KEY,
  HISTORY_KEY,
  newConversation,
  readConversations,
  saveConversation,
  deleteConversation,
} from "../lib/chat-history";
import "../styles/siraaj.css";
const ChatContext = createContext({
  open: false,
  toggle: () => {},
  close: () => {},
});
export function useSiraajOpen() {
  return useContext(ChatContext).open;
}
export function SiraajProvider({
  children,
  initialOpen = false,
  standalone = false,
}) {
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => {
    if (location.hash === "#siraaj") setOpen(true);
  }, []);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => {
    if (!standalone) setOpen(false);
  }, [standalone]);
  return (
    <ChatContext.Provider value={{ open, toggle, close }}>
      {children}
    </ChatContext.Provider>
  );
}
export function SiraajButton() {
  const { open, toggle } = useContext(ChatContext);
  return (
    <button
      type="button"
      className="rbtn siraaj-tab"
      aria-expanded={open}
      aria-controls="siraaj-workspace"
      aria-current={open ? "true" : undefined}
      onClick={toggle}
    >
      <img src="/brand/siraaj.svg" alt="" width="22" height="22" />
      Siraaj
    </button>
  );
}
let chatBundle;
function loadChat() {
  if (customElements.get("deep-chat")) return Promise.resolve();
  if (!chatBundle)
    chatBundle = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/deep-chat.bundle.js";
      const fail = () => {
        clearTimeout(timeout);
        script.remove();
        chatBundle = undefined;
        reject(new Error("Chat could not load. Click New chat to retry."));
      };
      const timeout = setTimeout(fail, 10000);
      script.onload = () => {
        clearTimeout(timeout);
        customElements.get("deep-chat") ? resolve() : fail();
      };
      script.onerror = fail;
      document.head.append(script);
    });
  return chatBundle;
}
export function SiraajWorkspace() {
  const { open, close } = useContext(ChatContext);
  const workspace = useRef(null);
  const mount = useRef(null);
  const chatRef = useRef(null);
  const [session, setSession] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [welcome, setWelcome] = useState(true);
  const [evidence, setEvidence] = useState([]);
  const conversationRef = useRef(null);
  const requestRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [conversationTitle, setConversationTitle] =
    useState("New conversation");
  const historyButton = useRef(null);
  useEffect(() => {
    if (!started) return;
    try {
      const saved = readConversations();
      setConversations(saved);
      const selected = saved.find(
        (item) =>
          item.id === localStorage.getItem(chatStorageKey(ACTIVE_CHAT_KEY)),
      );
      conversationRef.current = selected || newConversation();
    } catch {
      conversationRef.current = newConversation();
      setStorageError(
        "Saved conversations could not be read. This chat is still available while the page is open.",
      );
    }
    setHistoryReady(true);
    const sync = (event) => {
      if (event.key === chatStorageKey(HISTORY_KEY)) {
        try {
          setConversations(readConversations());
        } catch {
          /* Preserve the open conversation. */
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [started]);
  function selectConversation(conversation) {
    requestRef.current?.abort();
    conversationRef.current = conversation
      ? { ...conversation, messages: [...conversation.messages] }
      : newConversation();
    try {
      if (conversation)
        localStorage.setItem(chatStorageKey(ACTIVE_CHAT_KEY), conversation.id);
      else localStorage.removeItem(chatStorageKey(ACTIVE_CHAT_KEY));
    } catch {
      setStorageError(
        "Browser storage is unavailable. This conversation may not survive a reload.",
      );
    }
    setSession((value) => value + 1);
    if (window.innerWidth <= 900) setHistoryOpen(false);
  }
  function removeConversation(conversation) {
    if (
      !window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)
    )
      return;
    try {
      setConversations(deleteConversation(conversation.id));
      if (conversationRef.current?.id === conversation.id)
        selectConversation(null);
    } catch {
      setStorageError(
        "This conversation could not be deleted. Please try again.",
      );
    }
  }
  function persist(conversation) {
    conversation.updatedAt = new Date().toISOString();
    if (conversationRef.current?.id === conversation.id)
      setConversationTitle(conversation.title);
    try {
      setConversations(saveConversation(conversation));
      setStorageError("");
    } catch {
      setConversations((current) => [
        { ...conversation },
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setStorageError(
        "This conversation could not be saved. Browser storage may be full or unavailable.",
      );
    }
  }
  useEffect(() => {
    if (!open || !workspace.current) return;
    setStarted(true);
    document.querySelector("#hpClose")?.click();
    document.querySelector("#pClose")?.click();
    const siblings = [...workspace.current.parentElement.children].filter(
      (child) => child !== workspace.current,
    );
    const hidden = siblings.map((child) => child.hidden);
    siblings.forEach((child) => {
      child.hidden = true;
    });
    const current = document.querySelector(
      '.rail [aria-current="true"]:not(.siraaj-tab)',
    );
    current?.setAttribute("aria-current", "false");
    const rail = document.querySelector(".rail");
    // Department workflows can update the rail after the chat opens.
    const syncCurrent = () => {
      rail?.querySelectorAll(".rbtn").forEach((button) => {
        const selected = String(button.classList.contains("siraaj-tab"));
        if (button.getAttribute("aria-current") !== selected) {
          button.setAttribute("aria-current", selected);
        }
      });
    };
    const observer = new MutationObserver(syncCurrent);
    if (rail)
      observer.observe(rail, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-current"],
      });
    syncCurrent();
    const onClick = (event) => {
      const button = event.target.closest(".rbtn");
      if (button && !button.classList.contains("siraaj-tab")) close();
    };
    rail?.addEventListener("click", onClick, true);
    return () => {
      observer.disconnect();
      siblings.forEach((child, index) => {
        child.hidden = hidden[index];
      });
      current?.setAttribute("aria-current", "true");
      rail?.removeEventListener("click", onClick, true);
    };
  }, [open, close]);
  useEffect(() => {
    if (!started || !historyReady || !conversationRef.current) return;
    const conversation = conversationRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    let active = true;
    let chat;
    setLoading(true);
    setError("");
    setWelcome(conversation.messages.length === 0);
    setEvidence(conversation.evidence);
    setConversationTitle(conversation.title);
    loadChat()
      .then(() => {
        if (!active || !mount.current) return;
        chat = document.createElement("deep-chat");
        chat.history = conversation.messages.map((message) => ({ ...message }));
        chat.style.cssText =
          "display:block;box-sizing:border-box;width:100%;height:100%;min-height:0;border:0;background:transparent;font-family:DM Sans,Segoe UI,system-ui,sans-serif;font-size:14px;";
        chat.messageStyles = {
          default: {
            shared: {
              bubble: {
                fontSize: "15px",
                lineHeight: "1.75",
                color: "#253C35",
              },
              outerContainer: { marginBottom: "24px" },
            },
            user: {
              bubble: {
                backgroundColor: "rgba(224, 237, 222, .66)",
                border: "1px solid rgba(255,255,255,.85)",
                boxShadow: "inset 0 1px 2px #fff, 0 5px 15px #214a3c0a",
                backdropFilter: "blur(16px)",
                borderRadius: "22px",
                padding: "12px 20px",
                maxWidth: "82%",
              },
            },
            ai: {
              bubble: {
                backgroundColor: "transparent",
                borderRadius: "0",
                padding: "0 4px",
                width: "100%",
                maxWidth: "100%",
              },
            },
          },
        };
        chat.inputAreaStyle = {
          padding: "12px 20px 4px",
          boxSizing: "border-box",
          maxWidth: "820px",
          width: "100%",
          margin: "0 auto",
        };
        chat.textInput = {
          placeholder: { text: "Message Siraaj", style: { color: "#8A958D" } },
          styles: {
            container: {
              border: "1px solid rgba(255,255,255,.95)",
              backdropFilter: "blur(24px) saturate(1.4)",
              borderRadius: "26px",
              backgroundColor: "rgba(255,255,255,.62)",
              width: "100%",
              boxSizing: "border-box",
              margin: "0",
              padding: "16px 18px",
              boxShadow:
                "inset 0 2px 2px #fff, inset 0 -3px 4px #214a3c0c, 0 10px 28px #214a3c14, 0 0 0 1px #214a3c12",
            },
            focus: {
              borderColor: "#A7B99A",
              boxShadow: "0 3px 18px rgba(37,60,53,.08)",
            },
            text: {
              color: "#253C35",
              fontFamily: "DM Sans, Segoe UI, system-ui, sans-serif",
              fontSize: "15px",
              lineHeight: "1.6",
              minHeight: "28px",
              maxHeight: "150px",
              paddingRight: "48px",
            },
          },
        };
        const sendIcon =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
        chat.submitButtonStyles = {
          position: "inside-end",
          tooltip: { text: "Send message" },
          submit: {
            container: {
              default: {
                backgroundColor: "#285846",
                backgroundImage:
                  "linear-gradient(155deg, #61937b99, #214a3cdd)",
                border: "1px solid #ffffff66",
                boxShadow:
                  "inset 0 2px 2px #ffffff66, inset 0 -3px 3px #102e3255, 0 4px 9px #214a3c33",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: "7px",
                boxSizing: "border-box",
              },
              hover: { backgroundColor: "#315D4B" },
            },
            svg: {
              content: sendIcon,
              styles: { default: { filter: "brightness(0) invert(1)" } },
            },
          },
          disabled: {
            container: {
              default: {
                backgroundColor: "#E3E8DF",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                padding: "7px",
                boxSizing: "border-box",
              },
            },
            svg: {
              content: sendIcon,
              styles: { default: { filter: "none", color: "#95A18F" } },
            },
          },
        };
        chat.auxiliaryStyle = `
        #chat-view{display:flex!important;flex-direction:column;height:100%;min-height:0}
        #messages{flex:1;min-height:0;height:auto!important;overflow-y:auto;width:100%;max-width:820px;margin:0 auto;box-sizing:border-box;padding:64px 24px 68px;scrollbar-width:thin;scrollbar-color:#D9E1D5 transparent}
        #input{flex:0 0 auto;height:auto!important;align-items:stretch}
        #text-input-container{align-items:center;height:auto!important;min-height:64px}
        #text-input{box-sizing:border-box}
        .inside-end{right:14px!important;bottom:14px!important}
        .message-bubble p{margin-top:0}
        @media(max-width:700px){#messages{padding:64px 18px 68px}#input{padding:10px 12px 4px!important}.inside-end{right:13px!important}#text-input-container{padding:13px 16px!important}}
      `;
        chat.errorMessages = { displayServiceErrorMessages: true };
        chat.requestBodyLimits = {
          maxMessages: 30,
          totalMessagesMaxCharLength: 60000,
        };
        chat.connect = {
          handler: async (body, signals) => {
            if (
              !active ||
              controller.signal.aborted ||
              conversationRef.current?.id !== conversation.id
            )
              return;
            setWelcome(false);
            const userMessage = body.messages.at(-1);
            if (userMessage?.role === "user") {
              conversation.messages = [
                ...conversation.messages,
                { role: "user", text: userMessage.text },
              ];
              if (conversation.messages.length === 1)
                conversation.title = userMessage.text
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 80);
              conversation.evidence = [];
              setEvidence([]);
              persist(conversation);
            }
            try {
              const data = await requestChat(
                {
                  messages: body.messages,
                  department:
                    document.querySelector(".site-title h1")?.textContent ||
                    "OFC",
                },
                { signal: controller.signal },
              );
              if (
                active &&
                !controller.signal.aborted &&
                conversationRef.current?.id === conversation.id
              ) {
                conversation.messages = [
                  ...conversation.messages,
                  { role: "ai", text: data.text },
                ];
                conversation.evidence = data.evidence || [];
                persist(conversation);
                setEvidence(data.evidence || []);
                await signals.onResponse({ text: data.text });
              }
            } catch (reason) {
              if (
                active &&
                !controller.signal.aborted &&
                conversationRef.current?.id === conversation.id
              )
                await signals.onResponse({
                  error:
                    reason instanceof Error
                      ? reason.message
                      : "Could not connect to Siraaj. Please try again.",
                });
            }
          },
        };
        chatRef.current = chat;
        mount.current.replaceChildren(chat);
        chat.onComponentRender = () => {
          if (active) {
            setLoading(false);
            if (!workspace.current?.hidden) chat?.focusInput();
          }
        };
      })
      .catch((reason) => {
        if (active) {
          setLoading(false);
          setError(reason.message);
        }
      });
    return () => {
      active = false;
      controller.abort();
      if (chatRef.current === chat) chatRef.current = null;
      chat?.remove();
    };
  }, [started, session, historyReady]);
  return (
    <section
      ref={workspace}
      id="siraaj-workspace"
      className="siraaj-workspace siraaj-glass"
      hidden={!open}
      aria-label="Siraaj assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (historyOpen) {
            setHistoryOpen(false);
            historyButton.current?.focus();
            return;
          }
          close();
          document.querySelector(".siraaj-tab")?.focus();
        }
      }}
    >
      <div className="siraaj-topbar">
        <div className="siraaj-brand">
          <img src="/brand/siraaj.svg" alt="" width="32" height="32" />
          <div>
            <strong>Siraaj</strong>
            <span>Your OFC assistant</span>
          </div>
        </div>
        <div className="siraaj-topbar-actions">
          <button
            ref={historyButton}
            type="button"
            className="siraaj-glass-button"
            aria-expanded={historyOpen}
            aria-controls="siraaj-history"
            onClick={() => setHistoryOpen((value) => !value)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M3 11a9 9 0 1 1 2.5 7M3 4v7h7M12 7v5l3 2" />
            </svg>
            History
          </button>
          <button
            type="button"
            id="siraaj-new"
            className="siraaj-glass-button siraaj-new-button"
            onClick={() => selectConversation(null)}
            disabled={!historyReady}
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
            New chat
          </button>
        </div>
      </div>
      {storageError && (
        <p className="siraaj-storage-error" role="status">
          {storageError}
        </p>
      )}
      <div className={`siraaj-stage ${historyOpen ? "has-history" : ""}`}>
        {historyOpen && (
          <SiraajHistory
            conversations={conversations}
            selected={conversationRef.current?.id}
            onSelect={selectConversation}
            onDelete={removeConversation}
            onClose={() => {
              setHistoryOpen(false);
              historyButton.current?.focus();
            }}
          />
        )}
        <div className="siraaj-chat-card">
          <div className="siraaj-conversation-bar">
            <span title={conversationTitle}>
              {welcome ? "New conversation" : conversationTitle}
            </span>
            <SiraajEvidence evidence={evidence} />
          </div>
          <div className="siraaj-welcome" hidden={!welcome}>
            <span className="siraaj-welcome-mark">
              <img
                src="/brand/siraaj.svg"
                alt="Siraaj"
                width="52"
                height="52"
              />
            </span>
            <span className="siraaj-eyebrow">OFC KNOWLEDGE</span>
            <h2>What can I help with?</h2>
            <p>
              Ask about your opportunity, gate requirements and source
              documents, or explore OFC department records.
            </p>
            <div className="siraaj-suggestions">
              {[
                [
                  "Investment briefing",
                  "Summarize the selected opportunity and its main evidence gaps. Cite the sources.",
                ],
                [
                  "Critical tasks",
                  "Which outstanding tasks or gate requirements need attention, and who owns them?",
                ],
                [
                  "Management briefing",
                  "Draft talking points for the current investment stage. Separate facts, demo assumptions and proposed next steps.",
                ],
              ].map(([label, prompt]) => (
                <button
                  type="button"
                  key={label}
                  disabled={loading || Boolean(error)}
                  onClick={() =>
                    chatRef.current?.submitUserMessage({ text: prompt })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p id="siraaj-loading" role="status" hidden={!loading && !error}>
            {error || "Loading chat…"}
          </p>
          <div id="siraaj-chat-mount" ref={mount} />
          <p className="siraaj-disclaimer">
            Financial actuals through Feb 2026. Check sources and reporting
            periods.
          </p>
          <span
            id="siraaj-status"
            className="sr-only"
            role="status"
            aria-live="polite"
          >
            {session > 0 && welcome ? "New conversation started" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
