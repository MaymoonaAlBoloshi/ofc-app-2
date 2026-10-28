import { readFile } from "node:fs/promises";
import path from "node:path";
import { mutate, readState } from "../../../lib/store.mjs";
import { intake } from "../../../lib/intake.mjs";
import { sameOrigin, failure } from "../../../lib/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request) {
  try {
    sameOrigin(request);
    let s = await readState();
    const name = "ORCI opportunity study";
    if (s.opportunities.some((o) => o.name === name))
      throw Error(
        "The ORCI example already exists. Select it from the pipeline.",
      );
    const pack = await intake(
      await readFile(
        path.join(process.cwd(), "fixtures/ORCI_DD_Demo_Pack.zip"),
      ),
      "ORCI_DD_Demo_Pack.zip",
    );
    s = await mutate(
      {
        action: "create",
        role: "Investment",
        name,
        type: "Brownfield",
        sector: "Food and beverages",
      },
      s.version,
    );
    s = await mutate(
      {
        action: "documents",
        role: "Investment",
        id: s.opportunities[0].id,
        documents: pack.documents,
      },
      s.version,
    );
    return Response.json(s);
  } catch (e) {
    return failure(e);
  }
}
