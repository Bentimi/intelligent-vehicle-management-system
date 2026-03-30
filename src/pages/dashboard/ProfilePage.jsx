import { useForm } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { User as UserIcon, Mail, Phone, Shield, Calendar, LogOut, Car, Settings, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { useNavigate } from 'react-router'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [vPage, setVPage] = useState(1)
  const [vPageSize, setVPageSize] = useState(10)

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

  const { data: myVehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['my_vehicles', user?._id, vPage, vPageSize],
    queryFn: () => api.get(`/vehicle?page=${vPage}&pageSize=${vPageSize}&owner=${user?._id}`).then(r => r.data?.data),
    enabled: !!user?._id
  })

  const vehicles = myVehiclesData?.vehicles || []
  const vTotal = myVehiclesData?.total || 0

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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout title="My Profile">
      {loading ? (
        <div className="inline-loader"><div className="spinner" /></div>
      ) : (
        <div className="animate-slide-up">
          <div className="page-header">
            <h1><UserIcon className="inline-block mr-2" /> My Profile</h1>
            <p>View and manage your personal information</p>
          </div>

          <div className="grid-2">
            <div className="card" style={{ height:'fit-content' }}>
              <div className="card-title flex items-center gap-2 mb-4"><UserIcon size={20} className="text-primary" /> Account Information</div>
              <div className="profile-details">
                <div className="detail-item">
                  <UserIcon size={18} />
                  <div className="flex-1">
                    <div className="detail-label">Full Name</div>
                    <div className="detail-value">{profile?.first_name} {profile?.last_name}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Mail size={18} />
                  <div className="flex-1">
                    <div className="detail-label">Email Address</div>
                    <div className="detail-value">{profile?.email}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Phone size={18} />
                  <div className="flex-1">
                    <div className="detail-label">Phone Number</div>
                    <div className="detail-value">{profile?.phone_number || '—'}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Shield size={18} />
                  <div className="flex-1">
                    <div className="detail-label">System Role</div>
                    <div className="detail-value capitalize">{profile?.role}</div>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar size={18} />
                  <div className="flex-1">
                    <div className="detail-label">Joined On</div>
                    <div className="detail-value">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop:'2rem', borderTop:'1px solid var(--border)', paddingTop:'1.5rem', display:'flex', gap:'1rem' }}>
                <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2" onClick={() => setEditMode(true)}>
                  <Settings size={16} /> Edit Profile
                </button>
                <button className="btn btn-danger flex-1 flex items-center justify-center gap-2" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.5rem 1.75rem 1rem' }}>
                <div className="card-title flex items-center gap-2" style={{ margin:0 }}>
                  <Car size={20} className="text-primary" /> My Vehicles
                </div>
                <select 
                  className="form-select" 
                  style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.5rem', fontSize: '0.8rem' }} 
                  value={vPageSize} 
                  onChange={(e) => { setVPageSize(Number(e.target.value)); setVPage(1); }}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>
              
              {vehiclesLoading ? (
                <div className="inline-loader py-4"><div className="spinner" /></div>
              ) : vehicles && vehicles.length > 0 ? (
                <>
                  <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
                    <table>
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
                            <td style={{ textTransform: 'capitalize' }}>{v.vehicle_type || '—'}</td>
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
                    <div className="pagination" style={{ padding:'1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
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
                  <p>You haven't registered any vehicles yet.</p>
                </div>
              )}
            </div>
          </div>
          {/* Edit Profile Modal */}
          {editMode && (
            <div className="modal-overlay" onClick={() => setEditMode(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setEditMode(false)}><X size={16} /></button>
                <div className="modal-title flex items-center gap-2"><Settings size={20} /> Edit Profile</div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" {...register('first_name', { required: 'Required' })} />
                      {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" {...register('last_name', { required: 'Required' })} />
                      {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input className="form-input" type="email" {...register('email', { required: 'Required' })} />
                    {errors.email && <span className="form-error">{errors.email.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" {...register('phone_number')} />
                  </div>
                  <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                    <button type="button" className="btn btn-secondary flex-1" onClick={() => setEditMode(false)}>Cancel</button>
                    <button type="submit" className={`btn btn-primary flex-1 flex items-center justify-center gap-2${saving ? ' btn-loading' : ''}`} disabled={saving}>
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <UserIcon size={16} />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
