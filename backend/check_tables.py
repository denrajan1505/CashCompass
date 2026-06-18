import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    r = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"))
    tables = [row[0] for row in r]
    print("Tables:", tables)

    for t in tables:
        r2 = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}' ORDER BY ordinal_position"))
        cols = [row[0] for row in r2]
        print(f"  {t}: {cols}")
