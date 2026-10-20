# GCC Atlas — Reviewer Demo Walkthrough Guide

**Duration:** 5–10 minutes  
**Target Audience:** Flexiple Product Team & Evaluators  
**Application URL:** [http://localhost:5173](http://localhost:5173) (or deployed cloud URL)

---

## 1. Quick Local Launch (if not already running)

From the project root directory:

```bash
# 1. Install dependencies
npm run setup

# 2. Seed database
npm run seed

# 3. Launch both backend & frontend
npm run dev:api    # Port 4000
npm run dev:web    # Port 5173
```

Open your browser to: **`http://localhost:5173`**

---

## 2. Walkthrough Script (Step-by-Step)

### Step 1: Dashboard Overview (`/`)
- **What to observe:**
  - Headline metrics: **46 Tracked GCCs**, **12 Hub Cities**, **11 Sectors**, **13 Policy Records**, and **17 Service Providers**.
  - Notice the **Dataset Scope Notice**: clearly states that counts reflect the vetted GCC Atlas sample, not an inflated claim of the 2,117 national universe.
  - Scroll down to the **Verification Ledger**: shows the distribution of verified facts vs. market estimates.

### Step 2: City Comparison & Location Intelligence (`/compare`)
- **What to do:**
  1. Click **"Compare"** in the top navigation bar.
  2. Select **Bengaluru** and **Pune** from the city selector pills.
- **What to observe:**
  - Side-by-side metric comparison matrix: Grade-A office rents, talent pool size, and operating cost estimates.
  - Notice the orange **`EST`** badges indicating market estimates with hoverable metric definitions.
  - Below the metrics, inspect the **State Policy Matrix**: compares Karnataka vs. Maharashtra policy frameworks (payroll subsidies, stamp duty exemptions, and draft vs. finalized statuses).
  - Click any **Source Chip** to view the underlying publisher and verification date.

### Step 3: Session Persistence & Sharing
- **What to do:**
  1. On the compare page, enter a name in the save input: `"Q4 Expansion Shortlist"`.
  2. Click **"Save to my session"**.
  3. Navigate to **"Saved"** in the top navigation (`/saved`).
  4. Refresh the page (`F5` or `Ctrl+R`).
- **What to observe:**
  - The saved comparison persists across page reloads via anonymous `X-Session-Key` tokens stored in `localStorage`.
  - No user accounts or passwords required for instant evaluation.

### Step 4: GCC Company Explorer & Search (`/explorer`)
- **What to do:**
  1. Click **"Directory"** / **"Explorer"** in the navigation.
  2. In the search bar, type `"Nova"`.
  3. Notice instant fuzzy matching for *Novartis*.
  4. Filter by City (**"Bengaluru"**) and Sector (**"Software & SaaS"**).
  5. Click on **"ABB India"** to open its detailed profile (`/companies/com_abb`).
- **What to observe:**
  - Detailed company metadata: parent firm country, operating status (operational vs announced), headcount brackets, and office locations.
  - Every single fact links directly to verified source documentation.

### Step 5: Service Provider Directory (`/providers`)
- **What to do:**
  1. Click **"Providers"** in the navigation.
  2. Click the capability filter: **"Recruitment & staffing"**.
- **What to observe:**
  - Filtered results show verified enablers such as *TeamLease Services* and *xpheno*.
  - **No fake ratings or pay-to-play rankings**: GCC Atlas enforces strict neutrality by displaying verified capability tags and direct links without sponsored placement.

### Step 6: Sources & Evidence Explorer (`/sources`)
- **What to do:**
  1. Click **"Sources"** in the navigation bar.
  2. Browse through the 36 registered source records.
- **What to observe:**
  - Each source displays publisher, publication date, last verification date, and confidence level.
  - Click on any source row to expand its **Reverse Usage** panel, showing exactly which companies and city metrics cite that source.

### Step 7: AI Research Assistant (`/assistant`)
- **What to do:**
  1. Click **"Assistant"** in the navigation bar.
  2. Enter the flagship query:
     > *"Which city should a 150-person engineering GCC consider first: Hyderabad or Pune?"*
  3. Click **"Ask"** (or use the pre-built prompt chip).
- **What to observe:**
  - **Structured Answer:** Direct verdict, key findings, comparative data points, and recommendations.
  - **Fact vs. Recommendation Distinction:** Recommendations carry explicit basis tags (e.g. `Rule-based heuristic`).
  - **Grounded Citations:** Every fact includes clickable citation badges referencing real source records.
  - **Limitation Testing:** Ask an out-of-scope question like *"What are the office rental rates for London or Tokyo GCCs?"* &rarr; The assistant transparently declines to answer, citing lack of coverage in the India GCC dataset rather than hallucinating answers.

---

## 3. Key Takeaways for the Reviewer

1. **Information Asymmetry Solved:** Replaces fragmented state PDFs and opaque broker decks with a unified, normalized, and cited decision tool.
2. **Defensible Provenance:** Every metric carries its source, verification date, and counting denominator.
3. **Engineered for Reliability:** 108 automated tests, zero TypeScript errors, parameterized queries, and graceful fallback modes.
