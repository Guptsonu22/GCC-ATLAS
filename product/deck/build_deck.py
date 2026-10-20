"""
GCC Atlas — Flexiple Product Intern strategy deck builder (Phase 9).

Builds `gcc-atlas-strategy-deck.pptx` (12 slides, 16:9, dark product theme,
real prototype screenshots, every quantitative claim source-tagged) and a
PDF twin rendered with reportlab.

Facts come ONLY from research/ + product/ docs + the tracked dataset; no
market claims are invented. Hypotheses/proposals are labelled.
"""
import os
from pptx import Presentation
from pptx.util import Inches as In, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.abspath(os.path.join(HERE, '..', '..', 'qa', 'deck-assets'))
OUT_PPTX = os.path.join(HERE, 'gcc-atlas-strategy-deck.pptx')

# ---- palette -----------------------------------------------------------------
BG = RGBColor(0x0B, 0x12, 0x20)       # deep navy (product theme)
PANEL = RGBColor(0x13, 0x1C, 0x2E)    # cards
PANEL2 = RGBColor(0x0F, 0x17, 0x26)
INK = RGBColor(0xEA, 0xF1, 0xFC)      # primary text
MUT = RGBColor(0x94, 0xA3, 0xB8)      # secondary text
TEAL = RGBColor(0x2D, 0xD4, 0xBF)     # accent
AMBER = RGBColor(0xF5, 0x9E, 0x0B)    # hypothesis/estimate flags
RED = RGBColor(0xF8, 0x71, 0x71)
LINE = RGBColor(0x24, 0x30, 0x48)

prs = Presentation()
prs.slide_width = In(13.333)
prs.slide_height = In(7.5)
BLANK = prs.slide_layouts[6]
FOOT = 'GCC Atlas (working title) — Flexiple Product Intern assignment · pre-alpha prototype · sources: research/source-register.csv (S##) '

