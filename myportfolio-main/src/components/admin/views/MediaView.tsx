import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, Image as ImageIcon, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { listProjectImageFolders } from '@/lib/projectsApi'

const BUCKET = 'project-images'

interface FileEntry {
  name: string
  url: string
}

export default function MediaView() {
  const [folders, setFolders] = useState<string[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadFolders = async () => {
    setErr(null)
    try {
      const list = await listProjectImageFolders()
      setFolders(list)
      if (list.length > 0 && !active) setActive(list[0])
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load folders')
    }
  }

  const loadFiles = async (folder: string) => {
    setLoading(true)
    setErr(null)
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(folder, {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error) throw error
      const entries: FileEntry[] = (data ?? [])
        .filter(d => d.id !== null) // skip nested folders
        .map(d => {
          const path = `${folder}/${d.name}`
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
          return { name: d.name, url: pub.publicUrl }
        })
      setFiles(entries)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load images')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFolders() }, [])
  useEffect(() => { if (active) loadFiles(active) }, [active])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Media library</h2>
          <p className="text-sm text-neutral-500">Files in <code className="text-cyan-300">project-images</code> bucket</p>
        </div>
        <button
          onClick={() => { loadFolders(); if (active) loadFiles(active) }}
          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {err && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">{err}</div>
      )}

      {folders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-800 p-10 text-center text-neutral-500">
          <FolderOpen className="h-8 w-8 mx-auto mb-3 text-neutral-600" />
          No folders yet. Upload images from the Projects view to create folders.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[220px_1fr] gap-5">
          {/* Folders rail */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 p-2 max-h-[420px] overflow-y-auto">
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active === f ? 'bg-blue-500/10 text-white' : 'text-neutral-400 hover:bg-neutral-900/60 hover:text-white'
                }`}
              >
                <FolderOpen size={15} className={active === f ? 'text-cyan-300' : 'text-neutral-500'} />
                <span className="truncate flex-1 text-left">{f}</span>
              </button>
            ))}
          </div>

          {/* Files grid */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 p-3 sm:p-4 min-h-[320px]">
            {loading ? (
              <div className="flex items-center justify-center h-60 text-neutral-500 text-sm">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-neutral-500 text-sm gap-2">
                <ImageIcon className="h-7 w-7 text-neutral-700" />
                Empty folder
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {files.map(f => (
                  <motion.a
                    key={f.name}
                    href={f.url}
                    target="_blank" rel="noreferrer"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="group relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/60"
                  >
                    <img src={f.url} alt={f.name} className="aspect-square w-full object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white/90 truncate">{f.name}</p>
                    </div>
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={12} className="text-white" />
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
