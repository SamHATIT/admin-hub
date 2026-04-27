import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { login } from '../services/api'
import { useToast } from '../components/Toast'

function Login() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await login(username, password)
      localStorage.setItem('admin_token', res.data.access_token)
      localStorage.setItem('password_expired', String(res.data.password_expired))
      localStorage.setItem('password_days_remaining', String(res.data.password_days_remaining))
      navigate('/')
    } catch {
      addToast('Identifiants incorrects', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink text-bone flex">
      {/* Left — eyebrow + tagline */}
      <div className="hidden lg:flex flex-col justify-between flex-1 px-12 py-10 border-r border-bone/10 relative overflow-hidden">
        {/* Subtle linework background */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, var(--brass) 0 1px, transparent 1px 80px), repeating-linear-gradient(-45deg, var(--brass) 0 1px, transparent 1px 80px)',
        }} />
        <div className="relative">
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-4 mb-4">№ 00 · Console</p>
          <h1 className="font-serif italic text-5xl xl:text-6xl text-bone leading-[1.05] mb-6">
            Digital · Humans
          </h1>
          <p className="font-mono text-[12px] tracking-eyebrow uppercase text-bone-4">
            Autonomous Studio · Est MMXXV
          </p>
        </div>
        <div className="relative">
          <p className="font-serif italic text-2xl text-bone-2 max-w-md leading-snug">
            "Backstage of the eleven agents."
          </p>
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mt-3">
            Admin · Monitoring · Operations
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit} className="bg-ink-2 border border-bone/10 w-full max-w-md p-8 lg:p-10">
          <p className="font-mono text-[11px] tracking-eyebrow uppercase text-bone-4 mb-2">
            Welcome back · Sign in
          </p>
          <h2 className="font-serif italic text-3xl text-bone mb-1">Admin Console</h2>
          <p className="font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 mb-8">
            Console · v6.1
          </p>

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 mb-2">
                Utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone placeholder:text-bone-4 focus:border-brass focus:bg-ink-3 focus:outline-none transition-colors"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block font-mono text-[10px] tracking-eyebrow uppercase text-bone-3 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-ink-3 border border-bone/10 px-4 py-3 font-sans text-[14px] text-bone placeholder:text-bone-4 focus:border-brass focus:bg-ink-3 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 inline-flex items-center justify-center gap-2 px-4 py-3 bg-brass text-ink font-mono text-[11px] tracking-cta uppercase hover:bg-brass-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Connexion…</>
            ) : (
              <>Enter the console <span aria-hidden="true">→</span></>
            )}
          </button>

          <p className="mt-8 pt-5 border-t border-bone/10 font-mono text-[10px] tracking-eyebrow uppercase text-bone-4 text-center">
            © MMXXVI · Samhatit Consulting
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
