import type { Database } from 'sqlite';
import type { Citation } from '../../types';

export interface Retrieved {
  companies: Record<string, unknown>[];
  related_companies: Record<string, unknown>[];
  cities: Record<string, unknown>[];
  metrics: Record<string, unknown>[];
  policies: Record<string, unknown>[];
  announcements: Record<string, unknown>[];
  providers: Record<string, unknown>[];
  /** Citations reachable ONLY from retrieved records — the citation whitelist. */
  evidence: Map<string, Citation>;
  matched: Record<string, number>;
  time_window_days: number | null;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'what', 'which', 'how', 'why', 'when', 'where', 'who',
  'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'can', 'could',
  'this', 'that', 'these', 'those', 'about', 'from', 'into', 'tell', 'more', 'than',
  'compare', 'between', 'some', 'all', 'any', 'not', 'you', 'your', 'our',
]);

/** Spelling variants commonly used for the seeded city names. */
const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru', bengaluru: 'Bengaluru',
  hyderabad: 'Hyderabad', pune: 'Pune', mumbai: 'Mumbai', bombay: 'Mumbai',
  chennai: 'Chennai', madras: 'Chennai', gurugram: 'Gurugram', gurgaon: 'Gurugram',
  kolkata: 'Kolkata', calcutta: 'Kolkata', noida: 'Noida',
};

const RECENT_WORDS = new Set(['recent', 'recently', 'latest', 'new', 'fresh', 'ongoing', 'current']);
const TIME_WINDOW_DAYS = 90;

// Hard caps — retrieval must never ship an unbounded context.
export const RETRIEVAL_CAPS = {
  cities: 4,
  metricsPerCity: 6,
  companies: 8,
  relatedCompanies: 4,
  policies: 8,
  announcements: 12,
  providers: 8,
  evidence: 12,
  contextChars: 14000,
} as const;

