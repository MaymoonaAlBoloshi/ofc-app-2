import { readState } from "../../../lib/store.mjs";
import { reportHtml } from "../../../lib/report-html.mjs";
import { chromium } from "playwright-core";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id"),
    s = await readState(),
    o = s.opportunities.find(
      (o) =>
        o.reports.some((r) => r.id === id) ||
        o.closure?.id === id ||
        o.closures?.some((c) => c.id === id),
    );
  if (!o) return new Response("Report not found", { status: 404 });
  const closure = [o.closure, ...(o.closures || [])].find((c) => c?.id === id);
  const closureVersion = closure
    ? {
        title: "Investment closure report",
        version:
          (o.closures || []).findIndex((c) => c.id === id) + 1 ||
          (o.closures?.length || 0) + 1,
        status: closure.status,
        createdAt: closure.at,
        preparedBy: closure.requestedBy,
        mode: "Recorded closure request",
        sections: [
          {
            title: "Requested outcome and justification",
            text: `${closure.outcome}\n${closure.reason}`,
            sourceIds: [],
          },
          {
            title: "Commitments and follow-up",
            text: closure.commitments,
            sourceIds: [],
          },
          {
            title: "Retained report versions",
            text:
              closure.reportIds
                .map((id) => {
                  const r = o.reports.find((r) => r.id === id);
                  return r ? `${r.title} v${r.version}` : id;
                })
                .join("\n") || "No reports prepared before closure.",
            sourceIds: [],
          },
        ],
        reviews: closure.approvedBy
          ? [
              {
                role: closure.approvedBy,
                at: closure.approvedAt,
                note: closure.approvalNote,
              },
            ]
          : [],
        snapshot: { sources: [] },
      }
    : null;
  const report = closureVersion || o.reports.find((r) => r.id === id);
  const html = reportHtml(o, report);
  if (new URL(request.url).searchParams.get("format") === "pdf") {
    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.OFC2_CHROME || "/usr/bin/google-chrome",
        args: ["--no-sandbox"],
        timeout: 20000,
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 15000 });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "16mm", bottom: "16mm", left: "15mm", right: "15mm" },
      });
      return new Response(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(o.reference + " - " + report.title + " v" + report.version + ".pdf")}`,
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return Response.json(
        {
          error:
            "PDF export is unavailable. Open the saved report and use Print / save PDF.",
        },
        { status: 503 },
      );
    } finally {
      await browser?.close();
    }
  }
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
    },
  });
}
