import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  CheckSquare,
  Database,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/', label: '平台总览', icon: LayoutDashboard, end: true },
  { to: '/collection', label: '数据采集', icon: FolderKanban },
  { to: '/data', label: '数据管理', icon: Database },
  { to: '/pipeline', label: '生产任务', icon: Workflow },
  // { to: '/workers', label: 'GPU Worker', icon: Cpu },
  { to: '/qc', label: '质检中心', icon: CheckSquare },
  // { to: '/datasets', label: 'LeRobot 交付', icon: Boxes },
  { to: '/settings', label: '设置', icon: Settings },
]

export function AppLayout() {
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]">
        <div className="border-b border-[var(--border)] px-4 py-5">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--accent)]" />
            <div>
              <div className="text-sm font-semibold">EDP 数据平台</div>
              <div className="text-[11px] text-[var(--text-muted)]">Embodied Data Pipeline</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-4 text-[11px] text-[var(--text-muted)]">
          Mock 模式 · 可切换真实 API
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
