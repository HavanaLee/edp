# Vue 开发者维护指南

> 你是 Vue 工程师、React 不熟？这份文档用 **Vue 对照表** 说明本项目怎么读、怎么改、怎么加页面。

---

## 1. 先建立心智模型

| Vue 3 概念　　　　　　　| 本项目（React）对应　　　　　　　　| 文件在哪　　　　　　　　　|
| -------------------------| ------------------------------------| ---------------------------|
| `main.ts` + `createApp` | `createRoot(...).render`　　　　　 | `src/main.tsx`　　　　　　|
| `App.vue`　　　　　　　 | `App.tsx`　　　　　　　　　　　　　| `src/App.tsx`　　　　　　 |
| `vue-router`　　　　　　| `react-router-dom`　　　　　　　　 | `App.tsx` 里的 `<Routes>` |
| `views/*.vue`　　　　　 | `pages/*.tsx`　　　　　　　　　　　| `src/pages/`　　　　　　　|
| `components/*.vue`　　　| `components/*.tsx`　　　　　　　　 | `src/components/`　　　　 |
| `services/api.ts`　　　 | `api/client.ts`　　　　　　　　　　| `src/api/client.ts`　　　 |
| `mock/*.js`　　　　　　 | `mocks/data.ts`　　　　　　　　　　| `src/mocks/data.ts`　　　 |
| `ref` / `reactive`　　　| `useState`　　　　　　　　　　　　 | 各页面内　　　　　　　　　|
| `computed`　　　　　　　| `useMemo`　　　　　　　　　　　　　| 如 `DataPage.tsx`　　　　 |
| `onMounted` + axios　　 | `useQuery`　　　　　　　　　　　　 | TanStack Query　　　　　　|
| `watch`　　　　　　　　 | `useEffect`（本项目尽量少用）　　　| —　　　　　　　　　　　　 |
| Pinia / Vuex　　　　　　| 暂无全局 store；服务端状态用 Query | —　　　　　　　　　　　　 |
| `<script setup>`　　　　| 函数组件 `export function Xxx()`　 | —　　　　　　　　　　　　 |
| `v-if`　　　　　　　　　| `{cond && <A/>}` 或三元　　　　　　| —　　　　　　　　　　　　 |
| `v-for`　　　　　　　　 | `{list.map(item => ...)}`　　　　　| —　　　　　　　　　　　　 |
| `v-model`　　　　　　　 | `value` + `onChange`　　　　　　　 | 如质检备注框　　　　　　　|
| `router-link`　　　　　 | `<Link>` / `<NavLink>`　　　　　　 | —　　　　　　　　　　　　 |
| `:class`　　　　　　　　| `className` + `cn()`　　　　　　　 | `lib/utils.ts`　　　　　　|
| `scoped css`　　　　　　| Tailwind `className`　　　　　　　 | `index.css` 放全局变量　　|

**一句话：** React 没有 `.vue` 单文件三块结构，而是 **JSX（模板写在 JS 里）+ hooks（代替 setup）**。

---

## 2. 每天怎么启动 / 构建

```bash
cd c:\ysy\lerobot\edp-web
npm install          # 第一次或依赖变更后
npm run dev          # 开发：http://localhost:5173
npm run build        # 打包检查是否报错
npm run preview      # 预览 dist
```

改代码后浏览器会自动热更新（类似 Vite + Vue）。

---

## 3. 最常见的 6 种修改

### 3.1 改假数据（看板数字、任务列表）

打开：`src/mocks/data.ts`

例如改「今日上传切片」：

```ts
export const summary: DashboardSummary = {
  todayUploads: 99,  // 改这里
  // ...
}
```

保存后刷新页面即可。

### 3.2 改接口（以后接后端）

打开：`src/api/client.ts`

现在：

```ts
export async function getSummary() {
  await delay()
  return summary  // 来自 mocks
}
```

改成真实接口示例：

```ts
export async function getSummary() {
  const base = import.meta.env.VITE_API_BASE
  const res = await fetch(`${base}/api/v1/dashboard/summary`)
  if (!res.ok) throw new Error('summary failed')
  const json = await res.json()
  return json.data
}
```

`.env`：

```
VITE_API_BASE=http://127.0.0.1:8000
```

**页面不用改**，因为页面只调用 `getSummary()`。

### 3.3 加一个新菜单 / 新页面（像 Vue 加 route + view）

1. 新建 `src/pages/MyPage.tsx`：

```tsx
import { PageHeader } from '@/components/ui'

export function MyPage() {
  return (
    <div>
      <PageHeader title="我的页面" subtitle="说明文字" />
      <p>内容</p>
    </div>
  )
}
```

2. 在 `src/App.tsx` 加路由：

```tsx
<Route path="my" element={<MyPage />} />
```

3. 在 `src/components/AppLayout.tsx` 的 `nav` 数组加一项：