def rect(slide, x, y, w, h, fill=PANEL, line=None, radius=True):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, In(x), In(y), In(w), In(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line: shp.line.color.rgb = line; shp.line.width = Pt(0.75)
    else: shp.line.fill.background()
    shp.shadow.inherit = False
    if radius: shp.adjustments[0] = 0.08
    return shp

def txt(slide, x, y, w, h, runs, size=14, color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, leading=1.0, space_after=0):
    """runs: str | list[(text, dict overrides)]"""
    box = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    tf = box.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    p = tf.paragraphs[0]; p.alignment = align; p.line_spacing = leading; p.space_after = Pt(space_after)
    if isinstance(runs, str): runs = [(runs, {})]
    for text, o in runs:
        r = p.add_run(); r.text = text
        r.font.size = Pt(o.get('size', size)); r.font.bold = o.get('bold', bold)
        r.font.color.rgb = o.get('color', color); r.font.name = 'Calibri'
        r.font.italic = o.get('italic', False)
    return box

def bullets(slide, x, y, w, h, items, size=13, color=MUT, gap=6, leading=1.08, marker='▪'):
    box = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    tf = box.text_frame; tf.word_wrap = True
    tf.margin_left = 0; tf.margin_top = 0; tf.margin_right = 0; tf.margin_bottom = 0
    first = True
    # simpler: items = list of [head, body, headcolor]
    for i, it in enumerate(items):
        head = body = ''
        hc = TEAL
        if isinstance(it, tuple):
            head = it[0]
            if len(it) > 1: body = it[1]
            if len(it) > 2 and isinstance(it[2], RGBColor): hc = it[2]
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(gap); p.line_spacing = leading
        if marker and head:
            r = p.add_run(); r.text = '▪  '; r.font.size = Pt(size); r.font.color.rgb = hc; r.font.name = 'Calibri'
        if head:
            r = p.add_run(); r.text = head; r.font.size = Pt(size); r.font.bold = True; r.font.color.rgb = hc; r.font.name = 'Calibri'
        if body:
            r = p.add_run(); r.text = body; r.font.size = Pt(size); r.font.color.rgb = color; r.font.name = 'Calibri'
    return box

def chrome(slide, idx, title, kicker=None, src_line=True):
    bg = slide.background
    bg.fill.solid(); bg.fill.fore_color.rgb = BG
    rect(slide, 0, 0, 13.333, 7.5, fill=BG, radius=False)
    if kicker:
        txt(slide, 0.55, 0.32, 9, 0.3, kicker, size=11, color=TEAL, bold=True)
    txt(slide, 0.55, 0.62, 10.6, 0.75, title, size=27, bold=True)
    slide.shapes.add_line(In(0.55), In(1.42), In(12.78), In(1.42), 1.0, color=LINE) if False else None
    ln = slide.shapes.add_connector(1, In(0.55), In(1.44), In(12.78), In(1.44))
    ln.line.color.rgb = LINE; ln.line.width = Pt(1)
    # footer
    txt(slide, 0.55, 7.06, 11.4, 0.3, FOOT.strip(), size=9, color=RGBColor(0x64, 0x74, 0x8B))
    txt(slide, 12.15, 7.06, 0.9, 0.3, f'{idx:02d} / 12', size=9, color=RGBColor(0x64, 0x74, 0x8B), align=PP_ALIGN.RIGHT)
    if src_line:
        pass

def kpi(slide, x, y, w, h, num, label, sub, ncol=TEAL):
    rect(slide, x, y, w, h, fill=PANEL, line=LINE)
    txt(slide, x + 0.18, y + 0.16, w - 0.36, 0.28, label, size=10.5, color=MUT)
    txt(slide, x + 0.18, y + 0.44, w - 0.36, 0.6, num, size=30, bold=True, color=ncol)
    txt(slide, x + 0.18, y + h - 0.55, w - 0.34, 0.5, sub, size=8.5, color=RGBColor(0x64, 0x74, 0x8B), leading=0.95)

def tag(slide, x, y, text, color=AMBER, tc=BG):
    sh = rect(slide, x, y, 0.2 + len(text) * 0.096, 0.28, fill=color, radius=True)
    txt(slide, x + 0.1, y + 0.015, 0.2 + len(text) * 0.096, 0.25, text, size=9.5, bold=True, color=tc)
    return sh

def pic_panel(slide, img, x, y, w, h, caption, cap_color=MUT):
    rect(slide, x, y, w, h + 0.34, fill=PANEL2, line=LINE)
    sw, sh_ = In(w - 0.16), In(h - 0.16)
    slide.shapes.add_picture(os.path.join(ASSETS, img), In(x + 0.08), In(y + 0.06), width=sw, height=sh_)
    txt(slide, x + 0.08, y + h + 0.03, w - 0.16, 0.28, caption, size=9.5, color=cap_color)

def bar_chart(slide, x, y, w, h, cats, vals, colors, maxv=None, val_fmt='{:4.2f}'):
    maxv = maxv or max(vals)
    n = len(cats)
    cw = w / n
    for i, (c, v, col) in enumerate(zip(cats, vals, colors)):
        bh = (v / maxv) * (h - 0.62)
        bx = x + i * cw
        rect(slide, bx + cw * 0.14, y + h - 0.62 - bh + 0.34, cw * 0.72, bh, fill=col, radius=False)
        txt(slide, bx + cw * 0.10, y + h - 0.62 + 0.36, cw * 0.8, 0.3, c, size=9, color=MUT, align=PP_ALIGN.CENTER)
        txt(slide, bx + cw * 0.06, y + h - 0.66 + 0.34 - bh - 0.02, cw * 0.88, 0.25, val_fmt.format(v), size=9.5, bold=True, color=INK, align=PP_ALIGN.CENTER)

# ============================================================================
# SLIDE 1 — Title
# ============================================================================
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, fill=BG, radius=False)
rect(s, 0, 0, 0.14, 7.5, fill=TEAL, radius=False)
txt(s, 0.85, 1.65, 11.0, 0.4, 'FLEXIPLE PRODUCT INTERN ASSIGNMENT · PRE-ALPHA PROTOTYPE', size=12.5, color=TEAL, bold=True)
txt(s, 0.85, 2.0, 11.6, 1.35, [('GCC Atlas — India\u2019s GCC ecosystem, made searchable.', {})], size=39, bold=True)
txt(s, 0.85, 3.42, 11.2, 0.8, 'Provenance-first city, policy and company comparison for India capability-centre decisions:\nevery number carries its source, its date, and its counting denominator.', size=16, color=MUT, leading=1.15)
tag(s, 0.85, 4.45, 'WORKING TITLE — name collision flagged (S38)', color=AMBER)
tag(s, 7.05, 4.62, 'COMPOSITES FROM EVIDENCE — NO INTERVIEWS CONDUCTED', color=RED)
# stat chips
y = 5.15
for i, (num, lbl, src) in enumerate([('2,117', 'GCCs (parent-level)', 'FY2026 · S01/S02'), ('3,728', 'GCC units', 'FY2026 · S01'), ('39%', 'of 2025 office absorption', 'CBRE · S20'), ('$98.4B', 'GCC revenue FY26', 'Nasscom–Zinnov · S02')]):
    kpi(s, 0.85 + i * 3.0, y, 2.82, 1.55, num, lbl.upper(), src, ncol=TEAL)
