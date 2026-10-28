import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { seed, applyCommand } from "./engine.mjs";
export const dataRoot = () =>
  process.env.OFC2_DATA_DIR || path.join(process.cwd(), "data");
export async function readState() {
  try {
    return JSON.parse(
      await readFile(path.join(dataRoot(), "workspace.json"), "utf8"),
    );
  } catch (e) {
    if (e.code === "ENOENT") return seed();
    throw e;
  }
}
const key = Symbol.for("ofc2.writeQueue");
globalThis[key] ??= Promise.resolve();
export async function mutate(command, expectedVersion) {
  const run = globalThis[key].then(async () => {
    const state = await readState();
    if (typeof expectedVersion === "function") expectedVersion(state);
    else if (expectedVersion !== state.version)
      throw Error("This workspace changed. Refresh and retry your action.");
    const next =
      typeof command === "function"
        ? command(state)
        : applyCommand(state, command);
    await mkdir(dataRoot(), { recursive: true });
    const file = path.join(dataRoot(), "workspace.json");
    await writeFile(file + ".tmp", JSON.stringify(next, null, 2));
    await rename(file + ".tmp", file);
    return next;
  });
  globalThis[key] = run.catch(() => {});
  return run;
}
