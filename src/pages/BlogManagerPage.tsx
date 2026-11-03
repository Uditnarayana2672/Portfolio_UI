import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import s from './BlogEditorPage.module.css'

// Placeholder Blog Manager: only the "+ New post" entry point for now. The
// table, filters and bulk actions come with the Blog Manager build.

export default function BlogManagerPage() {
  const navigate = useNavigate()
  return (
    <div className={s.page}>
      <header className={s.pagehead}>
        <div>
          <h1>Blogs <span className={s.scribble}>/ Manage</span></h1>
          <nav className={s.crumbs}>
            <a href="/dashboard">Dashboard</a> › <span className={s.crumbCur}>Blogs</span>
          </nav>
        </div>
        <button type="button" className={s.newPostBtn} onClick={() => navigate('/admin/blogs/new')}>
          + New post
        </button>
      </header>
      <div className={s.layout}>
        <Sidebar activeItem="Blogs" />
        <main className={s.main}>
          <div className={s.placeholder}>
            <div className={s.placeholderTitle}>✎ Blog Manager is coming soon</div>
            <p>The post list, filters and bulk actions are the next build. For now, start a post:</p>
            <button type="button" className={s.newPostBtn} onClick={() => navigate('/admin/blogs/new')}>
              + New post
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
