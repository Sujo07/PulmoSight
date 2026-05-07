import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import api from '../utils/api'

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://mdbasimali440-pulmosight-backend.hf.space/api';

export default function Results() {
  const { scanId } = useParams()
  const { state } = useLocation()
  const [scan, setScan] = useState(state?.scan || null)
  const [loading, setLoading] = useState(!state?.scan)
  const [view, setView] = useState('gradcam')
  const [downloading, setDownloading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    if (!scan) {
      api.get(`/scan/${scanId}`)
        .then(r => setScan(r.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [scanId])

  useEffect(() => {
    if (scan) {
      const hasMultipleImages = scan.images && scan.images.length > 0;
      const currentImageData = hasMultipleImages ? scan.images[activeIdx] : scan;
      if (currentImageData && !currentImageData.gradcam_image) {
        setView('original')
      } else {
        setView('gradcam')
      }
    }
  }, [scan, activeIdx])

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

  const hasMultipleImages = scan.images && scan.images.length > 0;
  const currentImageData = hasMultipleImages ? scan.images[activeIdx] : scan;

  return (
    <div className="page-container">
      <div className="results-header">
        <div>
          <h1>Detection Results</h1>
          <p>Patient: <strong>{scan.patient_name}</strong> &nbsp;|&nbsp; Scan ID: <strong>{scan.scan_id}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {hasMultipleImages && (
            <div className="image-tabs" style={{ background: '#E2E8F0', padding: '4px', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
              <button className={view === 'gradcam' ? 'tab active' : 'tab'} onClick={() => setView('gradcam')}>Grad-CAM</button>
              <button className={view === 'original' ? 'tab active' : 'tab'} onClick={() => setView('original')}>Original</button>
            </div>
          )}
          <button className="download-btn" onClick={downloadReport} disabled={downloading}>
            {downloading ? 'Generating...' : '↓ Download Report'}
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className={`stat-card ${scan.is_positive ? 'danger' : 'success'}`}>
          <div className="stat-label">Overall Patient Detection</div>
          <div className="stat-value">{scan.is_positive ? 'POSITIVE' : 'NEGATIVE'}</div>
          <div className="stat-sub">{scan.is_positive ? 'Cancer detected in slices' : 'No cancer detected'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Max Confidence</div>
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
          <div className="stat-sub">{scan.scan_type} ({hasMultipleImages ? `${scan.images.length} slices` : '1 image'})</div>
        </div>
      </div>

      {hasMultipleImages ? (
        <div className="results-grid-view">
          {scan.images.map((img, idx) => (
            <div key={idx} className="slice-result-card glass-card">
              <div className="slice-card-header">
                <h3>Slice {idx + 1}</h3>
                <span className={`badge ${img.is_positive ? 'badge-danger' : 'badge-success'}`}>
                  {img.is_positive ? 'Positive' : 'Negative'}
                </span>
              </div>
              <div className="slice-card-body">
                <div className="slice-image-frame">
                  {view === 'gradcam' && img.gradcam_image ? (
                    <img src={imageUrl(img.gradcam_image)} alt={`Slice ${idx + 1} Grad-CAM`} className="slice-scan-image" />
                  ) : (
                    <img src={imageUrl(img.original_image)} alt={`Slice ${idx + 1} Original`} className="slice-scan-image" />
                  )}
                  {img.detections?.[0] && (
                    <div className="detection-badge">
                      {img.detections[0].label} {img.detections[0].confidence}%
                    </div>
                  )}
                </div>
                <div className="slice-info-panel">
                  <div className="slice-detections-list">
                    <div className="slice-det-title">Detections ({img.detections?.length || 0})</div>
                    {!img.detections || img.detections.length === 0 ? (
                      <p className="muted-text" style={{ fontSize: '12px', margin: '8px 0' }}>No regions detected</p>
                    ) : (
                      img.detections.map((d, i) => (
                        <div key={i} className="slice-det-row">
                          <span>{d.label}</span>
                          <span className="slice-det-conf">{d.confidence}%</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ marginTop: 'auto', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    <strong>Slice info:</strong> Confidence score of {img.top_confidence}% using YOLOv11 + Grad-CAM analysis.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="results-body">
          <div className="image-panel">
            {scan.gradcam_image && (
              <div className="image-tabs">
                <button className={view === 'gradcam' ? 'tab active' : 'tab'} onClick={() => setView('gradcam')}>Grad-CAM</button>
                <button className={view === 'original' ? 'tab active' : 'tab'} onClick={() => setView('original')}>Original</button>
              </div>
            )}
            <div className="image-frame">
              {view === 'gradcam' && scan.gradcam_image ? (
                <img src={imageUrl(scan.gradcam_image)} alt="Grad-CAM detection" className="scan-image"/>
              ) : view === 'original' && scan.original_image ? (
                <img src={imageUrl(scan.original_image)} alt="Original CT scan" className="scan-image"/>
              ) : (
                <div className="no-image">Image not available</div>
              )}
              {scan.detections?.[0] && (
                <div className="detection-badge">
                  {scan.detections[0].label} {scan.detections[0].confidence}%
                </div>
              )}
            </div>
          </div>

          <div className="detail-panel">
            <div className="detail-card">
              <div className="detail-title">Slice Detections ({scan.detections?.length || 0})</div>
              {!scan.detections || scan.detections.length === 0 ? (
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
      )}

      <div className="results-footer">
        <Link to="/upload" className="new-scan-btn">+ New Scan</Link>
        <Link to="/history" className="history-link">View All Patients →</Link>
      </div>
    </div>
  )
}
