import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MediaManagerPage from './pages/MediaManagerPage'
import PlaceholderPage from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/media" element={<MediaManagerPage />} />
        <Route path="/media" element={<Navigate to="/admin/media" replace />} />
        <Route path="/projects" element={<PlaceholderPage title="Project Manager" />} />
        <Route path="/blog" element={<PlaceholderPage title="Blog Manager" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/" element={<Navigate to="/admin/media" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
