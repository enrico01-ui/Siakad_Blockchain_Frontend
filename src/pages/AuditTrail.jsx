// src/pages/AuditTrail.jsx
import { useState, useEffect, useCallback } from 'react'
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

  // ── Data per tab ──────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [akademik, setAkademik] = useState({ all: [], filtered: [], loading: true })
  const [dokumen,  setDokumen]  = useState({ all: [], filtered: [], loading: true })
  const [users,    setUsers]    = useState({ all: [], filtered: [], loading: true })

  // ── Fetch akademik ────────────────────────────────────────
  useEffect(() => {
  setAkademik(p => ({ ...p, loading: true }))

  api.get(`/academic?page=${page}&limit=50&search=${filterText}`)
    .then(({ data }) => {
      const rows = data.records || []

      setAkademik({
        all: rows,
        filtered: rows,
        loading: false
      })

      setTotalPages(data.totalPages || 1)
      console.log('Academic data loaded:', rows.length, 'records')
      console.log('Total pages:', data.totalPages)
    })
    .catch(() => {
      setAkademik(p => ({ ...p, loading: false }))
    })

}, [page, filterText])

  // ── Fetch dokumen ─────────────────────────────────────────
  useEffect(() => {
    api.get('/documents?limit=2000')
      .then(({ data }) => {
        const rows = data.documents || []
        setDokumen({ all: rows, filtered: rows, loading: false })
      })
      .catch(() => setDokumen(p => ({ ...p, loading: false })))
  }, [])

  // ── Fetch users (admin only) ──────────────────────────────
  useEffect(() => {
    if (user?.role !== 'admin') {
      setUsers({ all: [], filtered: [], loading: false })
      return
    }
    api.get('/users')
      .then(({ data }) => {
        const rows = data.users || []
        setUsers({ all: rows, filtered: rows, loading: false })
      })
      .catch(() => setUsers(p => ({ ...p, loading: false })))
  }, [user])

  // ── Filter ────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault()
    // academic -> backend search
    setPage(1)

    const q = filterText.trim().toLowerCase()
    if (!q) {
      setAkademik(p => ({ ...p, filtered: p.all }))
      setDokumen(p  => ({ ...p, filtered: p.all }))
      setUsers(p    => ({ ...p, filtered: p.all }))
      return
    }
    setDokumen(p => ({ ...p, filtered: p.all.filter(r =>
      r.student_id?.toLowerCase().includes(q) ||
      r.student_name?.toLowerCase().includes(q) ||
      r.document_type?.toLowerCase().includes(q) ||
      r.tx_id?.toLowerCase().includes(q)
    )}))
    setUsers(p => ({ ...p, filtered: p.all.filter(r =>
      r.username?.toLowerCase().includes(q) ||
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    )}))
    setAkademik(p => ({ ...p, loading: true }))

  api.get(`/academic?page=1&limit=50&search=${q}`)
    .then(({ data }) => {
      const rows = data.records || []

      setAkademik({
        all: rows,
        filtered: rows,
        loading: false
      })

      setTotalPages(data.totalPages || 1)
    })
    .catch(() => {
      setAkademik(p => ({ ...p, loading: false }))
    })
  }

  const handleReset = () => {
    setFilter('')
    setPage(1)
    setDokumen(p  => ({ ...p, filtered: p.all }))
    setUsers(p    => ({ ...p, filtered: p.all }))
  }

  // ── Stats helper ──────────────────────────────────────────
  const stats = {
    akademik: {
      total:     akademik.filtered.length,
      confirmed: akademik.filtered.filter(r => r.status === 'confirmed').length,
      pending:   akademik.filtered.filter(r => r.status === 'pending' || r.status === 'pending_blockchain').length,
    },
    dokumen: {
      total:     dokumen.filtered.length,
      confirmed: dokumen.filtered.filter(r => r.status === 'confirmed').length,
      pending:   dokumen.filtered.filter(r => r.status === 'pending').length,
    },
    users: {
      total:  users.filtered.length,
      aktif:  users.filtered.filter(r => r.is_active).length,
      hashed: users.filtered.filter(r => r.data_hash).length,
    },
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
                ) : akademik.filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Tidak ada data ditemukan</td></tr>
                ) : akademik.filtered.map((r, i) => (
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
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            padding: 20
          }}>
            <button
              className="btn btn-outline"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>

            <span style={{ fontSize: 13 }}>
              Halaman {page} / {totalPages}
            </span>

            <button
              className="btn btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
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
                ) : dokumen.filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Belum ada transaksi dokumen</td></tr>
                ) : dokumen.filtered.map((r, i) => (
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
                  ) : users.filtered.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Belum ada data pengguna</td></tr>
                  ) : users.filtered.map((u, i) => (
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
          </div>
        )
      )}
    </div>
  )
}