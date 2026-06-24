# @niping9542/create-nova-admin

🚀 **Nova Admin 现代化后台管理系统快速生成工具** —— 帮助你一键快速构建基于 **Vue 3** + **Element Plus** 的企业级中后台标准项目。

---

## 🛠️ 技术栈预设

使用本脚手架生成的项目模板自动集成以下行业主流前端技术栈：
- **核心框架**: Vue 3 (SFC `<script setup>`)
- **构建工具**: Vite
- **开发语言**: TypeScript
- **状态管理**: Pinia
- **路由系统**: Vue Router
- **UI 组件库**: Element Plus

---

## 📦 安装

在开始之前，请确保你的本地环境已安装了 [Node.js](https://nodejs.org)。

你可以选择将脚手架全局安装到本地：
```bash
npm install -g @niping9542/create-nova-admin
```
*或者无需安装，在需要时直接通过 `npx` 随用随引（推荐）。*

---

## 🚀 使用指南

### 方式一：交互式创建（推荐）
在你想存放项目的目录下直接运行以下命令：
```bash
npx @niping9542/create-nova-admin
```
随后按照终端提示进行操作：
1. ✨ 输入你的后台项目名称（默认：`nova-admin-app`）。
2. 🛠️ 确认后台模板预设。
3. 📥 脚手架将全自动从云端拉取最新的 `nova-admin-template` 并完成配置。

### 方式二：快捷指定名称创建
你也可以在命令后直接追加项目名称，跳过名称输入步骤：
```bash
npx @niping9542/create-nova-admin my-new-admin
```

---

## 🏃 启动新项目

项目初始化完成后，依次执行以下命令即可快速预览和开发你的新系统：

```bash
# 1. 进入刚刚生成的项目目录
cd nova-admin-app

# 2. 安装项目依赖
npm install

# 3. 启动本地开发服务器
npm run dev
```

---

## 📄 许可证

本项目基于 [MIT](LICENSE) 协议开源。
© ni9542
