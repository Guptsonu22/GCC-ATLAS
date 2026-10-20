"""
GCC Atlas — Flexiple Product Intern Strategy Deck Final Builder.

Builds:
- submission/GCC-Atlas-Strategy-Deck-Final.pptx (13 slides, 16:9, dark theme)
- submission/GCC-Atlas-Strategy-Deck-Final.pdf (rendered via PowerPoint COM automation)

Preserves visual identity, research, structure, and evidence-backed strategy.
Incorporates:
1. Module explanations (What, Problem, Why) on the prototype screenshot slide (Slide 9).
2. New "From Fragmented Data to Defensible Decisions" workflow slide (Slide 7).
3. Verified Bengaluru/Karnataka count (38 tracked companies) from the live application.
4. Clear distinction between intended outcomes and validated results.
"""
import os
import sys
from pptx import Presentation
from pptx.util import Inches as In, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
ASSETS = os.path.join(ROOT, 'qa', 'deck-assets')
OUT_PPTX = os.path.join(ROOT, 'submission', 'GCC-Atlas-Strategy-Deck-Final.pptx')
OUT_PDF = os.path.join(ROOT, 'submission', 'GCC-Atlas-Strategy-Deck-Final.pdf')

# ---- Design Palette (Preserved Dark Visual Identity) -------------------------
BG = RGBColor(0x0B, 0x12, 0x20)       # Deep navy background
PANEL = RGBColor(0x13, 0x1C, 0x2E)    # Container cards
PANEL2 = RGBColor(0x0F, 0x17, 0x26)   # Inset sub-cards
INK = RGBColor(0xEA, 0xF1, 0xFC)      # Primary crisp text
MUT = RGBColor(0x94, 0xA3, 0xB8)      # Secondary muted text
TEAL = RGBColor(0x2D, 0xD4, 0xBF)     # Primary accent
CYAN = RGBColor(0x38, 0xBD, 0xF8)     # Secondary accent
AMBER = RGBColor(0xF5, 0x9E, 0x0B)    # Hypothesis / estimate flag
RED = RGBColor(0xF8, 0x71, 0x71)      # Boundary warning
LINE = RGBColor(0x24, 0x30, 0x48)     # Structural dividers
MUT_DARK = RGBColor(0x64, 0x74, 0x8B) # Subtle captions

TOTAL_SLIDES = 13
FOOT = 'GCC Atlas (working title) — Flexiple Product Intern assignment · pre-alpha prototype · sources: research/source-register.csv (S##)'

prs = Presentation()
prs.slide_width = In(13.333)
prs.slide_height = In(7.5)
BLANK = prs.slide_layouts[6]

