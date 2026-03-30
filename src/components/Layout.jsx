import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { LayoutDashboard, Users, Car, Scan, ClipboardList, LogOut, UserCircle, Menu, X, ShieldCheck } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const roleNav = {
  user: [
    { to: '/dashboard/vehicles', icon: <Car size={18} />, label: 'My Vehicles' },
    { to: '/dashboard/profile',  icon: <UserCircle size={18} />, label: 'My Profile' },
  ],
  staff: [
    { to: '/dashboard/vehicles', icon: <Car size={18} />, label: 'My Vehicles' },
    { to: '/dashboard/profile',  icon: <UserCircle size={18} />, label: 'My Profile' },
  ],
  security: [
    { to: '/dashboard/scan',     icon: <Scan size={18} />, label: 'Scan Terminal' },
    { to: '/dashboard/profile',  icon: <UserCircle size={18} />, label: 'My Profile' },
  ],
  cso: [
    { to: '/dashboard/vehicles', icon: <Car size={18} />, label: 'Vehicles' },
    { to: '/dashboard/scan',     icon: <Scan size={18} />, label: 'Scan Terminal' },
    { to: '/dashboard/logs',     icon: <ClipboardList size={18} />, label: 'System Logs' },
    { to: '/dashboard/profile',  icon: <UserCircle size={18} />, label: 'My Profile' },
  ],
  admin: [
    { to: '/dashboard/admin/users', icon: <Users size={18} />, label: 'Users' },
    { to: '/dashboard/vehicles',    icon: <Car size={18} />, label: 'Vehicles' },
    { to: '/dashboard/scan',        icon: <Scan size={18} />, label: 'Scan Terminal' },
    { to: '/dashboard/logs',        icon: <ClipboardList size={18} />, label: 'System Logs' },
    { to: '/dashboard/profile',     icon: <UserCircle size={18} />, label: 'My Profile' },
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
  const [collapsed, setCollapsed] = useState(false);

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
          <Menu size={24} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <ShieldCheck size={20} className="text-primary" />
          <span style={{ fontWeight:700, fontSize:'0.95rem' }}>CampusGate</span>
        </div>
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}${collapsed ? ' collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-brand">
            <div className="sidebar-logo-mark"><ShieldCheck size={22} className="text-white" /></div>
            <div style={{ flex: 1 }}>
              <div className="sidebar-logo-text">CampusGate</div>
              <span className="sidebar-logo-sub">Access Management</span>
            </div>
          </div>
          <button className="sidebar-mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
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
            <span className="nav-icon"><LogOut size={18} /></span>
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
      <main className={`main-content${collapsed ? ' collapsed' : ''}`}>
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="hamburger-desktop" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              <Menu size={24} />
            </button>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <ThemeToggle />
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>

        {/* Page body */}
        <div className="page-wrapper">{children}</div>
      </main>
    </div>
  );
}
