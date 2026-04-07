import { useState, useEffect } from 'react'
import './index.css'

import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'

import Dashboard     from './pages/Dashboard.jsx'
import Users         from './pages/Users.jsx'
import Dramas        from './pages/Dramas.jsx'
import Categories    from './pages/Categories.jsx'
import Banners       from './pages/Banners.jsx'
import Membership    from './pages/Membership.jsx'
import Coins         from './pages/Coins.jsx'
import Notifications from './pages/Notifications.jsx'
import Analytics     from './pages/Analytics.jsx'
import Roles         from './pages/Roles.jsx'
import CMS           from './pages/CMS.jsx'

// Route map — add a new page here with one line
const ROUTES = {
  dashboard:     Dashboard,
  users:         Users,
  dramas:        Dramas,
  categories:    Categories,
  banners:       Banners,
  membership:    Membership,
  coins:         Coins,
  notifications: Notifications,
  analytics:     Analytics,
  roles:         Roles,
  cms:           CMS,
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [active, setActive] = useState('dashboard')
  const Page = ROUTES[active] || Dashboard

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setActive('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <Layout active={active} onNavigate={setActive} onLogout={handleLogout}>
      <Page />
    </Layout>
  )
}