def rect(slide, x, y, w, h, fill=PANEL, line=None, radius=True):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, In(x), In(y), In(w), In(h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line:
        shp.line.color.rgb = line
        shp.line.width = Pt(0.75)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    if radius:
        shp.adjustments[0] = 0.06
    return shp

def txt(slide, x, y, w, h, runs, size=14, color=INK, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, leading=1.0, space_after=0):
    box = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = leading
    p.space_after = Pt(space_after)
    if isinstance(runs, str):
        runs = [(runs, {})]
    for text, o in runs:
        r = p.add_run()
        r.text = text
        r.font.size = Pt(o.get('size', size))
        r.font.bold = o.get('bold', bold)
        r.font.color.rgb = o.get('color', color)
        r.font.name = 'Calibri'
        r.font.italic = o.get('italic', False)
    return box

def bullets(slide, x, y, w, h, items, size=12, color=MUT, gap=6, leading=1.08, marker='▪'):
    box = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = 0
    tf.margin_top = 0
    tf.margin_right = 0
    tf.margin_bottom = 0
    first = True
    for it in items:
        head = body = ''
        hc = TEAL
        if isinstance(it, tuple):
            head = it[0]
            if len(it) > 1:
                body = it[1]
            if len(it) > 2 and isinstance(it[2], RGBColor):
                hc = it[2]
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.space_after = Pt(gap)
        p.line_spacing = leading
        if marker and head:
            r = p.add_run()
            r.text = f'{marker}  '
            r.font.size = Pt(size)
            r.font.color.rgb = hc
            r.font.name = 'Calibri'
        if head:
            r = p.add_run()
            r.text = head
            r.font.size = Pt(size)
            r.font.bold = True
            r.font.color.rgb = hc
            r.font.name = 'Calibri'
        if body:
            r = p.add_run()
            r.text = body
            r.font.size = Pt(size)
            r.font.color.rgb = color
            r.font.name = 'Calibri'
    return box

def chrome(slide, idx, title, kicker=None):
    rect(slide, 0, 0, 13.333, 7.5, fill=BG, radius=False)
    if kicker:
        txt(slide, 0.55, 0.32, 9.5, 0.28, kicker, size=10.5, color=TEAL, bold=True)
    txt(slide, 0.55, 0.60, 11.2, 0.72, title, size=25, bold=True)
    ln = slide.shapes.add_connector(1, In(0.55), In(1.38), In(12.78), In(1.38))
    ln.line.color.rgb = LINE
    ln.line.width = Pt(1)
    # Footer
    txt(slide, 0.55, 7.08, 11.2, 0.28, FOOT.strip(), size=8.5, color=MUT_DARK)
    txt(slide, 12.0, 7.08, 0.78, 0.28, f'{idx:02d} / {TOTAL_SLIDES:02d}', size=8.5, color=MUT_DARK, align=PP_ALIGN.RIGHT)

def kpi(slide, x, y, w, h, num, label, sub, ncol=TEAL):
    rect(slide, x, y, w, h, fill=PANEL, line=LINE)
    txt(slide, x + 0.16, y + 0.14, w - 0.32, 0.26, label, size=10, color=MUT)
    txt(slide, x + 0.16, y + 0.40, w - 0.32, 0.58, num, size=29, bold=True, color=ncol)
    txt(slide, x + 0.16, y + h - 0.52, w - 0.32, 0.45, sub, size=8.2, color=MUT_DARK, leading=0.95)

def tag(slide, x, y, text, color=AMBER, tc=BG):
    w = 0.18 + len(text) * 0.088
    sh = rect(slide, x, y, w, 0.26, fill=color, radius=True)
    txt(slide, x + 0.08, y + 0.02, w - 0.16, 0.22, text, size=8.5, bold=True, color=tc, align=PP_ALIGN.CENTER)
    return sh

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

# ==============================================================================
# SLIDE 1 — Title
# ==============================================================================
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, fill=BG, radius=False)
rect(s, 0, 0, 0.14, 7.5, fill=TEAL, radius=False)
txt(s, 0.85, 1.60, 11.0, 0.38, 'FLEXIPLE PRODUCT INTERN ASSIGNMENT · PRE-ALPHA PROTOTYPE', size=12, color=TEAL, bold=True)
txt(s, 0.85, 1.95, 11.6, 1.30, [('GCC Atlas — India’s GCC ecosystem, made searchable.', {})], size=38, bold=True)
txt(s, 0.85, 3.35, 11.2, 0.80, 'Provenance-first city, policy and company comparison for India capability-centre decisions:\nevery number carries its source, its date, and its counting denominator.', size=15.5, color=MUT, leading=1.15)
tag(s, 0.85, 4.38, 'WORKING TITLE — name collision flagged (S38)', color=AMBER)
tag(s, 6.85, 4.38, 'COMPOSITES FROM EVIDENCE — NO INTERVIEWS CONDUCTED', color=RED)

y = 4.95
for i, (num, lbl, src) in enumerate([
    ('2,117', 'GCCs (parent-level)', 'FY2026 · S01/S02'),
    ('3,728', 'GCC units', 'FY2026 · S01'),
    ('39%', 'of 2025 office absorption', 'CBRE · S20'),
    ('$98.4B', 'GCC revenue FY26', 'Nasscom–Zinnov · S02')
]):
    kpi(s, 0.85 + i * 3.0, y, 2.82, 1.55, num, lbl.upper(), src, ncol=TEAL)
txt(s, 0.85, 6.95, 11.6, 0.35, 'Prototype runs from repo: `npm run setup && npm run seed && npm run dev:api` + `npm run dev:web` · Walkthrough: deployment/demo-walkthrough.md', size=9.8, color=MUT_DARK)

# ==============================================================================
# SLIDE 2 — Problem
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 2, 'The problem: fragmented intelligence, costly decisions', 'PROBLEM CONTEXT & MARKET FRICTION')
txt(s, 0.55, 1.52, 12.2, 0.55, 'India’s GCC ecosystem is large, fast and definitionally messy — the decision layer above company directories is nowhere assembled.', size=14.5, color=MUT, leading=1.1)
for i, (num, lbl, sub) in enumerate([
    ('2,117', 'GCCs parent-level FY2026', 'Nasscom–Zinnov · S01/S02'),
    ('$98.4B', 'FY2026 revenue', 'same series · S02; 3 adds independent confirm'),
    ('39%', 'of 2025 office-absorption is GCCs', 'CBRE leasing records · S20/S22'),
]):
    kpi(s, 0.55 + i * 4.12, 2.18, 3.98, 1.55, num, lbl.upper(), sub)
rect(s, 0.55, 3.95, 12.23, 2.90, fill=PANEL, line=LINE)
bullets(s, 0.80, 4.12, 11.75, 2.65, [
    ('8+ state policies in 8+ formats. ', 'Karnataka, TN, UP, Gujarat, Kerala… each publish subsidy tables in different shapes (payroll %, land subsidy, stamp duty, OPEX caps) — normalizing them is manual analyst work (S05–S19).'),
    ('Counting regimes conflict. ', '2,117 GCCs / $98.4B (Nasscom–Zinnov, S02) vs "$164B / 4.2M jobs" (Wizmatic via Statesman, S04 — low-confidence definitional outlier, registered as a conflict, never averaged).'),
    ('The comparison is done by consultants on 3–6-week cycles. ', 'A build-vs-lease decision uses brokerage PDFs + press releases + Excel (S01, S24); a defensible shortlist with citations takes weeks of analyst hours.'),
    ('Source quality varies wildly across DIY databases. ', 'DIY city directories contain row-level coding mistakes (GCC Village: ~473 Hyderabad vs ~100 Bengaluru rows, S35) that can severely misinform a location business case.'),
], size=12, gap=8)
txt(s, 0.55, 6.90, 12.2, 0.28, 'Everything above is cited; no market-size figure on this slide is our own estimate. All source IDs refer to research/source-register.csv.', size=9, color=MUT_DARK)

