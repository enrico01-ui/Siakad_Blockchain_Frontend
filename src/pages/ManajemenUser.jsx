// src/pages/ManajemenUser.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const ROLE_MAP = {
  admin:     { label: 'Administrator', badge: 'badge-gold' },
  dosen:     { label: 'Dosen',         badge: 'badge-info' },
  mahasiswa: { label: 'Mahasiswa',     badge: 'badge-success' },
}

const PAGE_SIZE = 50

function StatCard({ label, value, color }) {
  return (
    <div style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
      <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', color }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

export default function ManajemenUser() {
  const [allUsers, setAllUsers]   = useState([])
  const [filtered, setFiltered]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [page, setPage]           = useState(1)
  const [totalFromServer, setTotalFromServer] = useState(0)
  const [allLoaded, setAllLoaded] = useState(false)

  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ username: '', email: '', password: '', role: 'mahasiswa', full_name: '' })
  const [msg, setMsg]             = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // ── Load semua user dengan pagination ───────────────────────
  const loadAllUsers = useCallback(async () => {
    setLoading(true)
    try {
      // Load page pertama
      const first = await api.get(`/users?limit=${PAGE_SIZE}&offset=0`)
      const total  = first.data.total || 0
      const rows   = first.data.users || []
      setTotalFromServer(total)
      setAllUsers(rows)
      setFiltered(rows)

      if (rows.length >= total) {
        setAllLoaded(true)
        setLoading(false)
        return
      }

      // Load sisa halaman secara paralel
      setLoadingMore(true)
      const pages = Math.ceil(total / PAGE_SIZE)
      const promises = []
      for (let p = 1; p < pages; p++) {
        promises.push(api.get(`/users?limit=${PAGE_SIZE}&offset=${p * PAGE_SIZE}`))
      }
      const results = await Promise.all(promises)
      const extra   = results.flatMap(r => r.data.users || [])
      const allRows = [...rows, ...extra]

      setAllUsers(allRows)
      setFiltered(allRows)
      setAllLoaded(true)
    } catch (err) {
      setMsg({ type: 'error', text: 'Gagal memuat data pengguna.' })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { loadAllUsers() }, [loadAllUsers])

  // ── Filter ───────────────────────────────────────────────────
  useEffect(() => {
    let result = allUsers
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'all')   result = result.filter(u => u.role === roleFilter)
    if (statusFilter !== 'all') result = result.filter(u => String(u.is_active) === statusFilter)
    setFiltered(result)
    setCurrentPage(1)
  }, [search, roleFilter, statusFilter, allUsers])

  // ── Pagination ───────────────────────────────────────────────
  const ROWS_PER_PAGE = 20
  const totalPages    = Math.ceil(filtered.length / ROWS_PER_PAGE)
  const pageData      = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE)

  // ── Submit tambah user ───────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/users', form)
      setMsg({ type: 'success', text: 'User berhasil ditambahkan.' })
      setShowForm(false)
      setForm({ username: '', email: '', password: '', role: 'mahasiswa', full_name: '' })
      loadAllUsers()
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal menambahkan user.' })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Toggle status user ───────────────────────────────────────
  const handleToggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active })
      setMsg({ type: 'success', text: `User ${user.username} berhasil ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}.` })
      setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal mengubah status user.' })
    }
  }

  // ── Verify user ──────────────────────────────────────────────
  const handleVerify = async (user) => {
    setLoadingVerify(true)
    try {
      const { data } = await api.get(`/users/${user.id}/verify`)
      const isValid  = data?.verification?.isValid
      console.log('Verifikasi user:', user.username, 'Result:', data)
      setMsg({
        type: isValid ? 'success' : 'error',
        text: isValid
          ? `✓ User ${user.username} terverifikasi — hash cocok dengan blockchain.`
          : `✗ User ${user.username} TIDAK VALID — hash tidak cocok.`,
      })
    } catch (err) {
      setLoadingVerify(false)
      setMsg({ type: 'error', text: err.response?.data?.message || 'Gagal verifikasi user.' })
    }
  }

  // ── Stats ────────────────────────────────────────────────────
  const countByRole   = (role) => allUsers.filter(u => u.role === role).length
  const countActive   = allUsers.filter(u => u.is_active).length

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Manajemen Pengguna</h1>
          <p>Kelola akun Administrator, Dosen, dan Mahasiswa</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setMsg({ type: '', text: '' }) }}>
          {showForm ? '✕ Batal' : '+ Tambah Pengguna'}
        </button>
      </div>

      {/* Alert */}
      {msg.text && (
        <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard label="Total Pengguna"  value={loading ? '...' : allUsers.length}     color="var(--navy)" />
        <StatCard label="Aktif"           value={loading ? '...' : countActive}          color="var(--success)" />
        <StatCard label="Admin"           value={loading ? '...' : countByRole('admin')} color="#b8860b" />
        <StatCard label="Dosen"           value={loading ? '...' : countByRole('dosen')} color="var(--info, #0d6efd)" />
        <StatCard label="Mahasiswa"       value={loading ? '...' : countByRole('mahasiswa')} color="var(--text-secondary)" />
        {loadingMore && (
          <div style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            ⏳ Memuat semua data ({allUsers.length}/{totalFromServer})...
          </div>
        )}
        {allLoaded && (
          <div style={{ padding: '8px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--success)' }}>
            ✓ Semua {allUsers.length} pengguna termuat
          </div>
        )}
      </div>

      {/* Form Tambah User */}
      {showForm && (
        <div className="card card-pad animate-fadeIn" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>Tambah Pengguna Baru</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              {[
                { key: 'full_name', label: 'Nama Lengkap', placeholder: 'Dr. Budi Santoso', type: 'text' },
                { key: 'username',  label: 'Username',     placeholder: 'budi.santoso',      type: 'text' },
                { key: 'email',     label: 'Email',        placeholder: 'budi@uajy.ac.id',   type: 'email' },
                { key: 'password',  label: 'Password',     placeholder: 'Min. 6 karakter',   type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="field-label">{f.label}</label>
                  <input className="field-input" type={f.type} placeholder={f.placeholder}
                    value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required />
                </div>
              ))}
              <div>
                <label className="field-label">Role</label>
                <select className="field-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan Pengguna →'}
            </button>
          </form>
        </div>
      )}

      {/* Filter & Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="field-input" style={{ width: 260 }} placeholder="Cari nama, username, email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="field-input" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">Semua Role</option>
          <option value="admin">Administrator</option>
          <option value="dosen">Dosen</option>
          <option value="mahasiswa">Mahasiswa</option>
        </select>
        <select className="field-input" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
          <button className="btn btn-outline" onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all') }}>
            Reset Filter
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Menampilkan {filtered.length} dari {allUsers.length} pengguna
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {['No', 'Nama Lengkap', 'Username', 'Email', 'Role', 'Status', 'Bergabung', 'Aksi'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  Memuat data...
                </td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  {allUsers.length === 0 ? 'Belum ada pengguna.' : 'Tidak ada pengguna yang sesuai filter.'}
                </td></tr>
              ) : pageData.map((u, i) => (
                <tr key={u.id || i}>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    {(currentPage - 1) * ROWS_PER_PAGE + i + 1}
                  </td>
                  <td style={{ fontWeight: 500 }}>{u.full_name || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)' }}>{u.username}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_MAP[u.role]?.badge || 'badge-navy'}`}>
                      {ROLE_MAP[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-outline" style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleVerify(u)} title="Verifikasi hash user di blockchain">
                        {loadingVerify ? 'Memverifikasi...' : '🔐 Verifikasi'}
                      </button>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-primary'}`}
                        style={{ fontSize: 11, padding: '3px 8px' }}
                        onClick={() => handleToggleStatus(u)}
                        title={u.is_active ? 'Nonaktifkan user' : 'Aktifkan user'}>
                        {u.is_active ? '⏸ Nonaktifkan' : '▶ Aktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Halaman {currentPage} dari {totalPages} ({filtered.length} pengguna)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-outline" disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}>«</button>
              <button className="btn btn-sm btn-outline" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}>‹ Prev</button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button key={pageNum}
                    className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </button>
                )
              })}

              <button className="btn btn-sm btn-outline" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}>Next ›</button>
              <button className="btn btn-sm btn-outline" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}