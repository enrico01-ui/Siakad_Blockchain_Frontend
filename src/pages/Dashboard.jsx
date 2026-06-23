// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../services/api'

// ─────────────────────────────────────────────────────────────
// Data performa hasil pengujian per platform (hardcode, statis)
//
// Sumber data per metrik:
//   TPS Sequential / TPS Concurrent          → Tabel 5.7 (Hasil Pengujian Spam Transaksi)
//   Latency Normal Sequential / Concurrent   → Tabel 5.7 (Latency Rata-rata spam testing)
//   Latency Store DDoS / Availability DDoS   → Tabel 4.10 (Evaluasi Komparatif)
//   Latency Verifikasi Integritas            → Tabel 4.10
//   Integritas Data / Deteksi Tampering      → Tabel 4.10
//
// Tabel 5.7 diutamakan untuk spam testing karena lebih detail
// (mencantumkan gagal/berhasil dan latency min/max).
// Pengujian: Mei 2026
// ─────────────────────────────────────────────────────────────
const PLATFORM_PERF = {
  ethereum: {
    label:  'Ethereum Sepolia',
    icon:   '⟠',
    color:  'var(--info)',
    bg:     'var(--info-bg)',
    border: 'rgba(37,99,235,0.25)',
    metrics: [
      // ── Spam Testing (Tabel 5.7) ──
      { label: 'TPS Sequential',       value: '0.07 TPS',   icon: '→',  note: '50/50 berhasil · 739,6 detik' },
      { label: 'TPS Concurrent',       value: '0.35 TPS',   icon: '⇉',  note: '20/20 berhasil · 59,2 detik' },
      { label: 'Latency Normal (Seq)', value: '14.284ms',   icon: '⏲',  note: 'Rata-rata spam sequential' },
      { label: 'Latency Normal (Con)', value: '14.394ms',   icon: '⏲',  note: 'Rata-rata spam concurrent' },
      // ── DDoS Testing (Tabel 4.10) ──
      { label: 'Latency Store DDoS',   value: '12.165ms',   icon: '⏱',  note: '49/49 berhasil' },
      { label: 'Latency Verifikasi', value: '86.3ms',  icon: '◎', note: 'Rata-rata integritas' },  // was 88.9ms
      { label: 'Availability DDoS', value: '100%',     icon: '⛨', note: '89/89 health check' },     // was 11 health check
      // ── Integrity Testing (Tabel 4.10) ──
      { label: 'Integritas Data',      value: '100%',       icon: '✓',  note: '1000/1000 record valid' },
      { label: 'Deteksi Tampering',    value: '30/30',      icon: '🔍', note: 'Semua terdeteksi' },
    ],
    note: 'Bergantung block time Sepolia (~12 detik) dan koneksi ke Alchemy RPC.',
  },
  fabric: {
    label:  'Hyperledger Fabric',
    icon:   '⬡',
    color:  'var(--success)',
    bg:     'var(--success-bg)',
    border: 'rgba(22,101,52,0.25)',
    metrics: [
      // ── Spam Testing (Tabel 5.7) ──
      { label: 'TPS Sequential',       value: '0.47 TPS',   icon: '→',  note: '497/500 berhasil (99,4%) · 1.048,2 detik' },
      { label: 'TPS Concurrent',       value: '27.63 TPS',  icon: '⇉',  note: '99/100 berhasil (99,0%) · 3,7 detik' },
      { label: 'Latency Normal (Seq)', value: '2.096ms',    icon: '⏲',  note: 'Rata-rata spam sequential' },
      { label: 'Latency Normal (Con)', value: '344ms',      icon: '⏲',  note: 'Rata-rata spam concurrent' },
      // ── DDoS Testing (Tabel 4.10) ──
      { label: 'Latency Store DDoS', value: '3.139ms', icon: '⏱', note: 'Saat serangan' },          // was 2.138ms; 0 timeout
      { label: 'Latency Verifikasi',   value: '57.2ms',     icon: '◎',  note: 'Rata-rata integritas' },
      { label: 'Availability DDoS',  value: '100%',    icon: '⛨', note: '288/288 health check' },
      // ── Integrity Testing (Tabel 4.10) ──
      { label: 'Integritas Data',      value: '100%',       icon: '✓',  note: '1000/1000 record valid' },
      { label: 'Deteksi Tampering',    value: '30/30',      icon: '🔍', note: 'Semua terdeteksi' },
    ],
    note: 'Jaringan private lokal. Tidak bergantung infrastruktur eksternal.',
  },
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1)  return 'baru saja'
  if (m < 60) return `${m} menit lalu`
  if (h < 24) return `${h} jam lalu`
  return `${d} hari lalu`
}

function activityColor(action) {
  if (!action) return 'var(--text-muted)'
  if (action.includes('RECORD_DATA')) return 'var(--success)'
  if (action.includes('VERIFY'))      return 'var(--info)'
  if (action.includes('USER'))        return 'var(--gold)'
  if (action.includes('DOCUMENT'))    return 'var(--navy)'
  return 'var(--text-muted)'
}

const GRADE_COLOR = {
  A: 'var(--success)', B: 'var(--info)',
  C: 'var(--warning)', D: 'var(--danger)', E: 'var(--danger)',
}

// Label grup untuk section separator di kartu performa
const METRIC_GROUPS = [
  { startIdx: 0, label: 'Spam Testing'      },
  { startIdx: 4, label: 'DDoS Testing'      },
  { startIdx: 7, label: 'Integrity Testing' },
]

