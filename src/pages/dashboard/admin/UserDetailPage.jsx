import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { ArrowLeft, Edit, Save, UserCircle, Loader2, Shield, X, Mail, Phone, Calendar, Hash, Heart, Clock, Car, ChevronLeft, ChevronRight } from 'lucide-react'
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

  const [vPage, setVPage] = useState(1)
  const [vPageSize, setVPageSize] = useState(5)

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

  const { data: vehicleData, isLoading: vLoading } = useQuery({
    queryKey: ['user_vehicles', id, vPage, vPageSize],
    queryFn: () => api.get(`/vehicle?page=${vPage}&pageSize=${vPageSize}&owner=${id}`).then(r => r.data?.data),
    enabled: !!id
  })

  const vehicles = vehicleData?.vehicles || []
  const vTotal = vehicleData?.total || 0

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
      <div className="inline-loader" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
    </Layout>
  )

  if (!user) return (
    <Layout title="User Detail">
      <div className="alert alert-error">User not found.</div>
    </Layout>
  )

  return (
    <Layout title="User Detail">
      <div className="animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginBottom:'1rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="page-header">
          <h1 style={{ fontWeight: 800 }}><UserCircle className="inline-block mr-2" /> {user.first_name} {user.last_name}</h1>
          <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>REG NO: <span style={{ textTransform: 'uppercase' }}>{user.reg_number}</span> · <span className={`badge badge-${user.role}`}>{user.role}</span></p>
        </div>

        <div className="grid-2">
          {/* Left Column — Account Info */}
          <div className="card" style={{ height:'fit-content' }}>
            <div className="card-title flex items-center gap-2 mb-4"><UserCircle size={20} className="text-primary" /> Account Information</div>
            <div className="profile-details">
              <div className="detail-item">
                <Mail size={18} />
                <div className="flex-1">
                  <div className="detail-label">Email Address</div>
                  <div className="detail-value">{user.email}</div>
                </div>
              </div>
              <div className="detail-item">
                <Phone size={18} />
                <div className="flex-1">
                  <div className="detail-label">Phone Number</div>
                  <div className="detail-value">{user.phone_number || '—'}</div>
                </div>
              </div>
              <div className="detail-item">
                <UserCircle size={18} />
                <div className="flex-1">
                  <div className="detail-label">Gender</div>
                  <div className="detail-value capitalize">{user.gender || '—'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Heart size={18} />
                <div className="flex-1">
                  <div className="detail-label">Marital Status</div>
                  <div className="detail-value capitalize">{user.marital_status || '—'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Hash size={18} />
                <div className="flex-1">
                  <div className="detail-label">Registration Number</div>
                  <div className="detail-value uppercase">{user.reg_number || '—'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Shield size={18} />
                <div className="flex-1">
                  <div className="detail-label">System Role</div>
                  <div className="detail-value"><span className={`badge badge-${user.role}`}>{user.role}</span></div>
                </div>
              </div>
              <div className="detail-item">
                <Clock size={18} />
                <div className="flex-1">
                  <div className="detail-label">Last Login</div>
                  <div className="detail-value">{user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</div>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={18} />
                <div className="flex-1">
                  <div className="detail-label">Member Since</div>
                  <div className="detail-value">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {currentUser?.role === 'admin' && (
              <div className="profile-actions">
                {currentUser?._id !== user._id && (
                  <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => setRoleMode(true)}>
                    <Shield size={16} /> Assign Role
                  </button>
                )}
                <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => setEditMode(true)}>
                  <Edit size={16} /> Edit User
                </button>
              </div>
            )}
          </div>

          {/* Right Column — Vehicles */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 1.75rem 1rem' }}>
              <div className="card-title flex items-center gap-2" style={{ margin:0 }}>
                <Car size={20} className="text-primary" /> Vehicles ({vTotal})
              </div>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.5rem', fontSize: '0.8rem' }} 
                value={vPageSize} 
                onChange={(e) => { setVPageSize(Number(e.target.value)); setVPage(1); }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
              </select>
            </div>

            {vLoading ? (
              <div className="inline-loader" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>
            ) : vehicles.length > 0 ? (
              <>
                <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
                  <table className="table-compact">
                    <thead>
                      <tr>
                        <th>Plate Number</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v) => (
                        <tr key={v._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/dashboard/vehicles/${v._id}`)}>
                          <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{v.plate_number}</td>
                          <td className="capitalize">{v.vehicle_type || '—'}</td>
                          <td>
                            <span className={`badge ${v.isBlacklisted ? 'badge-blacklisted' : 'badge-active'}`}>
                              {v.isBlacklisted ? 'Blacklisted' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {vTotal > 0 && (
                  <div className="pagination" style={{ padding:'0.75rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                    <button className="pagination-btn" disabled={vPage === 1} onClick={() => setVPage(p => p-1)}><ChevronLeft size={16} /></button>
                    <span className="text-sm font-medium">Page {vPage} of {Math.ceil(vTotal / vPageSize)}</span>
                    <button className="pagination-btn" disabled={vehicles.length < vPageSize || vPage * vPageSize >= vTotal} onClick={() => setVPage(p => p+1)}><ChevronRight size={16} /></button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state text-center py-8">
                <div className="empty-state-icon flex justify-center mb-4"><Car size={48} className="text-muted" /></div>
                <h3>No vehicles</h3>
                <p>This user has no registered vehicles.</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit User Modal */}
        {editMode && (
          <div className="modal-overlay" onClick={() => { setEditMode(false); reset(user) }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => { setEditMode(false); reset(user) }}><X size={16} /></button>
              <div className="modal-title flex items-center gap-2"><Edit size={20} /> Edit User</div>
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
                      <option value="">select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marital status</label>
                    <select className="form-select" {...register('marital_status')}>
                      <option value="">select marital status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="complicated">Complicated</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => { setEditMode(false); reset(user) }}>Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2" disabled={roleSaving}>
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
