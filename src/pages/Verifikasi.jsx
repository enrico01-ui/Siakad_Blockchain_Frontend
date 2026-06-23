// src/pages/Verifikasi.jsx
import { useState } from 'react'
import api from '../services/api'

export default function Verifikasi() {
  const [studentId, setStudentId] = useState('')
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await api.post('/verify/hash', { student_id: studentId })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Verifikasi gagal.')
    } finally { setLoading(false) }
  }

  const isValid = result?.verification?.isValid

  return (
    <div style={{ width:'100%' }}>
      <div className="page-header">
        <h1>Verifikasi Integritas</h1>
        <p>Bandingkan hash database dengan hash yang tersimpan di blockchain</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:24, width:'100%' }}>

        {/* Search */}
        <div>
          <div className="card card-pad" style={{ marginBottom:16 }}>
            <h3 style={{ fontSize:14, marginBottom:16 }}>Cari Data Mahasiswa</h3>
            <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="field-label">NIM / Student ID</label>
                <input className="field-input" placeholder="Contoh: STUD_1" value={studentId}
                  onChange={e=>setStudentId(e.target.value)} required />
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? 'Memverifikasi...' : 'Verifikasi Sekarang →'}
              </button>
            </form>
          </div>

          {/* How it works */}
          <div className="card card-pad" style={{ background:'var(--bg-subtle)', boxShadow:'none' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Cara Kerja</div>
            {[
              ['1', 'Ambil data dari PostgreSQL (off-chain)'],
              ['2', 'Hitung ulang hash SHA-256 dari data'],
              ['3', 'Ambil hash dari blockchain'],
              ['4', 'Bandingkan — cocok berarti data valid'],
            ].map(([no, text]) => (
              <div key={no} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--navy)', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{no}</div>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result */}
        <div>
          {!result && !error ? (
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320, color:'var(--text-muted)', gap:12 }}>
              <div style={{ fontSize:48, opacity:0.1 }}>◎</div>
              <div style={{ fontSize:13 }}>Hasil verifikasi akan ditampilkan di sini</div>
            </div>
          ) : result ? (
            <div className={`card animate-fadeIn`} style={{ overflow:'hidden', border:`1.5px solid ${isValid?'rgba(45,122,79,0.3)':'rgba(184,50,50,0.3)'}` }}>
              {/* Status banner */}
              <div style={{ padding:'20px 24px', background: isValid?'var(--success-bg)':'var(--danger-bg)', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background: isValid?'var(--success)':'var(--danger)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#fff', flexShrink:0 }}>
                  {isValid ? '✓' : '✗'}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:600, fontFamily:'var(--font-display)', color: isValid?'var(--success)':'var(--danger)' }}>
                    {isValid ? 'Data Valid' : 'Data Tidak Valid'}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                    {result.verification?.message}
                  </div>
                </div>
              </div>

              {/* Detail rows */}
              <div style={{ padding:'4px 0' }}>
                {[
                  ['Student ID',    result.student_id,                     false],
                  ['Record ID',     result.record_id,                      true],
                  ['Hash Database', result.verification?.expectedHash,     true],
                  ['Hash Blockchain',result.verification?.actualHash,      true],
                  ['Kecocokan',     isValid ? 'Identik ✓' : 'Berbeda ✗',  false],
                ].map(([k, v, mono]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'11px 24px', borderBottom:'1px solid var(--border)', gap:12 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0, minWidth:130 }}>{k}</span>
                    <span style={{ fontSize:12, fontFamily: mono?'var(--font-mono)':'var(--font-body)', color: k==='Kecocokan'?(isValid?'var(--success)':'var(--danger)'):'var(--text-primary)', textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}