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
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
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
      scripts: {
        dev: 'vite',
        'dev:demo': 'node scripts/demo.mjs',
        'update:presets': 'node scripts/update-presets.mjs',
        'check:presets': 'node scripts/check-presets.mjs'
      }
    }),
    'src/main.ts': 'export {};',
    'database/mysql/01-schema.sql': 'CREATE TABLE sys_user (id INT);',
    'database/mysql/02-seed.sql': '-- Basic permissions',
    'build/optional-examples.ts': 'export {};',
    'scripts/demo.mjs': '// Showcase launcher',
    'examples/index.ts': 'export {};',
    'workers/api/src/index.mjs': '// Optional backend',
    'public/favicon.svg': '<svg />',
    'pnpm-lock.yaml': 'lockfileVersion: 9.0',
    'scaffold/metadata.json': JSON.stringify({
      version: 1,
      sourceLockHash: createHash('sha256')
        .update('lockfileVersion: 9.0')
        .digest('hex')
    }),
    'docs/api.md': '# API',
    'scaffold/demo/README.md': '# Full demo',
    'docs/examples.md': '# Examples',
    'deploy/cloudflare/index.mjs': '// deploy',
    'cloudflare.config.ts': '// deployment config',
    'scaffold/core/package.json': JSON.stringify({
      name: 'template',
      private: true,
      packageManager: 'pnpm@12.3.4',
      scripts: { dev: 'vite' }
    }),
    'scaffold/core/pnpm-lock.yaml': 'lockfileVersion: 9.0',
    'scaffold/core/vite.config.ts': '// Core only',
    'scaffold/core/src/router/extensions.ts': '// Empty routes',
    'scaffold/worker/workers/api/src/config/pages.mjs':
      '// Core page catalogue',
    'scaffold/worker/workers/api/migrations/0002_seed.sql':
      '-- Core permissions',

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

test('starter creation preserves SQL and excludes optional modules, excludes personal files and writes fresh configuration', async (t) => {
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
    'public/favicon.svg'
  ]) {
    assert.ok((await lstat(path.join(target, name))).isFile());
  }
  for (const name of [
    'node_modules',
    '.git',
    'dist',
    '.cloudflare',
    'workers',
    'examples',
    'deploy',
    'cloudflare.config.ts',
    'scaffold',
    'docs/examples.md',
    'linked-secret'
  ]) {
    await assert.rejects(lstat(path.join(target, name)), { code: 'ENOENT' });
  }
  const env = await readFile(
    path.join(target, '.env.development.local'),
    'utf8'
  );
  assert.doesNotMatch(env, /VITE_DEMO_ENABLED/);
  assert.equal(result.preset, 'starter');
  assert.equal(pkg.scripts['dev:demo'], undefined);
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
  const demoPackage = JSON.parse(
    await readFile(path.join(result.directory, 'package.json'))
  );
  assert.equal(demoPackage.scripts['update:presets'], undefined);
  assert.equal(demoPackage.scripts['check:presets'], undefined);
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

test('worker preset includes only core frontend and independent backend', async (t) => {
  const { cwd, source } = await fixture(t);
  const result = await createProject({
    projectName: 'with-worker',
    cwd,
    templateDir: source,
    preset: 'worker'
  });
  assert.equal(result.preset, 'worker');
  assert.equal(result.startCommand, 'pnpm dev');
  assert.ok(
    (
      await lstat(path.join(result.directory, 'workers/api/src/index.mjs'))
    ).isFile()
  );
  assert.equal(
    await readFile(
      path.join(result.directory, 'workers/api/src/config/pages.mjs'),
      'utf8'
    ),
    '// Core page catalogue'
  );
  const pkg = JSON.parse(
    await readFile(path.join(result.directory, 'package.json'))
  );
  assert.match(pkg.scripts['check:backend'], /workers\/api/);
  for (const entry of ['examples', 'deploy', 'scaffold', 'workers/api/.local'])
    await assert.rejects(lstat(path.join(result.directory, entry)), {
      code: 'ENOENT'
    });
});

test('presets reject unknown selections, conflicting alias and stale snapshots before creating a project', async (t) => {
  const { cwd, source } = await fixture(t);
  for (const options of [{ preset: 'other' }, { preset: 'worker', demo: true }])
    await assert.rejects(
      createProject({
        projectName: 'invalid',
        cwd,
        templateDir: source,
        ...options
      }),
      /模板|--demo/
    );
  await writeFile(
    path.join(source, 'scaffold/core/package.json'),
    JSON.stringify({ scripts: { dev: 'outdated' } })
  );
  await assert.rejects(
    createProject({ projectName: 'stale', cwd, templateDir: source }),
    /快照已过期/
  );
  await assert.rejects(lstat(path.join(cwd, 'stale')), { code: 'ENOENT' });
});

test('CLI flags generate starter by default and accept explicit worker/demo selections', async (t) => {
  const { cwd, source } = await fixture(t);
  const cli = fileURLToPath(new URL('../bin/index.js', import.meta.url));
  for (const preset of ['starter', 'worker', 'demo']) {
    const args = [
      cli,
      `cli-${preset}`,
      '--yes',
      '--template-dir',
      source,
      ...(preset === 'starter' ? [] : ['--preset', preset])
    ];
    const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const directory = path.join(cwd, `cli-${preset}`);
    assert.equal(
      (await readdir(directory)).includes('workers'),
      preset !== 'starter'
    );
    assert.equal(
      (await readdir(directory)).includes('examples'),
      preset === 'demo'
    );
    assert.match(result.stdout, /初始化完成/);
  }
});

test('changed source lock requires regeneration and never leaves a project', async (t) => {
  const { cwd, source } = await fixture(t);
  await writeFile(path.join(source, 'pnpm-lock.yaml'), 'changed');
  await assert.rejects(
    createProject({ projectName: 'stale-lock', cwd, templateDir: source }),
    /锁文件快照已过期/
  );
  await assert.rejects(lstat(path.join(cwd, 'stale-lock')), { code: 'ENOENT' });
});
