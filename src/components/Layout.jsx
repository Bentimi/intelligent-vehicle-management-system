import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const roleNav = {
  user: [
    { to: '/dashboard/profile', icon: '👤', label: 'My Profile' },
  ],
  staff: [
    { to: '/dashboard/profile', icon: '👤', label: 'My Profile' },
  ],
  security: [
    { to: '/dashboard/scan',    icon: '📷', label: 'Scan Vehicle' },
    { to: '/dashboard/profile', icon: '👤', label: 'My Profile' },
  ],
  cso: [
    { to: '/dashboard/vehicles', icon: '🚗', label: 'Vehicles' },
    { to: '/dashboard/scan',     icon: '📷', label: 'Scan Vehicle' },
    { to: '/dashboard/profile',  icon: '👤', label: 'My Profile' },
  ],
  admin: [
    { to: '/dashboard/admin/users',    icon: '👥', label: 'Users' },
    { to: '/dashboard/vehicles',       icon: '🚗', label: 'Vehicles' },
    { to: '/dashboard/scan',           icon: '📷', label: 'Scan Vehicle' },
    { to: '/dashboard/profile',        icon: '👤', label: 'My Profile' },
  ],
};

function getInitials(user) {
  if (!user) return '?';
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
}

export default function Layout({ children, title = 'Dashboard' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = roleNav[user?.role] || [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, []);

  return (
    <div className="app-shell">
      {/* Mobile topbar */}
      <div className="mobile-topbar">
        <button className="hamburger" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
          ☰
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.2rem' }}>🔐</span>
          <span style={{ fontWeight:700, fontSize:'0.95rem' }}>CampusGate</span>
        </div>
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">🔐</div>
          <div>
            <div className="sidebar-logo-text">CampusGate</div>
            <span className="sidebar-logo-sub">Access Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" role="navigation">
          <span className="nav-section-label">Navigation</span>
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}

          <span className="nav-section-label" style={{ marginTop:'auto' }}>Account</span>
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </nav>

        {/* User chip */}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{getInitials(user)}</div>
            <div className="user-chip-info">
              <div className="user-chip-name">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="user-chip-role">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>

        {/* Page body */}
        <div className="page-wrapper">{children}</div>
      </main>
    </div>
  );
}
