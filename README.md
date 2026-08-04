# EDP 具身智能数据平台（前端）

对标 [EDP 演示站](https://rkzhegwavgdgc.ok.kimi.link/) 的 React 管理后台（一期：Mock 数据可演示）。

如果你是 **Vue 开发者**，请先读：

- [Vue 开发者维护指南](./docs/Vue开发者维护指南.md)
- [使用报告](./docs/使用报告.md)
- 设计方案：[`../docs/EDP具身智能数据平台-设计方案.md`](../docs/EDP具身智能数据平台-设计方案.md)

## 快速开始

```bash
cd edp-web
npm install
npm run dev
```

浏览器打开：http://localhost:5173

| 命令 | 作用 |
|------|------|
| `npm run dev` | 本地开发（热更新） |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 预览构建结果 |

## 功能一览

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 平台总览 | KPI、漏斗、图表、Worker、事件流、采集任务 |
| `/collection` | 数据采集 | 任务列表与详情 |
| `/data` | 数据管理 | 按流水线阶段浏览切片 |
| `/pipeline` | 生产任务 | Job 队列，失败可重试 |
| `/workers` | GPU Worker | 按角色分组监控 |
| `/qc` | 质检工作台 | 通过 / 驳回（Mock） |
| `/datasets` | LeRobot 交付 | 本地 pen/mouse 数据集元信息 |
| `/settings` | 设置 | API 切换说明 |

## 目录结构（维护入口）

```
edp-web/
├── src/
│   ├── api/client.ts      ← 改接口只动这里（像 Vue 的 services）
│   ├── mocks/data.ts      ← 改假数据只动这里
│   ├── types/index.ts     ← TypeScript 类型（像 interface）
│   ├── pages/             ← 页面（像 views/）
│   ├── components/        ← 通用组件
│   ├── lib/utils.ts       ← 工具函数
│   ├── App.tsx            ← 路由表（像 router/index.ts）
│   └── main.tsx           ← 入口（像 main.ts）
├── docs/                  ← 使用说明与维护指南
└── package.json
```

## 技术栈

- React 19 + TypeScript + Vite 8
- React Router 7（路由）
- TanStack Query（请求缓存 / 轮询，类似 Vue 里 axios + 自己写刷新）
- Recharts（图表）
- Tailwind CSS 4 + lucide-react（图标）

## 接真实后端

1. 复制 `.env.example` 为 `.env`
2. 设置 `VITE_API_BASE=http://127.0.0.1:8000`
3. 修改 `src/api/client.ts` 中函数为真实 `fetch`

页面组件一般 **不用改**。

## GitHub Pages 部署

推送到 `main` 后由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 自动构建并发布。

首次启用：

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
2. 推送或手动运行 **Actions → Deploy → Run workflow**
3. 站点地址：`https://havanalee.github.io/edp/`（与仓库名一致；`BASE_PATH=/edp/`）

本地模拟 Pages 构建：

```bash
# Windows PowerShell
$env:BASE_PATH='/edp/'; npm run build
```

## 许可证

内部演示工程，按需修改。
