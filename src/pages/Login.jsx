// src/pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login }   = useAuth()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Username atau password salah.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', width:'100%', display:'flex', fontFamily:'var(--font-body)', background:'var(--bg)' }}>

      {/* Left panel — branding */}
      <div style={{ flex:1, background:'var(--navy)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', position:'relative', overflow:'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute', top:-40, right:-40, width:200, height:200, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.07)' }} />
        <div style={{ position:'absolute', bottom:-100, left:-60, width:350, height:350, borderRadius:'50%', border:'1px solid rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
            <div style={{ width:44, height:44, background:'var(--gold)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, color:'#fff', fontWeight:700 }}>B</div>
            <div>
              <div style={{ fontSize:18, fontWeight:600, color:'#fff', fontFamily:'var(--font-display)' }}>BACAS</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>Universitas Atma Jaya Yogyakarta</div>
            </div>
          </div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'2.6rem', color:'#fff', fontWeight:500, lineHeight:1.2, marginBottom:16 }}>
            Sistem Manajemen<br/>Data Akademik
          </h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:15, lineHeight:1.7, maxWidth:360 }}>
            Platform terpadu berbasis blockchain untuk menjamin keamanan, keaslian, dan integritas data akademik mahasiswa.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position:'relative', zIndex:1 }}>
          {[
            { icon:'◎', text:'Verifikasi integritas data real-time' },
            { icon:'◫', text:'Generate dokumen akademik terverifikasi' },
            { icon:'⬡', text:'Didukung Ethereum & Hyperledger Fabric' },
          ].map((f, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gold-light)', fontSize:15, flexShrink:0 }}>{f.icon}</div>
              <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.6)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ width:480, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px', background:'var(--bg-card)' }}>
        <div style={{ animation:'fadeUp 0.4s ease both' }}>
          <div style={{ marginBottom:40 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', fontWeight:500, color:'var(--text-primary)', marginBottom:8 }}>Selamat Datang</h2>
            <p style={{ fontSize:14, color:'var(--text-muted)' }}>Masukkan kredensial Anda untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div>
              <label className="field-label">Username</label>
              <input className="field-input" placeholder="Masukkan username"
                value={form.username} onChange={e => setForm(p => ({...p, username: e.target.value}))} required />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input className="field-input" type="password" placeholder="Masukkan password"
                value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
            </div>

            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}
              style={{ marginTop:4 }}>
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Credentials hint */}
          <div style={{ marginTop:32, padding:'16px', background:'var(--bg-subtle)', borderRadius:'var(--radius-md)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em' }}>Akun Default</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {[
                { role:'Admin',    user:'admin',  pass:'admin123' },
                { role:'Dosen',    user:'dosen1', pass:'dosen123' },
              ].map(a => (
                <div key={a.role} style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}>
                  <span style={{ color:'var(--text-muted)' }}>{a.role}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--navy-muted)' }}>{a.user} / {a.pass}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}