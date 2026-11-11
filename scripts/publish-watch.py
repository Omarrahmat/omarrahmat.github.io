#!/usr/bin/env python3
"""Waits until the newest commit on `source` is built, published to `main` and deployed by GitHub Pages.

Why it exists: on 11 Nov 2026 GitHub gave our jobs no machines for over two hours. Builds sat queued, or ended
after fifteen minutes with "The job was not acquired by Runner of type hosted even after multiple attempts", and
the last step ("pages build and deployment", GitHub's own workflow) waited the same way. Nothing was wrong with
the site or the commits; each run only had to be started again until a machine was free.

What it does, checking every half minute and printing a line only when something changes:
  1. Build: looks for a "Build, test and publish" run of the newest commit on `source`.
     - a run that ended without any step having run was given no machine: it is re-run;
     - a run that has sat queued with no jobs for five minutes, or no run at all after four: one is started by hand;
     - a run in which a step failed is a real failure: it stops and says which job, and nothing was published.
  2. Deployment: looks for the "pages build and deployment" run of the newest commit on `main`, and re-runs it
     if it ended without a machine. Only ever the newest commit's run: re-running an older one would put older
     pages back on the live site.
It ends with "DEPLOYED <commit>" (exit 0), or says plainly why it stopped (exit 2 to 7).

It changes nothing in the repository and reverts nothing. It needs `git` and `gh`, signed in.

usage: python3 -I scripts/publish-watch.py [minutes to keep trying, default 30]
"""
import json
import os
import subprocess
import sys
import time

R = 'Omarrahmat/omarrahmat.github.io'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MINUTES = float(sys.argv[1]) if len(sys.argv) > 1 else 30
DEADLINE = time.time() + MINUTES * 60
BUILD, PAGES = 'Build, test and publish', 'pages build and deployment'


def say(*a):
    print(time.strftime('%H:%M:%S', time.gmtime()), *a, flush=True)


def run(cmd, timeout=90):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


def api(path):
    out = run(['gh', 'api', path])
    try:
        return json.loads(out) if out else None
    except Exception:
        return None


def tip(branch):
    out = run(['git', '-C', REPO, 'ls-remote', 'origin', f'refs/heads/{branch}'])
    return out.split()[0] if out and out.split() else None


def runs(name, sha):
    d = api(f'repos/{R}/actions/runs?per_page=30&head_sha={sha}')
    if d is None:
        return None
    rs = [x for x in d.get('workflow_runs', []) if x.get('name') == name]
    rs.sort(key=lambda x: (x['run_number'], x.get('run_attempt', 1)), reverse=True)
    return rs


def jobs(run_id):
    d = api(f'repos/{R}/actions/runs/{run_id}/jobs?per_page=50')
    return None if d is None else d.get('jobs', [])


def real_failures(js):
    return [j['name'] for j in js if any(s.get('conclusion') == 'failure' for s in (j.get('steps') or []))]


def rerun(run_id):
    again = ['gh', 'run', 'rerun', str(run_id), '-R', R]
    return run(again + ['--failed']) is not None or run(again) is not None


def start_build():
    return run(['gh', 'workflow', 'run', 'publish.yml', '-R', R, '--ref', 'source']) is not None


def describe(what, top):
    return f"{what}: run {top['run_number']} (attempt {top.get('run_attempt', 1)}) {top['status']} {top.get('conclusion') or ''}".rstrip()


# 1. The build of the newest commit on `source`.
seen, reruns, started, stuck_since, waiting_since, built = None, 0, 0, None, time.time(), None
while time.time() < DEADLINE and not built:
    src = tip('source')
    rs = runs(BUILD, src) if src else None
    if rs is None:
        time.sleep(30)
        continue
    done = [x for x in rs if x['status'] == 'completed' and x.get('conclusion') == 'success']
    if done:
        built = src
        say(f"built and published: source {src[:8]} (run {done[0]['run_number']})")
        break
    if not rs:
        if time.time() - waiting_since > 240 and started < 3 and start_build():
            started += 1
            waiting_since = time.time()
            say(f'build: no run appeared for {src[:8]}; started one by hand')
        time.sleep(30)
        continue
    top = rs[0]
    state = (top['run_number'], top.get('run_attempt'), top['status'], top.get('conclusion'))
    if state != seen:
        say(describe('build', top))
        seen = state
    js = jobs(top['id'])
    if top['status'] == 'completed':
        bad = real_failures(js or [])
        if bad:
            say(f"BUILD FAILED in: {', '.join(bad)} (run {top['run_number']}). Nothing was published; this needs a look.")
            sys.exit(2)
        if reruns >= 6:
            say('BUILD: no machine from GitHub after 6 re-runs')
            sys.exit(3)
        ok = rerun(top['id']) or (started < 3 and start_build())
        reruns += 1
        say(f"build: run {top['run_number']} ended without a machine; {'started again' if ok else 'could not start it again'} ({reruns})")
        time.sleep(45)
        continue
    if top['status'] == 'queued' and js is not None and len(js) == 0:
        stuck_since = stuck_since or time.time()
        if time.time() - stuck_since > 300 and started < 3 and start_build():
            started += 1
            stuck_since = None
            say(f"build: run {top['run_number']} sat queued with no jobs for five minutes; started one by hand")
    else:
        stuck_since = None
    time.sleep(30)
if not built:
    say('GAVE UP: the newest commit on source was not built in the time allowed')
    sys.exit(4)

# 2. GitHub Pages' deployment of the newest commit on `main`.
seen, reruns, live = None, 0, None
while time.time() < DEADLINE:
    m = tip('main')
    if not m:
        time.sleep(30)
        continue
    if m != live:
        live, seen, reruns = m, None, 0
    rs = runs(PAGES, live)
    if not rs:
        time.sleep(30)
        continue
    top = rs[0]
    state = (top['run_number'], top.get('run_attempt'), top['status'], top.get('conclusion'))
    if state != seen:
        say(describe('deployment', top))
        seen = state
    if top['status'] == 'completed':
        if top.get('conclusion') == 'success':
            say(f"DEPLOYED {live[:8]} (deployment run {top['run_number']})")
            sys.exit(0)
        bad = real_failures(jobs(top['id']) or [])
        if bad:
            say(f"DEPLOYMENT FAILED in: {', '.join(bad)} (run {top['run_number']}). This needs a look.")
            sys.exit(5)
        if reruns >= 12:
            say('DEPLOYMENT: no machine from GitHub after 12 re-runs')
            sys.exit(6)
        ok = rerun(top['id'])
        reruns += 1
        say(f"deployment: run {top['run_number']} ended without a machine; {'started again' if ok else 'could not start it again'} ({reruns})")
        time.sleep(45)
        continue
    time.sleep(30)
say(f"GAVE UP: main is at {(live or '?')[:8]} but GitHub Pages has not deployed it in the time allowed")
sys.exit(7)
