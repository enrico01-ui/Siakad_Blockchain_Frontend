// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../services/api'

const NAV = [
  { to: '/dashboard', label: 'Dashboard',      icon: '▦',  roles: ['admin','dosen','mahasiswa'] },
  { to: '/input',     label: 'Input Data',      icon: '✎',  roles: ['admin','dosen'] },
  { to: '/verifikasi',label: 'Verifikasi',      icon: '◎',  roles: ['admin','dosen','mahasiswa'] },
  { to: '/audit',     label: 'Audit Trail',     icon: '≡',  roles: ['admin','dosen'] },
  { to: '/dokumen',   label: 'Dokumen',         icon: '◫',  roles: ['admin','dosen','mahasiswa'] },
  { to: '/users',     label: 'Manajemen User',  icon: '⊙',  roles: ['admin'] },
]
const CHAIN_CONFIG = {
  ethereum: {
    label:  '⟠ Ethereum Sepolia',
    bg:     'var(--info-bg)',
    color:  'var(--info)',
    border: 'var(--info)',
  },
  fabric: {
    label:  '⬡ Hyperledger Fabric',
    bg:     'var(--success-bg)',
    color:  'var(--success)',
    border: 'var(--success)',
  },
}
const ROLE_BADGE = {
  admin:     { label: 'Administrator', bg: 'var(--gold-bg)',      color: 'var(--gold)' },
  dosen:     { label: 'Dosen',         bg: 'var(--info-bg)',      color: 'var(--info)' },
  mahasiswa: { label: 'Mahasiswa',     bg: 'var(--success-bg)',   color: 'var(--success)' },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [chain, setChain]             = useState('ethereum')
  const [chainLoading, setChainLoading] = useState(true)
  const [chainError, setChainError]   = useState(false)


  useEffect(() => {
    api.get('/health')
      .then(({ data }) => {
        if (data?.blockchain) setChain(data.blockchain)
        setChainError(false)
      })
      .catch(() => {
        // Kalau gagal fetch, tetap pakai 'ethereum' sebagai fallback
        // dan tampilkan tanda error kecil
        setChainError(true)
      })
      .finally(() => setChainLoading(false))
  }, [])
  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV.filter(n => n.roles.includes(user?.role))
  const roleBadge  = ROLE_BADGE[user?.role] || ROLE_BADGE.mahasiswa
  const chainCfg     = CHAIN_CONFIG[chain] || CHAIN_CONFIG.ethereum
  return (
    <div style={{ display:'flex', height:'100vh', width:'100%', overflow:'hidden', background:'var(--bg)', fontFamily:'var(--font-body)' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-w)',
        flexShrink: 0,
        background: 'var(--navy)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{ padding:'28px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, background:'var(--gold)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', fontWeight:700, flexShrink:0 }}>
              B
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#fff', fontFamily:'var(--font-display)', lineHeight:1.2 }}>Siakad</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', marginTop:2 }}>Akademik UAJY</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', padding:'0 10px', marginBottom:8 }}>NAVIGASI</div>
          {visibleNav.map(n => (
            <NavLink key={n.to} to={n.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--gold)' : '3px solid transparent',
                transition: 'all 0.15s',
              })}>
              <span style={{ fontSize:15, width:18, textAlign:'center' }}>{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding:'16px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, borderRadius:99, background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'rgba(255,255,255,0.7)', fontWeight:600, flexShrink:0 }}>
              {(user?.full_name || user?.username || '?')[0].toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:13, color:'#fff', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {typeof user?.full_name === 'string' ? user.full_name : typeof user?.username === 'string' ? user.username : ''}
              </div>
              <div style={{ fontSize:11, padding:'1px 7px', borderRadius:99, display:'inline-block', marginTop:3, background: roleBadge.bg, color: roleBadge.color, fontWeight:600 }}>
                {roleBadge.label}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--radius-sm)', color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-body)', fontSize:12, cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.target.style.background='rgba(255,255,255,0.12)'; e.target.style.color='#fff' }}
            onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.06)'; e.target.style.color='rgba(255,255,255,0.5)' }}>
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
 
        {/* Top bar */}
        <header style={{ height:'var(--topbar-h)', flexShrink:0, background:'var(--bg-card)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', gap:16 }}>
 
          {/* Kiri: label */}
          <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>
            Platform Blockchain Aktif
          </div>
 
          {/* Tengah: badge platform — read-only dari backend */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {chainLoading ? (
              <span style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>
                Memeriksa platform...
              </span>
            ) : (
              <>
                {/* Dot animasi */}
                <span style={{
                  width: 7, height: 7,
                  borderRadius: '50%',
                  background: chainError ? '#f59e0b' : chainCfg.color,
                  display: 'inline-block',
                  animation: chainError ? 'none' : 'pulse 2s infinite',
                }} />
 
                {/* Badge platform */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 14px',
                  borderRadius: 99,
                  background: chainCfg.bg,
                  color: chainCfg.color,
                  border: `1px solid ${chainCfg.color}`,
                }}>
                  {chainCfg.label}
                </span>
 
                {/* Keterangan error jika health check gagal */}
                {chainError && (
                  <span style={{ fontSize:11, color:'#f59e0b' }} title="Tidak dapat mengambil status platform dari server">
                    ⚠ offline
                  </span>
                )}
              </>
            )}
          </div>
 
          {/* Kanan: tanggal */}
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'long', year:'numeric' })}
          </div>
        </header>
 
        {/* Page content — chain diteruskan ke semua halaman via context */}
        <main style={{ flex:1, overflow:'auto', padding:'28px 32px', width:'100%', boxSizing:'border-box' }}>
          <Outlet context={{ chain }} />
        </main>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}