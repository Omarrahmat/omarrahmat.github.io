#!/usr/bin/env bash
# Build, test and publish FosteringToday.com from this checkout (the `source` branch).
# Usage: bash scripts/desk/publish.sh "<commit message>"
# Needs: node, git with push access to github.com/Omarrahmat/omarrahmat.github.io, Playwright (preinstalled).
# No npm install is needed: react, react-dom and esbuild are found in /opt/npm-tools or the global npm root.
set -euo pipefail
MSG="${1:-Site update by desk}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export NEXT_PUBLIC_SUPABASE_URL=https://vbgustjtxjmjlgukzcfa.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OLCpJFfc-ILt9acNMdfb_Q_wL4yjqSS
node scripts/merge-data.mjs
node scripts/merge-news.mjs
node scripts/merge-guides.mjs
node scripts/merge-allowances.mjs
timeout 600 node scripts/build-static.mjs
echo "--- smoke test"
timeout 900 node scripts/e2e.mjs > /tmp/ft-e2e.log 2>&1 || { tail -40 /tmp/ft-e2e.log; echo "E2E FAILED: nothing published"; exit 2; }
tail -2 /tmp/ft-e2e.log
echo "--- save source"
git add -A
git -c user.name="Fostering Today desk" -c user.email="hello@fosteringtoday.com" commit -q -m "$MSG" || echo "(no source changes)"
git push -q origin HEAD:source
echo "--- deploy"
PAGES="$(mktemp -d)"
git clone -q --depth 1 --branch main "$(git remote get-url origin)" "$PAGES"
find "$PAGES" -mindepth 1 -maxdepth 1 ! -name .git ! -name .nojekyll -exec rm -rf {} +
cp -a out/. "$PAGES/"
cd "$PAGES"
git add -A
if git -c user.name="Fostering Today desk" -c user.email="hello@fosteringtoday.com" commit -q -m "$MSG"; then
  git push -q origin main
  echo "PUBLISHED $(git rev-parse --short HEAD)"
else
  echo "NO SITE CHANGES"
fi
