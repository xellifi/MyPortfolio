"use client"

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, Plus, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'

import staticProjectsData from '@/data/projects.json'
import { supabase } from '@/lib/supabase'
import {
  fetchProjects as fetchProjectsFromDb,
  replaceAllProjects,
  deleteProject as deleteProjectFromDb,
  type Project,
} from '@/lib/projectsApi'

import AdminLayout, { type AdminView } from '@/components/admin/AdminLayout'
import AdminLogin from '@/components/admin/AdminLogin'
import Overview from '@/components/admin/views/Overview'
import ProjectsView from '@/components/admin/views/ProjectsView'
import MediaView from '@/components/admin/views/MediaView'
import InquiriesView from '@/components/admin/views/InquiriesView'
import { fetchInquiries } from '@/lib/inquiriesApi'

export default function AdminDashboard() {
  // ---------- Auth ----------
  const [session, setSession] = useState<Session | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const isAuthed = !!session

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      setAuthChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  // ---------- Data ----------
  const [projects, setProjects] = useState<Project[]>(staticProjectsData.projects as Project[])
  const [apiConnected, setApiConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const showMessage = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3500)
  }, [])

  const refreshProjects = useCallback(async () => {
    try {
      const rows = await fetchProjectsFromDb()
      setProjects(rows.length > 0 ? rows : (staticProjectsData.projects as Project[]))
      setApiConnected(true)
    } catch (err) {
      setApiConnected(false)
      setProjects(staticProjectsData.projects as Project[])
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showMessage(`Database offline — using static data (${msg})`, 'error')
    }
  }, [showMessage])

  useEffect(() => { if (isAuthed) refreshProjects() }, [isAuthed, refreshProjects])

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await replaceAllProjects(projects)
      showMessage('Pushed updates to live site')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      showMessage(`Failed to save: ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateProject = (id: number, key: keyof Project, value: Project[keyof Project]) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, [key]: value } : p)))
  }

  const deleteProject = async (id: number) => {
    try {
      await deleteProjectFromDb(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      showMessage('Project deleted')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      showMessage(`Failed to delete: ${msg}`, 'error')
    }
  }

  const addProject = async (p: Project) => {
    const next = [{ ...p }, ...projects]
    setProjects(next)
    if (apiConnected) {
      try {
        await replaceAllProjects(next)
        showMessage('Project created')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed'
        showMessage(`Created locally — push failed: ${msg}`, 'error')
      }
    } else {
      showMessage('Project added locally — database offline', 'error')
    }
  }

  // ---------- Inquiry unread badge ----------
  const [unreadInquiries, setUnreadInquiries] = useState(0)

  const refreshUnreadInquiries = useCallback(async () => {
    try {
      const list = await fetchInquiries()
      setUnreadInquiries(list.filter(i => !i.read).length)
    } catch {
      setUnreadInquiries(0)
    }
  }, [])

  useEffect(() => { if (isAuthed) refreshUnreadInquiries() }, [isAuthed, refreshUnreadInquiries])

  // ---------- View routing ----------
  const [view, setView] = useState<AdminView>('overview')
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  // Refresh unread count when leaving the inquiries view (read state may have changed)
  useEffect(() => {
    if (isAuthed && view !== 'inquiries') refreshUnreadInquiries()
  }, [view, isAuthed, refreshUnreadInquiries])

  // ---------- Render guards ----------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthed) return <AdminLogin />

  // Topbar contextual action
  const topbarAction = view === 'projects' ? (
    <>
      <button
        onClick={() => setNewProjectOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:bg-neutral-800 text-xs sm:text-sm"
      >
        <Plus size={14} /> <span className="hidden sm:inline">New project</span>
      </button>
      <button
        onClick={handleSaveAll}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-60"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        <span className="hidden sm:inline">{saving ? 'Saving…' : 'Push updates'}</span>
      </button>
    </>
  ) : (
    <button
      onClick={refreshProjects}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:bg-neutral-800 text-xs sm:text-sm"
      title="Refresh from database"
    >
      <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
    </button>
  )

  return (
    <>
      <AdminLayout
        activeView={view}
        onChangeView={setView}
        userEmail={session?.user.email ?? undefined}
        onLogout={handleLogout}
        apiConnected={apiConnected}
        topbarAction={topbarAction}
        badges={{ inquiries: unreadInquiries }}
      >
        {view === 'overview' && (
          <Overview
            projects={projects}
            onNavigate={setView}
            onAddNew={() => { setView('projects'); setNewProjectOpen(true) }}
          />
        )}
        {view === 'projects' && (
          <ProjectsView
            projects={projects}
            apiConnected={apiConnected}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onAdd={addProject}
            onShowMessage={showMessage}
            newProjectOpen={newProjectOpen}
            setNewProjectOpen={setNewProjectOpen}
          />
        )}
        {view === 'inquiries' && <InquiriesView onShowMessage={showMessage} />}
        {view === 'media' && <MediaView />}
      </AdminLayout>

      {/* Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : 'bg-red-500/15 border-red-500/40 text-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