```ts
{ to: '/my', label: '我的页面', icon: Settings },
```

### 3.4 改侧边栏文案 / 图标

文件：`src/components/AppLayout.tsx` → `nav` 数组。

### 3.5 改主题颜色

文件：`src/index.css` 的 `:root` CSS 变量：

```css
--accent: #3b82f6;
--bg: #0b0f17;
```

### 3.6 质检通过/驳回逻辑

文件：`src/pages/QcPage.tsx` + `src/api/client.ts` 的 `reviewQcPackage`。

注意：Mock 数据在内存里，**刷新页面会重置**。接后端后才会持久化。

---

## 4. React 语法对照（够用版）

### 4.1 组件

Vue：

```vue
<template><div>{{ title }}</div></template>
<script setup>
const title = 'hello'
</script>
```

React：

```tsx
export function Hello() {
  const title = 'hello'
  return <div>{title}</div>
}
```

### 4.2 列表

Vue：`v-for="item in list" :key="item.id"`

React：

```tsx
{list.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

### 4.3 条件

```tsx
{loading ? <LoadingBlock /> : <Content />}
{error && <p>出错了</p>}
```

### 4.4 事件

Vue：`@click="onSave"`

React：`onClick={onSave}` 或 `onClick={() => onSave(id)}`

### 4.5 表单双向绑定

Vue：`v-model="note"`

React：

```tsx
const [note, setNote] = useState('')
<textarea value={note} onChange={(e) => setNote(e.target.value)} />
```

### 4.6 请求数据（重要）

本项目用 TanStack Query，类似「带缓存的 axios」：

```tsx
const q = useQuery({
  queryKey: ['summary'],      // 缓存 key，像接口名
  queryFn: getSummary,        // 请求函数
  refetchInterval: 5000,      // 每 5 秒刷新（总览）
})

if (q.isLoading) return <LoadingBlock />
const data = q.data
```

写操作（重试 Job、质检提交）用 `useMutation`，成功后 `invalidateQueries` 刷新列表。

---

## 5. 文件该改哪：决策树

```
想改页面上的字/布局？ → pages/ 或 components/
想改数字/假任务？     → mocks/data.ts
想接真实 HTTP？       → api/client.ts + .env
想加类型字段？         → types/index.ts → 再改 mocks → 再改页面
想加路由菜单？         → App.tsx + AppLayout.tsx + 新 page
构建报错？             → 看终端 TypeScript 报错行号，通常是类型不匹配
```

---

## 6. 和 Vue 不一样、容易踩坑的点

1. **必须写 `key`**：`map` 列表缺 `key` 会警告。  
2. **`class` 要写成 `className`**。  
3. **样式对象用 `style={{ color: 'red' }}`**（两层花括号）。  
4. **不能直接改 props**；本地状态用 `useState`。  
5. **Fragment**：多个根节点用 `<>...</>`（Vue3 也支持多根，但 React 17 前不行）。  
6. **严格模式**：开发环境可能故意双调用 effect，Mock 无副作用即可。  
7. **路径别名 `@/`**：指向 `src/`，在 `vite.config.ts` / `tsconfig.app.json` 已配好。

---

## 7. 推荐阅读顺序（1 小时上手）

1. `src/mocks/data.ts` — 看懂业务假数据  
2. `src/api/client.ts` — 看懂数据怎么进页面  
3. `src/App.tsx` — 看懂路由  
4. `src/components/AppLayout.tsx` — 看懂壳子  
5. `src/pages/DashboardPage.tsx` — 最复杂的一页，对照 EDP 首页  
6. `src/pages/QcPage.tsx` — 看懂表单 + mutation  

---

## 8. 后期维护约定（建议遵守）

1. **页面不直接 import mocks**，只通过 `api/client.ts`。  
2. **新字段先改 `types`，再改 mocks，再改 UI**。  
3. **一个路由一个 Page 文件**，复杂 UI 再拆子组件到 `components/`。  
4. **中文文案**可先写死在页面；量大了再抽 `src/i18n/`。  
5. 提交前跑一遍：`npm run build`。

---

## 9. 常见问题

**Q: 我和 Vue 一样想用 Element Plus？**  
A: 本项目用 Tailwind 手写深色卡片。若要组件库，可后续加 Ant Design / shadcn，不必一次换完。

**Q: 能不能改成 Vue？**  
A: 可以，但成本等于重写。当前结构已按「api / mocks / pages」分层，迁移时按页搬运即可。

**Q: 视频为什么播不了？**  
A: 一期可播本地 Mock 视频：`public/datasets/ds-*/videos/...`（HTTP 路径 `/datasets/...`）。

**Q: 质检点了通过刷新又没了？**  
A: Mock 内存存储。接后端 `POST /qc/packages/:id/review` 后即持久。
