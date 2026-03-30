import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, AlertTriangle, ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import api from '../../services/api'
import Layout from '../../components/Layout'
import useDebounce from '../../hooks/useDebounce'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router'

export default function LogsPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const [pageSize, setPageSize] = useState(10)

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['logs', page, debouncedSearch, pageSize],
    queryFn: () => api.get(`/log?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`).then((r) => r.data?.data),
    keepPreviousData: true,
  })

  return (
    <Layout title="System Logs">
      <div className="animate-slide-up">
        <div className="page-header">
          <h1>Scan Logs</h1>
          <p>View all vehicle entry and exit history across campus</p>
        </div>

        <div style={{ display:'flex', gap:'1rem', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'0.75rem', flex:1, minWidth:260 }}>
            <input
              className="form-input"
              placeholder="Search by user or plate..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
        </div>

        <div className="card" style={{ padding: 0 }}>
          {isLoading && <div className="inline-loader py-8"><div className="spinner" /></div>}

          {isError && (
            <div className="alert alert-error flex items-center gap-2 m-6">
              <AlertTriangle size={16} /> {error?.response?.data?.message || 'Failed to load logs'}
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              {data.logs && data.logs.length > 0 ? (
                <div className="table-wrapper" style={{ borderRadius: 'var(--radius-lg)', border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Vehicle</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Duration</th>
                        <th>Scanned By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            <div className="font-medium">{log.vehicle?.plate_number || 'Unknown'}</div>
                          </td>
                          <td className="capitalize">{log.vehicle?.vehicle_type || '—'}</td>
                           <td>
                            <span className={`badge flex items-center gap-1 badge-${log.status?.toLowerCase()}`}>
                              {log.status === 'IN' ? <><ArrowDownToLine size={14} /> IN</> : <><ArrowUpFromLine size={14} /> OUT</>}
                            </span>
                          </td>
                          <td className="text-sm">{log.entryTime ? new Date(log.entryTime).toLocaleString() : '—'}</td>
                          <td className="text-sm">{log.exitTime ? new Date(log.exitTime).toLocaleString() : '—'}</td>
                          <td className="text-sm">{log.duration != null ? `${log.duration} mins` : '—'}</td>
                          <td className="text-sm">
                            {log.scannedBy ? (
                              user?.role === 'admin' ? (
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
              ) : (
                <div className="empty-state text-center py-12">
                  <div className="empty-state-icon flex justify-center mb-4"><ClipboardList size={48} className="text-muted" /></div>
                  <h3>No logs yet</h3>
                  <p>There are no vehicle scans recorded in the system.</p>
                </div>
              )}

              {/* Pagination */}
              {data.total > 0 && (
                <div className="pagination" style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                  <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium">Page {page} of {Math.ceil(data.total / pageSize)}</span>
                  <button
                    className="pagination-btn"
                    disabled={data.logs.length < pageSize || page * pageSize >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                  ><ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
