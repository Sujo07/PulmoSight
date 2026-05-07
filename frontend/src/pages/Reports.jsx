import { useEffect, useState } from 'react'
import api from '../utils/api'

export default function Reports() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    api.get('/scan/recent')
      .then(r => setScans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function downloadReport(scan) {
    setDownloading(scan.scan_id)
    try {
      const res = await api.get(`/reports/generate/${scan.scan_id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `PulmoSight_${scan.scan_id}_${scan.patient_name?.replace(/\s+/g,'_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Could not generate report. Ensure reportlab is installed.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Download PDF radiology reports for each completed scan</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : scans.length === 0 ? (
        <div className="empty-state">No scans available yet.</div>
      ) : (
        <div className="reports-grid">
          {scans.map(s => (
            <div key={s.scan_id} className="report-card">
              <div className="report-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="report-info">
                <div className="report-name">{s.patient_name}</div>
                <div className="report-meta">
                  {s.scan_id} &nbsp;·&nbsp; {s.timestamp?.slice(0,10)} &nbsp;·&nbsp;
                  <span className={s.is_positive ? 'text-danger' : 'text-success'}>
                    {s.is_positive ? 'Positive' : 'Negative'}
                  </span>
                  &nbsp;·&nbsp; {s.top_confidence}%
                </div>
              </div>
              <button
                className="pdf-btn"
                onClick={() => downloadReport(s)}
                disabled={downloading === s.scan_id}
              >
                {downloading === s.scan_id ? '...' : '↓ PDF'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
