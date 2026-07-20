// src/pages/AuditTrail.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'akademik', label: 'Data Akademik',   icon: '▦' },
  { key: 'dokumen',  label: 'Dokumen PDF',      icon: '◫' },
  { key: 'users',    label: 'Akun Pengguna',    icon: '⊙' },
]

export default function AuditTrail() {
  const { user } = useAuth()
  const [tab, setTab]           = useState('akademik')
  const [filterText, setFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('') // query yang benar-benar dikirim ke backend

  // ── Data per tab ──────────────────────────────────────────
  const [page, setPage] = useState({ akademik: 1, dokumen: 1, users: 1 })
  const [totalPages, setTotalPages] = useState({ akademik: 1, dokumen: 1, users: 1 })
  const [akademik, setAkademik] = useState({ rows: [], total: 0, confirmed: 0, pending: 0, loading: true })
  const [dokumen,  setDokumen]  = useState({ rows: [], total: 0, confirmed: 0, pending: 0, loading: true })
  const [users,    setUsers]    = useState({ rows: [], total: 0, aktif: 0, hashed: 0, loading: true })

  // ── Fetch akademik ────────────────────────────────────────
  useEffect(() => {
    setAkademik(p => ({ ...p, loading: true }))
    api.get(`/academic?page=${page.akademik}&limit=50&search=${searchQuery}`)
      .then(({ data }) => {
        const rows = data.records || []
        setAkademik({
          rows,
          total:     data.total ?? rows.length,
          confirmed: rows.filter(r => r.status === 'confirmed').length,
          pending:   rows.filter(r => r.status === 'pending' || r.status === 'pending_blockchain').length,
          loading:   false,
        })
        setTotalPages(p => ({ ...p, akademik: data.totalPages || 1 }))
      })
      .catch(() => setAkademik(p => ({ ...p, loading: false })))
  }, [page.akademik, searchQuery])

  // ── Fetch dokumen ─────────────────────────────────────────
  useEffect(() => {
    setDokumen(p => ({ ...p, loading: true }))
    api.get(`/documents?page=${page.dokumen}&limit=50&search=${searchQuery}`)
      .then(({ data }) => {
        const rows = data.documents || []
        setDokumen({
          rows,
          total:     data.total ?? rows.length,
          confirmed: rows.filter(r => r.status === 'confirmed').length,
          pending:   rows.filter(r => r.status === 'pending').length,
          loading:   false,
        })
        setTotalPages(p => ({ ...p, dokumen: data.totalPages || 1 }))
      })
      .catch(() => setDokumen(p => ({ ...p, loading: false })))
  }, [page.dokumen, searchQuery])

  // ── Fetch users (admin only) ──────────────────────────────
  useEffect(() => {
    if (user?.role !== 'admin') {
      setUsers({ rows: [], total: 0, aktif: 0, hashed: 0, loading: false })
      return
    }
    setUsers(p => ({ ...p, loading: true }))
    api.get(`/users?page=${page.users}&limit=50&search=${searchQuery}`)
      .then(({ data }) => {
        const rows = data.users || []
        setUsers({
          rows,
          total:  data.total ?? rows.length,
          aktif:  rows.filter(r => r.is_active).length,
          hashed: rows.filter(r => r.data_hash).length,
          loading: false,
        })
        setTotalPages(p => ({ ...p, users: data.totalPages || 1 }))
      })
      .catch(() => setUsers(p => ({ ...p, loading: false })))
  }, [page.users, user, searchQuery])

  // ── Filter ────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    setPage({ akademik: 1, dokumen: 1, users: 1 })
    setSearchQuery(filterText.trim())
  }

  const handleReset = () => {
    setFilter('')
    setSearchQuery('')
    setPage({ akademik: 1, dokumen: 1, users: 1 })
  }

  // ── Stats helper ──────────────────────────────────────────
  const stats = {
    akademik: { total: akademik.total, confirmed: akademik.confirmed, pending: akademik.pending },
    dokumen:  { total: dokumen.total,  confirmed: dokumen.confirmed,  pending: dokumen.pending },
    users:    { total: users.total,    aktif: users.aktif,            hashed: users.hashed },
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const fmtHash = (h) => h ? h.slice(0, 10) + '…' : '—'

  const currentStats = stats[tab]

  return (
    <div style={{ width: '100%' }}>
      <div className="page-header">
        <h1>Audit Trail Blockchain</h1>
        <p>Riwayat seluruh transaksi yang tercatat di blockchain — data akademik, dokumen, dan akun pengguna</p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.filter(t => t.key !== 'users' || user?.role === 'admin').map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: tab === t.key ? 500 : 400,
              color: tab === t.key ? 'var(--navy)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--navy)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
              transition: 'all 0.15s',
            }}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats + Search ───────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'akademik' && [
            { label: 'Total',     value: currentStats.total,     color: 'var(--navy)' },
            { label: 'Confirmed', value: currentStats.confirmed, color: 'var(--success)' },
            { label: 'Pending',   value: currentStats.pending,   color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 7, alignItems: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
          {tab === 'dokumen' && [
            { label: 'Total Dokumen', value: currentStats.total,     color: 'var(--navy)' },
            { label: 'Confirmed',     value: currentStats.confirmed, color: 'var(--success)' },
            { label: 'Pending',       value: currentStats.pending,   color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 7, alignItems: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
          {tab === 'users' && [
            { label: 'Total User',    value: currentStats.total,  color: 'var(--navy)' },
            { label: 'Aktif',         value: currentStats.aktif,  color: 'var(--success)' },
            { label: 'Hash Tercatat', value: currentStats.hashed, color: 'var(--info)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '7px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 7, alignItems: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 600, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input className="field-input" style={{ width: 260 }}
            placeholder={
              tab === 'akademik' ? 'Cari Student ID, mata kuliah, tx_id...' :
              tab === 'dokumen'  ? 'Cari Student ID, nama, jenis dokumen...' :
                                   'Cari username, nama, email...'
            }
            value={filterText} onChange={e => setFilter(e.target.value)} />
          <button className="btn btn-primary" type="submit">Cari</button>
          <button className="btn btn-outline" type="button" onClick={handleReset}>Reset</button>
        </form>
      </div>

      {/* ── TAB: DATA AKADEMIK ────────────────────────────────── */}
      {tab === 'akademik' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Waktu', 'Student ID', 'Mata Kuliah', 'Nilai', 'Kehadiran', 'Platform', 'Hash Data', 'Tx ID', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {akademik.loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Memuat data...</td></tr>
                ) : akademik.rows.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Tidak ada data ditemukan</td></tr>
                ) : akademik.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)' }}>{r.student_id}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.course_name}</td>
                    <td><span className="badge badge-navy" style={{ fontFamily: 'var(--font-mono)' }}>{r.grade}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.attendance || '—'}</td>
                    <td>
                      <span className={`badge ${r.platform === 'ethereum' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: 10 }}>
                        {r.platform === 'ethereum' ? '⟠ ETH' : '⬡ FAB'}
                      </span>
                    </td>
                    <td><span className="hash-text">{fmtHash(r.data_hash)}</span></td>
                    <td><span className="hash-text">{fmtHash(r.tx_id)}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 }}>
            <button className="btn btn-outline" disabled={page.akademik <= 1}
              onClick={() => setPage(p => ({ ...p, akademik: p.akademik - 1 }))}>
              Prev
            </button>
            <span style={{ fontSize: 13 }}>Halaman {page.akademik} / {totalPages.akademik}</span>
            <button className="btn btn-outline" disabled={page.akademik >= totalPages.akademik}
              onClick={() => setPage(p => ({ ...p, akademik: p.akademik + 1 }))}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: DOKUMEN PDF ──────────────────────────────────── */}
      {tab === 'dokumen' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Waktu', 'Student ID', 'Nama Mahasiswa', 'Jenis Dokumen', 'Platform', 'File Hash', 'Tx ID', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dokumen.loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Memuat data...</td></tr>
                ) : dokumen.rows.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Belum ada transaksi dokumen</td></tr>
                ) : dokumen.rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(r.created_at)}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)' }}>{r.student_id}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.student_name}</td>
                    <td>
                      <span className="badge badge-navy" style={{ textTransform: 'capitalize' }}>
                        {r.document_type === 'ijazah'    ? '📜 Ijazah' :
                         r.document_type === 'transkrip' ? '📋 Transkrip' :
                                                           '🏅 Sertifikat'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.platform === 'ethereum' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: 10 }}>
                        {r.platform === 'ethereum' ? '⟠ ETH' : '⬡ FAB'}
                      </span>
                    </td>
                    <td><span className="hash-text">{fmtHash(r.file_hash)}</span></td>
                    <td><span className="hash-text">{fmtHash(r.tx_id)}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 }}>
            <button className="btn btn-outline" disabled={page.dokumen <= 1}
              onClick={() => setPage(p => ({ ...p, dokumen: p.dokumen - 1 }))}>
              Prev
            </button>
            <span style={{ fontSize: 13 }}>Halaman {page.dokumen} / {totalPages.dokumen}</span>
            <button className="btn btn-outline" disabled={page.dokumen >= totalPages.dokumen}
              onClick={() => setPage(p => ({ ...p, dokumen: p.dokumen + 1 }))}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: AKUN PENGGUNA ────────────────────────────────── */}
      {tab === 'users' && (
        user?.role !== 'admin' ? (
          <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
            Hanya Admin yang dapat melihat riwayat transaksi akun pengguna.
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Dibuat', 'Username', 'Nama Lengkap', 'Email', 'Role', 'Status Akun', 'Hash User', 'Tx ID Blockchain', 'Blockchain Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.loading ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Memuat data...</td></tr>
                  ) : users.rows.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Belum ada data pengguna</td></tr>
                  ) : users.rows.map((u, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(u.created_at)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)' }}>{u.username}</td>
                      <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'admin'     ? 'badge-gold' :
                          u.role === 'dosen'     ? 'badge-info' : 'badge-success'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td><span className="hash-text">{fmtHash(u.data_hash)}</span></td>
                      <td><span className="hash-text">{fmtHash(u.tx_id)}</span></td>
                      <td>
                        <span className={`badge ${
                          u.blockchain_status === 'confirmed' ? 'badge-success' :
                          u.blockchain_status === 'failed'    ? 'badge-danger'  : 'badge-warning'
                        }`}>
                          {u.blockchain_status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 }}>
              <button className="btn btn-outline" disabled={page.users <= 1}
                onClick={() => setPage(p => ({ ...p, users: p.users - 1 }))}>
                Prev
              </button>
              <span style={{ fontSize: 13 }}>Halaman {page.users} / {totalPages.users}</span>
              <button className="btn btn-outline" disabled={page.users >= totalPages.users}
                onClick={() => setPage(p => ({ ...p, users: p.users + 1 }))}>
                Next
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}