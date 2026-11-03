import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MediaManagerPage from './pages/MediaManagerPage'
import ProjectManagerPage from './pages/ProjectManagerPage'
import NewProjectPage from './pages/NewProjectPage'
import EditProjectPage from './pages/EditProjectPage'
import ProjectPreviewPage from './pages/ProjectPreviewPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import PlaceholderPage from './pages/PlaceholderPage'
import BlogManagerPage from './pages/BlogManagerPage'
// The editor pulls in TipTap + highlight.js; load it only on blog routes.
const BlogEditorPage = lazy(() => import('./pages/BlogEditorPage'))
const BlogPreviewPage = lazy(() => import('./pages/BlogPreviewPage'))
import { supabase } from './lib/supabaseClient'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // TEST_BYPASS: skip auth in test/preview builds — remove before real prod
  if (import.meta.env.VITE_SKIP_AUTH === 'true') return <>{children}</>

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

function BlogIdRedirect() {
  const { id } = useParams()
  return <Navigate to={`/admin/blogs/${id}/edit`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/media" element={<ProtectedRoute><MediaManagerPage /></ProtectedRoute>} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/admin/projects" element={<ProtectedRoute><ProjectManagerPage /></ProtectedRoute>} />
        <Route path="/admin/projects/new" element={<ProtectedRoute><NewProjectPage /></ProtectedRoute>} />
        <Route path="/admin/projects/:id/edit" element={<ProtectedRoute><EditProjectPage /></ProtectedRoute>} />
        <Route path="/admin/projects/:id/preview" element={<ProtectedRoute><ProjectPreviewPage /></ProtectedRoute>} />
        {/* Public, unauthenticated project detail page */}
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/projects" element={<Navigate to="/admin/projects" replace />} />
        <Route path="/admin/blogs" element={<ProtectedRoute><BlogManagerPage /></ProtectedRoute>} />
        <Route path="/admin/blogs/new" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
        <Route path="/admin/blogs/:id/edit" element={<ProtectedRoute><BlogEditorPage /></ProtectedRoute>} />
        <Route path="/admin/blogs/:id/preview" element={<ProtectedRoute><BlogPreviewPage /></ProtectedRoute>} />
        {/* Media "Used in" links point at /admin/blogs/:id */}
        <Route path="/admin/blogs/:id" element={<BlogIdRedirect />} />
        <Route path="/blog" element={<Navigate to="/admin/blogs" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><PlaceholderPage title="Dashboard" /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