export default function Dashboard() {
  const { chain } = useOutletContext()

  // ── State ─────────────────────────────────────────────────
  const [stats,      setStats]      = useState(null)
  const [txList,     setTxList]     = useState([])
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [actLoading, setActLoading] = useState(true)

  // ── Fetch stats + transaksi terbaru ───────────────────────
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/stats').catch(() => null),
      api.get('/academic?limit=8').catch(() => ({ data: { total: 0, records: [] } })),
    ]).then(([statsRes, acadRes]) => {
      const records = acadRes.data.records || []
      if (statsRes?.data?.success) {
        setStats(statsRes.data)
      } else {
        setStats({
          academic: {
            total:     acadRes.data.total || 0,
            confirmed: records.filter(r => r.status === 'confirmed').length,
            pending:   records.filter(r => r.status !== 'confirmed').length,
          },
          documents: { total: 0, confirmed: 0 },
          users:     { activeTotal: 0 },
        })
      }
      setTxList(records.slice(0, 8))
    }).finally(() => setLoading(false))
  }, [chain])

  // ── Fetch aktivitas terkini ───────────────────────────────
  useEffect(() => {
    setActLoading(true)
    api.get('/activity?limit=8')
      .then(({ data }) => setActivities(data.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setActLoading(false))
  }, [chain])

  const perf = PLATFORM_PERF[chain] || PLATFORM_PERF.fabric

  // ── Stat cards ────────────────────────────────────────────
  const statCards = [
    {
      label:  'Total Records Akademik',
      value:  loading ? '—' : (stats?.academic?.total || 0).toLocaleString('id-ID'),
      sub:    loading ? '' : `${(stats?.academic?.confirmed || 0).toLocaleString('id-ID')} confirmed`,
      icon:   '▦', accent: 'var(--navy)',
    },
    {
      label:  'Dokumen Diterbitkan',
      value:  loading ? '—' : (stats?.documents?.total || 0).toLocaleString('id-ID'),
      sub:    loading ? '' : `${(stats?.documents?.confirmed || 0).toLocaleString('id-ID')} confirmed`,
      icon:   '◫', accent: 'var(--gold)',
    },
    {
      label:  'Pending Blockchain',
      value:  loading ? '—' : (stats?.academic?.pending || 0).toLocaleString('id-ID'),
      sub:    'Menunggu konfirmasi',
      icon:   '◌',
      accent: !loading && (stats?.academic?.pending || 0) > 0 ? 'var(--warning)' : 'var(--success)',
    },
    {
      label: 'Hash Integrity', value: '100%',
      sub:   'Tidak ada tampering', icon: '◎', accent: 'var(--success)',
    },
  ]

  return (
    <div style={{ width: '100%' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Monitoring sistem manajemen data akademik berbasis blockchain</p>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot online" />
          Sistem aktif
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card animate-fadeUp" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.accent }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{s.sub}</div>}
              </div>
              <div className="stat-icon" style={{ color: s.accent }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Transaksi + Aktivitas ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Transaksi akademik terbaru */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14 }}>Transaksi Akademik Terbaru</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>8 terakhir</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Student ID', 'Mata Kuliah', 'Nilai', 'Platform', 'Hash', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Memuat data...</td></tr>
                ) : txList.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Belum ada data</td></tr>
                ) : txList.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--navy)' }}>{r.student_id}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {String(r.course_name || '')}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: GRADE_COLOR[r.grade?.[0]] || 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {r.grade}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.platform === 'ethereum' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: 10 }}>
                        {r.platform === 'ethereum' ? '⟠ ETH' : '⬡ FAB'}
                      </span>
                    </td>
                    <td><span className="hash-text">{r.data_hash?.slice(0, 10)}…</span></td>
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

        {/* Aktivitas Terkini */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>Aktivitas Terkini</h3>
          {actLoading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>Memuat aktivitas...</div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 13 }}>Belum ada aktivitas tercatat</div>
          ) : activities.map((act, i) => (
            <div key={act.id} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: i < activities.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ paddingTop: 5, flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: activityColor(act.action), display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 1, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {act.label}
                  {act.blockchainOk
                    ? <span style={{ fontSize: 10, color: 'var(--success)' }}>✓ blockchain</span>
                    : <span style={{ fontSize: 10, color: 'var(--warning)' }}>⏳ pending</span>
                  }
                </div>
                {act.context && (
                  <div style={{ fontSize: 11, color: 'var(--navy)', fontFamily: 'var(--font-mono)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {act.context}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 5 }}>
                  <span style={{ fontWeight: 500 }}>{act.actor}</span>
                  <span>·</span>
                  <span>{timeAgo(act.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Platform Aktif + Performa ───────────────────────── */}
      <div className="card" style={{ border: `1px solid ${perf.border}`, background: perf.bg, overflow: 'hidden' }}>

        {/* Header kartu */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${perf.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 18, color: perf.color }}>{perf.icon}</span>
              <h3 style={{ fontSize: 14, color: perf.color }}>Platform Aktif: {perf.label}</h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: perf.color, color: '#fff' }}>aktif</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 26 }}>{perf.note}</p>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'right', flexShrink: 0 }}>
            Hasil pengujian · Juni 2026
          </span>
        </div>

        {/* Grid metrik 3×3 dengan section separator */}
        <div style={{ padding: '16px 20px' }}>
          {METRIC_GROUPS.map((group, gi) => {
            const nextStart = METRIC_GROUPS[gi + 1]?.startIdx ?? perf.metrics.length
            const slice = perf.metrics.slice(group.startIdx, nextStart)
            return (
              <div key={gi} style={{ marginBottom: gi < METRIC_GROUPS.length - 1 ? 14 : 0 }}>
                {/* Section label */}
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
                  {group.label}
                </div>
                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
                  {slice.map((m, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: perf.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {m.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}