import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { ArrowLeft, Edit, Save, UserCircle, Loader2, Shield, X } from 'lucide-react'
import api from '../../../services/api'
import Layout from '../../../components/Layout'
import { useAuth } from '../../../context/AuthContext'

export default function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [roleMode, setRoleMode] = useState(false)
  const [roleSaving, setRoleSaving] = useState(false)
  const { user: currentUser } = useAuth()

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const { register: registerRole, handleSubmit: handleRoleSubmit, reset: resetRole, formState: { errors: roleErrors } } = useForm()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/user/${id}`).then((r) => {
      const u = r.data?.data
      reset(u)
      resetRole({ role: u.role })
      return u
    }),
  })

  const onUpdate = async (data) => {
    setSaving(true)
    try {
      await api.put(`/user/${id}`, data)
      toast.success('User updated!')
      setEditMode(false)
      qc.invalidateQueries({ queryKey: ['user', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const onRoleUpdate = async (data) => {
    setRoleSaving(true)
    try {
      await api.put(`/user/allocate-role/${id}`, data)
      toast.success('Role updated successfully!')
      setRoleMode(false)
      qc.invalidateQueries({ queryKey: ['user', id] })
      qc.invalidateQueries({ queryKey: ['users'] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Role update failed')
    } finally {
      setRoleSaving(false)
    }
  }

  function getInitials(u) {
    return `${u?.first_name?.[0] ?? ''}${u?.last_name?.[0] ?? ''}`.toUpperCase()
  }

  if (isLoading) return (
    <Layout title="User Detail">
      <div className="inline-loader"><div className="spinner" /></div>
    </Layout>
  )

  if (!user) return (
    <Layout title="User Detail">
      <div className="alert alert-error">User not found.</div>
    </Layout>
  )

  return (
    <Layout title="User Detail">
      <div className="animate-slide-up">
        <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginBottom:'1rem' }} onClick={() => navigate('/dashboard/admin/users')}>
          <ArrowLeft size={16} /> Back to users
        </button>

        <div className="page-header">
          <h1>{user.first_name} {user.last_name}</h1>
          <p>Reg #{user.reg_number}</p>
        </div>

        {/* Header card */}
        <div className="card" style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.5rem' }}>
          <div style={{
            width:72, height:72, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--primary), var(--primary))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.75rem', fontWeight:800, color:'white', flexShrink:0,
            boxShadow:'0 4px 20px var(--primary-glow)'
          }}>
            {getInitials(user)}
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ margin:0 }}>{user.first_name} {user.last_name}</h2>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.4rem', flexWrap:'wrap' }}>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
              <span className={`badge ${user.active ? 'badge-active' : 'badge-blacklisted'}`}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentUser?._id !== user._id && !editMode && (
              <button id="allocate-role-btn" className="btn btn-secondary flex items-center gap-2" onClick={() => setRoleMode(true)}>
                <Shield size={16} /> Assign Role
              </button>
            )}
            {!editMode && (
              <button id="edit-user-btn" className="btn btn-secondary flex items-center gap-2" onClick={() => setEditMode(true)}>
                <Edit size={16} /> Edit
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {editMode ? (
            <>
              <div className="card-title flex items-center gap-2"><Edit size={18} className="text-primary" /> Edit User</div>
              <form onSubmit={handleSubmit(onUpdate)} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First name</label>
                    <input className="form-input" {...register('first_name', { required:'Required' })} />
                    {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last name</label>
                    <input className="form-input" {...register('last_name', { required:'Required' })} />
                    {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" {...register('email', { required:'Required' })} />
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
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); reset(user) }}>Cancel</button>
                  <button type="submit" className={`btn btn-primary flex items-center gap-2${saving ? ' btn-loading' : ''}`} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="card-title flex items-center gap-2"><UserCircle size={18} className="text-primary" /> User Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
                {[
                  ['Email', user.email],
                  ['Phone', user.phone_number || '—'],
                  ['Gender', user.gender || '—'],
                  ['Marital Status', user.marital_status || '—'],
                  ['Last Login', user.last_login ? new Date(user.last_login).toLocaleString() : '—'],
                  ['Reg Number', user.reg_number],
                  ['Member since', user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'],
                  ['Role', user.role],
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

        {/* Allocate Role Modal */}
        {roleMode && (
          <div className="modal-overlay" onClick={() => setRoleMode(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setRoleMode(false)}><X size={16} /></button>
              <div className="modal-title flex items-center gap-2"><Shield size={20} /> Allocate Role</div>
              <form onSubmit={handleRoleSubmit(onRoleUpdate)}>
                <div className="form-group">
                  <label className="form-label">Select System Role</label>
                  <select className="form-select" {...registerRole('role', { required: 'Role is required' })}>
                    <option value="">select role</option>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="security">Security</option>
                    <option value="cso">CSO</option>
                    <option value="admin">Admin</option>
                  </select>
                  {roleErrors.role && <span className="form-error">{roleErrors.role.message}</span>}
                </div>
                <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setRoleMode(false)}>Cancel</button>
                  <button type="submit" className={`btn btn-primary flex-1 flex items-center justify-center gap-2${roleSaving ? ' btn-loading' : ''}`} disabled={roleSaving}>
                    {roleSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    {roleSaving ? 'Saving...' : 'Confirm Allocation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
