# @niping9542/create-nova-admin

创建基于 Vue 3、TypeScript、Element Plus、Pinia 和 Vue Router 的 Npora Admin 后台项目。

模板来源：[npora/admin-template](https://github.com/npora/admin-template)，默认使用 `main`。脚手架核心、展示页面、测试后端与正式权限 SQL 已分开维护，使用者无需删除目录。

## 环境要求

- Node.js 22.12+。
- 创建后使用模板 `packageManager` 指定版本的 pnpm 安装和运行项目。

生成器不会自动安装依赖、启动后端、执行 SQL 或部署网站。

## 创建核心脚手架

```sh
npx @niping9542/create-nova-admin@latest my-admin
```

也可省略项目名，按提示输入；未交互终端中需要提供名称或使用 `--yes`。

```sh
cd my-admin
pnpm install
pnpm dev
```

核心模式保留登录、布局、动态路由、权限、用户/部门/角色/菜单管理、公共表格分页、多语言和主题。生成器创建本机配置 `.env.development.local`：

```dotenv
VITE_DEMO_ENABLED=false
VITE_API_URL=http://localhost:8080
```

启动自己的后端，或用 `--api-url` 在创建时指定接口地址：

```sh
npx @niping9542/create-nova-admin@latest my-admin --api-url https://api.example.com
```

默认 API 前缀为 `/api`，开发代理会移除该前缀后转发；生产仍需配置站点 API 转发。不同的后端响应格式在生成项目的 `src/api/protocol/` 适配。

## 创建完整展示项目

想先体验现有界面和测试接口时：

```sh
npx @niping9542/create-nova-admin@latest my-demo --demo
cd my-demo
pnpm install
pnpm dev:demo
```

展示模式加载独立的 `examples/`，通过真实 HTTP 使用测试 API，需要网络，没有内存 Mock。表格任务、表单草稿等页面示例数据仍在演示模块中维护。

展示地址：[Npora Admin 在线体验](https://admin-demo.npora.workers.dev)。账号 `admin`，密码 `123456`。演示账号不代表导入 SQL 后自动存在的账号。

同时指定 `--demo --api-url` 时，生成器启用展示页面并写入自定义接口地址，使用打印的 `pnpm dev` 命令启动。

## 正式 SQL 与项目结构

生成项目完整保留：

| 目录              | 用途                                              |
| ----------------- | ------------------------------------------------- |
| `src/`            | 脚手架核心和系统管理                              |
| `database/mysql/` | 正式权限表与基础角色、菜单、按钮授权              |
| `examples/`       | 独立演示页面、统计 API 和示例数据，核心构建不加载 |
| `workers/api/`    | 可选测试后端，普通前端运行不启动或部署它          |
| `deploy/`         | 可选展示站部署辅助，普通构建无需配置              |

使用自己的数据库时，在空 MySQL 数据库依次导入 `database/mysql/01-schema.sql`、`02-seed.sql`。管理员账号与密码哈希由实际后端初始化；生成器不会连接数据库或执行这些文件。

## 选项

| 选项                         | 作用                                                      |
| ---------------------------- | --------------------------------------------------------- |
| `[project-name]`             | 项目名，只接受单级、小写的 npm 包名，不接受目录路径       |
| `-y, --yes`                  | 不询问名称，缺省使用 `nova-admin-app`                     |
| `--demo`                     | 启用展示模式                                              |
| `--api-url <url>`            | HTTP/HTTPS 后端地址，不包含账号密码或查询参数             |
| `--ref <ref>`                | 模板分支或标签，默认 `main`；指定的版本须包含新版目录结构 |
| `--template-dir <directory>` | 使用本地模板，供开发和离线验证；不访问远程仓库            |
| `--version`                  | 读取当前包版本                                            |
| `--help`                     | 显示帮助                                                  |

目标目录已存在时直接失败，不覆盖、不删除。模板先在临时目录准备和校验，失败不会留下半成品项目；模板的 `.git`、依赖、构建产物、符号链接及本机 `.local` 文件不会复制。

## 维护与验证

```sh
npm ci
npm run check
npm pack --dry-run
```

使用本地模板验证真实生成结果：

```sh
node bin/index.js local-admin --template-dir ../admin-template
```

npm 包只包含 CLI 入口、生成逻辑与说明；模板在创建时单独获取，不把整个后台仓库打进 npm 包。包名保留 `@niping9542/create-nova-admin`，可执行命令统一为 `create-nova-admin`。

修改代码后不会自动更新已发布的 npm 包；发布前需要更新版本并完成检查。本次维护命令不执行发布。

许可证声明：MIT。
