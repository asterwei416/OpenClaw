import os
import sqlite3

p = '/home/openclaw/.openclaw/memory/main.sqlite'
print('exists', os.path.exists(p))
if not os.path.exists(p):
    raise SystemExit(0)
print('size_mb', round(os.path.getsize(p) / 1024 / 1024, 2))

con = sqlite3.connect(p)
cur = con.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cur.fetchall()]
print('tables', tables)
for t in tables:
    if 'message' in t.lower() or 'event' in t.lower() or 'session' in t.lower() or 'chat' in t.lower():
        try:
            cur.execute(f'SELECT COUNT(*) FROM "{t}"')
            print(t, cur.fetchone()[0])
        except Exception:
            pass