txt(s, 0.85, 6.95, 11.6, 0.35, 'Prototype runs from the repo: `npm run setup && npm run seed && npm run dev:api` + `npm run dev:web` (full walkthrough: deployment/demo-walkthrough.md)', size=10.5, color=RGBColor(0x64, 0x74, 0x8B))

# ============================================================================
# SLIDE 2 — Problem
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 2, 'The problem: fragmented intelligence, costly decisions', 'PROBLEM')
txt(s, 0.55, 1.62, 12.2, 0.62, 'India\u2019s GCC ecosystem is large, fast and definitionally messy — the decision layer above company directories is nowhere assembled.', size=15, color=MUT, leading=1.1)
for i, (num, lbl, sub) in enumerate([
    ('2,117', 'GCCs parent-level FY2026', 'Nasscom–Zinnov · S01/S02'),
    ('$98.4B', 'FY2026 revenue', 'same series · S02; 3 adds independent confirm'),
    ('39%', 'of 2025 office-absorption is GCCs', 'CBRE leasing records · S20/S22'),
]):
    kpi(s, 0.55 + i * 4.0, 2.35, 3.8, 1.62, num, lbl.upper(), sub)
rect(s, 0.55, 4.25, 12.23, 2.62, fill=PANEL, line=LINE)
bullets(s, 0.8, 4.5, 11.8, 2.3, [
    ('8+ state policies in 8+ formats. ', 'Karnataka, TN, UP, Gujarat, Kerala… each publish subsidy tables in different shapes (payroll %, land subsidy, stamp duty, OPEX caps) — normalizing them is manual analyst work (S05–S19).'),
    ('Counting regimes conflict. ', '2,117 GCCs / $98.4B (Nasscom–Zinnov, S02) vs "$164B / 4.2M jobs" (Wizmatic via Statesman, S04 — low-confidence definitional outlier, registered as a conflict, never averaged).'),
    ('The comparison is done by consultants on 3–6-week cycles.', 'A build-vs-lease decision uses brokerage PDFs + press releases + Excel (S01, S24); a defensible shortlist with citations can take weeks to assemble.'),
    ('Source quality varies wildly. ', 'DIY city directories contain row-level coding mistakes (GCC Village: ~473 Hyderabad vs ~100 Bengaluru rows, S35) that can misinform a location case.'),
], size=13, gap=9)
txt(s, 0.55, 6.92, 12.2, 0.3, 'Everything above is cited; no market-size figure on this slide is our own estimate.', size=9.5, color=RGBColor(0x64, 0x74, 0x8B))

# ============================================================================
# SLIDE 3 — Stakeholders
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 3, 'Who feels the information asymmetry', 'STAKEHOLDERS (composite personas, evidence-based)')
def persona(x, name, role, color, pains, basis, primary=False):
    rect(s, x, 1.75, 3.95, 4.9, fill=PANEL, line=color if primary else LINE)
    tag(s, x + 0.2, 1.98, 'PRIMARY — designed for' if primary else 'secondary — served', color=color)
    txt(s, x + 0.2, 2.42, 3.55, 0.4, name, size=19, bold=True)
    txt(s, x + 0.2, 2.82, 3.55, 0.55, role, size=11.5, color=MUT, leading=1.05)
    bullets(s, x + 0.2, 3.5, 3.6, 2.6, [(p, '', color) for p in pains], size=11, gap=6, marker='–')
    txt(s, x + 0.2, 6.15, 3.55, 0.5, basis, size=8.5, color=RGBColor(0x64, 0x74, 0x8B), leading=1.0)
