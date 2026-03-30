import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { ShieldCheck, ArrowRight } from 'lucide-react'

const roleHome = {
  user:     '/dashboard/profile',
  staff:    '/dashboard/profile',
  security: '/dashboard/scan',
  cso:      '/dashboard/vehicles',
  admin:    '/dashboard/admin/users',
}

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      const user = await login(data)
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate(roleHome[user.role] || '/dashboard/profile')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
      toast.error(msg)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark"><ShieldCheck size={24} className="text-white" /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>CampusGate</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Campus Access Management</div>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Welcome back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter password"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            id="login-btn"
            type="submit"
            className={`btn btn-primary btn-full btn-lg flex items-center justify-center gap-2${isLoading ? ' btn-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : <> Sign In<ArrowRight size={18} /> </>}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
