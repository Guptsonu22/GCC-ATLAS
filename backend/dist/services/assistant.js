"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssistantService = createAssistantService;
const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'what', 'which', 'how', 'why', 'when', 'where', 'who',
    'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would', 'can', 'could',
    'this', 'that', 'these', 'those', 'about', 'from', 'into', 'tell', 'more', 'than',
    'compare', 'between', 'some', 'all', 'any', 'not', 'you', 'your', 'our',
]);
const METRIC_LABELS = {
    gcc_count_estimated: 'Tracked GCCs (estimated)',
    tech_talent_pool_estimated: 'Tech talent pool (estimated)',
    office_rent_grade_a: 'Grade-A office rent (indicative)',
    metro_rail_km_operational: 'Metro rail network (operational km)',
    senior_engineer_total_comp: 'Senior engineer total comp (indicative)',
    entry_engineer_total_comp: 'Entry-level engineer total comp (indicative)',
};
function createAssistantService(db) {
    async function retrieveAsync(query) {
        const q = query.toLowerCase();
        const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOPWORDS.has(t));
        const matches = (text) => {
            if (!text)
                return false;
            const lower = text.toLowerCase();
            return tokens.some((t) => lower.includes(t));
        };
        const allCompanies = (await db.all(`SELECT c.id, c.name, c.parent_company, c.headquarters_country, c.india_entry_year,
              c.operating_status, c.description, s.name AS sector_name
       FROM companies c LEFT JOIN sectors s ON s.id = c.sector_id`));
        const allCities = (await db.all(`SELECT l.id, l.name, l.state, l.tier,
              (SELECT COUNT(DISTINCT cl.company_id) FROM company_locations cl WHERE cl.location_id = l.id) AS tracked_company_count
       FROM locations l`));
        const matchedCityIds = allCities.filter((c) => matches(c.name) || matches(c.state)).map((c) => c.id);
        const metrics = matchedCityIds.length
            ? (await db.all(`SELECT m.*, l.name AS city_name, s.title AS source_title, s.url AS source_url, s.verification_status
           FROM city_metrics m JOIN locations l ON l.id = m.location_id
           LEFT JOIN source_records s ON s.id = m.source_id
           WHERE m.location_id IN (${matchedCityIds.map(() => '?').join(',')})`, matchedCityIds))
            : [];
        const policies = (await db.all(`SELECT p.*, s.title AS source_title, s.url AS source_url, s.publisher AS source_publisher FROM policy_records p
       LEFT JOIN source_records s ON s.id = p.source_id`));
        const announcements = (await db.all(`SELECT a.id, a.title, a.summary, a.announcement_type, a.announcement_date, a.is_verified,
              c.name AS company_name, l.name AS location_name, s.title AS source_title, s.url AS source_url
       FROM announcements a
       LEFT JOIN companies c ON c.id = a.company_id
       LEFT JOIN locations l ON l.id = a.location_id
       LEFT JOIN source_records s ON s.id = a.source_id
       ORDER BY a.announcement_date DESC`));
        return {
            // Strong evidence: matched by company name, parent company, or city/state.
            companies: allCompanies.filter((c) => matches(c.name) || matches(c.parent_company)),
            // Weak/related: matched only via sector keyword — displayed but never
            // counted as sufficient evidence.
            related_companies: allCompanies.filter((c) => !(matches(c.name) || matches(c.parent_company)) &&
                matches(c.sector_name)),
            cities: allCities.filter((c) => matches(c.name) || matches(c.state)),
            metrics,
            policies: policies.filter((p) => matches(p.title) || matches(p.state)),
            announcements: announcements.filter((a) => matches(a.title) ||
                matches(a.company_name) ||
                (matchedCityIds.length > 0 && matchedCityIds.includes(a.location_id))),
        };
    }
    function buildCitations(retrieved) {
        const citations = [];
        const seen = new Set();
        const push = (source, excerpt) => {
            if (!source || !source.url || seen.has(source.url))
                return;
            seen.add(source.url);
            citations.push({
                source_id: source.id ?? 'unknown',
                title: source.title ?? 'Untitled source',
                url: source.url,
                publication_date: source.publication_date ?? null,
                relevant_excerpt: excerpt,
            });
        };
        for (const m of retrieved.metrics) {
            push({ id: m.source_id, title: m.source_title, url: m.source_url, publication_date: m.metric_period }, `${m.city_name}: ${m.metric_name} = ${m.metric_value} ${m.metric_unit} (${m.metric_period}); ${m.metric_definition}`);
        }
        for (const p of retrieved.policies) {
            push({ id: p.source_id, title: p.source_title, url: p.source_url, publication_date: p.effective_date }, `${p.title}: ${p.description}`);
        }
        for (const a of retrieved.announcements) {
            push({ id: a.source_id ?? undefined, title: a.source_title, url: a.source_url, publication_date: a.announcement_date }, `${a.title}: ${a.summary}`);
        }
        return citations.slice(0, 8);
    }
    function formatMetricValue(m) {
        const value = m.metric_value;
        if (value === null || value === undefined)
            return 'Not available';
        const unit = m.metric_unit ?? '';
        return `${value} ${unit}`.trim();
    }
    function composeDemoAnswer(query, retrieved) {
        const parts = [];
        const cityNames = retrieved.cities.map((c) => c.name);
        if (retrieved.cities.length >= 2) {
            parts.push(`### Comparison: ${cityNames.join(' vs ')}`);
            const metricNames = [...new Set(retrieved.metrics.map((m) => m.metric_name))];
            if (metricNames.length) {
                parts.push('| Metric | ' + cityNames.join(' | ') + ' |');
                parts.push('|' + '---|'.repeat(cityNames.length + 1));
                for (const metricName of metricNames) {
                    const row = cityNames.map((city) => {
                        const m = retrieved.metrics.find((x) => x.metric_name === metricName && x.city_name === city);
                        if (!m)
                            return 'Not available';
                        const flag = m.confidence_level === 'low' ? ' (estimate, low confidence)' : ' (estimate)';
                        return `${formatMetricValue(m)}${flag}`;
                    });
                    parts.push(`| ${METRIC_LABELS[metricName] ?? metricName} | ${row.join(' | ')} |`);
                }
            }
            parts.push('');
            parts.push('_All figures are indicative estimates with stated confidence levels. Verify against latest primary reports before making decisions._');
        }
        if (retrieved.cities.length >= 1 && retrieved.cities.length < 2) {
            const city = retrieved.cities[0];
            parts.push(`### ${city.name} (${city.state})`);
            parts.push(`Tracked GCC presence in this dataset: **${city.tracked_company_count} companies**.`);
            const cityMetrics = retrieved.metrics.slice(0, 6);
            if (cityMetrics.length) {
                parts.push('');
                for (const m of cityMetrics) {
                    parts.push(`- **${METRIC_LABELS[m.metric_name] ?? m.metric_name}**: ${formatMetricValue(m)} (${m.metric_period}) — ${m.confidence_level === 'low' ? 'low-confidence estimate' : 'estimate'}`);
                }
            }
        }
        if (retrieved.companies.length) {
            parts.push(`### Companies matching your query (${retrieved.companies.length})`);
            for (const c of retrieved.companies.slice(0, 6)) {
                parts.push(`- **${c.name}** (${c.sector_name ?? 'sector n/a'}) — status: ${c.operating_status}${c.india_entry_year ? `, in India since ${c.india_entry_year}` : ''}. ${c.description ?? ''}`);
            }
        }
        if (retrieved.policies.length) {
            parts.push(`### Relevant policies (${retrieved.policies.length})`);
            for (const p of retrieved.policies.slice(0, 4)) {
                parts.push(`- **${p.title}** (${p.state}, ${p.effective_date ?? 'n/a'}, ${p.is_active ? 'active' : 'lapsed'}): ${p.description ?? ''}`);
            }
            parts.push('');
            parts.push('_Policy details must be verified against official state documents — links below are portal homepages pending exact-document verification._');
        }
        if (retrieved.announcements.length) {
            parts.push(`### Related announcements (${retrieved.announcements.length})`);
            for (const a of retrieved.announcements.slice(0, 5)) {
                const who = a.company_name ?? a.location_name ?? 'Industry';
                parts.push(`- **${a.title}** — ${who}, ${a.announcement_date} (${a.is_verified ? 'verified' : 'unverified'}): ${a.summary ?? ''}`);
            }
        }
        if (retrieved.related_companies.length) {
            parts.push(`### Possibly related companies (matched by sector keyword only)`);
            for (const c of retrieved.related_companies.slice(0, 5)) {
                parts.push(`- **${c.name}** (${c.sector_name ?? 'sector n/a'}) — ${c.description ?? ''}`);
            }
        }
        const strongEvidence = retrieved.cities.length > 0 ||
            retrieved.companies.length > 0 ||
            retrieved.policies.length > 0 ||
            retrieved.announcements.length > 0;
        const insufficient = !strongEvidence;
        if (insufficient) {
            parts.push('I could not find sufficient evidence in the GCC Atlas dataset to answer this question.');
            parts.push('');
            parts.push('The dataset currently covers tracked GCC companies, six core cities with indicative metrics, state policies, service providers, and recent announcements. Try asking about a specific city (e.g., "Compare Bengaluru and Hyderabad"), a company (e.g., "Tell me about Microsoft India"), or a policy (e.g., "Karnataka GCC policy").');
            parts.push('');
            parts.push('_Note: this is the deterministic demo mode, answering only from the local dataset. Configure an AI key on the server for generative answers._');
        }
        else {
            parts.push('');
            parts.push('---');
            parts.push('_Demo mode: this answer was composed deterministically from the local GCC Atlas dataset — not generated by an LLM. Facts above are limited to what the dataset contains; recommendations and assumptions are not included in demo mode._');
        }
        return { answer: parts.join('\n'), insufficient };
    }
    async function callLlm(query, retrieved) {
        const apiKey = process.env.AI_API_KEY;
        const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
        const model = process.env.AI_MODEL || 'gpt-4o-mini';
        const contextSections = [];
        if (retrieved.cities.length) {
            contextSections.push(`CITIES: ${JSON.stringify(retrieved.cities)}`);
        }
        if (retrieved.metrics.length) {
            contextSections.push(`CITY METRICS (all indicative estimates): ${JSON.stringify(retrieved.metrics.slice(0, 20))}`);
        }
        if (retrieved.companies.length) {
            contextSections.push(`COMPANIES: ${JSON.stringify(retrieved.companies.slice(0, 10))}`);
        }
        if (retrieved.policies.length) {
            contextSections.push(`POLICIES: ${JSON.stringify(retrieved.policies.slice(0, 5))}`);
        }
        if (retrieved.announcements.length) {
            contextSections.push(`ANNOUNCEMENTS: ${JSON.stringify(retrieved.announcements.slice(0, 8))}`);
        }
        const systemPrompt = [
            'You are the GCC Atlas research assistant for India\u2019s Global Capability Centre ecosystem.',
            'Answer ONLY using the CONTEXT provided. Cite sources inline using their source ids like [src:ID].',
            'If the context is insufficient, say so explicitly instead of guessing.',
            'Clearly separate facts from recommendations and assumptions.',
            'Never invent numbers, companies, policies, or sources.',
            'All city metrics in context are indicative estimates — say so when you use them.',
        ].join(' ');
        const userContent = contextSections.length
            ? `CONTEXT:\n${contextSections.join('\n\n')}\n\nQUESTION: ${query}`
            : `CONTEXT: (empty — no matching records)\n\nQUESTION: ${query}`;
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userContent },
                ],
                temperature: 0.2,
                max_tokens: 900,
            }),
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new Error(`LLM provider error ${response.status}: ${detail.slice(0, 300)}`);
        }
        const payload = (await response.json());
        const answer = payload.choices?.[0]?.message?.content?.trim();
        if (!answer)
            throw new Error('LLM returned an empty response');
        const usedSourceIds = [...answer.matchAll(/\[src:([a-z0-9_]+)\]/gi)].map((m) => m[1]);
        const allSources = await db.all(`SELECT * FROM source_records WHERE id IN (${usedSourceIds.length ? usedSourceIds.map(() => '?').join(',') : 'NULL'})`, usedSourceIds);
        const citations = allSources.map((s) => ({
            source_id: s.id,
            title: s.title,
            url: s.url,
            publication_date: s.publication_date ?? null,
            relevant_excerpt: 'Referenced in the answer; verify details at the linked source.',
        }));
        const insufficient = contextSections.length === 0;
        return {
            answer,
            citations,
            confidence: insufficient ? 'low' : 'medium',
            is_demo_mode: false,
            insufficient_evidence: insufficient,
        };
    }
    async function answer(request) {
        const retrieved = await retrieveAsync(request.query);
        const hasApiKey = Boolean(process.env.AI_API_KEY) && !request.use_demo_mode;
        if (hasApiKey) {
            try {
                return await callLlm(request.query, retrieved);
            }
            catch (err) {
                // Transparent fallback: report the failure, then answer deterministically.
                const demo = composeDemoAnswer(request.query, retrieved);
                return {
                    answer: `> ⚠️ The configured LLM provider failed (${err instanceof Error ? err.message : 'unknown error'}). Showing the deterministic dataset answer instead.\n\n${demo.answer}`,
                    citations: buildCitations(retrieved),
                    confidence: 'low',
                    is_demo_mode: true,
                    insufficient_evidence: demo.insufficient,
                };
            }
        }
        const demo = composeDemoAnswer(request.query, retrieved);
        return {
            answer: demo.answer,
            citations: buildCitations(retrieved),
            confidence: demo.insufficient ? 'low' : 'medium',
            is_demo_mode: true,
            insufficient_evidence: demo.insufficient,
        };
    }
    return { answer };
}
//# sourceMappingURL=assistant.js.map