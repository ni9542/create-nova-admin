# @niping9542/create-nova-admin

创建 Vue 3 + TypeScript + Element Plus + Pinia 后台脚手架。模板来自 [npora/admin-template](https://github.com/npora/admin-template)，默认 `main`，核心源码只维护一份。

## 选择模板

```sh
npx @niping9542/create-nova-admin@latest
```

按提示输入项目名并选择：

| 预设              | 内容                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `starter`（默认） | 纯净后台，保留登录、布局、用户/部门/角色/菜单管理、权限、公共组件、多语言、主题和正式 SQL |
| `worker`          | 纯净后台 + 独立 Worker 后端源码与 SQLite 迁移，后端菜单只引用核心页面                     |
| `demo`            | 完整演示首页与示例页面、测试后端和展示站实现                                              |

默认纯净版不生成 `examples/`、`workers/`、`deploy/`，也不保留相关依赖、构建插件和命令。Worker 版只额外生成后端，无需手动删除示例目录。完整演示需要网络访问测试 API，不使用本地 Mock。

明确指定模板：

```sh
npx @niping9542/create-nova-admin@latest my-admin --preset starter
npx @niping9542/create-nova-admin@latest my-worker --preset worker
npx @niping9542/create-nova-admin@latest my-demo --preset demo
```

原 `--demo` 兼容为 `--preset demo`，不能与其他预设同时指定。`--yes` 或非交互终端不询问模板，默认 `starter`。

## 启动

需要 Node.js 22.12+（后端检查需 22.13+），使用生成项目 `packageManager` 指定版本的 pnpm。

```sh
cd my-admin
pnpm install
pnpm dev
```

纯净版与 Worker 版默认代理到 `http://localhost:8080`，先启动自己的后端，或在生成时使用 `--api-url https://api.example.com`，之后也可修改 `.env.development.local`。Worker 版先完成迁移、密钥和账号初始化，见生成的后端说明；生成器不自动创建资源、执行 SQL 或部署。

完整演示无自定义 API 时使用生成器打印的 `pnpm dev:demo`；指定 `--api-url` 后使用 `pnpm dev`。API 前缀默认 `/api`，开发代理移除该前缀再转发。生产需要站点 API 转发，响应格式可在 `src/api/protocol/` 适配。

[完整展示网站](https://admin-demo.npora.workers.dev)：账号 `admin`，密码 `123456`。此账号只用于展示站。

## 目录与 SQL

| 目录                   | 用途                                   |
| ---------------------- | -------------------------------------- |
| `src/`                 | 核心后台与权限管理                     |
| `database/mysql/`      | 所有预设始终保留的正式表结构与基础授权 |
| `public/`、`build/`    | 静态资源与公共构建配置                 |
| `scripts/`、`tests/`   | 验证命令与回归测试                     |
| `docs/`                | 与所选预设匹配的使用和接口说明         |
| `workers/api/`         | Worker 与 demo 预设的独立后端          |
| `examples/`、`deploy/` | 仅完整演示预设包含                     |

在空 MySQL 数据库依次导入 `database/mysql/01-schema.sql`、`02-seed.sql`。正式 SQL 不包含测试账号，管理员及密码哈希由自己的后端初始化，与 Worker SQLite 迁移分开使用。

## 选项

| 选项                         | 用途                                            |
| ---------------------------- | ----------------------------------------------- |
| `[project-name]`             | 小写单级项目名，不接受路径                      |
| `-y, --yes`                  | 无交互，缺省名称 `nova-admin-app`、缺省纯净版   |
| `--preset <preset>`          | `starter`、`worker`、`demo`                     |
| `--demo`                     | `--preset demo` 的快捷方式                      |
| `--api-url <url>`            | HTTP/HTTPS 后端，不包含账号密码、查询参数或片段 |
| `--ref <ref>`                | 模板分支/标签，须支持当前预设目录结构           |
| `--template-dir <directory>` | 使用本地模板，不下载仓库                        |
| `--version`、`--help`        | 版本和帮助                                      |

目标已存在则失败，不覆盖已有内容。模板先在临时目录准备、校验再生成；失败清理本次创建的目录。本机配置、密钥、依赖、符号链接、构建缓存和 Git 历史不会复制。生成器不自动安装项目依赖或启动服务。

## 维护

```sh
npm ci
npm run check
npm pack --dry-run
node bin/index.js local-admin --yes --preset starter --template-dir ../admin-template
```

npm 包只包含生成器和说明；模板创建时获取。根模板的 `scaffold/` 保存少量差异文件，不进入生成结果。依赖变更后由模板维护者执行 `pnpm run update:presets`，防止纯净锁文件过期。

模板仓库与 CLI 需配套提交和发布；本地修改不会更新已经发布的 npm 包。新预设选项需要在生成器新版发布后才可通过 npm 使用。

许可证声明：MIT。