persona(0.55, 'Priya Raman', 'Location-strategy lead, MNC expansion desk', TEAL, [
    'Translates headcount mandate → city criteria',
    'Needs ranked prospects w/ talent + cost + subsidy facts',
    'Must defend the shortlist to CFO + consultants',
    'Fears "why is this number different?" in review',
], 'Basis: 64% of GCC space take-up by her class of buyer (S20,S21); UK/US firms drive 37–45% of India office absorption (S24). Composites; no interviews.', primary=True)
persona(4.7, 'Rakesh', 'State investment-promotion (IPA) officer', RGBColor(0x60, 0xA5, 0xFA), [
    'Competes vs peer states with numbers, not slogans',
    'Wants a shareable neutral page for prospects',
    'Fears third-party tables painting the state unfairly',
], 'Basis: 8+ states run GCC-acquisition playbooks with published targets (S05,S10,S13,S16). Secondary persona — distribution catalyst in v1.')
persona(8.85, 'Maya', 'Provider / enabler BD lead (RE, legal, staffing)', RGBColor(0xF4, 0x72, 0x8B), [
    'Wants ready-to-engage demand signals',
    'Currently pays $3.5K–$10K for lead surfaces (S30)',
    'v1 gives her nothing to pay for — trust cultivated first',
], 'Basis: GCC Explorer monetizes exactly this class (S30); AIM watchlists purchased by this class (S32).')
txt(s, 0.55, 6.78, 12.2, 0.35, 'Anti-personas by design: job-seekers (no JTBD) and competitor scrapers. Everything persona-labelled as [inference] through Phase-3 validation gates.', size=10, color=RGBColor(0x64, 0x74, 0x8B))

# ============================================================================
# SLIDE 4 — Workarounds & competitive landscape
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 4, 'Current workarounds and where they stop', 'COMPETITIVE LANDSCAPE (verified, S30–S38)')
cols = [
    ('GCC Explorer (AIM Research)', '1,680+ GCC directory, daily analyst updates, contacts, watchlists. $3,500–$10,000 per seat cycle; free tier = 15 companies (S30/S31/S32).', 'Not a city-DECISION tool: no policy-incentive normalization, no side-by-side compare with counting denominators (S30 pages reviewed).'),
    ('Consultancies (CBRE/JLL/Zinnov)', 'Authoritative bespoke decks; mandates; human nuance (S01, S20–S24).', 'Time + fees; 3–6 week cycles; not self-serve at session speed.'),
    ('State portals + PIB PDFs', 'Primary-source truth; free (S05–S19).', '8+ formats; conflicting denominators; normalization is analyst hours.'),
    ('DIY directories (GCC Village et al.)', 'Free coverage slices (S35–S37).', 'Row-level coding inconsistencies (S35); unverified; no provenance.'),
]
yy = 1.72
for i, (t, good, gap) in enumerate(cols):
    x = 0.55 + (i % 2) * 6.25
    y = 1.72 + (i // 2) * 2.28
    rect(s, x, y, 6.0, 2.12, fill=PANEL, line=LINE)
    txt(s, x + 0.2, y + 0.14, 5.6, 0.32, t, size=14, bold=True, color=TEAL if i == 0 else INK)
    txt(s, x + 0.2, y + 0.5, 5.6, 0.75, good, size=10.5, color=MUT, leading=1.06)
    rect(s, x + 0.2, y + 1.4, 5.6, 0.62, fill=PANEL2, line=None)
    txt(s, x + 0.34, y + 1.47, 5.35, 0.5, [('Their gap: ', {'bold': True, 'color': AMBER}), (gap, {})], size=10.5, leading=1.02)
txt(s, 0.55, 6.35, 12.2, 0.55, [('White space we occupy: ', {'bold': True, 'color': TEAL}), ('a free, provenance-linked city-vs-city comparison layer with explicit counting denominators — no verified analog exists across the scanned landscape.', {})], size=12.5, leading=1.1)

# ============================================================================
# SLIDE 5 — Opportunity map
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 5, 'Opportunity map and prioritization', 'SCORING (research/opportunity-prioritization.md)')
cats = ['O2 City atlas', 'O1 Directory', 'O3 Policy tracker', 'O5 Comp bands', 'O4 Watchlist', 'O7 AI report', 'O6 Contacts resale']
vals = [4.40, 4.30, 4.15, 3.60, 3.30, 3.10, 1.40]
cols_ = [TEAL, RGBColor(0x60, 0xA5, 0xFA), RGBColor(0x60, 0xA5, 0xFA), RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x2A, 0x35, 0x50)]
bar_chart(s, 0.55, 1.6, 7.3, 4.3, cats, vals, cols_, maxv=5.0)
txt(s, 0.55, 5.95, 7.2, 0.6, 'Scores = weighted TAM / underservedness / public-data feasibility / prototype fit / risk (weights 20/30/25/15/10). Method + rubric documented in research/opportunity-prioritization.md.', size=9.5, color=RGBColor(0x64, 0x74, 0x8B), leading=1.05)
rect(s, 8.15, 1.6, 4.63, 4.95, fill=PANEL, line=LINE)
txt(s, 8.35, 1.78, 4.25, 0.35, 'WINNER: O2 — the decision layer', size=13.5, bold=True, color=TEAL)
bullets(s, 8.35, 2.2, 4.25, 3.6, [
    ('City atlas + location-comparison ', 'is the most underserved, most buildable surface (O2 score 4.40).'),
    ('O1 directory and O3 policy tracker ship as ', 'supporting modules inside it.'),
    ('Deliberately excluded: ', 'contact-data resale (O6: name/legal risk, S38), watchlists/O4 (needs live ingestion infrastructure), comp-band library (O5: licensing cost, Phase-3 candidate).'),
    ('Falsification path: ', 'if a real expansion desk says a one-week spreadsheet solves it, we pivot to O4 (documented in research §6).'),
], size=10.5, gap=7)

