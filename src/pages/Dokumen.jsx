// src/pages/Dokumen.jsx
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../services/api'

const DOC_TYPES = [
  { value:'ijazah',     label:'Ijazah',     desc:'Dokumen kelulusan resmi',         icon:'🎓' },
  { value:'transkrip',  label:'Transkrip',  desc:'Daftar nilai & IPK lengkap',      icon:'📋' },
  { value:'sertifikat', label:'Sertifikat', desc:'Sertifikat penghargaan/kelulusan', icon:'🏅' },
]

export default function Dokumen() {
  const { chain }        = useOutletContext()
  const [tab, setTab]    = useState('generate')
  const [docType, setDocType] = useState('ijazah')
  const [studentId, setStudentId] = useState('')
  const [certType, setCertType]   = useState('Kelulusan')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')

  const [verifyFile, setVerifyFile]     = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const [documents, setDocuments]     = useState([])
  const [listStudentId, setListId]    = useState('')
  const [listLoading, setListLoading] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await api.post('/documents/generate', { student_id: studentId, document_type: docType, cert_type: certType })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal generate dokumen.')
    } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!verifyFile) return setError('Pilih file PDF dulu')
    setError(''); setVerifyResult(null); setVerifyLoading(true)
    try {
      const fd = new FormData()
      fd.append('document', verifyFile)
      const { data } = await api.post('/documents/verify', fd, { headers:{'Content-Type':'multipart/form-data'} })
      setVerifyResult(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal verifikasi.')
    } finally { setVerifyLoading(false) }
  }

  const handleList = async (e) => {
    e.preventDefault()
    setListLoading(true)
    try {
      const { data } = await api.get(`/documents/student/${listStudentId}`)
      setDocuments(data.documents || [])
    } catch { setDocuments([]) }
    finally { setListLoading(false) }
  }

  const handleDownload = async (docId, fileName) => {
    try {
      const res  = await api.get(`/documents/download/${docId}`, { responseType:'blob' })
      const url  = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link); link.click(); link.remove()
    } catch { alert('Gagal download') }
  }

  return (
    <div style={{ width:'100%' }}>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <h1>Dokumen Akademik</h1>
          <p>Generate dan verifikasi dokumen via <strong style={{ color: chain==='ethereum'?'var(--info)':'var(--success)' }}>{chain==='ethereum'?'Ethereum Sepolia':'Hyperledger Fabric'}</strong></p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ maxWidth:480, marginBottom:24 }}>
        {[['generate','Generate Dokumen'],['verify','Verifikasi PDF'],['list','Daftar Dokumen']].map(([key,label]) => (
          <button key={key} className={`tab-btn ${tab===key?'active':''}`}
            onClick={()=>{ setTab(key); setError(''); setResult(null); setVerifyResult(null) }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── GENERATE ── */}
      {tab === 'generate' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }} className="animate-fadeIn">
          <div className="card card-pad">
            <h3 style={{ fontSize:14, marginBottom:20, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>Generate Dokumen PDF</h3>

            {/* Type selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
              {DOC_TYPES.map(dt => (
                <div key={dt.value} onClick={()=>setDocType(dt.value)}
                  style={{ padding:'14px 10px', border:`1.5px solid ${docType===dt.value?'var(--navy)':'var(--border)'}`, borderRadius:'var(--radius-md)', cursor:'pointer', textAlign:'center', background: docType===dt.value?'rgba(26,39,68,0.04)':'var(--bg-card)', transition:'all 0.15s' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{dt.icon}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: docType===dt.value?'var(--navy)':'var(--text-secondary)' }}>{dt.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{dt.desc}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleGenerate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="field-label">NIM / Student ID</label>
                <input className="field-input" placeholder="Contoh: DS2_ID00001" value={studentId} onChange={e=>setStudentId(e.target.value)} required />
              </div>
              {docType==='sertifikat' && (
                <div>
                  <label className="field-label">Jenis Sertifikat</label>
                  <select className="field-input" value={certType} onChange={e=>setCertType(e.target.value)}>
                    <option>Kelulusan</option>
                    <option>Prestasi Akademik</option>
                    <option>Partisipasi</option>
                  </select>
                </div>
              )}
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                {loading ? 'Generating PDF...' : `Generate ${DOC_TYPES.find(d=>d.value===docType)?.label} →`}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="card card-pad">
            <h3 style={{ fontSize:14, marginBottom:20, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>Hasil Generate</h3>
            {!result ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'var(--text-muted)', gap:10 }}>
                <div style={{ fontSize:40, opacity:0.12 }}>📄</div>
                <div style={{ fontSize:13 }}>Hasil dokumen akan muncul di sini</div>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <div className="alert alert-success" style={{ marginBottom:16 }}>✓ {result.message}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:0, marginBottom:16 }}>
                  {[
                    ['Student ID',   result.document?.student_id],
                    ['Tipe',         result.document?.document_type],
                    ['Hash Dokumen', result.document?.file_hash?.slice(0,24)+'…'],
                    ['Tx ID',        result.document?.tx_id ? result.document.tx_id.slice(0,24)+'…' : 'Pending'],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
                      <span style={{ fontSize:12, color:'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-primary)', textAlign:'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-outline btn-block" onClick={()=>handleDownload(result.document?.id, result.document?.file_name)}>
                  ⬇ Download PDF
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VERIFY ── */}
      {tab === 'verify' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:24 }} className="animate-fadeIn">
          <div className="card card-pad">
            <h3 style={{ fontSize:14, marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>Upload Dokumen PDF</h3>
            <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label className="field-label">File PDF</label>
                <input type="file" accept=".pdf" onChange={e=>setVerifyFile(e.target.files[0])}
                  style={{ width:'100%', padding:'9px 12px', background:'var(--bg-subtle)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', color:'var(--text-secondary)' }} />
                {verifyFile && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>{verifyFile.name} ({(verifyFile.size/1024).toFixed(1)} KB)</div>}
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <button className="btn btn-primary btn-block" type="submit" disabled={verifyLoading || !verifyFile}>
                {verifyLoading ? 'Memverifikasi...' : 'Verifikasi Keaslian →'}
              </button>
            </form>

            <hr className="divider" />
            <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.8 }}>
              Sistem akan menghitung hash SHA-256 dari file PDF yang diupload dan membandingkannya dengan hash yang tersimpan di blockchain.
            </div>
          </div>

          <div>
            {!verifyResult ? (
              <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:280, color:'var(--text-muted)', gap:10 }}>
                <div style={{ fontSize:40, opacity:0.1 }}>🔍</div>
                <div style={{ fontSize:13 }}>Hasil verifikasi akan muncul di sini</div>
              </div>
            ) : (
              <div className="card animate-fadeIn" style={{ overflow:'hidden', border:`1.5px solid ${verifyResult.isValid?'rgba(45,122,79,0.3)':'rgba(184,50,50,0.3)'}` }}>
                <div style={{ padding:'18px 22px', background: verifyResult.isValid?'var(--success-bg)':'var(--danger-bg)', display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background: verifyResult.isValid?'var(--success)':'var(--danger)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {verifyResult.isValid ? '✓' : '✗'}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, fontFamily:'var(--font-display)', color: verifyResult.isValid?'var(--success)':'var(--danger)' }}>
                      {verifyResult.isValid ? 'Dokumen Valid' : 'Dokumen Tidak Valid'}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{verifyResult.message}</div>
                  </div>
                </div>
                {verifyResult.document && (
                  <div style={{ padding:'4px 0' }}>
                    {[
                      ['Student ID',   verifyResult.document.student_id],
                      ['Nama',         verifyResult.document.student_name],
                      ['Tipe Dokumen', verifyResult.document.document_type],
                      ['Tx ID',        verifyResult.document.tx_id?.slice(0,20)+'…' || '—'],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 22px', borderBottom:'1px solid var(--border)', gap:12 }}>
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{k}</span>
                        <span style={{ fontSize:12, color:'var(--text-primary)', fontFamily:'var(--font-mono)', textAlign:'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      {tab === 'list' && (
        <div className="animate-fadeIn">
          <form onSubmit={handleList} style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input className="field-input" style={{ maxWidth:400 }} placeholder="Masukkan NIM mahasiswa..." value={listStudentId} onChange={e=>setListId(e.target.value)} required />
            <button className="btn btn-primary" type="submit" disabled={listLoading}>{listLoading?'…':'Cari Dokumen'}</button>
          </form>

          {documents.length > 0 && (
            <div className="card" style={{ overflow:'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>{['Tipe','Student ID','Hash File','Tx ID','Status','Tanggal','Aksi'].map(h=><th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {documents.map((d,i) => (
                    <tr key={i}>
                      <td><span className="badge badge-navy">{DOC_TYPES.find(t=>t.value===d.document_type)?.icon} {d.document_type}</span></td>
                      <td style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--navy)' }}>{d.student_id}</td>
                      <td><span className="hash-text">{d.file_hash?.slice(0,12)}…</span></td>
                      <td><span className="hash-text">{d.tx_id ? d.tx_id.slice(0,12)+'…' : '—'}</span></td>
                      <td><span className={`badge ${d.status==='confirmed'?'badge-success':'badge-warning'}`}>{d.status}</span></td>
                      <td style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString('id-ID')}</td>
                      <td><button className="btn btn-outline btn-sm" onClick={()=>handleDownload(d.id, d.file_name)}>⬇ PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {documents.length === 0 && listStudentId && !listLoading && (
            <div style={{ textAlign:'center', color:'var(--text-muted)', padding:40, fontSize:13 }}>Tidak ada dokumen untuk {listStudentId}</div>
          )}
        </div>
      )}
    </div>
  )
}