import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