# ============================================================================
# SLIDE 6 — Initial target customer & JTBD
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 6, 'Initial target customer and the job to be done', 'PRIMARY SEGMENT')
rect(s, 0.55, 1.7, 6.1, 5.1, fill=PANEL, line=LINE)
txt(s, 0.75, 1.92, 5.7, 0.4, 'Job statement (from primary persona)', size=13, bold=True, color=TEAL)
rect(s, 0.75, 2.35, 5.7, 1.15, fill=PANEL2, line=None)
txt(s, 0.9, 2.48, 5.42, 0.95, '“Compare candidate cities for a new GCC — talent, policies, real-estate cost and sector peers — for a specific function, with every number carrying its counting denominator and its source.”', size=12.5, color=INK, leading=1.14)
bullets(s, 0.75, 3.75, 5.75, 2.95, [
    ('JTBD 1 — Frame: ', 'mandate → city criteria (function, tier, cost ceiling).'),
    ('JTBD 2 — Shortlist: ', 'ranked candidates with facts (talent, rent, subsidy).'),
    ('JTBD 3 — Defend: ', 'comparison survives CFO + consultant scrutiny, cited.'),
    ('JTBD 4 — Act: ', 'know exactly which IPA contact / subsidy applies (TN 30/20/10% payroll bands S06; UP ₹20,000/fresher S10).'),
], size=11.5, gap=8)
rect(s, 6.95, 1.7, 5.85, 5.1, fill=PANEL, line=LINE)
txt(s, 7.15, 1.92, 5.45, 0.4, 'Why this segment first', size=13, bold=True, color=TEAL)
bullets(s, 7.15, 2.35, 5.5, 3.3, [
    ('Documented demand density: ', 'US/global firms drove 37–45% of recent office absorption; this class pays for location intelligence (CBRE/JLL advisory hours, S20–S24; GCC Explorer $3.5K–$10K, S30).'),
    ('Worst information-workflow fit: ', '8+ policy formats + conflicting market counts = exactly the asymmetry documented in market-research §2–3.'),
    ('Reachable for validation ', 'via IPA relationships + expansion-team desks (both self-identify publicly) [inference].'),
    ('Acceptance is measurable: ', 'M1 time-to-answer metric is instrumentable end-to-end.'),
], size=11.5, gap=8)
tag(s, 7.15, 5.95, '[inference] items bound for Phase-3 interviews', color=AMBER)

