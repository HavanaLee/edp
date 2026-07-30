import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSlices } from '@/api/client'
import { Badge, Card, LoadingBlock, PageHeader } from '@/components/ui'
import { stageLabels, statusLabel } from '@/lib/utils'

const stageTabs = [
  { key: 'all', label: '全部' },
  { key: 'raw', label: '原始' },
  { key: 'split', label: '切分' },
  { key: 'parse', label: '解析' },
  { key: 'voicetag', label: '语音 Tag' },
  { key: 'prelabel', label: '预标' },
  { key: 'extrinsic', label: '外参' },
  { key: 'lerobot', label: '交付' },
]

export function DataPage() {
  const [stage, setStage] = useState('all')
  const q = useQuery({ queryKey: ['slices', stage], queryFn: () => getSlices(stage) })

  const countByStage = useMemo(() => {
    // 仅展示当前筛选结果数量
    return q.data?.length ?? 0
  }, [q.data])

  return (
    <div>
      <PageHeader title="数据管理" subtitle={`按流水线阶段浏览切片 · 当前 ${countByStage} 条`} />
      <div className="mb-4 flex flex-wrap gap-2">
        {stageTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStage(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              stage === tab.key
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(q.data ?? []).map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">{s.id}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">{s.sceneLabel}</div>
                </div>
                <Badge tone="info">{s.stageLabel || stageLabels[s.stage]}</Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-[var(--text-muted)]">
                <div>任务：{s.taskId}</div>
                <div>时长：{s.durationSec}s</div>
                <div>质量：{statusLabel[s.quality]}</div>
                <div className="truncate">存储：{s.storageUri}</div>
                <div>更新：{s.updatedAt}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
