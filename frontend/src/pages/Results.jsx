import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../utils/api'

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://pulmosight-boh9.onrender.com/api';

export default function Results() {
  const { scanId } = useParams()
  const { state } = useLocation()
  const [scan, setScan] = useState(state?.scan || null)
  const [loading, setLoading] = useState(!state?.scan)
  const [view, setView] = useState('gradcam')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!scan) {
      api.get(`/scan/${scanId}`)
        .then(r => setScan(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [scanId])

  async function downloadReport() {
    setDownloading(true)
    try {
      const res = await api.get(`/reports/generate/${scanId}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `PulmoSight_${scanId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Report generation failed.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="page-container"><div className="loading">Loading scan results...</div></div>
  if (!scan) return <div className="page-container"><div className="error-msg">Scan not found. <Link to="/upload">Go back</Link></div></div>

  const imageUrl = (filename) => `${API_BASE}/scan/image/${filename}`

  return (
    <div className="page-container">
      <div className="results-header">
        <div>
          <h1>Detection Results</h1>
          <p>Patient: <strong>{scan.patient_name}</strong> &nbsp;|&nbsp; Scan ID: <strong>{scan.scan_id}</strong></p>
        </div>
        <button className="download-btn" onClick={downloadReport} disabled={downloading}>
          {downloading ? 'Generating...' : '↓ Download Report'}
        </button>
      </div>

      <div className="stats-row">
        <div className={`stat-card ${scan.is_positive ? 'danger' : 'success'}`}>
          <div className="stat-label">Detection</div>
          <div className="stat-value">{scan.is_positive ? 'POSITIVE' : 'NEGATIVE'}</div>
          <div className="stat-sub">{scan.detections[0]?.label || 'No detections'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confidence</div>
          <div className="stat-value warn">{scan.top_confidence}%</div>
          <div className="confidence-bar">
            <div className="confidence-fill" style={{width: `${scan.top_confidence}%`}}></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Model</div>
          <div className="stat-value accent">{scan.model_version}</div>
          <div className="stat-sub">+ Grad-CAM</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scan Date</div>
          <div className="stat-value-sm">{scan.timestamp?.slice(0,10)}</div>
          <div className="stat-sub">{scan.scan_type}</div>
        </div>
      </div>

      <div className="results-body">
        <div className="image-panel">
          <div className="image-tabs">
            <button className={view === 'gradcam' ? 'tab active' : 'tab'} onClick={() => setView('gradcam')}>Grad-CAM</button>
            <button className={view === 'original' ? 'tab active' : 'tab'} onClick={() => setView('original')}>Original</button>
          </div>
          <div className="image-frame">
            {view === 'gradcam' && scan.gradcam_image ? (
              <img src={imageUrl(scan.gradcam_image)} alt="Grad-CAM detection" className="scan-image"/>
            ) : view === 'original' && scan.original_image ? (
              <img src={imageUrl(scan.original_image)} alt="Original CT scan" className="scan-image"/>
            ) : (
              <div className="no-image">Image not available</div>
            )}
            {scan.detections[0] && (
              <div className="detection-badge">
                {scan.detections[0].label} {scan.detections[0].confidence}%
              </div>
            )}
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-card">
            <div className="detail-title">Detections ({scan.detections.length})</div>
            {scan.detections.length === 0 ? (
              <p className="muted-text">No regions detected</p>
            ) : (
              scan.detections.map((d, i) => (
                <div key={i} className="detection-row">
                  <span>{d.label}</span>
                  <span className="det-conf">{d.confidence}%</span>
                </div>
              ))
            )}
          </div>

          <div className="detail-card">
            <div className="detail-title">Scan Info</div>
            <div className="info-table">
              <div className="info-row"><span>Patient Age</span><span>{scan.patient_age}</span></div>
              <div className="info-row"><span>Scan Type</span><span>{scan.scan_type}</span></div>
              <div className="info-row"><span>Model</span><span>{scan.model_version}</span></div>
              <div className="info-row"><span>Grad-CAM</span><span className="accent-text">Enabled</span></div>
            </div>
          </div>

          <div className="clinical-notice">
            <div className="notice-title">Clinical Notice</div>
            <p>AI-assisted result only. Further clinical evaluation and biopsy recommended before any diagnosis is made.</p>
          </div>
        </div>
      </div>

      <div className="results-footer">
        <Link to="/upload" className="new-scan-btn">+ New Scan</Link>
        <Link to="/history" className="history-link">View All Patients →</Link>
      </div>
    </div>
  )
}
