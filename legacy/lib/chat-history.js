export const HISTORY_KEY = "ofc-siraaj-history-v1";
export const ACTIVE_CHAT_KEY = "ofc-siraaj-active-v1";
export function newConversation() {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    updatedAt: new Date().toISOString(),
    messages: [],
    evidence: [],
  };
}
export function readConversations() {
  const stored = JSON.parse(
    localStorage.getItem(chatStorageKey(HISTORY_KEY)) || "[]",
  );
  if (!Array.isArray(stored)) throw new Error("Invalid conversation history");
  return stored
    .filter((item) => {
      return (
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.updatedAt === "string" &&
        Number.isFinite(Date.parse(item.updatedAt)) &&
        Array.isArray(item.messages) &&
        item.messages.every(
          (message) =>
            message &&
            ["user", "ai"].includes(message.role) &&
            typeof message.text === "string",
        ) &&
        Array.isArray(item.evidence) &&
        item.evidence.every(
          (source) =>
            source &&
            ["id", "entity", "locator", "path"].every(
              (key) => typeof source[key] === "string",
            ),
        )
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
// Merge against the latest store so saving in one tab preserves other conversations.
export function saveConversation(conversation) {
  const conversations = [
    conversation,
    ...readConversations().filter((item) => item.id !== conversation.id),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  localStorage.setItem(
    chatStorageKey(HISTORY_KEY),
    JSON.stringify(conversations),
  );
  localStorage.setItem(chatStorageKey(ACTIVE_CHAT_KEY), conversation.id);
  return conversations;
}
export function deleteConversation(id) {
  const conversations = readConversations().filter((item) => item.id !== id);
  localStorage.setItem(
    chatStorageKey(HISTORY_KEY),
    JSON.stringify(conversations),
  );
  if (localStorage.getItem(chatStorageKey(ACTIVE_CHAT_KEY)) === id)
    localStorage.removeItem(chatStorageKey(ACTIVE_CHAT_KEY));
  return conversations;
}

export function chatStorageKey(key) {
  const opportunity =
    typeof location !== "undefined"
      ? new URL(location.href).searchParams.get("opportunity")
      : "";
  return "ofc2:" + key + ":" + (opportunity || "general");
}