# ==============================================================================
# SLIDE 3 — Stakeholders & Personas
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 3, 'Who feels the information asymmetry', 'STAKEHOLDERS (composite personas, evidence-based)')
def persona(x, name, role, color, pains, basis, primary=False):
    rect(s, x, 1.55, 3.95, 5.25, fill=PANEL, line=color if primary else LINE)
    tag(s, x + 0.2, 1.75, 'PRIMARY — designed for' if primary else 'secondary — served', color=color)
    txt(s, x + 0.2, 2.15, 3.55, 0.35, name, size=18, bold=True)
    txt(s, x + 0.2, 2.52, 3.55, 0.45, role, size=11, color=MUT, leading=1.05)
    bullets(s, x + 0.2, 3.08, 3.6, 2.8, [(p, '', color) for p in pains], size=10.5, gap=6, marker='–')
    txt(s, x + 0.2, 6.25, 3.55, 0.45, basis, size=8, color=MUT_DARK, leading=0.98)

persona(0.55, 'Priya Raman', 'Location-strategy lead, MNC expansion desk', TEAL, [
    'Translates global headcount mandate → Indian city criteria',
    'Needs ranked candidate cities with talent, cost & subsidy facts',
    'Must defend shortlists to CFO, tax team & external consultants',
    'Fears "why does your slide contradict the broker report?" in review',
], 'Basis: 64% of GCC space take-up by her class of buyer (S20,S21); UK/US firms drive 37–45% of India office absorption (S24). Composites; no interviews conducted.', primary=True)

persona(4.70, 'Rakesh', 'State investment-promotion (IPA) officer', CYAN, [
    'Competes vs peer states with hard numbers, not policy slogans',
    'Wants a shareable, credible neutral link for prospective investors',
    'Fears third-party commercial tables painting the state unfairly',
], 'Basis: 8+ states run active GCC-acquisition playbooks with published targets (S05,S10,S13,S16). Secondary persona — distribution catalyst in v1.')

persona(8.85, 'Maya', 'Provider / enabler BD lead (RE, legal, staffing)', RGBColor(0xF4, 0x72, 0x8B), [
    'Wants verified, ready-to-engage corporate demand signals',
    'Currently pays $3.5K–$10K/year for commercial lead surfaces (S30)',
    'v1 gives her nothing to pay for — credibility & trust cultivated first',
], 'Basis: GCC Explorer monetizes exactly this class (S30); AIM watchlists purchased by this class (S32). Provider neutrality is an enforced rule.')
txt(s, 0.55, 6.88, 12.2, 0.32, 'Anti-personas by design: job-seekers (no JTBD) and competitor scrapers. Everything persona-labelled as [inference] through Phase-3 validation gates.', size=9.2, color=MUT_DARK)

# ==============================================================================
# SLIDE 4 — Workarounds & Competitive Landscape
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 4, 'Current workarounds and where they stop', 'COMPETITIVE LANDSCAPE (verified, S30–S38)')
cols = [
    ('GCC Explorer (AIM Research)', '1,680+ GCC directory, daily analyst updates, contacts, watchlists. $3,500–$10,000 per seat cycle; free tier = 15 companies (S30/S31/S32).', 'Not a city-DECISION tool: no policy-incentive normalization, no side-by-side compare with counting denominators (S30 pages reviewed).'),
    ('Consultancies (CBRE/JLL/Zinnov)', 'Authoritative bespoke decks; mandates; deep local nuance (S01, S20–S24).', 'Time + high fees; 3–6 week project cycles; not self-serve at session speed.'),
    ('State portals + PIB PDFs', 'Primary-source truth; free access (S05–S19).', '8+ formats; conflicting denominators; normalizing incentives is analyst hours.'),
    ('DIY directories (GCC Village et al.)', 'Free coverage slices; open directory tables (S35–S37).', 'Row-level coding inconsistencies (S35); unverified data; zero provenance links.'),
]
for i, (t, good, gap) in enumerate(cols):
    x = 0.55 + (i % 2) * 6.25
    y = 1.55 + (i // 2) * 2.38
    rect(s, x, y, 6.0, 2.22, fill=PANEL, line=LINE)
    txt(s, x + 0.2, y + 0.14, 5.6, 0.32, t, size=13.5, bold=True, color=TEAL if i == 0 else INK)
    txt(s, x + 0.2, y + 0.50, 5.6, 0.80, good, size=10.2, color=MUT, leading=1.06)
    rect(s, x + 0.2, y + 1.44, 5.6, 0.66, fill=PANEL2, line=None)
    txt(s, x + 0.32, y + 1.50, 5.36, 0.55, [('Their gap: ', {'bold': True, 'color': AMBER}), (gap, {})], size=10, leading=1.04)
txt(s, 0.55, 6.45, 12.2, 0.50, [('White space we occupy: ', {'bold': True, 'color': TEAL}), ('a free, provenance-linked city-vs-city comparison layer with explicit counting denominators — no verified analog exists across the scanned landscape.', {})], size=12, leading=1.1)

# ==============================================================================
# SLIDE 5 — Opportunity Map & Prioritization
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 5, 'Opportunity map and prioritization', 'SCORING (research/opportunity-prioritization.md)')
cats = ['O2 City atlas', 'O1 Directory', 'O3 Policy tracker', 'O5 Comp bands', 'O4 Watchlist', 'O7 AI report', 'O6 Contacts resale']
vals = [4.40, 4.30, 4.15, 3.60, 3.30, 3.10, 1.40]
cols_ = [TEAL, CYAN, CYAN, RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x3B, 0x55, 0x8A), RGBColor(0x2A, 0x35, 0x50)]
bar_chart(s, 0.55, 1.55, 7.3, 4.35, cats, vals, cols_, maxv=5.0)
txt(s, 0.55, 6.00, 7.2, 0.65, 'Scores = weighted TAM / underservedness / public-data feasibility / prototype fit / risk (weights 20/30/25/15/10). Method + rubric documented in research/opportunity-prioritization.md.', size=9.2, color=MUT_DARK, leading=1.05)

