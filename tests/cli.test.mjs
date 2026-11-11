import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(root, 'bin/index.js');
const run = (args, cwd = root) =>
  spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
    timeout: 10000
  });

test('package name, binary, lock metadata and CLI version agree', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json')));
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json')));
  assert.deepEqual(pkg.bin, { 'create-nova-admin': 'bin/index.js' });
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.deepEqual(lock.packages[''].bin, pkg.bin);
  assert.equal(run(['--version']).stdout.trim(), pkg.version);
  assert.match(run(['--help']).stdout, /--demo/);
  assert.match(run(['--help']).stdout, /--preset/);
  assert.match(run(['bad', '--preset', 'unknown']).stderr, /模板仅支持/);
  assert.match(run(['bad', '--preset', 'starter', '--demo']).stderr, /不能/);
});

test('noninteractive missing name and invalid paths exit unsuccessfully without creating files', async (t) => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'nova-cli-command-'));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const missing = run([], cwd);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /提供项目名称/);
  const invalid = run(['../outside'], cwd);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /项目名/);
  const broken = run(['my-admin', '--template-dir', './missing-template'], cwd);
  assert.equal(broken.status, 1);
});
