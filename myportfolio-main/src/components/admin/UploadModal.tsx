import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Loader2, FolderOpen } from 'lucide-react'
import { listProjectImageFolders, uploadProjectImage } from '@/lib/projectsApi'

export interface UploadTarget {
  projectId: number
  type: 'cover' | 'gallery'
}

interface UploadModalProps {
  open: boolean
  target: UploadTarget | null
  onClose: () => void
  onUploaded: (urls: string[], target: UploadTarget) => void
  onError: (msg: string) => void
}

export default function UploadModal({ open, target, onClose, onUploaded, onError }: UploadModalProps) {
  const [folders, setFolders] = useState<string[]>([])
  const [folder, setFolder] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setFolder('')
    setNewFolder('')
    listProjectImageFolders().then(setFolders).catch(() => setFolders([]))
  }, [open])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !target) return
    const folderPath = (folder || newFolder || 'uploads').trim()
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadProjectImage(file, folderPath)
        urls.push(url)
      }
      onUploaded(urls, target)
      onClose()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      onError(msg)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#08061a] border border-neutral-800 rounded-3xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Upload image</h3>
                <p className="text-xs text-neutral-500">Files go to Supabase Storage</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest px-1 block mb-2">Choose folder</label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <select
                    value={folder}
                    onChange={(e) => { setFolder(e.target.value); setNewFolder('') }}
                    className="w-full pl-10 pr-3 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-white outline-none focus:border-blue-500"
                  >
                    <option value="">— Pick existing folder —</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="text-center text-xs text-neutral-600">— or —</div>

              <div>
                <label className="text-xs text-neutral-400 uppercase tracking-widest px-1 block mb-2">Create new folder</label>
                <input
                  type="text"
                  value={newFolder}
                  onChange={(e) => { setNewFolder(e.target.value); setFolder('') }}
                  placeholder="e.g. travel-site"
                  className="w-full px-3 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                disabled={uploading || (!folder && !newFolder.trim())}
                onClick={() => inputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><Loader2 size={18} className="animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={18} /> Choose file{target?.type === 'gallery' ? 's' : ''} to upload</>
                )}
              </button>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple={target?.type === 'gallery'}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <p className="text-[11px] text-neutral-600 text-center">
                Files save to <span className="text-cyan-300">/{(folder || newFolder || 'uploads').replace(/^\/+|\/+$/g, '')}/</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
