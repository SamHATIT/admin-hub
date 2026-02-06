import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
      navigate('/')
    } catch {
      addToast('Identifiants incorrects', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Admin Hub</h1>
        <p>Digital Humans</p>
        <div className="form-group">
          <label htmlFor="username">Utilisateur</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button className="btn btn-confirm login-btn" type="submit" disabled={loading}>
          {loading ? (
            <><span className="spinner" /> Connexion...</>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
    </div>
  )
}

export default Login
