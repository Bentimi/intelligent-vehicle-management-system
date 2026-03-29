import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

// Role → their default home route
const roleHome = {
  user:     '/dashboard/profile',
  staff:    '/dashboard/profile',
  security: '/dashboard/scan',
  cso:      '/dashboard/vehicles',
  admin:    '/dashboard/admin/users',
};

/**
 * allowedRoles: string[] — roles allowed to see this page
 * If empty / undefined, any authenticated user can see it.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const home = roleHome[user.role] || '/dashboard/profile';
    return <Navigate to={home} replace />;
  }

  return children;
}
