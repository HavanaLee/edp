import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Activity,
  CheckSquare,
  ChevronsLeft,
  ChevronsRight,
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
  { to: '/qc', label: '质检中心', icon: CheckSquare },
  { to: '/settings', label: '设置', icon: Settings },
]

const STORAGE_KEY = 'edp-sidebar-collapsed'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <div className="flex min-h-full">
      <aside
        className={cn(
          'sticky top-0 flex h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-panel)] transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex items-center border-b border-[var(--border)] py-4',
            collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-3',
          )}
        >
          <div
            className={cn('flex min-w-0 items-center gap-2', collapsed && 'justify-center')}
            title={collapsed ? 'EDP 数据平台' : undefined}
          >
            <Activity className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            {!collapsed ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">EDP 数据平台</div>
                <div className="truncate text-[11px] text-[var(--text-muted)]">
                  Embodied Data Pipeline
                </div>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]"
              title="折叠侧边栏"
              aria-label="折叠侧边栏"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className={cn('flex-1 space-y-1', collapsed ? 'p-2' : 'p-3')}>
          {collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="group relative mb-1 flex w-full items-center justify-center rounded-lg px-2 py-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]"
              aria-label="展开侧边栏"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text)] shadow-lg group-hover:block">
                展开侧边栏
              </span>
            </button>
          ) : null}

          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center rounded-lg text-sm transition',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-3 py-2',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text)]',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
              {collapsed ? (
                <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text)] shadow-lg group-hover:block">
                  {item.label}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {!collapsed ? (
          <div className="border-t border-[var(--border)] p-4 text-[11px] text-[var(--text-muted)]">
            Mock 模式 · 可切换真实 API
          </div>
        ) : (
          <div
            className="border-t border-[var(--border)] p-2 text-center text-[10px] text-[var(--text-muted)]"
            title="Mock 模式 · 可切换真实 API"
          >
            M
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
