import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router'
import { toast } from 'react-toastify'
import { useState } from 'react'
import api from '../../services/api'
import { ShieldCheck, UserPlus } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const { confirmPassword, ...payload } = data
      await api.post('/user/signup', payload)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-mark"><ShieldCheck size={24} className="text-white" /></div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>CampusGate</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Campus Access Management</div>
          </div>
        </div>

        <div className="auth-heading">
          <h2>Create an account</h2>
          <p>Register with your campus details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First name</label>
              <input
                className="form-input"
                placeholder="Enter first name"
                {...register('first_name', { required: 'First name is required' })}
              />
              {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input
                className="form-input"
                placeholder="Enter last name"
                {...register('last_name', { required: 'Last name is required' })}
              />
              {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter email address"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-select" {...register('gender', { required: 'Select a gender' })}>
              <option value="">select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="others">Others</option>
            </select>
            {errors.gender && <span className="form-error">{errors.gender.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 chars' } })}
              />
              {errors.password && <span className="form-error">{errors.password.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm password"
                {...register('confirmPassword', {
                  required: 'Please confirm',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
            </div>
          </div>

          <button
            id="signup-btn"
            type="submit"
            className={`btn btn-primary btn-full btn-lg flex items-center justify-center gap-2${loading ? ' btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? '' : <><UserPlus size={18} /> Create Account</>}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
