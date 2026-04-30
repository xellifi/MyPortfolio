import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, MailOpen, Search, Trash2, RefreshCw, Loader2, Inbox,
  X, ExternalLink, Reply,
} from 'lucide-react'
import {
  fetchInquiries, markInquiryRead, deleteInquiry, type Inquiry,
} from '@/lib/inquiriesApi'

interface InquiriesViewProps {
  onShowMessage: (msg: string, type?: 'success' | 'error') => void
}

type FilterKey = 'all' | 'unread' | 'read'

export default function InquiriesView({ onShowMessage }: InquiriesViewProps) {
  const [items, setItems] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [active, setActive] = useState<Inquiry | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const list = await fetchInquiries()
      setItems(list)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load inquiries'
      onShowMessage(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let list = items
    if (filter === 'unread') list = list.filter(i => !i.read)
    else if (filter === 'read') list = list.filter(i => i.read)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.firstName.toLowerCase().includes(q) ||
        i.lastName.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        i.subject.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      )
    }
    return list
  }, [items, filter, search])

  const unreadCount = items.filter(i => !i.read).length

  const handleOpen = async (inq: Inquiry) => {
    setActive(inq)
    if (!inq.read) {
      try {
        await markInquiryRead(inq.id, true)
        setItems(prev => prev.map(p => p.id === inq.id ? { ...p, read: true } : p))
      } catch { /* silent */ }
    }
  }

  const toggleRead = async (inq: Inquiry) => {
    const next = !inq.read
    try {
      await markInquiryRead(inq.id, next)
      setItems(prev => prev.map(p => p.id === inq.id ? { ...p, read: next } : p))
      if (active?.id === inq.id) setActive({ ...active, read: next })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update'
      onShowMessage(msg, 'error')
    }
  }

  const handleDelete = async (inq: Inquiry) => {
    if (!confirm(`Delete inquiry from ${inq.firstName}? This cannot be undone.`)) return
    try {
      await deleteInquiry(inq.id)
      setItems(prev => prev.filter(p => p.id !== inq.id))
      if (active?.id === inq.id) setActive(null)
      onShowMessage('Inquiry deleted')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete'
      onShowMessage(msg, 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Inquiries</h2>
          <p className="text-sm text-neutral-500">
            {items.length} total{unreadCount > 0 && <> · <span className="text-cyan-300">{unreadCount} unread</span></>}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject…"
            className="w-full pl-10 pr-3 py-3 bg-neutral-950/60 border border-neutral-900 focus:border-blue-500/50 rounded-xl text-sm text-white outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-3 sm:flex bg-neutral-900/60 border border-neutral-800 rounded-xl p-1">
          {(['all', 'unread', 'read'] as FilterKey[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1 text-[10px]">({unreadCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-60 text-neutral-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-10 text-center text-neutral-500">
          <Inbox className="h-8 w-8 mx-auto mb-3 text-neutral-700" />
          {items.length === 0
            ? <>No inquiries yet. Submissions from the contact form will appear here.</>
            : <>No inquiries match those filters.</>
          }
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inq, i) => (
            <motion.button
              key={inq.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              onClick={() => handleOpen(inq)}
              className={`w-full text-left flex items-start gap-3 p-3 sm:p-4 rounded-2xl border transition-colors ${
                inq.read
                  ? 'bg-neutral-950/40 border-neutral-900 hover:bg-neutral-900/40'
                  : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
              }`}
            >
              <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                inq.read ? 'bg-neutral-800 text-neutral-300' : 'bg-blue-500/20 text-cyan-200'
              }`}>
                {(inq.firstName?.[0] ?? 'A').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm truncate ${inq.read ? 'text-neutral-300' : 'text-white font-semibold'}`}>
                    {inq.firstName} {inq.lastName}
                  </p>
                  {!inq.read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                  <span className="text-[11px] text-neutral-500 ml-auto shrink-0">{formatDate(inq.createdAt)}</span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${inq.read ? 'text-neutral-500' : 'text-neutral-200'}`}>
                  {inq.subject || '(no subject)'}
                </p>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{inq.message}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <AnimatePresence>
        {active && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setActive(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-[480px] z-50 bg-[#08061a] border border-neutral-800 sm:border-l rounded-t-3xl sm:rounded-t-none sm:rounded-l-3xl flex flex-col max-h-[92vh] sm:max-h-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-900">
                <h3 className="text-base font-bold text-white">Inquiry detail</h3>
                <button
                  onClick={() => setActive(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {(active.firstName?.[0] ?? 'A').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-white">{active.firstName} {active.lastName}</p>
                    <a href={`mailto:${active.email}`} className="text-sm text-cyan-300 hover:underline break-all">
                      {active.email}
                    </a>
                    <p className="text-[11px] text-neutral-500 mt-1">{formatDate(active.createdAt, true)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Subject</p>
                  <p className="text-sm text-white font-medium">{active.subject || '(no subject)'}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Message</p>
                  <div className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed bg-neutral-950/60 border border-neutral-900 rounded-xl p-4">
                    {active.message}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-neutral-900 grid grid-cols-3 gap-2">
                <a
                  href={`mailto:${active.email}?subject=Re: ${encodeURIComponent(active.subject || 'your inquiry')}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
                >
                  <Reply size={14} /> Reply
                </a>
                <button
                  onClick={() => toggleRead(active)}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-sm"
                >
                  {active.read ? <><Mail size={14} /> Unread</> : <><MailOpen size={14} /> Read</>}
                </button>
                <button
                  onClick={() => handleDelete(active)}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-sm"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatDate(iso: string, full = false): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (full) {
    return d.toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    })
  }
  const now = Date.now()
  const diff = now - d.getTime()
  const min = 60_000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < hour)  return `${Math.max(1, Math.floor(diff / min))}m ago`
  if (diff < day)   return `${Math.floor(diff / hour)}h ago`
  if (diff < 7*day) return `${Math.floor(diff / day)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Suppress unused-import lint for icon kept for future use
void ExternalLink
