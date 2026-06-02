import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import './index.css'

import { selectIsAuthenticated, selectUser, selectCanAccess, selectDefaultPage, setUser } from './store/authSlice'
import { selectActivePage, setActivePage } from './store/navigationSlice'
import { canAccessPage } from './config/permissions.js'
import { authApi } from './services/api.js'

import Layout        from './components/Layout.jsx'
import Login         from './pages/Login.jsx'

import Dashboard     from './pages/Dashboard.jsx'
import Users         from './pages/Users.jsx'
import Dramas        from './pages/Dramas.jsx'
import Categories    from './pages/Categories.jsx'
import Banners       from './pages/Banners.jsx'
import Membership    from './pages/Membership.jsx'
import TopUp         from './pages/TopUp.jsx'
import Coins         from './pages/Coins.jsx'
import Notifications from './pages/Notifications.jsx'
import Analytics     from './pages/Analytics.jsx'
import Roles         from './pages/Roles.jsx'
import CMS           from './pages/CMS.jsx'

const ROUTES = {
  dashboard:     Dashboard,
  users:         Users,
  dramas:        Dramas,
  categories:    Categories,
  banners:       Banners,
  membership:    Membership,
  topup:         TopUp,
  coins:         Coins,
  notifications: Notifications,
  analytics:     Analytics,
  roles:         Roles,
  cms:           CMS,
}

function AccessDenied() {
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 8 }}>Access denied</h2>
      <p style={{ color: 'var(--text3)', fontSize: 14 }}>
        You do not have permission to view this section. Contact your administrator.
      </p>
    </div>
  )
}

export default function App() {
  const dispatch          = useDispatch()
  const isAuthenticated   = useSelector(selectIsAuthenticated)
  const activePage        = useSelector(selectActivePage)
  const user              = useSelector(selectUser)
  const hasAccess         = useSelector(selectCanAccess(activePage))
  const defaultPage       = useSelector(selectDefaultPage)

  // Refresh admin profile (role + sections) after page load / refresh
  useEffect(() => {
    if (!isAuthenticated) return
    authApi
      .getAdminProfile()
      .then((res) => {
        const profile = res.data?.data
        if (profile) {
          localStorage.setItem('admin_user', JSON.stringify(profile))
          dispatch(setUser(profile))
        }
      })
      .catch(() => {})
  }, [isAuthenticated, dispatch])

  // Redirect to first allowed page if current page is not permitted
  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!canAccessPage(user, activePage)) {
      dispatch(setActivePage(defaultPage))
    }
  }, [isAuthenticated, user, activePage, defaultPage, dispatch])

  if (!isAuthenticated) {
    return <Login />
  }

  const Page = ROUTES[activePage] || Dashboard

  return (
    <Layout>
      {hasAccess ? <Page /> : <AccessDenied />}
    </Layout>
  )
}
