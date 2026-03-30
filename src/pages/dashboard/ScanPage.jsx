import { useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../services/api'
import Layout from '../../components/Layout'
import { Camera, RotateCcw, Scan, ArrowDownToLine, ArrowUpFromLine, ClipboardList, QrCode, Loader2 } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'

export default function ScanPage() {
  const [vehicleId, setVehicleId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [useCamera, setUseCamera] = useState(false)

  const submitScan = async (idToScan) => {
    if (!idToScan) return
    let cleanId = idToScan.trim();

    // If scanned data is a JSON string, try to extract the ID
    if (cleanId.startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanId);
        if (parsed.vehicleId) cleanId = parsed.vehicleId;
      } catch (err) {
        // Keep as is if not valid JSON
      }
    }

    setLoading(true)
    setResult(null)
    try {
      const res = await api.post('/log/scan', { vehicleId: cleanId })
      const log = res.data?.data
      setResult(log)
      toast.success(`Vehicle scanned — Status: ${log?.status}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed'
      toast.error(msg)
    } finally {
      setLoading(false)
      setUseCamera(false)
    }
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!vehicleId.trim()) { toast.warning('Enter a vehicle ID'); return }
    await submitScan(vehicleId.trim())
  }

  const clearScan = () => { setResult(null); setVehicleId('') }

  return (
    <Layout title="Scan Vehicle">
      <div className="animate-slide-up">
        <div className="page-header">
          <h1>Scan Vehicle</h1>
          <p>Scan a vehicle QR code to log entry or exit</p>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'2rem', alignItems:'center', maxWidth:'800px', margin:'0 auto' }}>
          {/* Scanner Input */}
          <div style={{ width:'100%' }}>
            <div className="card" style={{ padding:'1.5rem' }}>
              <div className="scan-zone relative text-center">
                <div className="scan-icon text-primary flex justify-center mb-2"><QrCode size={48} /></div>
                <h3 style={{ marginBottom:'0.25rem', fontSize:'1.25rem' }}>Vehicle Scanner</h3>
                <p style={{ fontSize:'0.81rem', marginBottom:'1.25rem', color:'var(--text-muted)' }}>
                  Scan a QR code or enter manually
                </p>

                {useCamera ? (
                  <div className="mb-4 rounded-xl overflow-hidden border border-border bg-black" style={{ height: 240, position:'relative' }}>
                    <Scanner
                      styles={{ container: { height: '100%' } }}
                      onScan={(detected) => {
                        if (loading) return
                        if (detected && detected[0]) {
                          const id = detected[0].rawValue
                          toast.info(`Scanned ID. Submitting...`)
                          submitScan(id)
                        }
                      }}
                      onError={(error) => console.log('QR Scanner Error', error)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-sm btn-secondary" 
                      onClick={() => setUseCamera(false)}
                      style={{ position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)', zIndex:10 }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary btn-full mb-4 flex items-center justify-center gap-2"
                    style={{ py:'0.6rem' }}
                    onClick={() => setUseCamera(true)}
                  >
                    <Camera size={16} /> Open Scanner
                  </button>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Manual Entry</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <form onSubmit={handleScan} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  <input
                    id="vehicle-id-input"
                    className="form-input text-center"
                    placeholder="Plate Number..."
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    style={{ fontFamily:'monospace', fontSize:'0.81rem' }}
                  />
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    {result && (
                      <button type="button" className="btn btn-secondary flex items-center justify-center gap-2" onClick={clearScan} style={{ flex:1 }}>
                        <RotateCcw size={14} /> New
                      </button>
                    )}
                    <button
                      id="scan-btn"
                      type="submit"
                      className={`btn btn-primary flex items-center justify-center gap-2${loading ? ' btn-loading' : ''}`}
                      disabled={loading}
                      style={{ flex:2 }}
                    >
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Scan size={14} />}
                      {loading ? 'Processing...' : 'Process Scan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div style={{ width:'100%' }}>
            {result ? (
              <div className={`scan-result status-${result.status?.toLowerCase()}`} style={{ padding:'2rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                  <h2 style={{ margin:0, fontSize:'1.5rem' }}>Scan Result</h2>
                  <span className={`badge badge-${result.status?.toLowerCase()}`} style={{ padding:'0.5rem 1rem', fontSize:'1rem' }}>
                    {result.status === 'IN' ? <><ArrowDownToLine size={18}/> ENTRY</> : <><ArrowUpFromLine size={18}/> EXIT</>}
                  </span>
                </div>

                <div style={{ display:'grid', gap:'1.25rem' }}>
                  {[
                    ['Plate Number', result.vehicle?.plate_number || '—'],
                    ['Status', result.status],
                    ['Entry Time', result.entryTime ? new Date(result.entryTime).toLocaleString() : '—'],
                    ['Exit Time', result.exitTime ? new Date(result.exitTime).toLocaleString() : '—'],
                    ['Duration', result.duration != null ? `${result.duration} mins` : '—'],
                    ['Scanned by', result.scannedBy ? result.scannedBy.email || `${result.scannedBy.first_name || ''} ${result.scannedBy.last_name || ''}`.trim() || result.scannedBy : '—'],
                    ['Logged at', result.createdAt ? new Date(result.createdAt).toLocaleString() : '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="log-item">
                      <span className="log-item-label">{label}</span>
                      <span className="log-item-value">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="empty-state text-center py-8">
                  <div className="empty-state-icon flex justify-center mb-4"><ClipboardList size={48} className="text-muted" /></div>
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
