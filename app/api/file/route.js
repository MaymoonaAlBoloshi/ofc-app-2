import { readState, dataRoot } from "../../../lib/store.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  const s = await readState();
  const d = s.opportunities
    .flatMap((o) => o.documents)
    .find((d) => d.id === id);
  if (!d) return new Response("File not found", { status: 404 });
  try {
    return new Response(
      await readFile(path.join(dataRoot(), "files", d.hash)),
      {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`,
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response("Original file unavailable", { status: 404 });
  }
}
