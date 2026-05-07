import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      {/* Left Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#2EC4B6" strokeWidth="2.5"/>
            <path d="M8 14 Q11 8 14 14 Q17 20 20 14" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="#2EC4B6"/>
          </svg>
          <span className="logo-text">PulmoSight</span>
        </div>

        <div className="sidebar-menu">
          <div className="nav-section-label">Navigation</div>

          <NavLink to="/upload" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            Upload Scan
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            Patient History
          </NavLink>
          <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            Reports
          </NavLink>
        </div>

        {user && (
          <div className="sidebar-footer">
            <div className="user-profile">
              <div className="avatar">{user.initials || 'DR'}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            </div>
            <button onClick={logout} className="logout-btn">
              🚪 Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Layout */}
      <div className="main-layout">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-brand">
            <h1>PulmoSight Portal</h1>
            <p className="system-subtitle">Lung Cancer AI Detection System</p>
          </div>
          
          <div className="header-right">
            <div className="header-status">
              <span className="status-dot active"></span>
              <span className="status-text">Model Online (YOLOv11)</span>
            </div>
            
            {user && (
              <div className="doctor-profile">
                <div className="doctor-avatar">{user.initials || 'DR'}</div>
                <div className="doctor-info">
                  <span className="doctor-name">{user.name}</span>
                  <span className="doctor-role">{user.role}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Component */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