# ============================================================================
# SLIDE 7 — Product & differentiated value
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 7, 'The product and its differentiated value proposition', 'WHAT IS BUILT (running prototype)')
rect(s, 0.55, 1.62, 12.23, 0.72, fill=PANEL2, line=LINE)
txt(s, 0.75, 1.74, 11.9, 0.5, None if False else '', size=1)
txt(s, 0.75, 1.72, 11.9, 0.55, [('One line: ', {'bold': True, 'color': TEAL}), ('evidence-first India GCC location intelligence — the decision layer above directories, below bespoke consulting ("free to look, defensible to reuse").', {})], size=13.5, leading=1.1)
feats = [
    ('City Intelligence', '12 tracked cities × 6+ metrics; side-by-side compare of 2–4 cities w/ metric definitions, units and EST flags.', 'dataset: tracked records only (scope-labelled)'),
    ('Policy matrix', 'State incentives normalized vs source G.O.s; draft/final states distinct; "not yet tracked" ≠ 0 (Kerala dual targets co-labelled, S16 vs S18).', ''),
    ('Provenance everywhere', '46 GCC records, 36 sources; every figure → source chip → publisher, URL, pub date, verification date, confidence.', 'seed linter fails a build on sourceless values'),
    ('Cited AI assistant', 'Retrieval-pack answers; only retrieved evidence may be cited; hallucinated ids stripped (tested); recommendations separated, basis-labelled; declines when evidence is thin.', 'demo mode composes deterministically without a key'),
    ('Saved research + share', 'Session-scoped server-side persistence (cross-session isolation tested); share links; CSV export.', ''),
    ('Event instrumentation', 'PRD §3.5 catalog (search, detail_view, compare_create, source_click, export, saved_create…) — hashed session keys; aggregate admin.', ''),
]
for i, (t, b, extra) in enumerate(feats):
    x = 0.55 + (i % 3) * 4.13
    y = 2.55 + (i // 3) * 2.2
    rect(s, x, y, 3.97, 2.05, fill=PANEL, line=LINE)
    txt(s, x + 0.16, y + 0.13, 3.65, 0.35, t, size=12.5, bold=True, color=TEAL)
    txt(s, x + 0.16, y + 0.5, 3.66, 1.45, b, size=10.5, color=MUT, leading=1.07)
    if extra:
        txt(s, x + 0.16, y + 1.72, 3.66, 0.3, extra, size=8.5, color=RGBColor(0x64, 0x74, 0x8B))
txt(s, 0.55, 6.9, 12.2, 0.3, 'All coverage claims are dataset-scope-labelled; the app never claims the 2,117 national count as its own data.', size=9.5, color=RGBColor(0x64, 0x74, 0x8B))

# ============================================================================
# SLIDE 8 — Walkthrough (screenshots)
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 8, 'Product walkthrough — genuine prototype captures', 'SCREENSHOTS (headless-browser captures of the running build)')
pic_panel(s, 'compare.png', 0.55, 1.55, 7.55, 2.5, 'Compare Workspace: Bengaluru vs Pune — EST flags, metric definitions, provenance chips, save/copy-link.')
pic_panel(s, 'assistant-answer.png', 8.25, 1.55, 4.53, 2.5, 'Assistant: structured, cited answer (demo mode).')
pic_panel(s, 'sources.png', 0.55, 4.55, 7.55, 2.24, 'Sources: publisher, confidence, verification date + reverse "where used" per source.')
pic_panel(s, 'dashboard.png', 8.25, 4.55, 4.53, 2.24, 'Dashboard: dataset-scope counters + verification ledger.')

# ============================================================================
# SLIDE 9 — Positioning & adoption
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 9, 'Positioning and stakeholder adoption strategy', 'GO-TO-MARKET SEQUENCING [most steps are hypotheses]')
rect(s, 0.55, 1.62, 12.23, 0.95, fill=PANEL2, line=LINE)
txt(s, 0.75, 1.72, 11.9, 0.75, [('Category we aim to create: ', {'bold': True, 'color': TEAL}), ('"evidence-first India GCC location intelligence" — decision layer above directories, below bespoke consulting. We never out-claim Nasscom–Zinnov/CBRE; their data is our source of record (competitive-landscape §4).', {})], size=12.5, leading=1.12)
steps = [
    ('1. IPAs share', 'Free, cited compare links let state IPAs position themselves fairly vs peer states — they become our distribution catalysts (no engine gas needed, S05–S19; S12 shows IPAs actively pitch at NASSCOM events).'),
    ('2. Providers inspect', 'Provider/BD leads verify claims pre-meeting (this class already pays $3.5K–$10K for similar surfaces, S30 — awareness follows the free tier).'),
    ('3. Expansion desks adopt', 'Priya-style desks self-serve pre-work, arrive at consultant conversations evidence-armed; conversion to paid only AFTER free-tier trust (M1/M3 instrumented).'),
]
for i, (t, b) in enumerate(steps):
    x = 0.55 + i * 4.13
    rect(s, x, 2.75, 3.97, 2.6, fill=PANEL, line=LINE)
    txt(s, x + 0.18, 2.95, 3.6, 0.4, t, size=13, bold=True, color=TEAL)
    txt(s, x + 0.18, 3.38, 3.62, 1.9, b, size=10.5, color=MUT, leading=1.1)
