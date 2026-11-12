# Create Nova Admin

使用命令行创建 Vue 3 + TypeScript + Element Plus + Pinia 后台管理项目，请求使用 `@npora/request`，多语言使用 Vue I18n，并同步 Element Plus、Day.js 与页面日期格式。

npm 包名：`@niping9542/create-nova-admin`；[生成器源码](https://github.com/ni9542/create-nova-admin)。生成器从 [Npora Admin Template](https://github.com/npora/admin-template) 获取模板，默认使用 `main` 分支，按所选预设生成项目文件。

## 在线演示

[打开 Npora Admin 展示网站](https://admin-demo.npora.workers.dev)

| 账号    | 密码     |
| ------- | -------- |
| `admin` | `123456` |

以上账号仅用于在线演示和默认测试 API。纯净版、自己部署的后端和正式 SQL 不会自动获得这个账号。

## 环境要求

- 创建项目和开发前端：Node.js 22.12.0 或更高版本。
- 检查 Worker 后端：Node.js 22.13.0 或更高版本。
- 生成项目不指定 `packageManager`，可使用 npm、pnpm 或 Yarn。以下以 npm 为例；pnpm 锁文件仅供选择 pnpm 的使用者使用，其他工具会生成自己的锁文件，无需先删除 pnpm 配置。生成器自身使用 npm 锁文件维护依赖，与生成项目使用哪种包管理器无关。
- 在线创建需要能够访问 npm 和 GitHub；完整演示的默认测试 API 也需要网络。

## 创建项目

### 交互选择

```sh
npx @niping9542/create-nova-admin@latest
```

按提示输入项目名，选择模板。直接回车使用默认纯净版：

```text
选择模板：
  1. 纯净后台（默认）
  2. 后台 + Worker 后端
  3. 完整演示
```

### 三个模板的区别

| 内容                             | `starter` 纯净版 | `worker` 后端版 | `demo` 完整演示 |
| -------------------------------- | ---------------- | --------------- | --------------- |
| 登录页、后台布局、导航与标签页   | 保留             | 保留            | 保留            |
| 首页                             | 核心首页         | 核心首页        | 美化演示首页    |
| 用户、部门、角色、菜单及权限管理 | 保留             | 保留            | 保留            |
| 个人中心、公共组件、主题和多语言 | 保留             | 保留            | 保留            |
| 请求封装与前端 API 定义          | 保留             | 保留            | 保留            |
| 正式 MySQL 权限 SQL              | 保留             | 保留            | 保留            |
| Worker 后端源码与 SQLite 迁移    | 不生成           | 生成            | 生成            |
| 表格、表单、下载、缓存等示例页面 | 不生成           | 不生成          | 生成            |
| 展示站部署辅助                   | 不生成           | 不生成          | 生成            |

**纯净版包含登录页和首页，也保留完整的核心后台功能。** 它不附带 Worker 后端、示例页面和展示站部署工具，相关依赖、插件和命令也不生成。

所有预设使用真实 HTTP 请求，不附带本地 Mock。纯净版的登录流程、动态菜单和系统管理数据需要对接使用者自己的后端；Worker 版提供可独立部署的后端源码，但需要先初始化并运行后端。完整演示默认连接现有测试 API。

### 创建纯净版

```sh
npx @niping9542/create-nova-admin@latest my-admin --preset starter
cd my-admin
npm install
npm run dev
```

开发地址默认 `http://localhost:3000`，端口被占用时以终端打印的地址为准。登录页面可以正常打开；完成真实登录并进入首页，需要可用的后端认证接口。

### 创建 Worker 版

```sh
npx @niping9542/create-nova-admin@latest my-worker --preset worker
cd my-worker
npm install
npm run dev
```

该预设在纯净版基础上增加 `workers/api/`，后端菜单仅引用核心页面。按生成项目中的 `workers/api/README.md` 完成数据库迁移、密钥与账号初始化，并配置可访问的后端地址。

`npm run dev` 只启动前端，不会自动启动或部署 Worker。根目录的 `npm run check:backend` 用于检查后端构建与测试。

### 创建完整演示

```sh
npx @niping9542/create-nova-admin@latest my-demo --preset demo
cd my-demo
npm install
npm run dev:demo
```

兼容快捷选项：

```sh
npx @niping9542/create-nova-admin@latest my-demo --demo
```

完整演示默认使用测试 API，可使用前面的演示账号。`--demo` 等同于 `--preset demo`，不能同时指定其他预设。

## 接入自己的后端

在创建时指定接口地址：

```sh
npx @niping9542/create-nova-admin@latest my-admin --preset starter --api-url https://api.example.com
```

也可以创建后修改生成项目中的 `.env.development.local`：

```dotenv
VITE_API_URL=https://api.example.com
```

修改后重启开发服务。默认 API 前缀为 `/api`，开发代理会移除该前缀后转发给后端。此地址只配置开发代理；生产环境需要由站点服务器将 `/api` 转发到实际后端。

前端 API 定义位于生成项目的 `src/api/`，接口契约见其中的 `docs/api.md`；后端响应格式有差异时，集中调整 `src/api/protocol/`。

完整演示指定自定义 API 后，生成器会写入接口地址并启用演示页面，此时使用打印的 `npm run dev` 命令启动：

```sh
npx @niping9542/create-nova-admin@latest my-demo --preset demo --api-url https://api.example.com
```

## 生成项目的目录

以下是创建后的后台项目目录，不是本生成器仓库的目录。

| 目录              | 用途                                                       | 包含的预设       |
| ----------------- | ---------------------------------------------------------- | ---------------- |
| `src/`            | 登录、首页、布局、权限、系统管理、状态管理、请求与公共组件 | 全部             |
| `public/`         | 网站图标等原样输出的静态资源                               | 全部             |
| `build/`          | 公共构建配置和启动加载层                                   | 全部             |
| `database/mysql/` | 正式权限表结构与基础授权 SQL                               | 全部             |
| `scripts/`        | 所选预设需要的开发与检查工具                               | 全部             |
| `tests/`          | 前端核心回归与测试辅助                                     | 全部             |
| `docs/`           | 与所选预设匹配的目录、开发、接口和权限说明                 | 全部             |
| `workers/api/`    | 独立后端源码、SQLite 迁移、初始化脚本及测试                | `worker`、`demo` |
| `examples/`       | 演示首页、示例页面、统计 API 与示例测试                    | `demo`           |
| `deploy/`         | 展示站部署辅助                                             | `demo`           |

生成器按预设准备文件，使用者无需先删除 Worker 或演示目录。`node_modules/` 和 `dist/` 等安装、构建产物在本机生成，不随模板复制。

### 正式权限 SQL

所有预设都保留以下文件，在空 MySQL 数据库中按顺序导入：

1. `database/mysql/01-schema.sql`：用户、部门、角色、菜单及关联表，包含索引与约束。
2. `database/mysql/02-seed.sql`：基础部门、角色、系统管理菜单、按钮权限和授权关系。

使用方法见生成项目的 `database/mysql/README.md`。正式 SQL 不包含演示账号，不替使用者选择密码哈希算法；管理员账号由实际后端初始化。Worker 使用独立的 SQLite 迁移，不能把 MySQL 脚本当作 Worker 迁移执行。

### 常用命令

在生成的后台项目根目录执行：

| 命令                     | 用途                                   | 包含的预设       |
| ------------------------ | -------------------------------------- | ---------------- |
| `npm run dev`            | 启动前端，按所选预设与本机配置加载页面 | 全部             |
| `npm run build`          | 类型检查并构建到 `dist/`               | 全部             |
| `npm run preview`        | 预览构建产物，API 转发仍需自行提供     | 全部             |
| `npm run check`          | 格式、类型与核心回归检查               | 全部             |
| `npm run check:backend`  | 后端构建与回归检查                     | `worker`、`demo` |
| `npm run dev:demo`       | 启动完整演示，默认连接测试 API         | `demo`           |
| `npm run build:demo`     | 类型检查并构建完整演示                 | `demo`           |
| `npm run check:examples` | 示例页面与路由检查                     | `demo`           |
| `npm run check:all`      | 完整演示仓库回归检查                   | `demo`           |

## 命令行选项

```sh
npx @niping9542/create-nova-admin@latest --help
```

| 选项                         | 说明                                                                       |
| ---------------------------- | -------------------------------------------------------------------------- |
| `[project-name]`             | 当前目录下的单级项目名，使用小写字母、数字、连字符、下划线或点，不接受路径 |
| `-y, --yes`                  | 无交互创建；未指定名称时使用 `nova-admin-app`，未指定预设时使用 `starter`  |
| `--preset <preset>`          | 指定 `starter`、`worker` 或 `demo`                                         |
| `--demo`                     | `--preset demo` 的快捷方式                                                 |
| `--api-url <url>`            | 自定义 HTTP/HTTPS 后端地址，不接受账号密码、查询参数或片段                 |
| `--ref <ref>`                | 模板分支或标签，默认 `main`；目标版本须支持当前预设结构                    |
| `--template-dir <directory>` | 使用本地模板目录，跳过远程模板下载                                         |
| `-V, --version`              | 显示生成器版本                                                             |
| `-h, --help`                 | 显示帮助                                                                   |

例如，无交互创建默认纯净版：

```sh
npx @niping9542/create-nova-admin@latest my-admin --yes
```

`--yes` 可以与 `--preset worker` 或 `--preset demo` 一起使用。非交互终端不会询问模板，未指定预设时使用纯净版；项目名仍须明确提供，或使用 `--yes` 采用默认名称。

已存在的目标目录会导致创建失败，不会被覆盖。生成器不自动安装项目依赖、启动后端、执行 SQL 或部署网站，也不会复制模板中的 Git 历史、本机配置、密钥目录及符号链接。

## 维护生成器

以下操作在本仓库 `create-nova-admin` 中执行。

### 本仓库结构

| 路径                    | 用途                                               |
| ----------------------- | -------------------------------------------------- |
| `bin/index.js`          | CLI 入口，处理项目名称、模板选择、参数和提示       |
| `src/create-project.js` | 模板获取、输入校验、本机配置写入及创建失败后的清理 |
| `src/presets.js`        | 三种预设的文件组合、依赖快照校验及文档选择         |
| `tests/`                | 参数、预设、目录保护和创建流程的回归测试           |
| `package.json`          | npm 包信息、命令入口、依赖与发布文件清单           |
| `package-lock.json`     | 生成器自身依赖的 npm 锁文件                        |
| `README.md`             | GitHub 与 npm 展示的使用说明                       |

npm 包只包含 CLI 入口、生成逻辑、包信息和本说明，不把后台模板源码打进 npm 包。模板在创建项目时获取。

### 本机检查

```sh
npm ci
npm run check
npm pack --dry-run
```

如果后台模板和生成器放在同一父目录，可通过本地模板验证：

```sh
node bin/index.js local-admin --yes --preset starter --template-dir ../admin-template
```

本地模板也必须是包含当前预设差异文件的完整模板仓库。

### 自动检查

每次推送或提交 PR，GitHub Actions 会在 Node.js 22、24 上运行生成器检查和 npm 打包预览，并联合 `admin-template` 的 `main` 分支创建三个真实项目。三个预设分别使用 npm、pnpm 独立安装依赖并执行实际脚本，验证页面、文档链接、类型、回归和生产构建；pnpm 验证模板锁文件，Worker 版同时检查后端。CI 中的 pnpm 版本只用于维护验收，不写入生成项目，也不限制使用者选择工具。

后台模板仓库也会用自身改动验证生成器的 `main` 分支，因此修改任意一边都能检查两者是否兼容。首次启用时，先推送生成器的配套改动，再推送 `admin-template`，让模板端使用到已经支持新检查流程的生成器。

这些工作流只有检查权限，不发布 npm，也不部署网站。生成项目保留应用检查流程，跨仓库维护流程不会复制进去。

### 更新模板与发布

本次配套版本允许模板不再提供 `packageManager` 字段。更新时需要同步推送两个仓库，并手动发布包含兼容修改的生成器新版本；旧生成器仍会校验 pnpm 字段，不能只更新模板仓库。

- 只修改后台页面或公共组件时，提交并推送 `admin-template` 的模板分支；之后新创建的项目会获取对应分支内容，已经生成的项目不会自动更新。
- 修改生成器逻辑或本仓库 README 后，需要发布新的 npm 版本，才能更新 npm 用户拿到的生成器及包说明。
- 修改模板依赖或核心命令后，在 `admin-template` 执行 `npm run update:presets`，同步并提交纯净版依赖和锁文件快照。

生成器采用手动发布。在本仓库执行：

```sh
npm version patch --no-git-tag-version
npm run check
npm pack --dry-run
```

将本次改动及同步更新的 `package.json`、`package-lock.json` 提交并推送 Git，确认 npm 登录账号具有发布权限后执行：

```sh
npm whoami --registry=https://registry.npmjs.org/
npm publish --access public --registry=https://registry.npmjs.org/
```

如果登录失效，先执行 `npm login --auth-type=web --registry=https://registry.npmjs.org/`，按终端提示完成认证。

发布后检查公开版本：

```sh
npm view @niping9542/create-nova-admin version dist-tags --json --registry=https://registry.npmjs.org/
```

发布命令提示仍在处理时，稍后再查询公开版本。Git 提交和推送不会自动发布 npm，已经发布的版本不能覆盖；重新发布修改后的内容需要递增版本号。

## 许可证

MIT

## 变更记录与许可

- [变更记录](CHANGELOG.md)：生成器兼容变化及发布约定。
- [MIT 许可证](LICENSE)：生成器自身源码许可；第三方依赖遵循各自许可证。

生成项目保留后台模板的 `LICENSE`、`CHANGELOG.md` 和 `docs/new-business-page.md`，其中说明新增业务页面以及管理表单的开发约定。
