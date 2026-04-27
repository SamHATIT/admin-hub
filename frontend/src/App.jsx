import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import N8nDetail from './pages/N8nDetail'
import OllamaDetail from './pages/OllamaDetail'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/n8n" element={<N8nDetail />} />
          <Route path="/ollama" element={<OllamaDetail />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
