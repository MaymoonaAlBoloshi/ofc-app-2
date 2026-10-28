import { intake } from "../../../lib/intake.mjs";
import { mutate, readState } from "../../../lib/store.mjs";
import { sameOrigin, bodyBytes, failure } from "../../../lib/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request) {
  try {
    sameOrigin(request);
    const q = new URL(request.url).searchParams,
      version = Number(q.get("version"));
    const initial = await readState();
    if (initial.version !== version)
      throw Error("Workspace changed. Refresh before uploading.");
    const result = await intake(
      await bodyBytes(request, 25 * 1024 * 1024),
      q.get("name") || "",
    );
    if (!result.documents.length)
      throw Error(result.skipped.join("; ") || "No supported files found.");
    const state = await mutate(
      {
        action: "documents",
        id: q.get("id"),
        role: q.get("role"),
        documents: result.documents,
      },
      version,
    );
    return Response.json({
      state,
      skipped: result.skipped,
      count: result.documents.length,
    });
  } catch (e) {
    return failure(e);
  }
}
