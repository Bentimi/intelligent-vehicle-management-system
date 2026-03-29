import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import Layout from '../../components/Layout'

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">🚗 Register New Vehicle</div>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">Vehicle owner (email or phone)</label>
            <input className="form-input" placeholder="owner@email.com or +234..." {...register('user', { required: 'Required' })} />
            {errors.user && <span className="form-error">{errors.user.message}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Plate number</label>
              <input className="form-input" placeholder="ABC-123-XY" {...register('plate_number', { required: 'Required' })} />
              {errors.plate_number && <span className="form-error">{errors.plate_number.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle type</label>
              <select className="form-select" {...register('vehicle_type', { required: 'Required' })}>
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
              <input className="form-input" placeholder="Toyota Corolla" {...register('model', { required: 'Required' })} />
              {errors.model && <span className="form-error">{errors.model.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" placeholder="Silver" {...register('color', { required: 'Required' })} />
              {errors.color && <span className="form-error">{errors.color.message}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="e.g. 2018 Toyota Corolla, silver..." {...register('vehicle_description', { required: 'Required' })} />
            {errors.vehicle_description && <span className="form-error">{errors.vehicle_description.message}</span>}
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn btn-primary${loading ? ' btn-loading' : ''}`} disabled={loading}>
              {loading ? '' : '→ Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// We don't have a "list all vehicles" endpoint, so we show vehicles via a search by plate/user
// For now, display a useful placeholder table with the ability to navigate to a vehicle by ID
export default function VehiclesPage() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [vehicleInput, setVehicleInput] = useState('')
  const [searchId, setSearchId] = useState('')
  const [refetchKey, setRefetchKey] = useState(0)

  const { data: vehicleData, isLoading, isError, error } = useQuery({
    queryKey: ['vehicle', searchId, refetchKey],
    queryFn: () => {
      if (!searchId) return null
      return api.get(`/vehicle/${searchId}`).then((r) => r.data?.data)
    },
    enabled: !!searchId,
    retry: false,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (!vehicleInput.trim()) { toast.warning('Enter a vehicle ID'); return }
    setSearchId(vehicleInput.trim())
  }

  return (
    <Layout title="Vehicles">
      <RegisterVehicleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setRefetchKey((k) => k + 1)}
      />

      <div className="animate-slide-up">
        <div className="page-header">
          <h1>Vehicle Management</h1>
          <p>Register, search, update, and manage campus vehicles</p>
        </div>

        <div style={{ display:'flex', gap:'1rem', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:'0.75rem', flex:1, minWidth:260 }}>
            <input
              id="vehicle-search-input"
              className="form-input"
              placeholder="Enter vehicle ID to look up..."
              value={vehicleInput}
              onChange={(e) => setVehicleInput(e.target.value)}
            />
            <button id="vehicle-search-btn" type="submit" className="btn btn-secondary">🔍 Search</button>
          </form>
          <button id="register-vehicle-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Register Vehicle
          </button>
        </div>

        {!searchId && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🚗</div>
              <h3>Search for a vehicle</h3>
              <p>Enter a vehicle ID above to look up its profile, or register a new vehicle.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="inline-loader"><div className="spinner" /></div>
        )}

        {isError && (
          <div className="alert alert-error">
            ⚠️ {error?.response?.data?.message || 'Vehicle not found'}
          </div>
        )}

        {vehicleData && !isLoading && (
          <div className="card animate-slide-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
              <div>
                <h2 style={{ margin:0 }}>{vehicleData.plate_number}</h2>
                <p style={{ margin:'0.25rem 0 0', fontSize:'0.875rem' }}>
                  {vehicleData.model} · {vehicleData.color} · {vehicleData.vehicle_type}
                </p>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                <span className={`badge ${vehicleData.isBlacklisted ? 'badge-blacklisted' : 'badge-active'}`}>
                  {vehicleData.isBlacklisted ? '🚫 Blacklisted' : '✅ Active'}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/dashboard/vehicles/${vehicleData._id}`)}
                >
                  View Details →
                </button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.85rem' }}>
              {[
                ['Owner', vehicleData.user?.email || vehicleData.user],
                ['Description', vehicleData.vehicle_description || '—'],
                ['Registered', vehicleData.createdAt ? new Date(vehicleData.createdAt).toLocaleDateString() : '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                  <div style={{ fontSize:'0.875rem', color:'var(--text-primary)', fontWeight:500 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
