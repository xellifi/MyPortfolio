import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, ArrowDownUp, Plus, ChevronDown, ChevronUp, GripVertical,
  Tag, List, Image as ImageIcon, Upload, Globe, Link as LinkIcon, X, Trash2,
} from 'lucide-react'
import type { Project } from '@/lib/projectsApi'
import UploadModal, { type UploadTarget } from '../UploadModal'
import NewProjectModal from '../NewProjectModal'

interface ProjectsViewProps {
  projects: Project[]
  apiConnected: boolean
  onUpdate: (id: number, key: keyof Project, value: Project[keyof Project]) => void
  onDelete: (id: number) => void
  onAdd: (p: Project) => void
  onShowMessage: (msg: string, type?: 'success' | 'error') => void
  newProjectOpen: boolean
  setNewProjectOpen: (v: boolean) => void
}

type SortKey = 'title' | 'recent'
type FilterKey = 'all' | 'featured' | 'live' | 'draft'

export default function ProjectsView({
  projects, apiConnected, onUpdate, onDelete, onAdd, onShowMessage,
  newProjectOpen, setNewProjectOpen,
}: ProjectsViewProps) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('recent')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [techDraft, setTechDraft] = useState<Record<number, string>>({})
  const [featureDraft, setFeatureDraft] = useState<Record<number, string>>({})
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)

  const filtered = useMemo(() => {
    let list = [...projects]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.technologies.some(t => t.toLowerCase().includes(q))
      )
    }
    if (filter === 'featured') list = list.filter(p => p.featured)
    else if (filter === 'live') list = list.filter(p => !!p.liveUrl)
    else if (filter === 'draft') list = list.filter(p => !p.liveUrl)

    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title))
    else list.sort((a, b) => b.id - a.id)
    return list
  }, [projects, search, sort, filter])

  const addTech = (id: number) => {
    const v = (techDraft[id] || '').trim()
    if (!v) return
    const p = projects.find(x => x.id === id); if (!p) return
    if (p.technologies.includes(v)) return
    onUpdate(id, 'technologies', [...p.technologies, v])
    setTechDraft(d => ({ ...d, [id]: '' }))
  }
  const removeTech = (id: number, t: string) => {
    const p = projects.find(x => x.id === id); if (!p) return
    onUpdate(id, 'technologies', p.technologies.filter(x => x !== t))
  }
  const addFeature = (id: number) => {
    const v = (featureDraft[id] || '').trim()
    if (!v) return
    const p = projects.find(x => x.id === id); if (!p) return
    onUpdate(id, 'features', [...p.features, v])
    setFeatureDraft(d => ({ ...d, [id]: '' }))
  }
  const removeFeature = (id: number, f: string) => {
    const p = projects.find(x => x.id === id); if (!p) return
    onUpdate(id, 'features', p.features.filter(x => x !== f))
  }
  const removeImage = (id: number, url: string) => {
    const p = projects.find(x => x.id === id); if (!p) return
    onUpdate(id, 'images', (p.images || []).filter(x => x !== url))
  }

  const handleUploaded = (urls: string[], target: UploadTarget) => {
    const p = projects.find(x => x.id === target.projectId); if (!p) return
    if (target.type === 'cover') {
      onUpdate(target.projectId, 'image', urls[0])
      onShowMessage('Cover image updated')
    } else {
      onUpdate(target.projectId, 'images', [...(p.images || []), ...urls])
      onShowMessage(`${urls.length} image${urls.length > 1 ? 's' : ''} added to gallery`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, tech, descriptions…"
            className="w-full pl-10 pr-3 py-3 bg-neutral-950/60 border border-neutral-900 focus:border-blue-500/50 rounded-xl text-sm text-white outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <SelectPill icon={<Filter size={14} />} value={filter} onChange={(v) => setFilter(v as FilterKey)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'featured', label: 'Featured' },
              { value: 'live', label: 'Live' },
              { value: 'draft', label: 'Draft' },
            ]}
          />
          <SelectPill icon={<ArrowDownUp size={14} />} value={sort} onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'recent', label: 'Newest' },
              { value: 'title', label: 'Title A→Z' },
            ]}
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500 mb-3">Showing {filtered.length} of {projects.length} projects</p>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="bg-neutral-950/50 border border-neutral-900 rounded-2xl overflow-hidden"
          >
            {/* Header row */}
            <div
              className="flex items-center gap-3 p-3 sm:p-4 cursor-pointer hover:bg-neutral-900/40 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <GripVertical className="text-neutral-700 hidden sm:block" size={18} />
              <div className="h-12 w-16 shrink-0 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
                {p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">{p.title || 'Untitled'}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {p.technologies.slice(0, 3).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-neutral-900 text-neutral-400 rounded">{t}</span>
                  ))}
                  {p.technologies.length > 3 && (
                    <span className="text-[10px] text-neutral-600 self-center">+{p.technologies.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.featured && <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">Featured</span>}
                {p.liveUrl
                  ? <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">Live</span>
                  : <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500">Draft</span>
                }
                {expanded === p.id ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
              </div>
            </div>

            {/* Expanded edit area */}
            <AnimatePresence>
              {expanded === p.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-neutral-900"
                >
                  <div className="p-4 sm:p-6 grid lg:grid-cols-2 gap-6">
                    {/* Left */}
                    <div className="space-y-4">
                      <Field label="Project Title">
                        <input
                          value={p.title}
                          onChange={(e) => onUpdate(p.id, 'title', e.target.value)}
                          className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-base font-bold text-white outline-none"
                        />
                      </Field>

                      <Field label="Description">
                        <textarea
                          value={p.description}
                          onChange={(e) => onUpdate(p.id, 'description', e.target.value)}
                          rows={4}
                          className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-sm text-neutral-200 outline-none resize-none leading-relaxed"
                        />
                      </Field>

                      <Field label="Technologies" icon={<Tag size={12} />}>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {p.technologies.map(t => (
                            <Chip key={t} onRemove={() => removeTech(p.id, t)}>{t}</Chip>
                          ))}
                        </div>
                        <ChipInput
                          value={techDraft[p.id] || ''}
                          onChange={(v) => setTechDraft(d => ({ ...d, [p.id]: v }))}
                          onAdd={() => addTech(p.id)}
                          placeholder="Add technology…"
                        />
                      </Field>

                      <Field label="Features" icon={<List size={12} />}>
                        <div className="space-y-1.5 mb-2">
                          {p.features.map((f, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                              <span className="text-sm text-neutral-200 flex-1">{f}</span>
                              <button onClick={() => removeFeature(p.id, f)} className="text-neutral-500 hover:text-red-400">
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <ChipInput
                          value={featureDraft[p.id] || ''}
                          onChange={(v) => setFeatureDraft(d => ({ ...d, [p.id]: v }))}
                          onAdd={() => addFeature(p.id)}
                          placeholder="Add feature…"
                        />
                      </Field>
                    </div>

                    {/* Right */}
                    <div className="space-y-4">
                      <Field label="Cover Image" icon={<ImageIcon size={12} />}>
                        <button
                          onClick={() => setUploadTarget({ projectId: p.id, type: 'cover' })}
                          className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl text-neutral-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          <Upload size={16} /> {p.image ? 'Replace cover image' : 'Upload cover image'}
                        </button>
                        {p.image && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/60 p-2 relative group">
                            <img src={p.image} alt="cover" className="w-full h-32 object-cover object-top rounded-lg" />
                            <span className="absolute bottom-3 left-3 text-[10px] text-emerald-300 bg-black/60 px-2 py-0.5 rounded truncate max-w-[60%]">
                              {p.image.split('/').pop()}
                            </span>
                            <button
                              onClick={() => onUpdate(p.id, 'image', '')}
                              className="absolute top-3 right-3 p-1 bg-red-600/80 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </Field>

                      <Field label="Gallery Images" icon={<ImageIcon size={12} />}>
                        {(p.images && p.images.length > 0) && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {p.images.map((img, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/60">
                                <img src={img} alt="" className="w-full h-20 object-cover" />
                                <button
                                  onClick={() => removeImage(p.id, img)}
                                  className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setUploadTarget({ projectId: p.id, type: 'gallery' })}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl text-neutral-400 hover:text-blue-300 transition-colors text-sm"
                        >
                          <Upload size={14} /> Upload gallery images
                        </button>
                      </Field>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Live URL" icon={<Globe size={12} />}>
                          <input
                            value={p.liveUrl ?? ''}
                            onChange={(e) => onUpdate(p.id, 'liveUrl', e.target.value)}
                            placeholder="https://…"
                            className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-xs font-mono text-neutral-200 outline-none"
                          />
                        </Field>
                        <Field label="GitHub URL" icon={<LinkIcon size={12} />}>
                          <input
                            value={p.githubUrl ?? ''}
                            onChange={(e) => onUpdate(p.id, 'githubUrl', e.target.value)}
                            placeholder="https://github.com/…"
                            className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-xs font-mono text-neutral-200 outline-none"
                          />
                        </Field>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <button
                            type="button"
                            onClick={() => onUpdate(p.id, 'featured', !p.featured)}
                            className={`w-11 h-6 rounded-full relative transition-colors ${p.featured ? 'bg-blue-600' : 'bg-neutral-700'}`}
                          >
                            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${p.featured ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                          <span className="text-sm font-medium text-white">Featured</span>
                        </label>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.title}"? This cannot be undone.`)) onDelete(p.id)
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-800 p-10 text-center text-neutral-500 text-sm">
            No matching projects.
          </div>
        )}

        <button
          onClick={() => setNewProjectOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all group"
        >
          <div className="bg-neutral-900 p-3 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Plus size={22} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wide">Add new project</span>
          {!apiConnected && <span className="text-[11px] text-yellow-500/70">Database offline — changes won't persist</span>}
        </button>
      </div>

      <UploadModal
        open={!!uploadTarget}
        target={uploadTarget}
        onClose={() => setUploadTarget(null)}
        onUploaded={handleUploaded}
        onError={(m) => onShowMessage(m, 'error')}
      />

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onSave={(p) => { onAdd(p); setNewProjectOpen(false) }}
      />
    </div>
  )
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-neutral-500 uppercase tracking-widest px-1 mb-2 flex items-center gap-1.5">
        {icon}{label}
      </label>
      {children}
    </div>
  )
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-200 rounded-full">
      {children}
      <button onClick={onRemove} className="hover:text-red-400 ml-1"><X size={12} /></button>
    </span>
  )
}

function ChipInput({ value, onChange, onAdd, placeholder }: { value: string; onChange: (v: string) => void; onAdd: () => void; placeholder: string }) {
  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        placeholder={placeholder}
        className="flex-1 p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-sm text-neutral-200 outline-none transition-colors"
      />
      <button onClick={onAdd} className="px-4 py-3 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 rounded-xl">
        <Plus size={16} />
      </button>
    </div>
  )
}

function SelectPill({ icon, value, onChange, options }:
  { icon: React.ReactNode; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }
) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-9 pr-8 py-3 bg-neutral-950/60 border border-neutral-900 text-sm text-neutral-200 rounded-xl outline-none cursor-pointer hover:border-neutral-800 transition-colors w-full"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
    </div>
  )
}
