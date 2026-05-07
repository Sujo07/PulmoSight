import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

export default function PatientHistory() {
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/scan/recent')
      .then(r => setScans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = scans.filter(s =>
    s.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.patient_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.scan_id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Patient History</h1>
          <p>All previous scan submissions and detection records</p>
        </div>
        <input
          className="search-input" placeholder="Search patient..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="history-table-wrap">
        {loading ? (
          <div className="loading">Loading records...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No records found. <Link to="/upload">Upload a scan</Link> to get started.</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Scan ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Result</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.scan_id}>
                  <td>
                    <div className="patient-cell">
                      <div className="patient-avatar">{s.patient_name?.[0] || '?'}</div>
                      <div>
                        <div className="patient-name">{s.patient_name}</div>
                        <div className="patient-id">{s.patient_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono-text">{s.scan_id}</td>
                  <td className="muted-text">{s.timestamp?.slice(0,10)}</td>
                  <td className="muted-text">{s.scan_type}</td>
                  <td>
                    <span className={`badge ${s.is_positive ? 'badge-danger' : 'badge-success'}`}>
                      {s.is_positive ? 'Positive' : 'Negative'}
                    </span>
                  </td>
                  <td className={s.top_confidence >= 80 ? 'warn-text' : 'accent-text'}>
                    {s.top_confidence}%
                  </td>
                  <td>
                    <Link to={`/results/${s.scan_id}`} className="view-link">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
