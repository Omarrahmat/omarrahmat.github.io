#!/usr/bin/env python3
"""Turn a Google Search Console "Performance" export into SQL for the owner dashboard.

The owner downloads the export on Mondays (Search Console > Performance > 3 months > Export > Download CSV)
and sends the zip to Claude. Unzip it, then:

    python3 scripts/gsc-to-sql.py <folder with the CSVs> <snapshot date YYYY-MM-DD> <output folder>

It writes numbered .sql files of at most about 9 KB each. Run them in order with the Supabase connector
(execute_sql, project vbgustjtxjmjlgukzcfa), then run the check query it prints and compare the numbers.
The dashboard at /hq/ (Google tab) reads the newest snapshot and compares it with the one before.

Tables: gsc_snapshots, gsc_daily, gsc_queries, gsc_pages, gsc_segments. Re-running a snapshot is safe.
The SQL only inserts and updates (no DELETE), so the connector does not stop to ask for approval.
"""
import csv
import hashlib
import os
import re
import sys

SITE = 'https://fosteringtoday.com'
# zero-width and direction marks that sometimes ride along in copied search terms
INVISIBLE = re.compile('[\u200b-\u200f\u2060\ufeff]')
LIMIT = 9000


def q(s):
    return "'" + s.replace("'", "''") + "'"


def num(s):
    return float(s) if s not in ('', None) else None


def clean(s):
    return re.sub(r'\s+', ' ', INVISIBLE.sub('', s)).strip()


def merge(rows):
    """rows: (key, clicks, impressions, position). Rows with the same key are added, position weighted by impressions."""
    out = {}
    for k, c, i, p in rows:
        if not k:
            continue
        if k in out:
            c0, i0, p0 = out[k]
            tot = (i0 + i) or 1
            out[k] = (c0 + c, i0 + i, (p0 * i0 + p * i) / tot if (i0 + i) else p)
        else:
            out[k] = (c, i, p)
    return sorted(((k, c, i, round(p, 2)) for k, (c, i, p) in out.items()), key=lambda r: (-r[2], r[3], r[0]))


def fmt(p):
    return ('%.2f' % p).rstrip('0').rstrip('.')


def chunks(head, tuples, tail):
    files, cur, size = [], [], len(head) + len(tail)
    for t in tuples:
        if cur and size + len(t) + 1 > LIMIT:
            files.append(head + ','.join(cur) + tail)
            cur, size = [], len(head) + len(tail)
        cur.append(t)
        size += len(t) + 1
    if cur:
        files.append(head + ','.join(cur) + tail)
    return files


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    folder, snap, outdir = sys.argv[1:]
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', snap):
        sys.exit('snapshot date must be YYYY-MM-DD')
    read = lambda name: list(csv.DictReader(open(os.path.join(folder, name), encoding='utf-8-sig')))

    daily = [(r['Date'], int(r['Clicks']), int(r['Impressions']), num(r['Position'])) for r in read('Chart.csv')]
    with_data = [d for d in daily if d[2] > 0]
    start, end = daily[0][0], (with_data[-1][0] if with_data else daily[-1][0])
    queries = merge((clean(r['Top queries']), int(r['Clicks']), int(r['Impressions']), float(r['Position'])) for r in read('Queries.csv'))
    pages = merge(((r['Top pages'][len(SITE):] if r['Top pages'].startswith(SITE) else r['Top pages']) or '/', int(r['Clicks']), int(r['Impressions']), float(r['Position'])) for r in read('Pages.csv'))
    segs = []
    for kind, name, col in (('country', 'Countries.csv', 'Country'), ('device', 'Devices.csv', 'Device')):
        if os.path.exists(os.path.join(folder, name)):
            segs += [(kind, r[col], int(r['Clicks']), int(r['Impressions']), num(r['Position'])) for r in read(name)]

    S = q(snap)
    files = [
        f"insert into public.gsc_snapshots(snapshot, range_start, range_end, source) values ({S}, {q(start)}, {q(end)}, 'export') "
        f"on conflict (snapshot) do update set range_start = excluded.range_start, range_end = excluded.range_end, loaded_at = now();\n"
        + "insert into public.gsc_daily(day, clicks, impressions, position, snapshot) values "
        + ','.join(f"({q(d)},{c},{i},{'null' if p is None else fmt(p)},{S})" for d, c, i, p in daily)
        + " on conflict (day) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position, snapshot = excluded.snapshot;\n"
        + ("insert into public.gsc_segments(snapshot, kind, name, clicks, impressions, position) values "
           + ','.join(f"({S},{q(k)},{q(n)},{c},{i},{'null' if p is None else fmt(p)})" for k, n, c, i, p in segs)
           + " on conflict (snapshot, kind, name) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position;\n" if segs else '')
    ]
    files += chunks(f"insert into public.gsc_queries(snapshot, query, clicks, impressions, position) select {S}, v.* from (values ",
                    [f"({q(k)},{c},{i},{fmt(p)})" for k, c, i, p in queries],
                    ") v(query, clicks, impressions, position) on conflict (snapshot, query) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position;\n")
    files += chunks(f"insert into public.gsc_pages(snapshot, page, clicks, impressions, position) select {S}, v.* from (values ",
                    [f"({q(k)},{c},{i},{fmt(p)})" for k, c, i, p in pages],
                    ") v(page, clicks, impressions, position) on conflict (snapshot, page) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position;\n")

    os.makedirs(outdir, exist_ok=True)
    for n, sql in enumerate(files, 1):
        open(os.path.join(outdir, f'gsc-{snap}-{n:02d}.sql'), 'w', encoding='utf-8').write(sql)

    md5 = lambda rows: hashlib.md5('|'.join(f"{k}:{c}:{i}:{fmt(p)}" for k, c, i, p in sorted(rows)).encode('utf-8')).hexdigest()
    print(f"{len(files)} files written to {outdir}")
    print(f"expect: days {len(daily)} (impressions {sum(d[2] for d in daily)}, clicks {sum(d[1] for d in daily)}), range {start} to {end}")
    print(f"expect: queries {len(queries)} (impressions {sum(r[2] for r in queries)}) md5 {md5(queries)}")
    print(f"expect: pages {len(pages)} (impressions {sum(r[2] for r in pages)}) md5 {md5(pages)}")
    print("check with:")
    print(f"select (select count(*) from gsc_queries where snapshot = {S}) queries, (select sum(impressions) from gsc_queries where snapshot = {S}) q_impr, "
          f"(select md5(string_agg(query || ':' || clicks || ':' || impressions || ':' || trim(trailing '.' from trim(trailing '0' from to_char(position, 'FM999990.00'))), '|' order by query collate \"C\")) from gsc_queries where snapshot = {S}) q_md5, "
          f"(select count(*) from gsc_pages where snapshot = {S}) pages, (select sum(impressions) from gsc_pages where snapshot = {S}) p_impr, "
          f"(select md5(string_agg(page || ':' || clicks || ':' || impressions || ':' || trim(trailing '.' from trim(trailing '0' from to_char(position, 'FM999990.00'))), '|' order by page collate \"C\")) from gsc_pages where snapshot = {S}) p_md5;")


if __name__ == '__main__':
    main()
