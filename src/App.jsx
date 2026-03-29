import { Routes, Route, Navigate } from 'react-router'
import LoginPage    from './pages/auth/LoginPage'
import SignupPage   from './pages/auth/SignupPage'
import ProfilePage  from './pages/dashboard/ProfilePage'
import ScanPage     from './pages/dashboard/ScanPage'
import VehiclesPage from './pages/dashboard/VehiclesPage'
import VehicleDetailPage from './pages/dashboard/VehicleDetailPage'
import UsersPage    from './pages/dashboard/admin/UsersPage'
import UserDetailPage from './pages/dashboard/admin/UserDetailPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

const roleHome = {
  user:     '/dashboard/profile',
  staff:    '/dashboard/profile',
  security: '/dashboard/scan',
  cso:      '/dashboard/vehicles',
  admin:    '/dashboard/admin/users',
}

function RootRedirect() {
  const { user } = useAuth()
  if (user) return <Navigate to={roleHome[user.role] || '/dashboard/profile'} replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected dashboard routes */}
      <Route
        path="/dashboard/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/scan"
        element={
          <ProtectedRoute allowedRoles={['security','cso','admin']}>
            <ScanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/vehicles"
        element={
          <ProtectedRoute allowedRoles={['cso','admin']}>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={['cso','admin']}>
            <VehicleDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}