rect(s, 8.15, 1.55, 4.63, 5.15, fill=PANEL, line=LINE)
txt(s, 8.35, 1.75, 4.25, 0.32, 'WINNER: O2 — the decision layer', size=13, bold=True, color=TEAL)
bullets(s, 8.35, 2.15, 4.25, 3.8, [
    ('City atlas + location-comparison ', 'is the most underserved, most buildable surface (O2 score 4.40).'),
    ('O1 directory and O3 policy tracker ship as ', 'supporting modules inside it.'),
    ('Deliberately excluded: ', 'contact-data resale (O6: name/legal risk, S38), watchlists/O4 (needs live crawler infrastructure), comp-band library (O5: licensing cost, Phase-3 candidate).'),
    ('Falsification path: ', 'if a real expansion desk says an ad-hoc spreadsheet already solves their need, we pivot to O4 (documented in research §6).'),
], size=10.2, gap=8)

# ==============================================================================
# SLIDE 6 — Initial Target Customer & JTBD
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 6, 'Initial target customer and the job to be done', 'PRIMARY SEGMENT (evidence-based composite)')
rect(s, 0.55, 1.55, 6.10, 5.25, fill=PANEL, line=LINE)
txt(s, 0.75, 1.75, 5.70, 0.35, 'Job statement (from primary persona)', size=13, bold=True, color=TEAL)
rect(s, 0.75, 2.18, 5.70, 1.20, fill=PANEL2, line=None)
txt(s, 0.90, 2.32, 5.40, 0.95, '“Compare candidate cities for a new GCC — talent, policies, real-estate cost and sector peers — for a specific function, with every number carrying its counting denominator and its source.”', size=12, color=INK, leading=1.14)
bullets(s, 0.75, 3.55, 5.75, 3.10, [
    ('JTBD 1 — Frame: ', 'translate parent company mandate → objective city criteria (function, tier, cost ceiling).'),
    ('JTBD 2 — Shortlist: ', 'generate ranked candidate cities with verified facts (talent pool, Grade-A rents, subsidies).'),
    ('JTBD 3 — Defend: ', 'ensure shortlists survive CFO, tax desk, and consultant scrutiny with explicit citations.'),
    ('JTBD 4 — Act: ', 'identify exact IPA contacts and eligible subsidy bands (TN 30/20/10% payroll bands S06; UP ₹20k/fresher S10).'),
], size=11, gap=8)

rect(s, 6.95, 1.55, 5.85, 5.25, fill=PANEL, line=LINE)
txt(s, 7.15, 1.75, 5.45, 0.35, 'Why this segment first', size=13, bold=True, color=TEAL)
bullets(s, 7.15, 2.18, 5.50, 3.50, [
    ('Documented demand density: ', 'US/global firms drove 37–45% of recent office absorption; this class routinely pays for location advisory (CBRE/JLL advisory hours S20–S24; GCC Explorer $3.5K–$10K S30).'),
    ('Severe workflow friction: ', '8+ state policy formats + conflicting market counts = exactly the information asymmetry documented in market-research §2–3.'),
    ('Reachable without paid ads: ', 'via state IPA relationships + public expansion-team leadership desks [inference].'),
    ('Measurable acceptance gate: ', 'M1 time-to-answer metric (<10 min) is instrumentable end-to-end.'),
], size=11, gap=8)
tag(s, 7.15, 6.25, '[inference] items bound for Phase-3 validation interviews', color=AMBER)

