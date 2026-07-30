import { Card, PageHeader } from '@/components/ui'

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="设置" subtitle="一期占位：场景、算子阈值、API 基址（便于后期维护）" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="API 模式">
          <p className="text-sm text-[var(--text-muted)]">
            当前为 <strong className="text-[var(--text)]">Mock</strong>（`src/mocks/data.ts` + `src/api/client.ts`）。
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            接真实后端时：在 `src/api/client.ts` 把函数改成 `fetch(`${import.meta.env.VITE_API_BASE}/api/v1/...`)`，并在 `.env` 配置：
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-sky-200">
{`VITE_API_BASE=http://127.0.0.1:8000`}
          </pre>
        </Card>
        <Card title="流水线阶段">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--text-muted)]">
            <li>原始采集</li>
            <li>切分</li>
            <li>解析（去畸变/双目）</li>
            <li>语音 Tag</li>
            <li>3D 预标</li>
            <li>高精度外参</li>
            <li>后处理</li>
            <li>LeRobot 交付</li>
            <li>质检</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
