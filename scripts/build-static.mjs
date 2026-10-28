// Static site builder: renders every page to plain HTML and bundles the interactive parts.
// Uses the same React components as src/ and needs only react, react-dom and esbuild.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'src');
const out = path.join(root, 'out');
const tmp = path.join(root, '.static-build');
const require = createRequire(import.meta.url);

function findPkgDir(name) {
  for (const base of [root, execSync('npm root -g').toString().trim(), '/opt/npm-tools']) {
    for (const nm of [path.join(base, 'node_modules'), base]) {
      if (fs.existsSync(path.join(nm, name, 'package.json'))) return nm;
    }
  }
  throw new Error(`Cannot find ${name}`);
}
const esbuild = require(path.join(findPkgDir('esbuild'), 'esbuild'));
const nodePaths = [findPkgDir('react')];

const ISLANDS = {
  SimpleForm: ['default'],
  DirectoryClient: ['default'],
  ParamForms: ['ClaimForm', 'ContactForm'],
  EnquiryForm: ['default'],
  PayCalculator: ['default'],
  Portal: ['default'],
  Unsubscribe: ['default'],
  ProfileLive: ['default', 'LogoTile'],
};

const plugin = (server) => ({
  name: 'site',
  setup(build) {
    build.onResolve({ filter: /^next\/link$/ }, () => ({ path: path.join(root, 'scripts/static/shim-link.tsx') }));
    build.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: path.join(root, 'scripts/static/shim-navigation.ts') }));
    build.onResolve({ filter: /^@\// }, async (args) => {
      const name = args.path.slice(2);
      const m = name.match(/^components\/(\w+)$/);
      if (server && m && ISLANDS[m[1]] && args.importer.includes(`${path.sep}src${path.sep}app${path.sep}`)) {
        return { path: m[1], namespace: 'island' };
      }
      const r = await build.resolve('./' + name, { resolveDir: src, kind: args.kind });
      return r;
    });
    build.onLoad({ filter: /.*/, namespace: 'island' }, (args) => {
      const real = path.join(src, 'components', args.path + '.tsx');
      const names = ISLANDS[args.path];
      const lines = [`import * as Real from ${JSON.stringify(real)};`, `import { makeIsland } from ${JSON.stringify(path.join(root, 'scripts/static/island.tsx'))};`];
      for (const n of names) {
        lines.push(n === 'default' ? `export default makeIsland(${JSON.stringify(args.path)}, Real.default);` : `export const ${n} = makeIsland(${JSON.stringify(n)}, Real.${n});`);
      }
      return { contents: lines.join('\n'), loader: 'tsx', resolveDir: root };
    });
    if (server) build.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
  },
});

const common = {
  bundle: true,
  jsx: 'automatic',
  nodePaths,
  tsconfigRaw: '{"compilerOptions":{"jsx":"react-jsx"}}',
  define: {
    'process.env.NODE_ENV': '"production"',
    // Public values only. Set these before building to switch the forms from demo mode to live.
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
  },
  logLevel: 'warning',
  logOverride: { 'unsupported-directive': 'silent' },
};

fs.rmSync(out, { recursive: true, force: true });
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

await esbuild.build({
  ...common,
  entryPoints: [path.join(root, 'scripts/static/server-entry.tsx')],
  platform: 'node', format: 'cjs', outfile: path.join(tmp, 'server.cjs'),
  plugins: [plugin(true)],
});
await esbuild.build({
  ...common,
  entryPoints: [path.join(root, 'scripts/static/client-entry.tsx')],
  platform: 'browser', format: 'iife', minify: true, target: 'es2020', outfile: path.join(out, 'assets/client.js'),
  plugins: [plugin(false)],
});

const css = fs.readFileSync(path.join(src, 'app/globals.css'), 'utf8');
fs.writeFileSync(path.join(out, 'assets/site.css'), (await esbuild.transform(css, { loader: 'css', minify: true })).code);
fs.writeFileSync(path.join(out, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#FBF4E6"/><circle cx="27" cy="12" r="6" fill="#FFC933"/><path d="M6 38V22a10 10 0 0 1 20 0v16z" fill="#0F3D33"/><path d="M26 38V27a6 6 0 0 1 12 0v11z" fill="#FF6A4D"/></svg>');
if (fs.existsSync(path.join(root, 'public'))) fs.cpSync(path.join(root, 'public'), out, { recursive: true });

const { buildAll } = require(path.join(tmp, 'server.cjs'));
const files = await buildAll();
for (const f of files) {
  const p = path.join(out, f.file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, f.content);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Built ${files.length} files into out/`);