# ==============================================================================
# SLIDE 7 (NEW) — From Fragmented Data to Defensible Decisions
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 7, 'From Fragmented Data to Defensible Decisions', 'PRODUCT WORKFLOW · RAW DATA TO BOARD-READY OUTCOMES')

# Pipeline workflow: 4 columns
steps = [
    ('1. SCATTERED PUBLIC DATA', 'Unstructured Raw Input', AMBER, [
        ('Disparate PDF formats: ', '8+ state Government Orders (G.O.s) with incompatible subsidy structures (S05–S19).'),
        ('Brokerage PDF reports: ', 'Fragmented real estate asking rents and vacancy rates across CBRE, JLL, Colliers (S20–S24).'),
        ('Conflicting counts: ', 'Nasscom 2,117 GCCs vs Wizmatic $164B/4.2M outlier (S02 vs S04).'),
        ('Friction: ', 'Analysts waste 3–6 weeks hunting, copying, and reconciling unformatted sources.'),
    ]),
    ('2. NORMALIZATION & PROVENANCE', 'GCC Atlas Data Engine', CYAN, [
        ('Unit standardization: ', 'Grade-A rents normalized to INR/sqft/mo; talent pools to headcount; subsidies to uniform schemas.'),
        ('Definitional labeling: ', 'Every metric explicitly tagged with counting denominator (e.g. parent entities vs units).'),
        ('Source hashing: ', 'Immutable link to publisher, publication date, verification date, and confidence level.'),
        ('Seed linter: ', 'Hard code invariant halts builds if any displayed figure lacks provenance (F6).'),
    ]),
    ('3. EXPLORATION & CITATION', 'Interactive Decision Surface', TEAL, [
        ('Side-by-side matrix: ', 'Compare 2–4 cities with explicit EST flags, metric definitions, and state policy clauses.'),
        ('Bounded AI assistant: ', 'RAG engine strictly constrained to retrieved evidence packs; hallucinated citation IDs stripped.'),
        ('Recommendation split: ', 'Factual evidence cleanly separated from strategic guidance; declines if data is thin.'),
        ('Shareable sessions: ', 'URL state (?ids=) and server-scoped persistence for cross-stakeholder collaboration.'),
    ]),
    ('4. DEFENSIBLE DECISION', 'Intended Outcome [Hypothesis]', TEAL, [
        ('3–6 weeks → 1 session: ', 'Target: condense initial location shortlisting from weeks to <10 minutes (M1 instrumented).'),
        ('Board-ready audit trail: ', 'Every cell, subsidy band, and quote carries clickable primary-source backing.'),
        ('Zero broker bias: ', 'Neutral comparator free of pay-to-play rankings or sponsored placements.'),
        ('Credibility boundary: ', '[INTENDED OUTCOME — UNVALIDATED IN PHASE 2; scheduled for Phase-3 MNC desk trials].', RED),
    ]),
]

col_w = 2.92
col_gap = 0.18
for i, (head, subhead, col, items) in enumerate(steps):
    x = 0.55 + i * (col_w + col_gap)
    rect(s, x, 1.55, col_w, 5.25, fill=PANEL, line=col)
    tag(s, x + 0.14, 1.72, f'STAGE {i+1}', color=col)
    txt(s, x + 0.14, 2.05, col_w - 0.28, 0.40, head, size=11.5, bold=True, color=col)
    txt(s, x + 0.14, 2.45, col_w - 0.28, 0.28, subhead, size=9.5, color=MUT)
    bullets(s, x + 0.14, 2.85, col_w - 0.28, 3.85, items, size=9.2, gap=6)

txt(s, 0.55, 6.90, 12.2, 0.28, 'Workflow maps research/market-research.md to product architecture. Stage 4 outcomes are explicitly tagged as intended targets awaiting Phase-3 validation.', size=9, color=MUT_DARK)

# ==============================================================================
# SLIDE 8 — Product & Differentiated Value Proposition
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 8, 'The product and its differentiated value proposition', 'WHAT IS BUILT (running pre-alpha prototype)')
rect(s, 0.55, 1.52, 12.23, 0.65, fill=PANEL2, line=LINE)
txt(s, 0.75, 1.62, 11.9, 0.45, [('One line: ', {'bold': True, 'color': TEAL}), ('evidence-first India GCC location intelligence — the decision layer above directories, below bespoke consulting ("free to look, defensible to reuse").', {})], size=13, leading=1.1)

