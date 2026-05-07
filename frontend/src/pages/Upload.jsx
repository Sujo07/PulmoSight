import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Upload() {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ patient_id: '', patient_name: '', age: '', scan_type: 'CT Chest' })
  const inputRef = useRef()
  const navigate = useNavigate()

  function handleFiles(newFiles) {
    if (!newFiles || newFiles.length === 0) return
    setError('')
    
    const updated = [...selectedFiles]
    Array.from(newFiles).forEach(f => {
      const previewUrl = f.type.startsWith('image/') ? URL.createObjectURL(f) : null
      updated.push({
        id: Math.random().toString(36).substr(2, 9),
        file: f,
        previewUrl: previewUrl
      })
    })
    setSelectedFiles(updated)
  }

  function removeFile(id) {
    const item = selectedFiles.find(x => x.id === id)
    if (item && item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl)
    }
    setSelectedFiles(selectedFiles.filter(x => x.id !== id))
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selectedFiles.length === 0) { setError('Please select at least one CT scan image.'); return }
    if (!form.patient_name) { setError('Patient name is required.'); return }

    setUploading(true)
    setError('')
    const fd = new FormData()
    selectedFiles.forEach(item => {
      fd.append('file', item.file)
    })
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))

    try {
      const res = await api.post('/scan/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      selectedFiles.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
      })
      navigate(`/results/${res.data.scan_id}`, { state: { scan: res.data } })
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Upload CT Scan</h1>
        <p>Submit a lung CT scan for AI-assisted cancer detection analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-grid">
        <div className="upload-card glass-card">
          <div className="card-label">Patient Information</div>
          <div className="field">
            <label>Patient ID</label>
            <input placeholder="e.g. PT-2024-001" value={form.patient_id}
              onChange={e => setForm({...form, patient_id: e.target.value})}/>
          </div>
          <div className="field">
            <label>Patient Name <span className="required">*</span></label>
            <input placeholder="Full name" value={form.patient_name} required
              onChange={e => setForm({...form, patient_name: e.target.value})}/>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Age</label>
              <input placeholder="Years" type="number" value={form.age}
                onChange={e => setForm({...form, age: e.target.value})}/>
            </div>
            <div className="field">
              <label>Scan Type</label>
              <select value={form.scan_type}
                onChange={e => setForm({...form, scan_type: e.target.value})}>
                <option>CT Chest</option>
                <option>HRCT</option>
                <option>PET-CT</option>
                <option>Low-dose CT</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-label">CT Scan Upload Area</div>
          <div
            className={`dropzone ${dragging ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={(e) => {
              if (e.target.closest('.remove-btn') || e.target.closest('.add-more-card')) return;
              inputRef.current.click()
            }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.dcm" multiple
              style={{display:'none'}} onChange={e => handleFiles(e.target.files)}/>
            {selectedFiles.length > 0 ? (
              <div className="preview-grid">
                {selectedFiles.map(item => (
                  <div key={item.id} className="preview-card" onClick={e => e.stopPropagation()}>
                    <button type="button" className="remove-btn" onClick={() => removeFile(item.id)}>×</button>
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt={item.file.name} />
                    ) : (
                      <div className="file-icon-placeholder">📄</div>
                    )}
                    <div className="file-name" title={item.file.name}>{item.file.name}</div>
                  </div>
                ))}
                <div className="add-more-card" onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span className="add-more-text">Add More</span>
                </div>
              </div>
            ) : (
              <div className="dropzone-inner">
                <div className="drop-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="drop-title">Drag & Drop CT Scans Here</div>
                <div className="drop-sub">Supported formats: PNG, JPG, DICOM | Select one or more images</div>
                <div className="drop-btn">Browse Files</div>
              </div>
            )}
          </div>
        </div>

        {error && <div className="upload-error">{error}</div>}

        <div className="upload-actions">
          <button type="submit" className="run-btn" disabled={uploading}>
            {uploading ? (
              <><span className="spinner"></span> AI is analyzing scan...</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                Analyze CT Scan
              </>
            )}
          </button>
          <p className="ai-disclaimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            AI assistance only — not a substitute for clinical diagnosis
          </p>
        </div>
      </form>
    </div>
  )
}
