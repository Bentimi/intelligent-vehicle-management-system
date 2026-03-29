import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import api from '../../services/api'
import Layout from '../../components/Layout'

function LogTable({ logs }) {
  if (!logs?.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <h3>No logs yet</h3>
      <p>This vehicle has no entry/exit records</p>
    </div>
  )
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Duration</th>
            <th>Scanned By</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id}>
              <td><span className={`badge badge-${log.status?.toLowerCase()}`}>{log.status}</span></td>
              <td>{log.entryTime ? new Date(log.entryTime).toLocaleString() : '—'}</td>
              <td>{log.exitTime  ? new Date(log.exitTime).toLocaleString()  : '—'}</td>
              <td>{log.duration != null ? `${log.duration} mins` : '—'}</td>
              <td style={{ fontSize:'0.82rem' }}>
                {log.scannedBy ? `${log.scannedBy.first_name || ''} ${log.scannedBy.last_name || ''}`.trim() || '—' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const fileRef = useRef()

  const [editMode, setEditMode]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [blisting, setBlisting]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logPage, setLogPage]     = useState(1)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: vehicle, isLoading: vLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.get(`/vehicle/${id}`).then((r) => r.data?.data),
    onSuccess: (v) => reset(v),
  })

  const { data: logData, isLoading: lLoading } = useQuery({
    queryKey: ['logs', id, logPage],
    queryFn: () => api.get(`/log/${id}?page=${logPage}&pageSize=8`).then((r) => r.data?.data?.log),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['vehicle', id] })

  const onUpdate = async (data) => {
    setSaving(true)
    try {
      await api.put(`/vehicle/${id}`, data)
      toast.success('Vehicle updated!')
      setEditMode(false)
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleBlacklist = async () => {
    setBlisting(true)
    try {
      await api.put(`/vehicle/status/${id}`)
      toast.success('Blacklist status toggled!')
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBlisting(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.patch(`/vehicle/${id}`, fd, { headers:{ 'Content-Type': 'multipart/form-data' } })
      toast.success('Image uploaded!')
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (vLoading) return (
    <Layout title="Vehicle Detail">
      <div className="inline-loader"><div className="spinner" /></div>
    </Layout>
  )

  if (!vehicle) return (
    <Layout title="Vehicle Detail">
      <div className="alert alert-error">Vehicle not found.</div>
    </Layout>
  )

  return (
    <Layout title="Vehicle Detail">
      <div className="animate-slide-up">
        {/* Back */}
        <button className="btn btn-ghost btn-sm" style={{ marginBottom:'1rem' }} onClick={() => navigate('/dashboard/vehicles')}>
          ← Back to vehicles
        </button>

        <div className="page-header">
          <h1>{vehicle.plate_number}</h1>
          <p>{vehicle.model} · {vehicle.color} · {vehicle.vehicle_type}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
          {/* Info card */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <div className="card-title" style={{ margin:0 }}>🚗 Vehicle Info</div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <span className={`badge ${vehicle.isBlacklisted ? 'badge-blacklisted' : 'badge-active'}`}>
                  {vehicle.isBlacklisted ? '🚫 Blacklisted' : '✅ Active'}
                </span>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmit(onUpdate)} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Plate number</label>
                    <input className="form-input" {...register('plate_number', { required:'Required' })} />
                    {errors.plate_number && <span className="form-error">{errors.plate_number.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" {...register('vehicle_type')}>
                      <option value="car">Car</option>
                      <option value="bike">Bike</option>
                      <option value="bus">Bus</option>
                      <option value="truck">Truck</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input className="form-input" {...register('model')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input className="form-input" {...register('color')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" {...register('vehicle_description')} />
                </div>
                <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); reset(vehicle) }}>Cancel</button>
                  <button type="submit" className={`btn btn-primary${saving?'btn-loading':''}`} disabled={saving}>
                    {saving ? '' : '💾 Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ display:'grid', gap:'0.85rem', marginBottom:'1.25rem' }}>
                  {[
                    ['Model', vehicle.model],
                    ['Color', vehicle.color],
                    ['Type', vehicle.vehicle_type],
                    ['Description', vehicle.vehicle_description || '—'],
                    ['Owner', vehicle.user?.email || '—'],
                    ['Registered', vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', paddingBottom:'0.6rem' }}>
                      <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                      <span style={{ fontSize:'0.875rem', color:'var(--text-primary)', fontWeight:500 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>✏️ Edit</button>
                  <button
                    id="blacklist-btn"
                    className={`btn btn-sm ${vehicle.isBlacklisted ? 'btn-success' : 'btn-danger'}`}
                    onClick={handleBlacklist}
                    disabled={blisting}
                  >
                    {vehicle.isBlacklisted ? '✅ Unblacklist' : '🚫 Blacklist'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Image & QR */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Vehicle image */}
            <div className="card" style={{ flex:1 }}>
              <div className="card-title">📸 Vehicle Image</div>
              {vehicle.image ? (
                <img src={vehicle.image} alt="vehicle" style={{ width:'100%', borderRadius:'var(--radius-md)', objectFit:'cover', maxHeight:160 }} />
              ) : (
                <div className="upload-area" onClick={() => fileRef.current?.click()}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📷</div>
                  <p style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Click to upload vehicle image</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
              {vehicle.image && (
                <button
                  className={`btn btn-secondary btn-sm${uploading?' btn-loading':''}`}
                  style={{ marginTop:'0.75rem' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '' : '🔄 Change Image'}
                </button>
              )}
            </div>

            {/* QR Code */}
            {vehicle.qrCode && (
              <div className="card">
                <div className="card-title">📱 QR Code</div>
                <img src={vehicle.qrCode} alt="QR" style={{ width:'100%', maxWidth:150, display:'block', margin:'0 auto', borderRadius:'var(--radius-md)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Log History */}
        <div className="card">
          <div className="card-title">📋 Entry / Exit Log History</div>
          {lLoading ? (
            <div className="inline-loader"><div className="spinner" /></div>
          ) : (
            <LogTable logs={logData} />
          )}
          {logData?.length >= 8 && (
            <div className="pagination">
              <button className="pagination-btn" disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>‹</button>
              <span className="pagination-btn active">{logPage}</span>
              <button className="pagination-btn" onClick={() => setLogPage((p) => p + 1)}>›</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