feats = [
    ('City Intelligence', '12 tracked cities × 6+ metrics; side-by-side compare of 2–4 cities w/ metric definitions, units and EST flags.', 'dataset: tracked records only (scope-labelled)'),
    ('Policy matrix', 'State incentives normalized vs source G.O.s; draft/final states distinct; "not yet tracked" ≠ 0 (Kerala dual targets co-labelled, S16 vs S18).', ''),
    ('Provenance everywhere', '46 GCC records, 36 sources; every figure → source chip → publisher, URL, pub date, verification date, confidence.', 'seed linter fails build on sourceless values'),
    ('Cited AI assistant', 'Retrieval-pack answers; only retrieved evidence may be cited; hallucinated IDs stripped (tested); recommendations separated; declines when thin.', 'demo mode composes deterministically without key'),
    ('Saved research + share', 'Session-scoped server-side persistence (cross-session isolation tested); shareable deep links; CSV export.', ''),
    ('Event instrumentation', 'PRD §3.5 catalog (search, detail_view, compare_create, source_click, export, saved_create…) — hashed session keys; aggregate admin.', ''),
]
for i, (t, b, extra) in enumerate(feats):
    x = 0.55 + (i % 3) * 4.13
    y = 2.35 + (i // 3) * 2.22
    rect(s, x, y, 3.97, 2.08, fill=PANEL, line=LINE)
    txt(s, x + 0.16, y + 0.14, 3.65, 0.32, t, size=12.5, bold=True, color=TEAL)
    txt(s, x + 0.16, y + 0.48, 3.66, 1.25, b, size=10.2, color=MUT, leading=1.06)
    if extra:
        txt(s, x + 0.16, y + 1.76, 3.66, 0.26, extra, size=8.5, color=MUT_DARK)
txt(s, 0.55, 6.90, 12.2, 0.28, 'All coverage claims are dataset-scope-labelled; the app never claims the 2,117 national count as its own data.', size=9.2, color=MUT_DARK)

# ==============================================================================
# SLIDE 9 — Product Walkthrough (Screenshots & Module Rationale)
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 9, 'Product walkthrough — genuine prototype captures', 'SCREENSHOTS & MODULE RATIONALE (running pre-alpha build captures)')

modules = [
    {
        'title': '1. City Comparison Workspace',
        'tag': 'DECISION MATRIX',
        'img': 'compare.png',
        'what': 'Side-by-side metric matrix (talent pool, Grade-A rents, comp, infra) and normalized state incentive policies across 2–4 selected cities with shareable URL parameters and CSV export.',
        'problem': 'Manual multi-week reconciliation across 8+ incompatible state government orders (G.O.s), brokerage PDFs, and ad-hoc analyst spreadsheets.',
        'why': 'Explicit EST flags, hoverable counting definitions, and transparent source citations ensure shortlists survive CFO and consultant scrutiny without hidden broker bias.'
    },
    {
        'title': '2. AI Research Assistant',
        'tag': 'BOUNDED RAG',
        'img': 'assistant-answer.png',
        'what': 'Retrieval-augmented query engine answering multi-city and expansion questions using strict local evidence packs with verified citation chips and separated recommendations.',
        'problem': 'Generic LLM hallucinations, fabricated policy figures, and untraceable advisory recommendations in executive decision memos.',
        'why': 'Hard code invariant strips non-retrieved citation IDs, separates recommendations from factual basis, and features a deterministic demo fallback ensuring 100% auditability without third-party API keys.'
    },
    {
        'title': '3. Sources & Evidence',
        'tag': 'AUDIT REGISTER',
        'img': 'sources.png',
        'what': 'Comprehensive provenance registry detailing publisher, publication date, verification status, confidence rating (high/med/low), and reverse "where cited" cross-links.',
        'problem': 'Opaque market figures, zombie statistics, and conflicting definitions (e.g. 2,117 GCC parents vs 3,728 units) with zero provenance.',
        'why': 'Establishes defensibility and user trust before monetization; automated seed linter halts builds on sourceless numeric claims.'
    },
    {
        'title': '4. GCC Intelligence Dashboard',
        'tag': 'ECOSYSTEM OVERVIEW',
        'img': 'dashboard.png',
        'what': 'High-level ecosystem overview tracking 46 verified GCCs across 12 cities and 11 sectors, paired with an active data freshness ledger and policy status tracker.',
        'problem': 'Conflation of sampled directory records with national market census figures, leading to misleading location business cases.',
        'why': 'Prominent dataset-scope banner and verification ledger distinguish tracked sample data from the national 2,117 universe.'
    }
]

quad_w = 6.02
quad_h = 2.62
positions = [
    (0.55, 1.50),  # Top-left: Compare
    (6.76, 1.50),  # Top-right: Assistant
    (0.55, 4.25),  # Bottom-left: Sources
    (6.76, 4.25),  # Bottom-right: Dashboard
]

for mod, (qx, qy) in zip(modules, positions):
    # Outer panel
    rect(s, qx, qy, quad_w, quad_h, fill=PANEL, line=LINE)
    
    # Header bar
    txt(s, qx + 0.14, qy + 0.10, quad_w - 1.6, 0.28, mod['title'], size=11, bold=True, color=INK)
    tag(s, qx + quad_w - 1.45, qy + 0.10, mod['tag'], color=TEAL, tc=BG)
    
    # Left: Screenshot
    img_x = qx + 0.14
    img_y = qy + 0.40
    img_w = 3.25
    img_h = 2.10
    rect(s, img_x, img_y, img_w, img_h, fill=PANEL2, line=LINE)
    img_path = os.path.join(ASSETS, mod['img'])
    s.shapes.add_picture(img_path, In(img_x + 0.04), In(img_y + 0.04), width=In(img_w - 0.08), height=In(img_h - 0.08))
    
    # Right: Compact structured explanation card
    card_x = qx + 3.46
    card_y = qy + 0.40
    card_w = quad_w - 3.60
    card_h = 2.10
    rect(s, card_x, card_y, card_w, card_h, fill=PANEL2, line=LINE)
    
    mod_bullets = [
        ('What it does: ', mod['what'], TEAL),
        ('Problem: ', mod['problem'], AMBER),
        ('Why built this way: ', mod['why'], CYAN),
    ]
    bullets(s, card_x + 0.10, card_y + 0.08, card_w - 0.20, card_h - 0.16, mod_bullets, size=8.0, gap=4, marker='▪', leading=1.04)

