# EDP 前端 Agent 指南

## 项目概览

- 本项目是 EDP（Embodied Data Pipeline）具身智能数据平台前端，一期使用 Mock 数据演示。
- 技术栈：React 19、TypeScript、Vite 8、React Router 7、TanStack Query 5、Tailwind CSS 4、Recharts、lucide-react。
- 无全局 store、i18n、认证。有 Vitest、oxlint、Prettier、GitHub Actions。
- 代码是事实来源；文档与代码冲突时以代码为准。
- 细则见 `.cursor/rules/`（按路径加载）；流程见 `.cursor/skills/`（按需加载）。

## 常用命令

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint
npm test
npm run format
npm run build        # tsc -b && vite build
npm run preview
```

改代码后至少运行：`npm run lint && npm test && npm run build`。

## 目录职责

```text
src/
├── main.tsx                 # React 入口
├── App.tsx                  # QueryClient 与路由表
├── index.css                # 主题变量与全局样式
├── api/client.ts            # 数据访问层
├── mocks/data.ts            # Mock 与内存状态
├── types/index.ts           # 领域类型
├── pages/                   # 路由页面
├── components/AppLayout.tsx # 布局与侧栏
├── components/ui.tsx        # 通用 UI
└── lib/utils.ts             # class / 标签 / 格式化
```

## 架构（摘要）

```text
pages → TanStack Query → api/client.ts → mocks/data.ts
```

新增数据能力顺序：`types → mocks → api/client → page`。完整约束见 `.cursor/rules/architecture.mdc`。

## 常见修改入口

| 目标 | 文件 |
|------|------|
| Mock | `src/mocks/data.ts` |
| API | `src/api/client.ts` |
| 类型 | `src/types/index.ts` |
| 新页面 | `src/pages/` + `App.tsx` + 必要时 `AppLayout.tsx` |
| 通用 UI | `src/components/ui.tsx` |
| 标签/格式化 | `src/lib/utils.ts` |
| 主题 | `src/index.css` |
| Lint | `.oxlintrc.json` |

## MCP 使用策略

- **查库文档**（React Router / TanStack Query / Vite / Tailwind 等）→ Context7，不要把整页文档塞进 rules。
- **验 UI** → 内置 Browser MCP（配合 `/ui-check` 或 `verify-ui` skill）。
- **搜代码** → 内置 Grep/Read；不要再挂 Filesystem MCP。
- **禁止**为「可能用到」堆 Playwright / Memory / Figma 等冗余 MCP（工具 schema 会持续占 token）。
- 项目 MCP 声明见 `.cursor/mcp.json`。

## 修改与验证原则

- 聚焦用户要求，不顺手重构无关代码。
- 禁止 `any`；优先复用现有组件与分层。
- 不要把文档示例 API 当作已实现契约。
- 修改完成后：

```bash
npm run lint
npm test
npm run build
```

- 仅改文档时可跳过构建，但须核对 Markdown 路径准确。
