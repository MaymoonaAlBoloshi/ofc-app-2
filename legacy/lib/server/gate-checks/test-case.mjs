import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
export const gateTestCase = {
  name: 'ONLDC-test',
  referenceCompany: 'ONLDC',
  partner: 'ONLDC reference company (simulation)',
  sector: 'Livestock and animal feed',
  source: 'Supplied ONLDC documents; simulated investment case',
  note: 'Simulation only. Investment amounts, assessments and decisions are test values.',
};
// Resolve private source data at runtime. It is not a bundled application asset.
export const gateTestSource = pathToFileURL(
  path.resolve(
    process.env.SIRAAJ_CLIENT_DATA ||
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../client-data'),
    "Asset Management/MIS/ONLDC/2026/02 Feb'26/MIS Feb 2026 OFC.xlsx",
  ),
);