txt(s, 0.55, 6.92, 12.2, 0.26, 'Screenshots captured from live prototype build (Compare verified with Bengaluru 38 tracked / Karnataka policy). Module cards communicate core functional JTBD & design rationale.', size=8.8, color=MUT_DARK)

# ==============================================================================
# SLIDE 10 — Positioning & Adoption Strategy
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 10, 'Positioning and stakeholder adoption strategy', 'GO-TO-MARKET SEQUENCING [most steps are hypotheses]')
rect(s, 0.55, 1.55, 12.23, 0.90, fill=PANEL2, line=LINE)
txt(s, 0.75, 1.65, 11.9, 0.70, [('Category we aim to create: ', {'bold': True, 'color': TEAL}), ('"evidence-first India GCC location intelligence" — decision layer above directories, below bespoke consulting. We never out-claim Nasscom–Zinnov/CBRE; their data is our source of record (competitive-landscape §4).', {})], size=12, leading=1.12)

steps_gtm = [
    ('1. IPAs share', 'Free, cited compare links let state IPAs position themselves fairly vs peer states — they become our distribution catalysts (no ad spend needed, S05–S19; S12 shows IPAs actively pitch at NASSCOM events).'),
    ('2. Providers inspect', 'Provider/BD leads verify market claims pre-meeting (this class already pays $3.5K–$10K for similar surfaces, S30 — organic awareness follows the free tier).'),
    ('3. Expansion desks adopt', 'Priya-style desks self-serve pre-work, arrive at consultant conversations evidence-armed; conversion to paid only AFTER free-tier trust (M1/M3 instrumented).'),
]
for i, (t, b) in enumerate(steps_gtm):
    x = 0.55 + i * 4.13
    rect(s, x, 2.65, 3.97, 2.70, fill=PANEL, line=LINE)
    txt(s, x + 0.18, 2.85, 3.60, 0.35, t, size=12.5, bold=True, color=TEAL)
    txt(s, x + 0.18, 3.25, 3.62, 1.95, b, size=10.2, color=MUT, leading=1.08)

rect(s, 0.55, 5.55, 12.23, 1.20, fill=PANEL, line=LINE)
txt(s, 0.75, 5.68, 11.9, 0.95, [('What we deliberately DON’T do: ', {'bold': True, 'color': AMBER}), ('no paid ranking anywhere facts are shown (trust contract), no bulk contact-data resale (O6, name/legal risk S38), no interviews implied in any deck claim (Phase-3 validates all [inference] tags).', {})], size=11.5, leading=1.15)

# ==============================================================================
# SLIDE 11 — Business Model Hypotheses & GTM
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 11, 'Business-model hypotheses and go-to-market', 'ALL PRICING = [proposal], UNVALIDATED')

bm = [
    ('H1 · Free core (now)', 'City compare + policy matrix + source register stay free. Reputation density is the wedge; paying for data pre-trust kills it (business-model §1).', TEAL),
    ('H2 · Pro seats [proposal]', '$99–$199/yr individual; $500–$2,000/yr teams of 3–5 — anchored at 3–6% of market comparables’ $3.5K–$10K cycles (S30). Gate: free-tier traction first.', CYAN),
    ('H4 · Reports [proposal]', 'Free quarterly standard; $299–$499 thematic deep-dives once publishing muscle exists (market precedent: free quarterly exists S31; historic $9,999 static lists S33).', CYAN),
    ('H5 · Provider verified [proposal]', '$199–$499/yr verified-profile attributes only — zero influence on rankings/answers; banned-paid-ranking is an immutable product rule (business-model §4).', CYAN),
]
for i, (t, b, c) in enumerate(bm):
    x = 0.55 + (i % 2) * 6.25
    y = 1.55 + (i // 2) * 1.98
    rect(s, x, y, 6.00, 1.82, fill=PANEL, line=LINE)
    tag(s, x + 0.20, y + 0.14, t, color=c)
    txt(s, x + 0.20, y + 0.50, 5.60, 1.25, b, size=10.2, color=MUT, leading=1.08)

rect(s, 0.55, 5.65, 12.23, 1.15, fill=PANEL2, line=LINE)
txt(s, 0.75, 5.78, 11.9, 0.90, [('GTM hypotheses [proposal, no spend]: ', {'bold': True, 'color': TEAL}), ('content-catalyst loop (share links) + expansion-desk outreach + token funnel metrics (M3 search→detail ≥40%; M1 median <10 min — BOTH are unvalidated targets until Phase 3 instrumentation reports).', {})], size=11, leading=1.12)

# ==============================================================================
# SLIDE 12 — Trust, AI Reliability, Risks & Metrics
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 12, 'Data trust, AI reliability, risks and success metrics', 'GUARDRAILS THE BUILD ACTUALLY ENFORCES')
rect(s, 0.55, 1.55, 6.05, 5.25, fill=PANEL, line=LINE)
txt(s, 0.75, 1.75, 5.60, 0.32, 'Trust contract (enforced in code, not just values)', size=12.5, bold=True, color=TEAL)
bullets(s, 0.75, 2.12, 5.70, 4.50, [
    ('Every figure sourced: ', 'seed linter FAILS the build on a sourceless value (F6); provenance chips on all numeric surfaces.'),
    ('Denominators labelled: ', '"GCCs, parent vs units" named at every count (S01/S02-style conflict rendered, never averaged).'),
    ('Conflicts co-shown: ', '$98.4B (S02) vs $164B (S04) both visible, flagged as contested.'),
    ('Missing ≠ zero: ', '"not yet tracked", draft policies flagged; placeholder sources labelled "stale".'),
    ('AI cites or declines: ', 'only retrieved evidence citable; unknown citation IDs stripped in tests; insufficiency is an honest low-confidence path; recommendations never blended into facts.'),
], size=10.5, gap=8)

