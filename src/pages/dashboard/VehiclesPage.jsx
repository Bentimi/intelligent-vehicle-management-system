import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { CarFront, Save, Search, Plus, AlertTriangle, Ban, CheckCircle2, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import useDebounce from '../../hooks/useDebounce'

function RegisterVehicleModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  if (!open) return null

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await api.post('/vehicle/register', data)
      toast.success('Vehicle registered!')
      reset()
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => { reset(); onClose(); }}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => { reset(); onClose(); }}><X size={20} /></button>
        <div className="modal-title flex items-center gap-2"><CarFront size={20} className="text-primary" /> Register New Vehicle</div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">Vehicle owner (email or phone)</label>
            <input className="form-input" placeholder="owner@email.com or +234..." {...register('user', { required: 'Field is required' })} />
            {errors.user && <span className="form-error">{errors.user.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Plate number</label>
              <input className="form-input" placeholder="ABC-123-XY" {...register('plate_number', { required: 'Plate number is required' })} />
              {errors.plate_number && <span className="form-error">{errors.plate_number.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle type</label>
              <select className="form-select" {...register('vehicle_type', { required: 'Vehicle type is required' })}>
                <option value="">— select —</option>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="bus">Bus</option>
                <option value="truck">Truck</option>
              </select>
              {errors.vehicle_type && <span className="form-error">{errors.vehicle_type.message}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-input" placeholder="Toyota Corolla" {...register('model', { required: 'Model is required' })} />
              {errors.model && <span className="form-error">{errors.model.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" placeholder="Silver" {...register('color', { required: 'Color is required' })} />
              {errors.color && <span className="form-error">{errors.color.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="e.g. 2018 Toyota Corolla, silver..." {...register('vehicle_description', { required: 'Description is required' })} />
            {errors.vehicle_description && <span className="form-error">{errors.vehicle_description.message}</span>}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => { reset(); onClose(); }}>Cancel</button>
            <button type="submit" className={`btn btn-primary flex items-center gap-2${loading ? ' btn-loading' : ''}`} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vehicleInput, setVehicleInput] = useState('')
  const debouncedSearch = useDebounce(vehicleInput, 400)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data: vehicleData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vehicles', page, pageSize, debouncedSearch],
    queryFn: () => api.get(`/vehicle?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`).then((r) => r.data?.data),
    keepPreviousData: true,
  })

  const [showModal, setShowModal] = useState(false)

  const handleBlacklistToggle = async (e, id) => {
    e.stopPropagation()
    try {
      await api.put(`/vehicle/status/${id}`)
      toast.success('Vehicle status updated!')
      refetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  const filteredVehicles = vehicleData?.vehicles || []
  const total = vehicleData?.total || 0

  return (
    <Layout title="Vehicles">
      <RegisterVehicleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => refetch()}
      />

      <div className="animate-slide-up">
        <div className="page-header">
          <h1>Vehicle Management</h1>
          <p>Register, update, and manage campus vehicles</p>
        </div>

        <div style={{ display:'flex', gap:'1rem', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'0.75rem', flex:1, minWidth:260 }}>
            <input
              id="vehicle-search-input"
              className="form-input"
              placeholder="Search by plate or email..."
              value={vehicleInput}
              onChange={(e) => setVehicleInput(e.target.value)}
            />
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.75rem' }} 
              value={pageSize} 
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
          {user?.role === 'admin' || user?.role === 'cso' ? (
            <button id="register-vehicle-btn" className="btn btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Register Vehicle
            </button>
          ) : null}
        </div>

        <div className="card" style={{ padding: 0 }}>
          {isLoading && <div className="inline-loader py-8"><div className="spinner" /></div>}

          {isError && (
            <div className="alert alert-error flex items-center gap-2 m-6">
              <AlertTriangle size={16} /> {error?.response?.data?.message || 'Failed to load vehicles'}
            </div>
          )}

          {!isLoading && !isError && vehicleData && (
            <>
              {filteredVehicles.length > 0 ? (
                <div className="table-wrapper" style={{ borderRadius: 'var(--radius-lg)', border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Plate Number</th>
                        <th>Owner</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Registered</th>
                        {(user?.role === 'admin' || user?.role === 'cso') && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((v) => (
                        <tr key={v._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/dashboard/vehicles/${v._id}`)}>
                          <td className="font-medium text-primary">{v.plate_number}</td>
                          <td>{v.user?.email || '—'}</td>
                          <td className="capitalize">{v.vehicle_type || '—'}</td>
                          <td>
                            <span className={`badge flex w-max items-center gap-1 ${v.isBlacklisted ? 'badge-blacklisted' : 'badge-active'}`}>
                              {v.isBlacklisted ? <><Ban size={14} /> Blacklisted</> : <><CheckCircle2 size={14} /> Active</>}
                            </span>
                          </td>
                          <td className="text-sm">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</td>
                          {(user?.role === 'admin' || user?.role === 'cso') && (
                            <td>
                              <button 
                                className={`btn btn-sm ${v.isBlacklisted ? 'btn-success' : 'btn-danger'}`}
                                onClick={(e) => handleBlacklistToggle(e, v._id)}
                              >
                                {v.isBlacklisted ? 'Unblacklist' : 'Blacklist'}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state text-center py-12">
                  <div className="empty-state-icon flex justify-center mb-4"><CarFront size={48} className="text-muted" /></div>
                  <h3>No vehicles found</h3>
                  <p>Register a new vehicle or adjust your search.</p>
                </div>
              )}

              {/* Pagination */}
              {total > 0 && (
                <div className="pagination" style={{ padding:'1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                  <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium">Page {page} of {Math.ceil(total / pageSize)}</span>
                  <button className="pagination-btn" disabled={filteredVehicles.length < pageSize || page * pageSize >= total} onClick={() => setPage(p => p+1)}><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
