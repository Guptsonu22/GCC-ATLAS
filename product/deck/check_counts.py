import sqlite3

con = sqlite3.connect('backend/data/gcc-atlas.db')
cur = con.cursor()

print("--- LOCATIONS ---")
for r in cur.execute("SELECT id, name, state FROM locations").fetchall():
    print(r)

print("\n--- COMPANY LOCATIONS COUNT PER CITY ---")
for r in cur.execute("""
    SELECT l.name, l.state, COUNT(cl.company_id) 
    FROM locations l 
    LEFT JOIN company_locations cl ON cl.location_id = l.id 
    GROUP BY l.id, l.name, l.state 
    ORDER BY COUNT(cl.company_id) DESC
""").fetchall():
    print(r)

print("\n--- COMPANY LOCATIONS COUNT PER STATE ---")
for r in cur.execute("""
    SELECT l.state, COUNT(DISTINCT cl.company_id) 
    FROM locations l 
    LEFT JOIN company_locations cl ON cl.location_id = l.id 
    GROUP BY l.state 
    ORDER BY COUNT(DISTINCT cl.company_id) DESC
""").fetchall():
    print(r)

print("\n--- CITY METRICS FOR BENGALURU ---")
for r in cur.execute("SELECT metric_name, metric_value, metric_unit, metric_definition, source_id, is_estimate FROM city_metrics WHERE location_id='loc_bengaluru'").fetchall():
    print(r)

print("\n--- POLICY FOR KARNATAKA ---")
for r in cur.execute("SELECT id, title, state, status, description, normalized_benefits, source_id FROM policy_records WHERE state='Karnataka'").fetchall():
    print(r)

print("\n--- TOTAL DISTINCT COMPANIES ---")
print(cur.execute("SELECT count(*) FROM companies").fetchone())

con.close()
