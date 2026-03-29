import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/Layout'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [editMode, setEditMode] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    if (!user?._id) return
    api.get(`/user/${user._id}`)
      .then((res) => {
        const u = res.data?.data
        setProfile(u)
        reset(u)
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user?._id, reset])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const res = await api.put(`/user/${user._id}`, data)
      const updated = res.data?.data?.user
      setProfile(updated)
      updateUser(updated)
      toast.success('Profile updated!')
      setEditMode(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  function getInitials(u) {
    return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase()
  }

  return (
    <Layout title="My Profile">
      {loading ? (
        <div className="inline-loader"><div className="spinner" /></div>
      ) : (
        <div className="animate-slide-up">
          <div className="page-header">
            <h1>My Profile</h1>
            <p>View and manage your personal information</p>
          </div>

          {/* Avatar + header strip */}
          <div className="card" style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.5rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.75rem', fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: '0 4px 20px var(--primary-glow)'
            }}>
              {getInitials(profile)}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>{profile?.first_name} {profile?.last_name}</h2>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', marginTop:'0.4rem' }}>
                <span className={`badge badge-${profile?.role}`}>{profile?.role}</span>
                <span className={`badge ${profile?.active ? 'badge-active' : 'badge-blacklisted'}`}>
                  {profile?.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p style={{ fontSize:'0.8rem', margin:'0.3rem 0 0', color:'var(--text-muted)' }}>
                Reg #{profile?.reg_number}
              </p>
            </div>
            {!editMode && (
              <button id="edit-profile-btn" className="btn btn-secondary" onClick={() => setEditMode(true)}>
                ✏️ Edit
              </button>
            )}
          </div>

          {/* Info / Edit Form */}
          <div className="card">
            {editMode ? (
              <>
                <div className="card-title">✏️ Edit Profile</div>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First name</label>
                      <input className="form-input" {...register('first_name', { required: 'Required' })} />
                      {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last name</label>
                      <input className="form-input" {...register('last_name', { required: 'Required' })} />
                      {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input className="form-input" type="email" {...register('email', { required: 'Required' })} />
                      {errors.email && <span className="form-error">{errors.email.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone number</label>
                      <input className="form-input" {...register('phone_number')} placeholder="+234..." />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select className="form-select" {...register('gender')}>
                        <option value="">— select —</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marital status</label>
                      <select className="form-select" {...register('marital_status')}>
                        <option value="">— select —</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="complicated">Complicated</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); reset(profile) }}>
                      Cancel
                    </button>
                    <button type="submit" className={`btn btn-primary${saving ? ' btn-loading' : ''}`} disabled={saving}>
                      {saving ? '' : '💾 Save Changes'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="card-title">👤 Profile Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                  {[
                    ['Email', profile?.email],
                    ['Phone', profile?.phone_number || '—'],
                    ['Gender', profile?.gender || '—'],
                    ['Marital Status', profile?.marital_status || '—'],
                    ['Last Login', profile?.last_login ? new Date(profile.last_login).toLocaleString() : '—'],
                    ['Member since', profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem' }}>{label}</div>
                      <div style={{ fontSize:'0.9rem', color:'var(--text-primary)', fontWeight:500 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
