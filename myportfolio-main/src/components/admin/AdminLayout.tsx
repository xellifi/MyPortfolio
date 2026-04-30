import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban, ImageIcon, LogOut,
  Menu, X, ShieldCheck, ChevronRight, Wifi, WifiOff,
} from 'lucide-react'

export type AdminView = 'overview' | 'projects' | 'media'

interface NavItem {
  id: AdminView
  label: string
  icon: typeof LayoutDashboard
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'media',    label: 'Media',    icon: ImageIcon     },
]

interface AdminLayoutProps {
  activeView: AdminView
  onChangeView: (v: AdminView) => void
  userEmail?: string
  onLogout: () => void
  apiConnected: boolean
  topbarAction?: ReactNode
  children: ReactNode
}

export default function AdminLayout({
  activeView, onChangeView, userEmail, onLogout,
  apiConnected, topbarAction, children,
}: AdminLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer when switching view
  useEffect(() => { setDrawerOpen(false) }, [activeView])

  const activeLabel = NAV.find(n => n.id === activeView)?.label ?? 'Admin'

  return (
    <div className="min-h-screen bg-[#030014] text-[#e8ebff] font-sans flex">
      {/* ---------- DESKTOP SIDEBAR ---------- */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-neutral-900 bg-neutral-950/60 sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">Admin Console</p>
              <p className="text-[11px] text-neutral-500 leading-tight">Venz Aba</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <NavButton
              key={item.id}
              item={item}
              active={activeView === item.id}
              onClick={() => onChangeView(item.id)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-neutral-900 space-y-2">
          <ConnectionPill apiConnected={apiConnected} />
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-900/60">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold">
              {(userEmail?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-300 truncate">{userEmail ?? 'Admin'}</p>
              <p className="text-[10px] text-neutral-500">Signed in</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-neutral-300 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-neutral-800"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ---------- MOBILE DRAWER ---------- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/70 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-[#08061a] border-r border-neutral-900 flex flex-col"
            >
              <div className="px-5 py-5 border-b border-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Admin Console</p>
                    <p className="text-[11px] text-neutral-500">Venz Aba</p>
                  </div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg text-neutral-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV.map(item => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={activeView === item.id}
                    onClick={() => onChangeView(item.id)}
                  />
                ))}
              </nav>
              <div className="p-3 border-t border-neutral-900 space-y-2">
                <ConnectionPill apiConnected={apiConnected} />
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-neutral-900/60">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                    {(userEmail?.[0] ?? 'A').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-300 truncate">{userEmail ?? 'Admin'}</p>
                    <p className="text-[10px] text-neutral-500">Signed in</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-neutral-300 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-neutral-800"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------- MAIN COLUMN ---------- */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#030014]/85 backdrop-blur-xl border-b border-neutral-900">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg text-neutral-300 hover:bg-neutral-800/60"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs text-neutral-500 hidden sm:inline">Admin</span>
              <ChevronRight size={14} className="text-neutral-700 hidden sm:inline" />
              <h1 className="text-base sm:text-lg font-bold text-white truncate">{activeLabel}</h1>
            </div>
            <div className="flex items-center gap-2">
              {topbarAction}
            </div>
          </div>
        </header>

        {/* Content scroll area — bottom padding leaves room for mobile bottom-nav */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      {/* ---------- MOBILE BOTTOM NAV ---------- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#08061a]/95 backdrop-blur-xl border-t border-neutral-900 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-3">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomNavBar"
                    className="absolute top-0 h-0.5 w-10 rounded-b-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  />
                )}
                <Icon size={20} className={isActive ? 'text-cyan-300' : 'text-neutral-500'} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-cyan-200' : 'text-neutral-500'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
        active
          ? 'bg-blue-500/10 text-white'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60'
      }`}
    >
      {active && <motion.span layoutId="sideNavIndicator" className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500" />}
      <Icon size={18} />
      <span className="font-medium">{item.label}</span>
    </button>
  )
}

function ConnectionPill({ apiConnected }: { apiConnected: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border ${
        apiConnected
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      }`}
    >
      {apiConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
      {apiConnected ? 'Database connected' : 'Database offline'}
    </div>
  )
}
