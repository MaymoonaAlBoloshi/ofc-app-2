import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataRoot } from "./store.mjs";
export function classify(doc) {
  const name = doc.name.toLowerCase(),
    text = doc.text;
  const category =
    /kyc|shareholder|ubo|sanctions|incorporation|group.structure|board.and.key/.test(
      name,
    )
      ? "KYC"
      : /finance|financial|income.statement|dividend|valuation|funds|interim/.test(
            name,
          )
        ? "Finance"
        : /regulatory|statutory|licen|tax|labour|foreign.ownership|governance.compliance/.test(
              name,
            )
          ? "Regulatory"
          : /esg|environment|certification|health.and.sugar/.test(name)
            ? "ESG"
            : /index|download.list/.test(name)
              ? "Assurance"
              : "Market";
  const warnings = [
    doc.warning,
    /Demo document compiled/i.test(text)
      ? "Demo compilation from public sources; not company-issued."
      : "",
    /not yet screened/i.test(text) ? "Screening has not been performed." : "",
    /To be provided|to be completed|To be confirmed|Not disclosed/i.test(text)
      ? "Contains missing information or unconfirmed items."
      : "",
    /EXAMPLE\s*[-:]/i.test(text)
      ? "Contains illustrative example values. Do not import these as investment facts."
      : "",
    /reconcile|third.party|third-party/i.test(text)
      ? "Contains third-party data or reconciliation requirements."
      : "",
  ].filter(Boolean);
  const kind = /download.list|index/.test(name)
    ? "Reference"
    : /template|declaration.form|questionnaire|checklist|screening.log/.test(
          name,
        )
      ? "Template"
      : "Source";
  return {
    ...doc,
    category,
    kind,
    warnings,
    researchUrls: [...new Set(text.match(/https:\/\/[^\s<>"|]+/g) || [])].slice(
      0,
      30,
    ),
  };
}
export async function intake(bytes, name) {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "python3",
      [path.join(process.cwd(), "lib/intake.py"), name],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let out = "",
      err = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(Error("Extraction timed out. Try a smaller batch."));
    }, 120000);
    child.stdout.on("data", (x) => {
      out += x;
      if (out.length > 120 * 1024 * 1024) {
        child.kill();
        reject(Error("Extracted files exceed the batch limit."));
      }
    });
    child.stderr.on("data", (x) => (err += x));
    child.stdin.on("error", () => {});
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        if (code)
          throw Error(
            /Maximum|ZIP exceeds|individual file|Unsafe ZIP/.test(err)
              ? err.trim().split("\n").at(-1).replace("ValueError: ", "")
              : "Unable to read the upload. Use PDF, DOCX, XLSX, CSV, TXT or ZIP.",
          );
        resolve(JSON.parse(out));
      } catch (e) {
        reject(e);
      }
    });
    child.stdin.end(bytes);
  });
  await mkdir(path.join(dataRoot(), "files"), { recursive: true });
  for (const d of result.documents) {
    await writeFile(
      path.join(dataRoot(), "files", d.hash),
      Buffer.from(d.bytes, "base64"),
    );
    delete d.bytes;
    Object.assign(d, classify(d));
  }
  return result;
}