rect(s, 6.85, 1.55, 5.95, 5.25, fill=PANEL, line=LINE)
txt(s, 7.05, 1.75, 5.55, 0.32, 'Risks + metrics (targets are [proposals])', size=12.5, bold=True, color=TEAL)
bullets(s, 7.05, 2.12, 5.60, 2.30, [
    ('Coverage honesty: ', '46-company tracked subset; never billed as "all 2,117 GCCs" (S02/S30 context).'),
    ('Name collision: ', 'gcc-atlas.com exists (S38) — working-title label everywhere; trademark check is a Phase-3 gate.'),
    ('Data freshness: ', 'verify-by dates shown; manual re-verification pass scheduled at submission.'),
], size=10.5, gap=7)

mets = [
    ('M1', 'Time-to-answer < 10 min [proposal]'),
    ('M2', '100% of displayed figures carry sources (hard invariant); assistant ≥95% answered w/ ≥1 citation [proposal]'),
    ('M3', 'Search→detail ≥40% [proposal]'),
    ('M4-M6', 'compare/assistant/provider engagement + no-paid-ranking guardrail countermetrics')
]
for i, (m, b) in enumerate(mets):
    txt(s, 7.05, 4.55 + i * 0.58, 0.90, 0.32, m, size=10.5, bold=True, color=AMBER)
    txt(s, 7.95, 4.55 + i * 0.58, 4.75, 0.55, b, size=9.8, color=MUT, leading=1.0)

# ==============================================================================
# SLIDE 13 — Roadmap & Close
# ==============================================================================
s = prs.slides.add_slide(BLANK)
chrome(s, 13, 'Roadmap, prototype and next steps', 'PHASE GATES (product/roadmap.md)')

phases = [
    ('Phase 2 — DONE: working prototype', TEAL, [
        'Research → strategy → full build (Phases 1–8)',
        'Retrieval→citation pipeline + demo fallback',
        'Rate limits, events, session ACL, QA report (108/108 tests green)',
        'Deployment guide + render.yaml + this deck',
    ]),
    ('Phase 3 — validation loop', CYAN, [
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
    rect(s, x, 1.55, 3.97, 3.35, fill=PANEL, line=c)
    txt(s, x + 0.18, 1.75, 3.60, 0.50, t, size=12, bold=True, color=c)
    bullets(s, x + 0.18, 2.32, 3.60, 2.45, [(it,) for it in items], size=9.8, gap=6)

rect(s, 0.55, 5.05, 12.23, 1.55, fill=PANEL2, line=LINE)
txt(s, 0.75, 5.20, 11.9, 1.25, [('The bet, honestly framed: ', {'bold': True, 'color': TEAL}), ('the market is undeniably real and growing; the intelligence layer above it is fragmented and expensive; a discipline-first free comparator is buildable and differentiated. What we have NOT proven: demand (no interviews), willingness-to-pay (proposals only), and defensibility against a fast follower. Every one of those is instrumented to be falsifiable in Phase 3 — which is the point.', {})], size=12, leading=1.2)
txt(s, 0.55, 6.72, 12.2, 0.40, 'Prototype + demo script: deployment/demo-walkthrough.md · QA evidence: qa/quality-report.md · Full evidence register: research/source-register.csv · Deck sources: product/deck-evidence-sources.md', size=9.5, color=MUT_DARK, leading=1.15)

# Save PPTX
os.makedirs(os.path.dirname(OUT_PPTX), exist_ok=True)
prs.save(OUT_PPTX)
print(f'SAVED PPTX: {OUT_PPTX} ({os.path.getsize(OUT_PPTX):,} bytes)')