rect(s, 0.55, 5.55, 12.23, 1.2, fill=PANEL, line=LINE)
txt(s, 0.75, 5.68, 11.9, 1.0, [('What we deliberately DON\u2019T do: ', {'bold': True, 'color': AMBER}), ('no paid ranking anywhere facts are shown (trust contract), no bulk contact-data resale (O6, name/legal risk S38), no interviews implied in any deck claim (Phase-3 validates all [inference] tags).', {})], size=12, leading=1.15)

# ============================================================================
# SLIDE 10 — Business model & GTM
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 10, 'Business-model hypotheses and go-to-market', 'ALL PRICING = [proposal], UNVALIDATED')
bm = [
    ('H1 · Free core (now)', 'City compare + policy matrix + source register stay free. Reputation density is the wedge; paying for data pre-trust kills it (business-model §1).', TEAL),
    ('H2 · Pro seats [proposal]', '$99–$199/yr individual; $500–$2,000/yr teams of 3–5 — anchored at 3–6% of the market compar\u2019s $3.5K–$10K cycles (S30). Gate: free-tier traction first.', RGBColor(0x60, 0xA5, 0xFA)),
    ('H4 · Reports [proposal]', 'Free quarterly standard; $299–$499 thematic deep-dives once publishing muscle exists (market precedent: free quarterly exists S31; historic $9,999 static lists S33).', RGBColor(0x60, 0xA5, 0xFA)),
    ('H5 · Provider verified [proposal]', '$199–$499/yr verified-profile attributes only — zero influence on rankings/answers; banned-paid-ranking is a standing product rule (business-model §4).', RGBColor(0x60, 0xA5, 0xFA)),
]
for i, (t, b, c) in enumerate(bm):
    x = 0.55 + (i % 2) * 6.25; y = 1.65 + (i // 2) * 1.98
    rect(s, x, y, 6.0, 1.82, fill=PANEL, line=LINE)
    tag(s, x + 0.2, y + 0.14, t, color=c)
    txt(s, x + 0.2, y + 0.52, 5.6, 1.25, b, size=10.5, color=MUT, leading=1.1)
rect(s, 0.55, 5.7, 12.23, 1.1, fill=PANEL2, line=LINE)
txt(s, 0.75, 5.82, 11.9, 0.9, [('GTM hypotheses [proposal, no spend]: ', {'bold': True, 'color': TEAL}), ('content-catalyst loop (share links) + expansion-desk outreach + token funnel metrics (M3 search→detail ≥40%; M1 median <10 min — BOTH are unvalidated targets until Phase 3 instrumentation reports).', {})], size=11.5, leading=1.12)

# ============================================================================
# SLIDE 11 — Trust, AI reliability, risks, metrics
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 11, 'Data trust, AI reliability, risks and success metrics', 'GUARDRAILS THE BUILD ACTUALLY ENFORCES')
rect(s, 0.55, 1.62, 6.05, 5.2, fill=PANEL, line=LINE)
txt(s, 0.75, 1.8, 5.6, 0.35, 'Trust contract (enforced in code, not just values)', size=13, bold=True, color=TEAL)
bullets(s, 0.75, 2.2, 5.7, 4.4, [
    ('Every figure sourced: ', 'seed linter FAILS the build on a sourceless value (F6); provenance chips on all numeric surfaces.'),
    ('Denominators labelled: ', '"GCCs, parent vs units" named at every count (S01/S02-style conflict rendered, never averaged).'),
    ('Conflicts co-shown: ', '$98.4B (S02) vs $164B (S04) both visible, flagged as contested.'),
    ('Missing ≠ zero: ', '"not yet tracked", draft policies flagged; placeholder sources labelled "stale".'),
    ('AI cites or declines: ', 'only retrieved evidence citable; unknown citation ids stripped in tests; insufficiency is an honest low-confidence path; recommendations never blended into facts.'),
], size=11, gap=8)
rect(s, 6.85, 1.62, 5.95, 5.2, fill=PANEL, line=LINE)
txt(s, 7.05, 1.8, 5.55, 0.35, 'Risks + metrics (targets are [proposals])', size=13, bold=True, color=TEAL)
bullets(s, 7.05, 2.2, 5.6, 2.4, [
    ('Coverage honesty: ', '46-company tracked subset; never billed as "all 2,117 GCCs" (S02/S30 context).'),
    ('Name collision: ', 'gcc-atlas.com exists (S38) — working-title label everywhere; trademark check is a Phase-3 gate.'),
    ('Data freshness: ', 'verify-by dates shown; manual re-verification pass scheduled at submission.'),
], size=11, gap=8)
mets = [('M1', 'Time-to-answer < 10 min [proposal]'), ('M2', '100% of displayed figures carry sources (hard invariant); assistant ≥95% answered w/ ≥1 citation [proposal]'), ('M3', 'Search→detail ≥40% [proposal]'), ('M4-M6', 'compare/assistant/provider engagement + no-paid-ranking guardrail countermetrics')]
for i, (m, b) in enumerate(mets):
    txt(s, 7.05, 4.62 + i * 0.58, 0.9, 0.35, m, size=11, bold=True, color=AMBER)
    txt(s, 7.95, 4.62 + i * 0.58, 4.75, 0.56, b, size=10, color=MUT, leading=1.0)