function tokenize(q: string): string[] {
  return q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

export function detectTimeWindowDays(q: string): number | null {
  const lower = q.toLowerCase();
  if (/\blast\s+year\b|\bthis\s+year\b|\b12\s*months\b/.test(lower)) return 365;
  if (/\bquarter\b|\b3\s*months\b/.test(lower)) return 120;
  if (/\brecent|latest\b|new/ .test(lower) ) return TIME_WINDOW_DAYS;
  return null;
}

export function createRetrieval(db: Database) {
  async function retrieve(query: string): Promise<Retrieved> {
    const tokens = tokenize(query);
    const matches = (text: string | null | undefined): boolean => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return tokens.some((t) => lower.includes(t));
    };
    const timeWindowDays = detectTimeWindowDays(query);

    const allCompanies = (await db.all(
      `SELECT c.id, c.name, c.parent_company, c.headquarters_country, c.india_entry_year,
              c.operating_status, c.description, s.name AS sector_name
       FROM companies c LEFT JOIN sectors s ON s.id = c.sector_id`,
    )) as Record<string, unknown>[];

    const allCities = (await db.all(
      `SELECT l.id, l.name, l.state, l.tier,
              (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l`,
    )) as Record<string, unknown>[];

    // City matching: canonical name/state tokens + spelling aliases.
    const wantedCities = new Map<string, Record<string, unknown>>();
    const wantedStates = new Map<string, Record<string, unknown>>();
    for (const c of allCities) {
      const name = String(c.name ?? '').toLowerCase();
      const state = String(c.state ?? '').toLowerCase();
      const alias = CITY_ALIASES[name];
      if (tokens.includes(name) || (alias && tokens.includes(alias.toLowerCase()))) {
        wantedCities.set(c.id as string, c);
      } else if (tokens.some((t) => state.includes(t))) {
        wantedStates.set(c.id as string, c);
      }
    }
    const matchedCityIds = [...wantedCities.keys(), ...wantedStates.keys()];
    const matchedCities = [...wantedCities.values(), ...wantedStates.values()];

    const metrics = matchedCityIds.length
      ? (await db.all(
          `SELECT m.*, l.name AS city_name, s.title AS source_title, s.url AS source_url,
                  s.id AS source_id, s.verification_status AS source_verification_status
           FROM city_metrics m JOIN locations l ON l.id = m.location_id
           LEFT JOIN source_records s ON s.id = m.source_id
           WHERE m.location_id IN (${matchedCityIds.slice(0, RETRIEVAL_CAPS.cities).map(() => '?').join(',')})
           ORDER BY m.location_id, m.metric_name`,
          matchedCityIds.slice(0, RETRIEVAL_CAPS.cities),
        )) as Record<string, unknown>[]
      : [];

    const policies = (await db.all(
      `SELECT p.*, s.title AS source_title, s.url AS source_url, s.publisher AS source_publisher,
              s.id AS source_id, s.verification_status AS source_verification_status
       FROM policy_records p LEFT JOIN source_records s ON s.id = p.source_id`,
    )) as Record<string, unknown>[];

    const announcements = (await db.all(
      `SELECT a.id, a.title, a.summary, a.announcement_type, a.announcement_date, a.is_verified,
              c.name AS company_name, l.name AS location_name, s.title AS source_title, s.url AS source_url,
              s.id AS source_id, s.verification_status AS source_verification_status
       FROM announcements a
       LEFT JOIN companies c ON c.id = a.company_id
       LEFT JOIN locations l ON l.id = a.location_id
       LEFT JOIN source_records s ON s.id = a.source_id
       ${timeWindowDays ? `WHERE a.announcement_date >= datetime('now', '-${Number(timeWindowDays)} days')` : ''}
       ORDER BY a.announcement_date DESC`,
    )) as Record<string, unknown>[];

    const allProviders = (await db.all(
      `SELECT p.id, p.name, p.category, p.subcategory, p.description, p.website, p.is_verified,
              p.verification_notes, s.title AS source_title, s.url AS source_url,
              s.id AS source_id, s.verification_status AS source_verification_status
       FROM service_providers p
       LEFT JOIN provider_sources ps ON ps.provider_id = p.id
       LEFT JOIN source_records s ON s.id = ps.source_id`,
    )) as Record<string, unknown>[];

    const matchedCompanyCareers = new Map<string, Record<string, unknown>>();
    for (const c of allCompanies) {
      if (matches(c.name as string) || matches(c.parent_company as string)) {
        matchedCompanyCareers.set(c.id as string, c);
      }
    }
    const relatedCompanies: Record<string, unknown>[] = [];
    for (const c of allCompanies) {
      if (matchedCompanyCareers.has(c.id as string)) continue;
      if (matches(c.sector_name as string)) relatedCompanies.push(c);
      if (relatedCompanies.length >= RETRIEVAL_CAPS.relatedCompanies) break;
    }

    const matchedCompanies = [...matchedCompanyCareers.values()].slice(0, RETRIEVAL_CAPS.companies);

    const matchedProviders: Record<string, unknown>[] = [];
    // Providers match ONLY with an explicit provider intent — generic words in
    // descriptions ("GCC setup") must not hijack city/company queries.
    const providerIntent = /provider|vendor|consult|recruit|legal|payroll|real.?estate|\beor\b/i.test(query);
    if (providerIntent) {
      const capabilityHitIds = new Set<string>();
      if (tokens.length) {
        const capRows = (await db.all(
          `SELECT DISTINCT provider_id FROM provider_capabilities WHERE ${tokens.slice(0, 6).map(() => 'capability LIKE ?').join(' OR ')}`,
          tokens.slice(0, 6).map((t) => `%${t}%`),
        )) as unknown as { provider_id: string }[];
        for (const row of capRows) capabilityHitIds.add(row.provider_id);
      }
      for (const p of allProviders) {
        if (
          matches(p.name as string) ||
          matches(p.subcategory as string) ||
          matches(p.category as string) ||
          capabilityHitIds.has(p.id as string)
        ) {
          matchedProviders.push(p);
          if (matchedProviders.length >= RETRIEVAL_CAPS.providers) break;
        }
      }
    }

    const matchedPolicies = policies.filter((p) => matches(p.title as string) || matches(p.state as string)).slice(0, RETRIEVAL_CAPS.policies);

    const matchedAnnouncements = announcements.filter(
      (a) =>
        matches(a.title as string) ||
        matches(a.company_name as string) ||
        timeWindowDays !== null ||
        (matchedCityIds.length > 0 && matchedCityIds.includes(a.location_id as string)),
    ).slice(0, RETRIEVAL_CAPS.announcements);

    // Citation whitelist: every retrieved record row that carries a source id.
    const evidence = new Map<string, Citation>();
    const pushEvidence = (source: Record<string, unknown> | undefined, excerpt: string) => {
      const id = source?.source_id ?? source?.id;
      const url = source?.source_url;
      const title = source?.source_title ?? source?.title;
      if (!id || !url || !title || evidence.has(id as string)) return;
      evidence.set(id as string, {
        source_id: id as string,
        title: String(title),
        url: String(url),
        publication_date: (source?.publication_date as string) ?? null,
        relevant_excerpt: excerpt.slice(0, 280),
        verification_status: (source?.source_verification_status as string) ?? null,
      });
    };

    for (const m of metrics) {
      pushEvidence(m, `${m.city_name}: ${m.metric_name} = ${m.metric_value} ${m.metric_unit ?? ''} (${m.metric_period ?? 'n/a'}); ${m.metric_definition ?? ''}`);
    }
    for (const p of matchedPolicies) {
      pushEvidence(p, `${p.title} (${p.state}, status ${p.status ?? 'n/a'}): ${p.description ?? ''}`);
    }
    for (const a of matchedAnnouncements) {
      pushEvidence(a, `${a.title} — ${a.company_name ?? a.location_name ?? 'industry'}, ${a.announcement_date ?? 'n/a'}: ${a.summary ?? ''}`);
    }
    for (const p of matchedProviders) {
      pushEvidence(p, `${p.name} (${p.category ?? 'provider'}): ${p.description ?? ''}`);
    }

    const cappedEvidence = [...evidence.values()].slice(0, RETRIEVAL_CAPS.evidence);
    const evidenceFinal = new Map(cappedEvidence.map((c) => [c.source_id, c]));

    return {
      companies: matchedCompanies,
      related_companies: relatedCompanies,
      cities: matchedCities.slice(0, RETRIEVAL_CAPS.cities),
      metrics: metrics.slice(0, RETRIEVAL_CAPS.metricsPerCity * RETRIEVAL_CAPS.cities),
      policies: matchedPolicies,
      announcements: matchedAnnouncements,
      providers: matchedProviders,
      evidence: evidenceFinal,
      matched: {
        companies: matchedCompanies.length,
        cities: matchedCities.length,
        explicit_cities: wantedCities.size,
        providers: matchedProviders.length,
        policies: matchedPolicies.length,
        announcements: matchedAnnouncements.length,
      },
      time_window_days: timeWindowDays,
    };
  }

  return { retrieve };
}

export type AssistantRetrieval = ReturnType<typeof createRetrieval>;
