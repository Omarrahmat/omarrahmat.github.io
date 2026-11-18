#!/usr/bin/env python3
"""Find area write-ups whose wording about how many services are listed no longer matches the page.

An area page prints the live count itself ("5 fostering services list Merton as an area they cover"), so a
write-up that says "Three fostering services list Merton, and all three are shown above" goes wrong the moment
the Local coverage desk adds a service (18 Nov 2026: Merton, Barnet and Greenwich all contradicted their own page).

Run after `node scripts/merge-data.mjs` (it reads src/data/providers.json):

    python3 scripts/check-area-counts.py

It prints every write-up with a count that does not equal the place's total, its independent agencies or its
council services, and exits 1 if there are any. Fix the wording in the same commit that changed the coverage.
Better still, do not state the count in a write-up at all: say "the services shown above".
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WORDS = {w: i for i, w in enumerate(
    'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen '
    'seventeen eighteen nineteen twenty'.split())}
WORDS['both'] = 2
NUM = '|'.join(WORDS) + r'|\d+'
# "three fostering services", "the two agencies above", "both are shown above", "all three services"
COUNTED = re.compile(
    r'\b(' + NUM + r')\s+(?:of the |other |more |independent |fostering |listed |local authority |council )*'
    r'(?:services|agencies|listings|providers)\b', re.I)
SHOWN = re.compile(r'\b(?:all |and )?(' + NUM + r') (?:are|is) (?:shown|listed) (?:above|below)', re.I)
# Advice such as "two or three of the agencies", and counts that describe something else.
ADVICE = re.compile(r'(?:one or two|two or three|three or four)', re.I)
OTHER_PAGE = re.compile(r'page (?:lists|has|shows) ', re.I)


def slug(name):
    return re.sub(r'^-|-$', '', re.sub(r'[^a-z0-9]+', '-', name.lower().replace('&', 'and')))


def main():
    providers = json.load(open(os.path.join(ROOT, 'src/data/providers.json')))
    total, council, agency = {}, {}, {}
    for p in providers:
        for s in {slug(a) for a in p.get('areasServed', [])}:
            total[s] = total.get(s, 0) + 1
            bucket = council if p.get('providerType') == 'local_authority' else agency
            bucket[s] = bucket.get(s, 0) + 1

    problems = []
    for path in sorted(glob.glob(os.path.join(ROOT, 'data/areas/*.json'))):
        note = json.load(open(path))
        s = note['slug']
        allowed = {total.get(s, 0), agency.get(s, 0), council.get(s, 0)}
        text = ' '.join(note.get('paragraphs', []))
        for m in list(COUNTED.finditer(text)) + list(SHOWN.finditer(text)):
            word = m.group(1).lower()
            n = WORDS.get(word, int(word) if word.isdigit() else None)
            around = text[max(0, m.start() - 40):m.end() + 40]
            if n is None or n > 20 or n in allowed:
                continue
            if re.match(r'one\s+of\b', m.group(0), re.I):  # "one of the agencies above" is not a count
                continue
            if ADVICE.search(text[max(0, m.start() - 12):m.end() + 6]) or OTHER_PAGE.search(text[max(0, m.start() - 40):m.start()]):
                continue
            problems.append((s, n, total.get(s, 0), agency.get(s, 0), council.get(s, 0), around.strip()))

    for s, n, t, a, c, around in problems:
        print(f'{s}: write-up says {n}; page lists {t} ({a} agencies, {c} council): "...{around}..."')
    print(f'{len(problems)} count(s) to check' if problems else 'Area write-up counts match the listings.')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
