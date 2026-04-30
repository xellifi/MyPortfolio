import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Save, Tag, List, Globe, Link as LinkIcon } from 'lucide-react'
import type { Project } from '@/lib/projectsApi'

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (p: Project) => void
}

const empty: Project = {
  id: 0,
  title: '',
  description: '',
  image: '',
  images: [],
  technologies: [],
  features: [],
  liveUrl: '',
  githubUrl: '',
  featured: false,
}

export default function NewProjectModal({ open, onClose, onSave }: NewProjectModalProps) {
  const [data, setData] = useState<Project>(empty)
  const [techInput, setTechInput] = useState('')
  const [featureInput, setFeatureInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setData({ ...empty, id: Date.now() })
      setTechInput('')
      setFeatureInput('')
      setError(null)
    }
  }, [open])

  const addTech = () => {
    const t = techInput.trim()
    if (!t || data.technologies.includes(t)) return
    setData(d => ({ ...d, technologies: [...d.technologies, t] }))
    setTechInput('')
  }
  const removeTech = (t: string) =>
    setData(d => ({ ...d, technologies: d.technologies.filter(x => x !== t) }))

  const addFeature = () => {
    const f = featureInput.trim()
    if (!f) return
    setData(d => ({ ...d, features: [...d.features, f] }))
    setFeatureInput('')
  }
  const removeFeature = (f: string) =>
    setData(d => ({ ...d, features: d.features.filter(x => x !== f) }))

  const handleSave = () => {
    if (!data.title.trim()) {
      setError('Project title is required')
      return
    }
    onSave(data)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-full flex items-start sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              className="bg-[#08061a] border border-neutral-800 rounded-3xl w-full max-w-2xl my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-900 sticky top-0 bg-[#08061a] rounded-t-3xl">
                <h2 className="text-lg sm:text-xl font-bold text-white">Create new project</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <Field label="Project title *">
                  <input
                    autoFocus
                    value={data.title}
                    onChange={(e) => setData(d => ({ ...d, title: e.target.value }))}
                    placeholder="Enter project title"
                    className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-white outline-none transition-colors"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={data.description}
                    onChange={(e) => setData(d => ({ ...d, description: e.target.value }))}
                    placeholder="Describe your project…"
                    rows={4}
                    className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-neutral-200 outline-none transition-colors resize-none"
                  />
                </Field>

                <Field label="Technologies" icon={<Tag size={12} />}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.technologies.map(t => (
                      <Chip key={t} onRemove={() => removeTech(t)}>{t}</Chip>
                    ))}
                  </div>
                  <ChipInput value={techInput} onChange={setTechInput} onAdd={addTech} placeholder="Add technology…" />
                </Field>

                <Field label="Features" icon={<List size={12} />}>
                  <div className="space-y-1.5 mb-2">
                    {data.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                        <span className="text-sm text-neutral-200 flex-1">{f}</span>
                        <button onClick={() => removeFeature(f)} className="text-neutral-500 hover:text-red-400">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <ChipInput value={featureInput} onChange={setFeatureInput} onAdd={addFeature} placeholder="Add feature…" />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Live URL" icon={<Globe size={12} />}>
                    <input
                      value={data.liveUrl ?? ''}
                      onChange={(e) => setData(d => ({ ...d, liveUrl: e.target.value }))}
                      placeholder="https://…"
                      className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-neutral-200 outline-none text-sm font-mono transition-colors"
                    />
                  </Field>
                  <Field label="GitHub URL" icon={<LinkIcon size={12} />}>
                    <input
                      value={data.githubUrl ?? ''}
                      onChange={(e) => setData(d => ({ ...d, githubUrl: e.target.value }))}
                      placeholder="https://github.com/…"
                      className="w-full p-3 bg-neutral-900/60 border border-neutral-800 focus:border-blue-500 rounded-xl text-neutral-200 outline-none text-sm font-mono transition-colors"
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setData(d => ({ ...d, featured: !d.featured }))}
                    className={`w-11 h-6 rounded-full relative transition-colors ${data.featured ? 'bg-blue-600' : 'bg-neutral-700'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${data.featured ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm font-medium text-white">Mark as featured</span>
                </label>

                <p className="text-[11px] text-neutral-500">
                  After saving, open the project in the list to upload a cover image and gallery.
                </p>

                {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>}
              </div>

              <div className="flex gap-2 p-5 border-t border-neutral-900 sticky bottom-0 bg-[#08061a] rounded-b-3xl">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl border border-neutral-800 text-neutral-300 hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20"
                >
                  <Save size={16} /> Create project
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
