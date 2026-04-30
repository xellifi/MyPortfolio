import { motion } from 'framer-motion'
import { FolderKanban, Star, Globe, Image as ImageIcon, Plus, ArrowRight } from 'lucide-react'
import type { Project } from '@/lib/projectsApi'
import type { AdminView } from '../AdminLayout'

interface OverviewProps {
  projects: Project[]
  onNavigate: (v: AdminView) => void
  onAddNew: () => void
}

export default function Overview({ projects, onNavigate, onAddNew }: OverviewProps) {
  const total = projects.length
  const featured = projects.filter(p => p.featured).length
  const live = projects.filter(p => p.liveUrl).length
  const images = projects.reduce((sum, p) => sum + (p.image ? 1 : 0) + (p.images?.length ?? 0), 0)

  const stats = [
    { label: 'Projects', value: total,   icon: FolderKanban, color: 'from-blue-500 to-cyan-400' },
    { label: 'Featured', value: featured, icon: Star,         color: 'from-amber-500 to-yellow-400' },
    { label: 'Live URLs', value: live,    icon: Globe,        color: 'from-emerald-500 to-green-400' },
    { label: 'Images',   value: images,   icon: ImageIcon,    color: 'from-violet-500 to-fuchsia-400' },
  ]

  const recent = [...projects].slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-neutral-900 bg-gradient-to-br from-blue-600/10 via-violet-600/5 to-transparent p-5 sm:p-7"
      >
        <p className="text-xs uppercase tracking-widest text-cyan-400/80 font-semibold">Dashboard</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">Welcome back 👋</h2>
        <p className="mt-2 text-sm text-neutral-400 max-w-xl">
          Manage your portfolio projects, upload images, and push updates straight to your live site.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Add new project
          </button>
          <button
            onClick={() => onNavigate('projects')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-sm font-medium"
          >
            Manage projects <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-neutral-900 bg-neutral-950/60 p-4 sm:p-5"
            >
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent projects */}
      <div className="rounded-3xl border border-neutral-900 bg-neutral-950/40 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-900">
          <h3 className="text-sm font-bold text-white">Recent projects</h3>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            No projects yet — add your first one.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-900">
            {recent.map(p => (
              <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                <div className="h-10 w-14 shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
                  {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{p.title}</p>
                  <p className="text-xs text-neutral-500 truncate">{p.technologies.slice(0, 4).join(' · ')}</p>
                </div>
                {p.featured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    Featured
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
