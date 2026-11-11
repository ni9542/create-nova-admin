import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  symlink,
  lstat,
  readdir,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createProject,
  validateProjectName,
  normalizeApiURL
} from '../src/create-project.js';

async function fixture(t) {
  const cwd = await mkdtemp(path.join(tmpdir(), 'nova-cli-test-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const source = path.join(cwd, 'template');
  const files = {
    'package.json': JSON.stringify({
      name: 'template',
      private: true,
      packageManager: 'pnpm@12.3.4',
      scripts: { dev: 'vite', 'dev:demo': 'node scripts/demo.mjs' }
    }),
    'src/main.ts': 'export {};',
    'database/mysql/01-schema.sql': 'CREATE TABLE sys_user (id INT);',
    'database/mysql/02-seed.sql': '-- Basic permissions',
    'build/optional-examples.ts': 'export {};',
    'scripts/demo.mjs': '// Showcase launcher',
    'examples/index.ts': 'export {};',
    'workers/api/src/index.mjs': '// Optional backend',
    'public/favicon.svg': '<svg />',
    '.env.development.local': 'PRIVATE_TOKEN=do-not-copy',
    'workers/api/.local/credentials.json': 'do-not-copy',
    'node_modules/private.txt': 'do-not-copy',
    '.git/config': 'do-not-copy',
    '.cloudflare/cache.json': 'do-not-copy',
    'dist/index.html': 'do-not-copy'
  };
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(source, name)), { recursive: true });
    await writeFile(path.join(source, name), text);
  }
  await symlink(
    path.join(source, '.env.development.local'),
    path.join(source, 'linked-secret')
  );
  return { cwd, source };
}

test('core creation preserves SQL and optional modules, excludes personal files and writes fresh configuration', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'my-admin',
    cwd,
    templateDir: source,
    apiURL: 'https://api.example.com/'
  });
  const target = result.directory;
  const pkg = JSON.parse(await readFile(path.join(target, 'package.json')));
  assert.equal(pkg.name, 'my-admin');
  assert.equal(pkg.private, true);
  assert.equal(pkg.packageManager, 'pnpm@12.3.4');
  assert.equal(result.startCommand, 'pnpm dev');
  for (const name of [
    'database/mysql/01-schema.sql',
    'database/mysql/02-seed.sql',
    'examples/index.ts',
    'workers/api/src/index.mjs',
    'public/favicon.svg'
  ]) {
    assert.ok((await lstat(path.join(target, name))).isFile());
  }
  for (const name of [
    'node_modules',
    '.git',
    'dist',
    '.cloudflare',
    'workers/api/.local',
    'linked-secret'
  ]) {
    await assert.rejects(lstat(path.join(target, name)), { code: 'ENOENT' });
  }
  const env = await readFile(
    path.join(target, '.env.development.local'),
    'utf8'
  );
  assert.match(env, /VITE_DEMO_ENABLED=false/);
  assert.match(env, /VITE_API_URL=https:\/\/api.example.com\n/);
  assert.doesNotMatch(env, /PRIVATE_TOKEN/);
  assert.match(
    await readFile(path.join(source, '.env.development.local'), 'utf8'),
    /PRIVATE_TOKEN/
  );
});

test('demo creation prints the real demo command, custom demo API uses the configured dev entry', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'showcase',
    cwd,
    templateDir: source,
    demo: true
  });
  assert.equal(result.startCommand, 'pnpm dev:demo');
  assert.match(
    await readFile(
      path.join(result.directory, '.env.development.local'),
      'utf8'
    ),
    /VITE_DEMO_ENABLED=true/
  );
  const custom = await createProject({
    projectName: 'custom-demo',
    cwd,
    templateDir: source,
    demo: true,
    apiURL: 'http://localhost:9000'
  });
  assert.equal(custom.startCommand, 'pnpm dev');
  assert.match(
    await readFile(
      path.join(custom.directory, '.env.development.local'),
      'utf8'
    ),
    /VITE_API_URL=http:\/\/localhost:9000/
  );
});

test('never overwrite existing directories or targets created while downloading', async (t) => {
  const { cwd, source } = await fixture(t);
  await mkdir(path.join(cwd, 'existing'));
  await writeFile(path.join(cwd, 'existing', 'keep.txt'), 'keep');
  await assert.rejects(
    createProject({ projectName: 'existing', cwd, templateDir: source }),
    /已存在/
  );
  assert.equal(
    await readFile(path.join(cwd, 'existing', 'keep.txt'), 'utf8'),
    'keep'
  );
  await assert.rejects(
    createProject({
      projectName: 'race',
      cwd,
      download: async (_input, options) => {
        const { cp } = await import('node:fs/promises');
        await cp(source, options.dir, { recursive: true });
        await mkdir(path.join(cwd, 'race'));
        await writeFile(path.join(cwd, 'race', 'keep.txt'), 'concurrent');
      }
    }),
    { code: 'EEXIST' }
  );
  assert.equal(
    await readFile(path.join(cwd, 'race', 'keep.txt'), 'utf8'),
    'concurrent'
  );
});

test('current repository/ref is downloaded and failed or incomplete downloads leave no project', async (t) => {
  const { cwd, source } = await fixture(t);
  let received;
  await createProject({
    projectName: 'downloaded',
    cwd,
    ref: 'v0.1.0',
    download: async (input, options) => {
      received = input;
      assert.equal(options.force, false);
      const { cp } = await import('node:fs/promises');
      await cp(source, options.dir, { recursive: true });
    }
  });
  assert.equal(received, 'github:npora/admin-template#v0.1.0');
  await assert.rejects(
    createProject({
      projectName: 'failed',
      cwd,
      download: async () => {
        throw new Error('network failed');
      }
    }),
    /network failed/
  );
  await assert.rejects(lstat(path.join(cwd, 'failed')), { code: 'ENOENT' });
  await rm(path.join(source, 'database/mysql/02-seed.sql'));
  await assert.rejects(
    createProject({ projectName: 'incomplete', cwd, templateDir: source }),
    /模板缺少/
  );
  await assert.rejects(lstat(path.join(cwd, 'incomplete')), { code: 'ENOENT' });
  assert.deepEqual((await readdir(cwd)).sort(), ['downloaded', 'template']);
});

test('project and API inputs reject traversal, shell text and credentials', () => {
  for (const name of [
    '',
    '.',
    '..',
    '../outside',
    '/absolute',
    'My App',
    'UPPERCASE',
    'node_modules',
    'con',
    'name;echo',
    'a'.repeat(215)
  ]) {
    assert.throws(() => validateProjectName(name));
  }
  assert.equal(validateProjectName('my-admin_2'), 'my-admin_2');
  for (const value of [
    'ftp://api.example.com',
    'https://user:secret@api.example.com',
    'https://api.example.com?token=secret',
    'not-a-url'
  ]) {
    assert.throws(() => normalizeApiURL(value));
  }
});
