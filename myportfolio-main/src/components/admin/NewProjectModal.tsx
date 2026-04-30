import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Plus, Save, Tag, List, Globe, Link as LinkIcon,
  Image as ImageIcon, Upload, FolderOpen, Loader2,
} from 'lucide-react'
import type { Project } from '@/lib/projectsApi'
import { listProjectImageFolders, uploadProjectImage } from '@/lib/projectsApi'

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

  // Image upload state
  const [folders, setFolders] = useState<string[]>([])
  const [folder, setFolder] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setData({ ...empty, id: Date.now() })
    setTechInput('')
    setFeatureInput('')
    setError(null)
    setFolder('')
    setNewFolder('')
    listProjectImageFolders().then(setFolders).catch(() => setFolders([]))
  }, [open])

  const folderPath = () => (folder || newFolder.trim() || 'uploads').replace(/^\/+|\/+$/g, '')

  const handleCoverUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return
    setUploadingCover(true)
    setError(null)
    try {
      const url = await uploadProjectImage(files[0], folderPath())
      setData(d => ({ ...d, image: url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cover upload failed')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadingGallery(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) {
        urls.push(await uploadProjectImage(f, folderPath()))
      }
      setData(d => ({ ...d, images: [...(d.images || []), ...urls] }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gallery upload failed')
    } finally {
      setUploadingGallery(false)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const removeGalleryImage = (url: string) =>
    setData(d => ({ ...d, images: (d.images || []).filter(x => x !== url) }))

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
              <div className="flex items-center justify-between p-5 border-b border-neutral-900 sticky top-0 bg-[#08061a] rounded-t-3xl z-10">
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

                {/* ---------- Images section ---------- */}
                <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-cyan-300" />
                    <h3 className="text-sm font-semibold text-white">Images</h3>
                  </div>

                  {/* Folder selector */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase tracking-widest px-1 mb-1.5 block">Use existing folder</label>
                      <div className="relative">
                        <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <select
                          value={folder}
                          onChange={(e) => { setFolder(e.target.value); setNewFolder('') }}
                          className="w-full pl-9 pr-3 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-sm text-white outline-none focus:border-blue-500 appearance-none"
                        >
                          <option value="">— Pick folder —</option>
                          {folders.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 uppercase tracking-widest px-1 mb-1.5 block">Or create new</label>
                      <input
                        type="text"
                        value={newFolder}
                        onChange={(e) => { setNewFolder(e.target.value); setFolder('') }}
                        placeholder="e.g. travel-site"
                        className="w-full px-3 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-600">
                    Files save to <span className="text-cyan-300">/{folderPath()}/</span>
                  </p>

                  {/* Cover upload */}
                  <div>
                    <label className="text-[11px] text-neutral-500 uppercase tracking-widest px-1 mb-2 block">Cover image</label>
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl text-neutral-400 hover:text-blue-300 transition-colors text-sm disabled:opacity-60"
                    >
                      {uploadingCover ? (
                        <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload size={16} /> {data.image ? 'Replace cover image' : 'Upload cover image'}</>
                      )}
                    </button>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleCoverUpload(e.target.files)}
                    />
                    {data.image && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/60 p-2 relative group">
                        <img src={data.image} alt="cover" className="w-full h-32 object-cover object-top rounded-lg" />
                        <button
                          onClick={() => setData(d => ({ ...d, image: '' }))}
                          className="absolute top-3 right-3 p-1 bg-red-600/80 hover:bg-red-500 rounded text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gallery upload */}
                  <div>
                    <label className="text-[11px] text-neutral-500 uppercase tracking-widest px-1 mb-2 block">Gallery images</label>
                    {(data.images && data.images.length > 0) && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {data.images.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900/60">
                            <img src={img} alt="" className="w-full h-20 object-cover" />
                            <button
                              onClick={() => removeGalleryImage(img)}
                              className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      disabled={uploadingGallery}
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 rounded-xl text-neutral-400 hover:text-blue-300 transition-colors text-sm disabled:opacity-60"
                    >
                      {uploadingGallery ? (
                        <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                      ) : (
                        <><Upload size={14} /> Upload gallery images</>
                      )}
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleGalleryUpload(e.target.files)}
                    />
                  </div>
                </div>

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
                  disabled={uploadingCover || uploadingGallery}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-60"
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
