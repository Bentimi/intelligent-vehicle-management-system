import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import api from '../../../services/api'
import Layout from '../../../components/Layout'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const navigate = useNavigate()

  const { data: users, isLoading, isError, error } = useQuery({
    queryKey: ['users', page],
    queryFn: () => api.get(`/user/get-users?page=${page}&pageSize=${pageSize}`).then((r) => r.data?.data),
    keepPreviousData: true,
  })

  const roleBadge = (role) => <span className={`badge badge-${role}`}>{role}</span>
  const statusBadge = (active) => (
    <span className={`badge ${active ? 'badge-active' : 'badge-blacklisted'}`}>
      {active ? '✅ Active' : '⛔ Inactive'}
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
            { label:'Total Users',    value: users?.length ?? '—', icon:'👥' },
            { label:'Admins',         value: users?.filter(u=>u.role==='admin').length ?? '—', icon:'🛡️' },
            { label:'Security',       value: users?.filter(u=>u.role==='security').length ?? '—', icon:'🔐' },
            { label:'Active',         value: users?.filter(u=>u.active).length ?? '—', icon:'✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="stat-card">
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
              <span className="stat-icon">{icon}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding:0 }}>
          {isLoading && <div className="inline-loader"><div className="spinner" /></div>}

          {isError && (
            <div className="alert alert-error" style={{ margin:'1.5rem' }}>
              ⚠️ {error?.response?.data?.message || 'Failed to load users'}
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
                              background:'linear-gradient(135deg, var(--primary), var(--accent))',
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
                        <td><button className="btn btn-ghost btn-sm">View →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination" style={{ padding:'1rem' }}>
                <button className="pagination-btn" disabled={page === 1} onClick={() => setPage((p) => p-1)}>‹</button>
                <span className="pagination-btn active">{page}</span>
                <button
                  className="pagination-btn"
                  disabled={!users || users.length < pageSize}
                  onClick={() => setPage((p) => p+1)}
                >›</button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
