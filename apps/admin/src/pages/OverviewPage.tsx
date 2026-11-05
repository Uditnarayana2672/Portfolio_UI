import Sidebar from '../components/layout/Sidebar'
import CommandDeck from '../components/overview/CommandDeck'
import PortfolioInfo from '../components/portfolio/PortfolioInfo'
import { useUiStore } from '../store/uiStore'
import styles from './OverviewPage.module.css'

export default function OverviewPage() {
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)

  return (
    <div className={styles.page}>
      <header className={styles.pagehead}>
        <button className={styles.menuBtn} onClick={() => setMobileNavOpen(true)} aria-label="Open menu">☰</button>
        <h1>Dashboard <span className={styles.scribble}>/ Overview</span></h1>
      </header>
      <div className={styles.layout}>
        <Sidebar activeItem="Overview" />
        <main className={styles.main}>
          <CommandDeck />
          <PortfolioInfo />
        </main>
      </div>
    </div>
  )
}