# ============================================================================
# SLIDE 12 — Roadmap & close
# ============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 12, 'Roadmap, prototype and next steps', 'PHASE GATES (product/roadmap.md)')
phases = [
    ('Phase 2 — DONE: working prototype', TEAL, [
        'Research → strategy → full build (Phases 1–8)',
        'Retrieval→citation pipeline + demo fallback',
        'Rate limits, events, session ACL, QA report (94+14 tests green)',
        'Deployment guide + render.yaml + this deck',
    ]),
    ('Phase 3 — validation loop', RGBColor(0x60, 0xA5, 0xFA), [
        '0→1 interviews to replace [inference] tags (5+ expansion desks, 2+ IPAs)',
        'Re-calibrate M1/M3 targets from real funnel data',
        'Trademark check (S38) → rename-or-keep decision',
    ]),
    ('Phase 4 — paid options (gated)', RGBColor(0x3B, 0x55, 0x8A), [
        'H2 seats only after free-traction gate; H3 workspaces; H5 provider profiles under neutrality rules',
        'Monitoring layer F17 if O2 survives falsification tests',
    ]),
]
for i, (t, c, items) in enumerate(phases):
    x = 0.55 + i * 4.13
    rect(s, x, 1.65, 3.97, 3.3, fill=PANEL, line=c)
    txt(s, x + 0.18, 1.83, 3.6, 0.55, t, size=12.5, bold=True, color=c)
    bullets(s, x + 0.18, 2.42, 3.6, 2.4, [(it,) for it in items], size=10, gap=6)
rect(s, 0.55, 5.15, 12.23, 1.5, fill=PANEL2, line=LINE)
txt(s, 0.75, 5.3, 11.9, 1.2, [('The bet, honestly framed: ', {'bold': True, 'color': TEAL}), ('the market is undeniably real and growing; the intelligence layer above it is fragmented and expensive; a discipline-first free comparator is buildable and differentiated. What we have NOT proven: demand (no interviews), willingness-to-pay (proposals only), and defensibility against a fast follower. Every one of those is instrumented to be falsifiable in Phase 3 — which is the point.', {})], size=12.5, leading=1.2)
txt(s, 0.55, 6.72, 12.2, 0.45, 'Prototype + demo script: deployment/demo-walkthrough.md · QA evidence: qa/quality-report.md · Full evidence register: research/source-register.csv · Deck sources: product/deck-evidence-sources.md', size=10, color=RGBColor(0x64, 0x74, 0x8B), leading=1.15)

prs.save(OUT_PPTX)
print('SAVED', OUT_PPTX, os.path.getsize(OUT_PPTX), 'bytes')
