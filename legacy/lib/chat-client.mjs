// Shared transport for quick chat and the full Siraaj workspace.
export class ChatRequestError extends Error {}

export function prepareChatBody(payload) {
  const messages = Array.isArray(payload.messages)
    ? payload.messages.slice(-30).map((m) => ({ role: m.role, text: m.text }))
    : [];
  if (!messages.length || messages.at(-1).role !== "user")
    throw new ChatRequestError("Enter a message to start chatting.");
  if (
    typeof messages.at(-1).text !== "string" ||
    messages.at(-1).text.length > 12000
  )
    throw new ChatRequestError(
      "Please shorten your message to under 12,000 characters.",
    );
  // Keep recent complete turns within the API's byte limit, including Arabic and page context.
  while (
    messages.length > 1 &&
    (messages[0].role !== "user" ||
      messages.some(
        (m) => typeof m.text !== "string" || m.text.length > 12000,
      ) ||
      new TextEncoder().encode(JSON.stringify({ ...payload, messages }))
        .length > 90000)
  ) {
    messages.shift();
  }
  const body = JSON.stringify({ ...payload, messages });
  if (new TextEncoder().encode(body).length > 90000)
    throw new ChatRequestError(
      "This page and message are too large to send together. Try a shorter question.",
    );
  return body;
}
function connectionError(error, signal) {
  if (signal?.aborted) {
    if (signal.reason?.name === "TimeoutError")
      return new ChatRequestError(
        "Siraaj took too long to reply. Your message is still here. Please try again.",
      );
    return (
      signal.reason || new DOMException("Request cancelled.", "AbortError")
    );
  }
  if (error instanceof ChatRequestError) return error;
  return new ChatRequestError(
    "The connection to the app was interrupted. Your message is still here. Please try again; if it continues, refresh this page.",
  );
}
function waitForRetry(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve(undefined);
    }, 500);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export async function requestChat(payload, options = {}) {
  const request = options.request || fetch;
  const signal = AbortSignal.any([
    ...(options.signal ? [options.signal] : []),
    AbortSignal.timeout(65000),
  ]);
  const opportunityId =
    typeof document !== "undefined"
      ? document
          .querySelector("[data-opportunity-id]")
          ?.getAttribute("data-opportunity-id") ||
        new URL(location.href).searchParams.get("opportunity")
      : "";
  const body = prepareChatBody({ ...payload, opportunityId });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await request("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal,
        cache: "no-store",
      });
      if (!response.headers.get("content-type")?.includes("application/json"))
        throw new ChatRequestError(
          "The app server returned an unexpected response. Refresh this page and try again.",
        );
      let data;
      try {
        data = await response.json();
      } catch (error) {
        if (error instanceof SyntaxError)
          throw new ChatRequestError(
            "The app server returned an incomplete reply. Please try again.",
          );
        throw error;
      }
      if (!response.ok)
        throw new ChatRequestError(
          typeof data?.error === "string"
            ? data.error
            : "Siraaj could not reply. Please try again.",
        );
      if (typeof data?.text !== "string" || !data.text.trim())
        throw new ChatRequestError(
          "Siraaj returned an empty reply. Please try again.",
        );
      return data;
    } catch (error) {
      // A network interruption can occur while sending or reading the body. Retry once only.
      // Do not retry provider errors, invalid responses, timeouts or deliberate cancellation.
      if (
        attempt === 0 &&
        !signal.aborted &&
        (error instanceof TypeError || error?.name === "NetworkError")
      ) {
        try {
          await waitForRetry(signal);
        } catch (reason) {
          throw connectionError(reason, signal);
        }
        continue;
      }
      throw connectionError(error, signal);
    }
  }
}
