// Builds a single-file, clickable preview of the whole site from out/ (run build-static first).
// Every page's content is embedded and a small hash router swaps pages in place, so the preview
// can be opened anywhere without a server. The real site in out/ is unchanged.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'out');
const target = path.join(root, 'docs', 'preview.html');

const pages = {};
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name === 'index.html') {
      const rel = '/' + path.relative(out, dir).split(path.sep).filter(Boolean).join('/');
      const route = rel === '/' ? '/' : rel + '/';
      const html = fs.readFileSync(p, 'utf8');
      const main = /<main id="main">([\s\S]*?)<\/main>/.exec(html);
      const title = /<title>([\s\S]*?)<\/title>/.exec(html);
      if (!main) throw new Error('no <main> in ' + p);
      const badge = 'data:image/svg+xml,' + encodeURIComponent(fs.readFileSync(path.join(out, 'badge.svg'), 'utf8'));
      pages[route] = { title: title ? title[1] : 'Fostering Today', html: main[1].split('src="/badge.svg"').join('src="' + badge + '"') };
    }
  }
}
walk(out);
{
  const nf = fs.readFileSync(path.join(out, '404.html'), 'utf8');
  const main = /<main id="main">([\s\S]*?)<\/main>/.exec(nf);
  pages['/404/'] = { title: 'Page not found | Fostering Today', html: main ? main[1] : '<p>Page not found.</p>' };
}

const shell = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(out, 'assets', 'site.css'), 'utf8');
const js = fs.readFileSync(path.join(out, 'assets', 'client.js'), 'utf8');
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');

const router = `
(function () {
  var pages = JSON.parse(document.getElementById('preview-pages').textContent);
  var main = document.getElementById('main');
  function parse(hash) {
    var h = hash.replace(/^#/, '') || '/';
    var frag = ''; var q = '';
    var fi = h.indexOf('#'); if (fi >= 0) { frag = h.slice(fi + 1); h = h.slice(0, fi); }
    var qi = h.indexOf('?'); if (qi >= 0) { q = h.slice(qi); h = h.slice(0, qi); }
    if (!h.endsWith('/')) h += '/';
    return { path: h, query: q, frag: frag };
  }
  function render() {
    var r = parse(location.hash);
    var page = pages[r.path] || pages['/404/'];
    main.innerHTML = page.html;
    document.title = page.title;
    if (window.__hydrateIslands) window.__hydrateIslands(main);
    if (r.frag) { var el = document.getElementById(r.frag); if (el) el.scrollIntoView(); else window.scrollTo(0, 0); }
    else window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/' || a.target === '_blank') return;
    e.preventDefault();
    location.hash = href;
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || (f.getAttribute('method') || 'get').toLowerCase() !== 'get') return;
    var action = f.getAttribute('action') || '';
    if (action.charAt(0) !== '/') return;
    e.preventDefault();
    var params = new URLSearchParams(new FormData(f));
    var qs = params.toString();
    location.hash = action + (qs ? '?' + qs : '');
  });
  window.addEventListener('hashchange', render);
  render();
})();
`;

let html = shell
  .replace('<link rel="stylesheet" href="/assets/site.css">', () => '<style>' + css + '</style>')
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Fostering Today preview</title>')
  .replace(/<link rel="canonical"[^>]*>/, '')
  .replace(/<link rel="icon"[^>]*>/, '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(fs.readFileSync(path.join(out, 'favicon.svg'), 'utf8')) + '">')
  .replace(/<main id="main">[\s\S]*?<\/main>/, '<main id="main"></main>')
  .replace('<script src="/assets/client.js" defer></script>', () =>
    '<div class="preview-note" style="position:fixed;bottom:12px;right:12px;z-index:50;background:#14130F;color:#FBF4E6;font:600 13px/1.3 DM Sans,sans-serif;padding:8px 12px;border-radius:999px;box-shadow:4px 4px 0 #FFC933">Preview build · forms in demo mode</div>'
    + '<script id="preview-pages" type="application/json">' + safe(JSON.stringify(pages)) + '</script>'
    + '<script>' + safe(js) + '</script>'
    + '<script>' + router + '</script>');

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, html);
console.log(`Preview written: ${target} (${Object.keys(pages).length} pages, ${(html.length / 1048576).toFixed(1)} MB)`);
