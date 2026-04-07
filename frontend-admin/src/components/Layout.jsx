import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

export default function Layout({ active, onNavigate, onLogout, children }) {
  return (
    <div className="app">
      <Sidebar active={active} onNavigate={onNavigate} />
      <div className="main">
        <Topbar active={active} onLogout={onLogout} />
        <main className="content" key={active}>
          {children}
        </main>
      </div>
    </div>
  )
}
