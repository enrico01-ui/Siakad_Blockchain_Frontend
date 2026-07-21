// src/pages/InputData.jsx
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../services/api'

const GRADES  = ['A','A-','B+','B','B-','C+','C','D','E']
const GPA_MAP = { 'A':4.00,'A-':3.70,'B+':3.30,'B':3.00,'B-':2.70,'C+':2.30,'C':2.00,'D':1.00,'E':0.00 }

export default function InputData() {
  const { chain } = useOutletContext()
  const [form, setForm] = useState({
    student_id:'', student_name:'', course_code:'', course_name:'',
    grade:'A', gpa_point:4.00, semester:1, academic_year:'2024/2025', attendance:'always'
  })
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({...p, [k]: v}))

  const handleGrade = (g) => { set('grade', g); set('gpa_point', GPA_MAP[g] ?? 0) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await api.post('/academic/record', form)
      setResult(data)
      setForm({ student_id:'', student_name:'', course_code:'', course_name:'', grade:'A', gpa_point:4.00, semester:1, academic_year:'2024/2025', attendance:'always' })
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ width:'100%' }}>
      <div className="page-header">
        <h1>Input Data Akademik</h1>
        <p>Data akan dicatat ke <strong style={{ color: chain==='ethereum'?'var(--info)':'var(--success)' }}>{chain==='ethereum'?'Ethereum Sepolia':'Hyperledger Fabric'}</strong></p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:24, width:'100%' }}>

        {/* Form */}
        <div className="card card-pad">
          <h3 style={{ fontSize:14, marginBottom:20, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>Data Nilai Mahasiswa</h3>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="field-label">NIM / Student ID</label>
                <input className="field-input" placeholder="STUD_001" value={form.student_id} onChange={e=>set('student_id',e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Nama Mahasiswa</label>
                <input className="field-input" placeholder="Nama lengkap" value={form.student_name} onChange={e=>set('student_name',e.target.value)} required />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="field-label">Kode Mata Kuliah</label>
                <input className="field-input" placeholder="IF-3001" value={form.course_code} onChange={e=>set('course_code',e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Nama Mata Kuliah</label>
                <input className="field-input" placeholder="Pemrograman Web" value={form.course_name} onChange={e=>set('course_name',e.target.value)} required />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <div>
                <label className="field-label">Nilai</label>
                <select className="field-input" value={form.grade} onChange={e=>handleGrade(e.target.value)}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Bobot Nilai</label>
                <input className="field-input" type="number" step="0.01" value={form.gpa_point} readOnly />
              </div>
              <div>
                <label className="field-label">Semester</label>
                <select className="field-input" value={form.semester} onChange={e=>set('semester',parseInt(e.target.value))}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div>
                <label className="field-label">Tahun Ajaran</label>
                <input className="field-input" placeholder="2024/2025" value={form.academic_year} onChange={e=>set('academic_year',e.target.value)} required />
              </div>
              <div>
                <label className="field-label">Kehadiran</label>
                <select className="field-input" value={form.attendance} onChange={e=>set('attendance',e.target.value)}>
                  <option value="always">Selalu (Always)</option>
                  <option value="sometimes">Kadang (Sometimes)</option>
                  <option value="never">Tidak Pernah (Never)</option>
                </select>
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop:4 }}>
              {loading ? 'Mengirim ke Blockchain...' : 'Simpan ke Blockchain →'}
            </button>
          </form>
        </div>

        {/* Result */}
        <div className="card card-pad">
          <h3 style={{ fontSize:14, marginBottom:20, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>Hasil Transaksi</h3>
          {!result ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, color:'var(--text-muted)', gap:12 }}>
              <div style={{ fontSize:40, opacity:0.15 }}>⬡</div>
              <div style={{ fontSize:13, textAlign:'center' }}>Isi form dan submit<br/>untuk melihat hasil transaksi</div>
            </div>
          ) : (
            <div className="animate-fadeIn">
              <div className="alert alert-success" style={{ marginBottom:18 }}>
                ✓ Data berhasil dicatat ke blockchain
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {[
                  ['Student ID',  result.data?.student_id],
                  ['Mata Kuliah', result.data?.course_code],
                  ['Nilai',       result.data?.grade],
                  ['Hash Data',   result.data?.data_hash?.slice(0,24)+'…'],
                  ['Tx ID',       result.data?.tx_id ? result.data.tx_id.slice(0,24)+'…' : 'Menunggu konfirmasi'],
                  ['Status',      result.data?.status],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
                    <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>{k}</span>
                    <span style={{ fontSize:12, fontFamily: k.includes('Hash')||k.includes('Tx')?'var(--font-mono)':'var(--font-body)', color:'var(--text-primary)', textAlign:'right', wordBreak:'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}