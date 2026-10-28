import seed from '../market-snapshot.json' with { type: 'json' };
const COMPANIES = [
  {
    symbol: 'OFMI',
    name: 'Oman Flour Mills',
    website: 'https://omanflourmills.com/',
    logoSource: 'https://omanflourmills.com/assets/img/logo.png',
  },
  {
    symbol: 'ORCI',
    name: 'Oman Refreshment',
    website: 'https://www.pepsioman.com/',
    logoSource: 'https://www.pepsioman.com/images/logo.png',
  },
  {
    symbol: 'SFMI',
    name: 'Salalah Mills',
    website: 'https://salalah-mills.com/',
    logoSource: 'https://salalah-mills.com/wp-content/uploads/2026/02/Salalah-Mills-Logo-White.svg',
    darkLogo: true,
  },
  {
    symbol: 'DFIN',
    name: 'Dhofar Foods & Investment',
    website: 'https://dhofarfoods.om/',
    logoSource:
      'https://dhofarfoods.om/wp-content/themes/SAOG-theme/assets/images/dhofar_foods_and_investment_logo.png',
  },
  {
    symbol: 'SPFI',
    name: 'A’Saffa Foods',
    website: 'https://www.asaffa.com/',
    logoSource: 'https://companieslogo.com/img/orig/SPFI.OM_BIG-7f3f70b4.png?t=1720244494',
  },
  {
    symbol: 'OFCI',
    name: 'Oman Fisheries',
    website: 'https://omanfisheries.com/arabic/',
    logoSource: 'https://omanfisheries.com/arabic/wp-content/uploads/2018/01/Ofclogo_600x.png',
  },
];
export function normalize(company, raw, now = new Date()) {
  if (!Array.isArray(raw)) throw Error('Unexpected exchange response');
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 2);
  const start = cutoff.toISOString().slice(0, 10),
    end = now.toISOString().slice(0, 10);
  const byDate = new Map();
  for (const r of raw) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(r.Date) && r.Date <= end && Number(r.Value) > 0)
      byDate.set(r.Date, { date: r.Date, close: Number(r.Value) });
  }
  const all = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  const ticks = raw
    .filter(
      (r) =>
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(r.Date) &&
        r.Date.slice(0, 10) <= end &&
        Number(r.LTP) > 0,
    )
    .sort((a, b) => a.Date.localeCompare(b.Date));
  const daily = all.at(-1),
    tick = ticks.at(-1);
  if (!daily) throw Error('No valid daily history');
  const useTick = tick && tick.Date.slice(0, 10) >= daily.date;
  const quote = {
    price: useTick ? Number(tick.LTP) : daily.close,
    at: useTick ? tick.Date : daily.date,
    intraday: !!useTick,
  };
  const previous = all.filter((p) => p.date < quote.at.slice(0, 10)).at(-1);
  return {
    ...company,
    source: `https://www.msx.om/snapshot.aspx?s=${company.symbol}`,
    dataSource: `https://www.msx.om/company-chart-data.aspx?s=${company.symbol}`,
    fetchedAt: now.toISOString(),
    quote,
    previous: previous || null,
    change: previous ? quote.price - previous.close : null,
    changePct: previous ? (quote.price / previous.close - 1) * 100 : null,
    start,
    end,
    history: all.filter((r) => r.date >= start),
    error: null,
  };
}

let snapshot = seed;
let lastAttempt = 0;
let pending;

export function getSnapshot() {
  return snapshot;
}

// Each server process caches observations in memory. Deployment needs no writable disk.
export async function refresh() {
  if (pending) return pending;
  if (Date.now() - Math.max(lastAttempt, Date.parse(snapshot.fetchedAt) || 0) < 15 * 60 * 1000)
    return snapshot;
  lastAttempt = Date.now();
  pending = Promise.all(
    COMPANIES.map(async (company) => {
      const old = snapshot.companies.find((item) => item.symbol === company.symbol) || company;
      try {
        const response = await fetch(
          `https://www.msx.om/company-chart-data.aspx?s=${company.symbol}`,
          {
            signal: AbortSignal.timeout(12000),
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          },
        );
        if (!response.ok) throw new Error('Exchange unavailable');
        return { ...normalize(company, await response.json()), logo: old.logo || null };
      } catch {
        return { ...old, error: 'Exchange update unavailable; showing last verified snapshot.' };
      }
    }),
  )
    .then((companies) => {
      snapshot = {
        fetchedAt: new Date().toISOString(),
        source: 'Muscat Stock Exchange',
        delayedMinutes: 15,
        companies,
      };
      return snapshot;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}
