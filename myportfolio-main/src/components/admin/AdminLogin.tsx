import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) setError(error.message)
      else setPassword('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030014] p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />

        <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 mx-auto mb-4">
          <ShieldCheck className="h-6 w-6 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Admin Login</h2>
        <p className="text-neutral-500 text-center mb-8 text-sm">Sign in with your Supabase admin account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-widest px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full p-4 pl-10 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full p-4 pl-10 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white outline-none focus:border-blue-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (<><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</>) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Authenticated by Supabase · Sessions persist in this browser
        </p>
      </motion.div>
    </div>
  )
}
