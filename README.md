# OFC Investment Studio

A separate rebuild of the investment lifecycle, based on `../source of truth.pdf` and the upload formats in `fixtures/ORCI_DD_Demo_Pack.zip`. OFC_Next remains unchanged.

## Run locally

Requires Node.js 22.12 or later, Python 3 and `pdftotext` (Poppler). This workspace currently reuses the installed dependencies through a `node_modules` symlink. On another machine, install dependencies with `npm ci`.

```sh
cd /home/maymona/Documents/ofc/ofc-app-2
npm run dev
```

Open http://127.0.0.1:3004. Select **Start ORCI example** to create a case and extract its 42 documents. The example does not invent investment amounts, evidence reviews or approvals.

For production mode, run `npm run build`, then `npm start`.

## Workflow

1. SG1 covers initial screening, all PIN topics, value assurance and CEO or CIO approval.
2. SG2 assigns pre-feasibility preparation to Asset Management, value assurance to Investment and study-budget confirmation to Finance. Both CEO and CIO report reviews precede the committee decision.
3. SG3 requires detailed evaluation, Finance confirmation before consultant appointment, Legal endorsement, execution deliverables, assurance, post-analysis EC review and IC or Board FID approval.
4. Asset Management accepts the documents, approvals, historical records and ownership. PMO supports execution under Asset Management ownership.
5. Execution or integration reviews precede ongoing financial, operational and governance monitoring. These are operational phases, not additional numbered investment gates in the supplied PDF.

The source describes EC review after detailed analysis in section 2.4, following the SG3 material in section 2.3. This implementation treats it as a required post-analysis EC review before IC/Board FID. This interpretation is recorded explicitly rather than silently skipping the review.

Each requirement has an accountable team, assessment, source references and review status. Optional requirements require a reviewed non-applicability justification. Source templates and reference lists cannot satisfy a completed requirement. Changes invalidate the current report until a fresh version is prepared and reviewed. Earlier approved versions retain their evidence snapshots.

Information requests return the report and create follow-up tasks. Conditional approvals require an owner, deadline and release point for each condition. Closure or deferral requires a justified closure report and the designated authority: CIO at SG1, EC at SG2, Board from SG3 onward. Submitted closure requests block gate progression until resolved.

## Automation

- PDF, DOCX, XLSX, CSV and TXT extraction, with ZIP intake, duplicate detection and original-file download.
- Suggested content categories, template classifications and warnings for missing information, example values, incomplete screening and conflicting data.
- Opportunity overview suggestions and source excerpts for individual assessments. **Prefill from evidence** prepares all empty assessments while preserving existing work.
- Automatic preparation tasks, suggested dates and meeting follow-up tasks.
- Structured report drafts and optional Siraaj drafting, with saved versions, review records and source snapshots.
- Retrieval of official sources from pepsioman.com, msx.om and mcd.om, including linked PDF extraction. Other research can be uploaded with a citation.
- Shared financial period records, calculated revenue variance and adjusted EBITDA, board appointments, KPIs and quarterly reporting archives.

Drafting and extraction do not establish that a study is adequate or a document authentic. A responsible reviewer must assess the actual evidence. The system blocks missing workflow requirements; it cannot independently validate the truth of a signed review.

**Download PDF** renders the exact saved version locally using Chrome. **Open report** provides a printable layout and a browser Print / save PDF fallback. Closure reports also support PDF export. Set `OFC2_CHROME` if Chrome is not at `/usr/bin/google-chrome`.

## Siraaj

Report drafting runs as a background job on the local Node server. The Reports tab polls its status; Tasks stays usable. Job status is saved under `data/report-jobs`, so a page reload can reconnect. A server restart interrupts an active job and presents a retry message. This worker assumes one persistent Node process; deployment to serverless or multiple workers requires a shared job queue. Provider requests have a five-minute limit. Provider outages or upstream timeouts can still fail a job, with a structured-draft fallback.

Report completion checks the opportunity stage, evidence revision and report history before saving. Task scheduling edits do not discard a running report, and task saves tolerate unrelated report completion while still rejecting conflicting edits to the same task.

The local `.env.local` uses the same server-side Siraaj settings as OFC_Next. It is ignored by Git. On another installation, configure:

```text
SIRAAJ_API_KEY=your-provider-key
SIRAAJ_BASE_URL=https://your-provider.example/v1
SIRAAJ_MODEL=your-model
```

Structured drafting works without an AI provider. Provider errors are displayed explicitly. External research failures offer the option to upload the source manually. Long-running operations show their current activity and elapsed time.

## Persistence and demo boundaries

Records are stored in `data/workspace.json`; original files are stored by hash in `data/files/`. `OFC2_DATA_DIR` overrides the directory. Writes are serialized within one server process and use atomic file replacement plus optimistic version checks. Run one server process against each data directory.

This is a local demonstration with selectable department roles, not production authentication or a tamper-proof audit service. It has no real committee membership verification or electronic signatures. Do not expose the local server publicly as a production approval platform.

The ORCI documents describe themselves as public-source demo compilations, not company-issued evidence. Some are blank forms; screening is explicitly incomplete. The source pack is provided for intake demonstrations. Synthetic approval records in tests are stored separately and never appear in the normal workspace.

Image-only or encrypted PDFs require a readable copy or manual TXT excerpt. Spreadsheet formulas use saved cached values and are not recalculated. Excerpts are limited to 80,000 characters per document. Original files remain downloadable. Individual documents have a 10 MB limit; ZIP uploads have a 25 MB compressed limit, 80 MB expanded limit and 100-file limit.

## Verification

```sh
npm test
npm run build
npm run test:browser
npm run test:journey
npm run test:reports
```

The browser layout check uses the running app on port 3004. The journey test starts the built app on port 3005 with a temporary data directory, exercises ORCI intake and the full SG1 interface, then verifies all subsequent transitions through the server API and inspects the final asset views. It does not call the AI provider or change the normal workspace. Screenshots are written to `test-results/`.

Set `OFC2_FIREFOX` to a Playwright-compatible Firefox executable on another machine. This workspace uses the existing OFC_Next Firefox installation.

`npm run test:live` makes a real configured AI-provider call using synthetic evidence and fetches the official MSX company page. It is separate from the ordinary tests. The live Siraaj and MSX checks passed during implementation. The Pepsi Oman site returned HTTP 406; the app reports this and retains the manual-upload fallback.
