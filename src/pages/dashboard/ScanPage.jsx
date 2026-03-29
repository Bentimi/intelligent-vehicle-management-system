import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import Layout from '../../components/Layout'

export default function ScanPage() {
  const [vehicleId, setVehicleId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!vehicleId.trim()) { toast.warning('Enter a vehicle ID'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/log/scan', { vehicleId: vehicleId.trim() })
      const log = res.data?.data
      setResult(log)
      toast.success(`Vehicle scanned — Status: ${log?.status}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const clearScan = () => { setResult(null); setVehicleId('') }

  return (
    <Layout title="Scan Vehicle">
      <div className="animate-slide-up">
        <div className="page-header">
          <h1>Scan Vehicle</h1>
          <p>Scan a vehicle QR code to log entry or exit</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start' }}>
          {/* Scanner Input */}
          <div>
            <div className="card">
              <div className="scan-zone">
                <div className="scan-icon">📷</div>
                <h3 style={{ marginBottom:'0.5rem' }}>Vehicle Scanner</h3>
                <p style={{ fontSize:'0.875rem', marginBottom:'1.5rem', color:'var(--text-muted)' }}>
                  Enter the vehicle ID from the QR code
                </p>
                <form onSubmit={handleScan} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  <input
                    id="vehicle-id-input"
                    className="form-input"
                    placeholder="Paste vehicle ID here..."
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    style={{ textAlign:'center', fontFamily:'monospace', fontSize:'0.875rem' }}
                  />
                  <div style={{ display:'flex', gap:'0.75rem' }}>
                    {result && (
                      <button type="button" className="btn btn-secondary" onClick={clearScan} style={{ flex:1 }}>
                        🔄 New Scan
                      </button>
                    )}
                    <button
                      id="scan-btn"
                      type="submit"
                      className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
                      disabled={loading}
                      style={{ flex:1 }}
                    >
                      {loading ? '' : '🔍 Scan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div>
            {result ? (
              <div className={`scan-result status-${result.status?.toLowerCase()}`}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <h3 style={{ margin:0 }}>Scan Result</h3>
                  <span className={`badge badge-${result.status?.toLowerCase()}`}>
                    {result.status === 'IN' ? '🟢 ENTRY' : '🔴 EXIT'}
                  </span>
                </div>

                <div style={{ display:'grid', gap:'0.85rem' }}>
                  {[
                    ['Status', result.status],
                    ['Entry Time', result.entryTime ? new Date(result.entryTime).toLocaleString() : '—'],
                    ['Exit Time', result.exitTime ? new Date(result.exitTime).toLocaleString() : '—'],
                    ['Duration', result.duration != null ? `${result.duration} mins` : '—'],
                    ['Scanned by', result.scannedBy ? `${result.scannedBy.first_name || ''} ${result.scannedBy.last_name || ''}`.trim() || result.scannedBy : '—'],
                    ['Logged at', result.createdAt ? new Date(result.createdAt).toLocaleString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', borderBottom:'1px solid var(--border)', paddingBottom:'0.65rem' }}>
                      <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
                      <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <h3>No scan yet</h3>
                  <p>Scan a vehicle to see its entry/exit result here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
