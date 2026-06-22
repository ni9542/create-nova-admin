# create-nova-admin ✨

> 🌌 **Nova Admin** 现代化企业级后台管理系统快速生成工具。

基于 Node.js 开发的轻量级自动化脚手架，支持通过 `npx` 一键拉取由 **Vue3 + Element Plus + TypeScript + Pinia + Vue Router** 构成的现代化后台模版，开箱即用。

---

## 🛠️ 核心技术栈预设

使用本脚手架生成的后台管理系统，默认集成以下黄金技术栈：

*   **Vue 3** - 组合式 API (Composition API) 核心架构
*   **Element Plus** - 现代化企业级 UI 框架
*   **TypeScript** - 全类型覆盖，极致的开发代码提示
*   **Pinia** - 新一代轻量、直观的状态管理库
*   **Vue Router 4** - 模块化路由配置与动态路由权限控制
*   **Vite** - 极速的前端构建工具与热更新体验

---

## 🚀 快速开始 (Usage)

无需在全局安装任何包，直接在你的终端（Terminal）执行以下命令即可：

```bash
npx create-nova-admin [你的项目名称]
```

### 交互式创建流程

1. **输入项目名称**：若未在命令中指定项目名，脚手架会交互式询问。
2. **下载模版**：自动从云端拉取最新的 `Nova Admin` 官方黄金技术栈模版。
3. **自动配置**：下载完成后，脚手架会自动修正新项目的 `package.json` 中的 `name` 字段。

---

## 📦 生成项目后的启动命令

项目创建成功后，依次执行以下命令即可启动本地开发服务器：

```bash
# 1. 进入项目目录
cd [你的项目名称]

# 2. 安装项目依赖
npm install

# 3. 启动开发环境
npm run dev
```

---

## 📂 脚手架源码结构

```text
create-nova-admin/
├── bin/
│   └── index.js      # 脚手架核心搬运与交互逻辑
├── package.json      # 定义 bin 执行命令与依赖
└── README.md         # 项目说明文档
```

---

## 📄 开源协议

[ISC License](LICENSE) © ni9542
