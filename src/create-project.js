import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { downloadTemplate } from 'giget';
import { composePreset, PRESETS, resolvePreset } from './presets.js';

export const TEMPLATE_REPOSITORY = 'github:npora/admin-template';

export function validateProjectName(name) {
  if (
    typeof name !== 'string' ||
    name.length > 214 ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(name) ||
    ['node_modules', 'favicon.ico'].includes(name) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
  ) {
    throw new Error(
      '项目名请使用小写字母、数字、连字符、下划线或点，不能是路径或保留名称。'
    );
  }
  return name;
}

export function normalizeApiURL(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('后端地址必须是完整的 http:// 或 https:// URL。');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      '后端地址只支持 HTTP/HTTPS，不能包含账号、密码、查询参数或片段。'
    );
  }
  return url.toString().replace(/\/$/, '');
}

const excluded = new Set([
  '.git',
  'AGENTS.md',
  '.agents',
  '.codex',
  '.aws',
  '.idea',
  'node_modules',
  'dist',
  'dist-ssr',
  '.cloudflare',
  '.wrangler',
  'coverage',
  '.pnpm-store',
  '.DS_Store',
  'report.html'
]);

async function copyTemplate(
  source,
  destination,
  { contentsOnly = false } = {}
) {
  const options = {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter: async (entry) => {
      const name = path.basename(entry);
      return (
        !excluded.has(name) &&
        !name.endsWith('.local') &&
        !name.endsWith('.log') &&
        !(await lstat(entry)).isSymbolicLink()
      );
    }
  };
  if (contentsOnly) {
    // The caller exclusively created the target. Copy new children without
    // asking fs.cp to merge the existing root (which fails on Node 24).
    for (const entry of await readdir(source)) {
      await cp(
        path.join(source, entry),
        path.join(destination, entry),
        options
      );
    }
  } else {
    await cp(source, destination, options);
  }
}

async function validateTemplate(directory) {
  const required = [
    'src/main.ts',
    'database/mysql/01-schema.sql',
    'database/mysql/02-seed.sql',
    'build/optional-examples.ts',
    'scripts/demo.mjs',
    'scaffold/metadata.json',
    'scaffold/demo/README.md',
    'scaffold/core/package.json',
    'scaffold/core/pnpm-lock.yaml',
    'scaffold/core/vite.config.ts',
    'scaffold/core/src/router/extensions.ts',
    'scaffold/worker/workers/api/src/config/pages.mjs',
    'scaffold/worker/workers/api/migrations/0002_seed.sql'
  ];
  for (const file of required) {
    try {
      if (!(await lstat(path.join(directory, file))).isFile())
        throw new Error();
    } catch {
      throw new Error(
        `模板缺少 ${file}，请使用已完成核心/展示分离的新版本模板。`
      );
    }
  }
  const pkg = JSON.parse(
    await readFile(path.join(directory, 'package.json'), 'utf8')
  );
  if (!pkg.scripts?.dev || !pkg.scripts?.['dev:demo']) {
    throw new Error('模板缺少当前开发或展示命令。');
  }
  return pkg;
}

export async function createProject({
  projectName,
  cwd = process.cwd(),
  demo = false,
  preset,
  apiURL,
  ref = 'main',
  templateDir,
  download = downloadTemplate
}) {
  validateProjectName(projectName);
  const selected = resolvePreset(preset, demo);
  demo = selected === 'demo';
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(ref) ||
    ref.includes('..') ||
    ref.includes('//') ||
    ref.endsWith('/')
  ) {
    throw new Error('模板版本必须是有效的分支或标签名称。');
  }
  const backend = apiURL === undefined ? undefined : normalizeApiURL(apiURL);
  const target = path.resolve(cwd, projectName);
  try {
    await lstat(target);
    throw new Error(
      `目录 ${projectName} 已存在，请换一个项目名；不会覆盖已有内容。`
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const temporary = await mkdtemp(path.join(tmpdir(), 'create-nova-admin-'));
  const prepared = path.join(temporary, 'prepared');
  let created = false;
  try {
    if (templateDir) {
      const source = path.resolve(cwd, templateDir);
      if (!(await lstat(source)).isDirectory())
        throw new Error('本地模板必须是目录。');
      const relative = path.relative(source, temporary);
      if (
        !relative ||
        (!relative.startsWith(`..${path.sep}`) &&
          relative !== '..' &&
          !path.isAbsolute(relative))
      ) {
        throw new Error('本地模板不能包含生成器的临时工作目录。');
      }
      await copyTemplate(source, prepared);
    } else {
      const downloaded = path.join(temporary, 'downloaded');
      await download(`${TEMPLATE_REPOSITORY}#${ref}`, {
        dir: downloaded,
        force: false,
        registry: false
      });
      await copyTemplate(downloaded, prepared);
    }
    const original = await validateTemplate(prepared);
    const pkg = await composePreset(prepared, selected, original);
    pkg.name = projectName;
    pkg.private = true;
    await writeFile(
      path.join(prepared, 'package.json'),
      `${JSON.stringify(pkg, null, 2)}\n`
    );
    const config = [
      '# 此文件只用于本机开发，不提交版本控制。',
      ...(demo ? ['VITE_DEMO_ENABLED=true'] : []),
      ...(!demo || backend
        ? [`VITE_API_URL=${backend || 'http://localhost:8080'}`]
        : []),
      ''
    ].join('\n');
    await writeFile(path.join(prepared, '.env.development.local'), config, {
      mode: 0o600
    });

    // 独占创建目标：下载期间出现同名目录时也不覆盖。
    await mkdir(target);
    created = true;
    await copyTemplate(prepared, target, { contentsOnly: true });
    // 本机环境只由生成器写入，不从模板源继承。
    await writeFile(path.join(target, '.env.development.local'), config, {
      mode: 0o600
    });
    return {
      directory: target,
      projectName,
      demo,
      preset: selected,
      presetLabel: PRESETS[selected],
      startCommand: demo && !backend ? 'npm run dev:demo' : 'npm run dev'
    };
  } catch (error) {
    if (created) await rm(target, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
