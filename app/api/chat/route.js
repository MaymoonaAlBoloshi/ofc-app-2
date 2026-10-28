import { sameOrigin, bodyBytes } from "../../../lib/http.mjs";
import { reply } from "../../../legacy/lib/server/chat.mjs";
import {
  openKnowledge,
  retrieve,
} from "../../../legacy/lib/server/knowledge.mjs";
import { opportunityEvidence } from "../../../lib/chat-context.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request) {
  try {
    sameOrigin(request);
    const body = JSON.parse((await bodyBytes(request, 100000)).toString());
    const { messages, department, pageContext, opportunityId } = body;
    if (
      !Array.isArray(messages) ||
      !messages.length ||
      messages.length > 40 ||
      messages.some(
        (m) =>
          !m ||
          !["user", "ai"].includes(m.role) ||
          typeof m.text !== "string" ||
          m.text.length > 12000,
      ) ||
      messages.at(-1).role !== "user"
    )
      return Response.json(
        { error: "Send a valid message under 12,000 characters." },
        { status: 400 },
      );
    const query = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.text)
      .join(" ")
      .slice(-12000);
    let evidence;
    if (opportunityId)
      evidence = await opportunityEvidence(opportunityId, query);
    else {
      const db = openKnowledge();
      try {
        evidence = retrieve(db, query);
      } finally {
        db.close();
      }
    }
    const result = await reply(
      messages,
      department,
      process.env,
      fetch,
      evidence,
      pageContext,
    );
    return Response.json(
      {
        ...result.body,
        evidence:
          result.status === 200
            ? evidence.map(({ id, entity, locator, path }) => ({
                id,
                entity,
                locator,
                path,
              }))
            : [],
      },
      { status: result.status, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e.message || "Chat could not complete. Please retry." },
      { status: 400 },
    );
  }
}
