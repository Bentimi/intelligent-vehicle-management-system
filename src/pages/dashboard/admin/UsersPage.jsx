import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Users, Shield, Lock, CheckCircle2, Ban, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../../services/api'
import Layout from '../../../components/Layout'
import useDebounce from '../../../hooks/useDebounce'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data: usersData, isLoading, isError, error } = useQuery({
    queryKey: ['users', page, debouncedSearch, pageSize],
    queryFn: () => api.get(`/user/get-users?page=${page}&pageSize=${pageSize}&search=${debouncedSearch}`).then((r) => r.data?.data),
    keepPreviousData: true,
  })

  const users = usersData?.users || []
  const total = usersData?.total || 0
  const roleBadge = (role) => <span className={`badge badge-${role}`}>{role}</span>
  const statusBadge = (active) => (
    <span className={`badge flex items-center gap-1 ${active ? 'badge-active' : 'badge-blacklisted'}`}>
      {active ? <><CheckCircle2 size={14} /> Active</> : <><Ban size={14} /> Inactive</>}
    </span>
  )

  return (
    <Layout title="User Management">
      <div className="animate-slide-up">
        <div className="page-header">
          <h1>All Users</h1>
          <p>Manage campus system users and their roles</p>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Total Users',    value: total, icon: <Users size={20} /> },
            { label:'Admins',         value: users.filter(u=>u.role==='admin').length ?? '—', icon: <Shield size={20} /> },
            { label:'Security',       value: users.filter(u=>u.role==='security').length ?? '—', icon: <Lock size={20} /> },
            { label:'Active',         value: users.filter(u=>u.active).length ?? '—', icon: <CheckCircle2 size={20} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="stat-card">
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
              <div className="stat-icon" style={{ opacity: 0.6 }}>{icon}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:'1rem', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:'0.75rem', flex:1, minWidth:260 }}>
            <input
              className="form-input"
              placeholder="Search by name, email, or reg #..."
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

        <div className="card" style={{ padding:0 }}>
          {isLoading && <div className="inline-loader"><div className="spinner" /></div>}

          {isError && (
            <div className="alert alert-error flex items-center gap-2" style={{ margin:'1.5rem' }}>
              <AlertTriangle size={18} /> {error?.response?.data?.message || 'Failed to load users'}
            </div>
          )}

          {!isLoading && !isError && users && (
            <>
              <div className="table-wrapper" style={{ borderRadius:'var(--radius-lg)', border:'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Reg #</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last login</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ cursor:'pointer' }} onClick={() => navigate(`/dashboard/admin/users/${u._id}`)}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                            <div style={{
                              width:30, height:30, borderRadius:'50%',
                              background:'var(--primary)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'0.7rem', fontWeight:700, color:'white', flexShrink:0
                            }}>
                              {(u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')}
                            </div>
                            <span style={{ fontWeight:500, color:'var(--text-primary)' }}>
                              {u.first_name} {u.last_name}
                            </span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td style={{ fontFamily:'monospace', fontSize:'0.82rem' }}>{u.reg_number}</td>
                        <td>{roleBadge(u.role)}</td>
                        <td>{statusBadge(u.active)}</td>
                        <td style={{ fontSize:'0.82rem' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>
                        <td><button className="btn btn-ghost btn-sm flex items-center gap-1">View <ArrowRight size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > 0 && (
                <div className="pagination" style={{ padding:'1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                  <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((p) => p-1)}><ChevronLeft size={16} /></button>
                  <span className="text-sm font-medium">Page {page} of {Math.ceil(total / pageSize)}</span>
                  <button
                    className="pagination-btn"
                    disabled={users.length < pageSize || page * pageSize >= total}
                    onClick={() => setPage((p) => p+1)}
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
