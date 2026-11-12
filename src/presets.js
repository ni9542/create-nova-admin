import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const PRESETS = {
  starter: '纯净后台',
  worker: '后台 + Worker 后端',
  demo: '完整演示'
};

export function resolvePreset(preset, demo = false) {
  const selected = preset ?? (demo ? 'demo' : 'starter');
  if (!Object.hasOwn(PRESETS, selected))
    throw new Error('模板仅支持 starter、worker、demo。');
  if (demo && selected !== 'demo')
    throw new Error('--demo 不能与其他 --preset 同时使用。');
  return selected;
}

const removeCore = [
  'examples',
  'deploy',
  'cloudflare.config.ts',
  'tsconfig.demo.json',
  'build/optional-examples.ts',
  'src/types/examples.d.ts',
  'scripts/demo.mjs',
  'scripts/lib',
  'scripts/check-backend.mjs',
  'scripts/check-standalone.mjs'
];

// Compose data files only; never execute scripts from a downloaded template.
export async function composePreset(directory, preset, original) {
  const overlays = path.join(directory, 'scaffold');
  if (preset !== 'demo') {
    const metadata = JSON.parse(
      await readFile(path.join(overlays, 'metadata.json'), 'utf8')
    );
    if (![1, 2].includes(metadata.version))
      throw new Error('不支持的模板锁文件快照版本。');
    const lockfile =
      metadata.version === 2 ? 'package-lock.json' : 'pnpm-lock.yaml';
    const sourceLockHash = createHash('sha256')
      .update(await readFile(path.join(directory, lockfile)))
      .digest('hex');
    if (metadata.sourceLockHash !== sourceLockHash)
      throw new Error(
        '模板的纯净版锁文件快照已过期，请维护者运行 npm run update:presets。'
      );
    const core = JSON.parse(
      await readFile(path.join(overlays, 'core/package.json'), 'utf8')
    );
    const expected = { ...original.devDependencies };
    delete expected['@cloudflare/vite-plugin'];
    delete expected.cf;
    const equal = (a, b) =>
      JSON.stringify(Object.entries(a ?? {}).sort()) ===
      JSON.stringify(Object.entries(b ?? {}).sort());
    if (
      !equal(core.dependencies, original.dependencies) ||
      !equal(core.devDependencies, expected) ||
      Object.entries(core.scripts).some(
        ([key, value]) => value !== original.scripts[key]
      )
    )
      throw new Error(
        '模板的纯净版依赖快照已过期，请维护者运行 npm run update:presets。'
      );
    for (const entry of removeCore)
      await rm(path.join(directory, entry), { recursive: true, force: true });
    if (preset === 'starter')
      await rm(path.join(directory, 'workers'), {
        recursive: true,
        force: true
      });
    // Keep common contracts, replace repository-specific usage documentation.
    for (const entry of await readdir(path.join(directory, 'docs'))) {
      if (
        !['api.md', 'rbac.md', 'i18n.md', 'deployment.md', 'database'].includes(
          entry
        )
      )
        await rm(path.join(directory, 'docs', entry), {
          recursive: true,
          force: true
        });
    }
    await cp(path.join(overlays, 'core'), directory, {
      recursive: true,
      force: true
    });
    if (preset === 'worker') {
      await cp(path.join(overlays, 'worker'), directory, {
        recursive: true,
        force: true
      });
      await rm(path.join(directory, 'workers/api/integration'), {
        recursive: true,
        force: true
      });
      core.scripts['check:backend'] =
        'node workers/api/scripts/build.mjs && node scripts/run-tests.mjs --backend';
      await writeFile(
        path.join(directory, 'package.json'),
        JSON.stringify(core, null, 2) + '\n'
      );
      await writeFile(
        path.join(directory, 'README.md'),
        '\n## 已选择 Worker 后端\n\n项目包含 `workers/api/`，使用前先完成数据库迁移和账号初始化，再配置自己的 API 地址。`npm run check:backend` 检查后端。见 [后端说明](workers/api/README.md)。\n',
        { flag: 'a' }
      );
    }
  }
  if (preset === 'demo')
    await cp(path.join(overlays, 'demo'), directory, {
      recursive: true,
      force: true
    });
  for (const entry of [
    '.github/workflows/presets.yml',
    'scripts/update-presets.mjs',
    'scripts/check-presets.mjs'
  ]) {
    await rm(path.join(directory, entry), { force: true });
  }
  await rm(overlays, { recursive: true, force: true });
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8')
  );
  delete pkg.packageManager;
  delete pkg.scripts['update:presets'];
  delete pkg.scripts['check:presets'];
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify(pkg, null, 2) + '\n'
  );
  return pkg;
}
