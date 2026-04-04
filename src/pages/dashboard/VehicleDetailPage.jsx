import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Camera, RefreshCw, Save, Edit, Ban, CheckCircle2, ClipboardList, QrCode, Car, Image as ImageIcon, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Layout from '../../components/Layout'
import useDebounce from '../../hooks/useDebounce'

function LogTable({ logs, userRole }) {
  if (!logs?.length) return (
    <div className="empty-state">
      <div className="empty-state-icon flex justify-center mb-4"><ClipboardList size={48} className="text-muted" /></div>
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
                {log.scannedBy ? (
                  userRole === 'admin' ? (
                    <Link to={`/dashboard/admin/users/${log.scannedBy._id}`} className="text-primary hover:underline font-medium">
                      {log.scannedBy.email || `${log.scannedBy.first_name || ''} ${log.scannedBy.last_name || ''}`.trim()}
                    </Link>
                  ) : (
                    log.scannedBy.email || `${log.scannedBy.first_name || ''} ${log.scannedBy.last_name || ''}`.trim()
                  )
                ) : '—'}
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

  const { user }   = useAuth()
  const [editMode, setEditMode]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [blisting, setBlisting]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logPage, setLogPage]     = useState(1)
  const [logPageSize, setLogPageSize] = useState(10)
  const [searchLogInput, setSearchLogInput] = useState('')
  const debouncedLogSearch = useDebounce(searchLogInput, 400)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const { data: vehicle, isLoading: vLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => api.get(`/vehicle/${id}`).then((r) => r.data?.data),
  })

  // Sync form with vehicle data as soon as it loads
  useEffect(() => {
    if (vehicle) reset(vehicle)
  }, [vehicle, reset])

  // Reset to page 1 when search changes
  useEffect(() => { setLogPage(1) }, [debouncedLogSearch])

  const { data: logQueryResult, isLoading: lLoading } = useQuery({
    queryKey: ['logs', id, logPage, logPageSize, debouncedLogSearch],
    queryFn: () => api.get(`/log/${id}?page=${logPage}&pageSize=${logPageSize}&search=${debouncedLogSearch}`).then((r) => r.data?.data),
  })
  const logData = logQueryResult?.log || []
  const logTotal = logQueryResult?.total || 0

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
        <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginBottom:'1rem' }} onClick={() => navigate('/dashboard/vehicles')}>
          <ArrowLeft size={16} /> Back to vehicles
        </button>

        <div className="page-header">
          <h1 style={{ fontWeight: 800 }}>{vehicle.plate_number}</h1>
          <p style={{ fontWeight: 600 }}>{vehicle.model} · {vehicle.color} · {vehicle.vehicle_type}</p>
        </div>

        <div className="grid-2" style={{ gap:'1.5rem', marginBottom:'1.5rem' }}>
          {/* Info card */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <div className="card-title flex items-center gap-2" style={{ margin:0, fontWeight: 'bold' }}>
                <Car size={18} className="text-primary" /> Vehicle Info
              </div>
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <span className={`badge flex items-center gap-1 ${vehicle.isBlacklisted ? 'badge-blacklisted' : 'badge-active'}`}>
                  {vehicle.isBlacklisted ? <><Ban size={14} /> Blacklisted</> : <><CheckCircle2 size={14} /> Active</>}
                </span>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleSubmit(onUpdate)} noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Plate number</label>
                    <input className="form-input" {...register('plate_number', { required:'plate number is required' })} />
                    {errors.plate_number && <span className="form-error">{errors.plate_number.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" {...register('vehicle_type', { required: 'Type is required' })}>
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
                    <input className="form-input" {...register('model', { required: 'Model is required' })} />
                    {errors.model && <span className="form-error">{errors.model.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color</label>
                    <input className="form-input" {...register('color', { required: 'Color is required' })} />
                    {errors.color && <span className="form-error">{errors.color.message}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" {...register('vehicle_description', { required: 'Description is required' })} />
                  {errors.vehicle_description && <span className="form-error">{errors.vehicle_description.message}</span>}
                </div>
                <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditMode(false); reset(vehicle) }}>Cancel</button>
                  <button type="submit" className={`btn btn-primary flex items-center gap-2${saving?' btn-loading':''}`} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Changes'}
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
                  {(user?.role === 'admin' || user?.role === 'cso') && (
                    <>
                      <button className="btn btn-secondary btn-sm flex items-center gap-2" onClick={() => { reset(vehicle); setEditMode(true); }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        id="blacklist-btn"
                        className={`btn btn-sm flex items-center gap-2 ${vehicle.isBlacklisted ? 'btn-success' : 'btn-danger'}`}
                        onClick={handleBlacklist}
                        disabled={blisting}
                      >
                        {blisting ? <Loader2 size={14} className="animate-spin" /> : (vehicle.isBlacklisted ? <CheckCircle2 size={14} /> : <Ban size={14} />)}
                        {blisting ? 'Processing...' : (vehicle.isBlacklisted ? 'Unblacklist' : 'Blacklist')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Image & QR */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Vehicle image */}
            <div className="card" style={{ flex:1 }}>
              <div className="card-title flex items-center gap-2"><ImageIcon size={18} className="text-primary" /> Vehicle Image</div>
              {vehicle.image ? (
                <img src={vehicle.image} alt="vehicle" style={{ width:'100%', borderRadius:'var(--radius-md)', objectFit:'cover', maxHeight:160 }} />
              ) : (
                <div className="upload-area" onClick={() => fileRef.current?.click()}>
                  <div className="mb-2 text-muted"><Camera size={32} /></div>
                  <p style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Click to upload vehicle image</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
              {vehicle.image && (
                <button
                  className={`btn btn-secondary btn-sm flex items-center gap-2${uploading?' btn-loading':''}`}
                  style={{ marginTop:'0.75rem' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {uploading ? 'Uploading...' : 'Change Image'}
                </button>
              )}
            </div>

            {/* QR Code */}
            {vehicle.qrCode && (vehicle.user?._id === user?._id || vehicle.user === user?._id || user?.role === 'admin' || user?.role === 'cso') && (
              <div className="card">
                <div className="card-title flex items-center gap-2"><QrCode size={18} className="text-primary" /> QR Code</div>
                <img src={vehicle.qrCode} alt="QR" style={{ width:'100%', maxWidth:250, display:'block', margin:'0 auto', borderRadius:'var(--radius-md)' }} />
              </div>
            )}
          </div>
        </div>

        {/* Log History */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
            <div className="card-title flex items-center gap-2" style={{ margin:0 }}>
              <ClipboardList size={18} className="text-primary" /> Entry / Exit Log History
            </div>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              <input
                className="form-input"
                style={{ padding:'0.4rem 0.75rem', fontSize:'0.82rem', width:'200px' }}
                placeholder="Search status or user..."
                value={searchLogInput}
                onChange={(e) => setSearchLogInput(e.target.value)}
              />
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '0.2rem 1.75rem 0.2rem 0.5rem', fontSize: '0.8rem' }} 
                value={logPageSize} 
                onChange={(e) => { setLogPageSize(Number(e.target.value)); setLogPage(1); }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
          
          {lLoading ? (
            <div className="inline-loader"><div className="spinner" /></div>
          ) : (
            <LogTable logs={logData} userRole={user?.role} />
          )}
          {logData && logTotal > 0 && (
            <div className="pagination" style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button className="pagination-btn" disabled={logPage === 1} onClick={() => setLogPage((p) => p - 1)}>‹</button>
              <span className="text-sm font-medium">Page {logPage} of {Math.ceil(logTotal / logPageSize)}</span>
              <button 
                className="pagination-btn" 
                disabled={logData.length < logPageSize || logPage * logPageSize >= logTotal}
                onClick={() => setLogPage((p) => p + 1)}
              >›</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
