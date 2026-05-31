import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MediaManagerPage from './pages/MediaManagerPage'
import PlaceholderPage from './pages/PlaceholderPage'
import { supabase } from './lib/supabaseClient'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!checked) return null
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/media" element={<ProtectedRoute><MediaManagerPage /></ProtectedRoute>} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/projects" element={<ProtectedRoute><PlaceholderPage title="Project Manager" /></ProtectedRoute>} />
        <Route path="/blog" element={<ProtectedRoute><PlaceholderPage title="Blog Manager" /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PlaceholderPage title="Dashboard" /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
